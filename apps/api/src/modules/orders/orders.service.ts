import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: { items: Array<{ productId: string; quantity: number }>; customerName?: string; customerEmail?: string; customerPhone?: string; couponCode?: string; notes?: string }) {
    let coupon: any = null;

    if (dto.couponCode) {
      coupon = await this.prisma.coupon.findUnique({
        where: { tenantId_code: { tenantId, code: dto.couponCode } },
      });
      if (!coupon || !coupon.isActive) throw new BadRequestException("Cupón inválido");
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException("Cupón expirado");
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException("Cupón agotado");
    }

    // Batch-fetch products (single query instead of one per item)
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
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
      await this.prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    }

    const order = await this.prisma.order.create({
      data: {
        tenantId,
        totalAmount: total - discount,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        couponCode: dto.couponCode,
        discount,
        notes: dto.notes,
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    });

    // Update stock (conditional, atomic, parallel)
    await Promise.all(
      dto.items.map((item) =>
        this.prisma.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
      )
    );

    return order;
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

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  private async assertExists(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!order) throw new NotFoundException("Order not found");
  }

  async updateStatus(id: string, status: string) {
    await this.assertExists(id);
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  async markPaid(id: string) {
    await this.assertExists(id);
    return this.prisma.order.update({ where: { id }, data: { status: "paid", paidAt: new Date() } });
  }

  async remove(id: string) {
    await this.assertExists(id);
    return this.prisma.order.delete({ where: { id } });
  }
}
