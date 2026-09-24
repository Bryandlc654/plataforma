import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService, private emailService: EmailService, private configService: ConfigService) {}

  async create(tenantId: string, dto: { items: Array<{ productId: string; quantity: number }>; customerName?: string; customerEmail?: string; customerPhone?: string; couponCode?: string; notes?: string; paymentMethod?: string }) {
    let coupon: any = null;

    if (dto.couponCode) {
      coupon = await this.prisma.coupon.findUnique({
        where: { tenantId_code: { tenantId, code: dto.couponCode } },
      });
      if (!coupon || !coupon.isActive) throw new BadRequestException("Cupón inválido");
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException("Cupón expirado");
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException("Cupón agotado");
    }

    // Batch-fetch products scoped to the tenant (evita IDOR cross-tenant)
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenantId },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const orderItems: { productId: string; quantity: number; price: any; total: number }[] = [];
    let total = 0;

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      if (product.stock < item.quantity) throw new BadRequestException(`Insufficient stock for ${product.name}`);

      const itemTotal = Number(product.price) * item.quantity;
      total += itemTotal;
      orderItems.push({ productId: product.id, quantity: item.quantity, price: product.price, total: itemTotal });
    }

    let discount = 0;
    if (coupon) {
      discount = coupon.type === "percentage" ? (total * Number(coupon.value)) / 100 : Number(coupon.value);
    }

    return this.prisma.$transaction(async (tx) => {
      // Decremento atómico y condicional del stock (evita sobreventa)
      for (const item of dto.items) {
        const res = await tx.product.updateMany({
          where: { id: item.productId, tenantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (res.count === 0) {
          throw new BadRequestException(`Stock insuficiente para el producto ${item.productId}`);
        }
      }

      if (coupon) {
        await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      }

      return tx.order.create({
        data: {
          tenantId,
          totalAmount: total - discount,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          couponCode: dto.couponCode,
          discount,
          notes: dto.notes,
          paymentMethod: dto.paymentMethod || "cod",
          items: { create: orderItems },
        },
        include: { items: { include: { product: true } } },
      });
    });
  }

  async findAll(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async findById(id: string, tenantId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  private async assertExists(id: string, tenantId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!order) throw new NotFoundException("Order not found");
  }

  async updateStatus(id: string, tenantId: string, status: string) {
    await this.assertExists(id, tenantId);
    const prev = await this.prisma.order.findFirst({ where: { id, tenantId }, select: { status: true } });
    const updated = await this.prisma.order.update({ where: { id }, data: { status } });
    if (status === "paid" && prev?.status !== "paid") {
      await this.notifyPaid(id).catch(() => undefined);
    }
    return updated;
  }

  async markPaid(id: string, tenantId: string) {
    await this.assertExists(id, tenantId);
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: "paid", paidAt: new Date() },
      include: { items: { include: { product: true } } },
    });
    await this.notifyPaid(id).catch(() => undefined);
    return order;
  }

  async notifyPaid(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!order) return;
    if (!order.customerEmail) return;
    try {
      const site = await this.prisma.site.findFirst({
        where: { tenantId: order.tenantId, isPublished: true, deletedAt: null },
        select: { name: true, subdomain: true },
      });
      const apiBase =
        this.configService.get<string>("PUBLIC_API_URL") ||
        this.configService.get<string>("API_URL") ||
        process.env.NEXT_PUBLIC_API_URL ||
        "https://plataforma-api-rkav7vkxia-uc.a.run.app";
      await this.emailService.sendOrderNotificationEmail({
        to: order.customerEmail,
        customerName: order.customerName || "Cliente",
        siteName: site?.name || "Mi tienda",
        orderId: order.id,
        orderUrl: site?.subdomain ? `${apiBase}/p/${site.subdomain}` : "",
        total: String(order.totalAmount),
        discount: String(order.discount || 0),
        currency: "USD",
        paymentMethod: order.paymentMethod || "cod",
        status: "paid",
        items: order.items.map((i) => ({
          name: i.product?.name || "Producto",
          quantity: i.quantity,
          price: Number(i.price),
        })),
      });
    } catch {}
  }

  async remove(id: string, tenantId: string) {
    await this.assertExists(id, tenantId);
    return this.prisma.order.delete({ where: { id } });
  }
}
