import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";

/** Métodos de pago en línea: el pedido reserva stock y cupón hasta que se paga o vence. */
export const ONLINE_PAYMENT_METHODS = ["paypal", "payphone"];
/** Minutos que un pedido en línea sin pagar mantiene reservado el stock. */
export const ONLINE_ORDER_TTL_MINUTES = 60;
const EXPIRY_SWEEP_MS = 5 * 60 * 1000;
export const EXPIRED_ORDER_NOTE = "Cancelado automáticamente: el pago en línea no se completó a tiempo.";

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersService.name);
  private sweepTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private prisma: PrismaService, private emailService: EmailService, private configService: ConfigService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test") return;
    this.sweepTimer = setInterval(() => {
      this.releaseExpiredOnlineOrders().catch((err) => this.logger.warn(`Liberación de pedidos vencidos falló: ${err?.message}`));
    }, EXPIRY_SWEEP_MS);
    this.sweepTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  /**
   * Cancela los pedidos en línea que no se pagaron a tiempo y devuelve su stock y el uso
   * del cupón. Sin esto, crear pedidos sin pagar dejaba la tienda sin stock ni cupones.
   * Es seguro con varias instancias: cada pedido se "reclama" con un update condicional.
   */
  async releaseExpiredOnlineOrders(now = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - ONLINE_ORDER_TTL_MINUTES * 60 * 1000);
    const stale = await this.prisma.order.findMany({
      where: { status: "pending", paymentMethod: { in: ONLINE_PAYMENT_METHODS }, createdAt: { lt: cutoff } },
      select: { id: true },
      take: 200,
    });
    let released = 0;
    for (const { id } of stale) {
      const done = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
        if (!order) return false;
        const claimed = await tx.order.updateMany({
          where: { id, status: "pending" },
          data: { status: "cancelled", notes: order.notes ? `${order.notes}\n${EXPIRED_ORDER_NOTE}` : EXPIRED_ORDER_NOTE },
        });
        if (claimed.count === 0) return false; // otra instancia ya lo liberó, o se pagó
        for (const item of order.items) {
          await tx.product.updateMany({ where: { id: item.productId, tenantId: order.tenantId }, data: { stock: { increment: item.quantity } } });
        }
        if (order.couponCode) {
          await tx.coupon.updateMany({
            where: { tenantId: order.tenantId, code: order.couponCode, usedCount: { gt: 0 } },
            data: { usedCount: { decrement: 1 } },
          });
        }
        return true;
      });
      if (done) released++;
    }
    if (released > 0) this.logger.log(`Pedidos en línea vencidos liberados: ${released}`);
    return released;
  }

  /**
   * Vuelve a reservar el stock de un pedido que se canceló por vencimiento pero cuyo pago
   * llegó después (Payphone cobra antes de confirmar). Devuelve false si ya no hay stock.
   */
  async reReserveStock(orderId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) return false;
      for (const item of order.items) {
        const res = await tx.product.updateMany({
          where: { id: item.productId, tenantId: order.tenantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (res.count === 0) throw new BadRequestException("SIN_STOCK");
      }
      return true;
    }).catch((err) => {
      if (err instanceof BadRequestException && err.message === "SIN_STOCK") return false;
      throw err;
    });
  }

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
      // Un cupón fijo mayor que el total no puede dejar el pedido en negativo.
      discount = Math.min(Math.max(discount, 0), total);
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
        // Incremento condicional: dos pedidos simultáneos no pueden superar maxUses.
        const used = await tx.coupon.updateMany({
          where: { id: coupon.id, ...(coupon.maxUses ? { usedCount: { lt: coupon.maxUses } } : {}) },
          data: { usedCount: { increment: 1 } },
        });
        if (used.count === 0) throw new BadRequestException("Cupón agotado");
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
