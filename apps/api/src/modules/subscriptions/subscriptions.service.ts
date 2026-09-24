import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const DEFAULT_EXPIRED_CHECK_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class SubscriptionsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SubscriptionsService.name);
  private expiredCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    const configured = parseInt(
      process.env.SUBSCRIPTIONS_EXPIRED_CHECK_INTERVAL_MS || "",
      10
    );
    const intervalMs =
      Number.isFinite(configured) && configured > 0
        ? configured
        : DEFAULT_EXPIRED_CHECK_INTERVAL_MS;

    this.expiredCheckInterval = setInterval(() => {
      this.checkAndSuspendExpired().catch((err) =>
        this.logger.error(`Expired subscriptions check failed: ${err.message}`)
      );
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.expiredCheckInterval) clearInterval(this.expiredCheckInterval);
  }

  async getCurrent(tenantId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId, status: "active" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    if (!sub) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new NotFoundException("Tenant not found");

      return {
        plan: null,
        status: "free",
        currentPeriodEnd: null,
        limits: {
          maxUsers: tenant.maxUsers,
          maxSites: tenant.maxSites,
          maxStorage: tenant.maxStorage,
          storageUsed: tenant.storageUsed,
        },
      };
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    return {
      id: sub.id,
      plan: sub.plan,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      paymentMethod: sub.paymentMethod,
      limits: {
        maxUsers: tenant?.maxUsers || 0,
        maxSites: tenant?.maxSites || 0,
        maxStorage: tenant?.maxStorage || BigInt(0),
        storageUsed: tenant?.storageUsed || BigInt(0),
      },
    };
  }

  /**
   * Aplica el plan gratuito de forma inmediata (no requiere pago).
   */
  private async applyFreePlan(tenantId: string, plan: any) {
    await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          planId: plan.id,
          subscriptionEndsAt: null,
          maxUsers: plan.maxUsers,
          maxSites: plan.maxSites,
          maxStorage: plan.maxStorage,
        },
      }),
      this.prisma.subscription.updateMany({
        where: { tenantId, status: { in: ["active", "pending"] } },
        data: { status: "canceled", canceledAt: new Date() },
      }),
    ]);

    return { status: "free", plan };
  }

  /**
   * Cambia a un plan. Los planes de pago NO se activan aquí: requieren un pago
   * confirmado (ver BillingService y `activatePaidSubscription`).
   */
  async upgrade(tenantId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan not found");

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    if (Number(plan.price) === 0) {
      return this.applyFreePlan(tenantId, plan);
    }

    throw new ForbiddenException(
      "Este plan requiere pago. Usa el enlace de pago para completar la suscripción."
    );
  }

  /**
   * Activa una suscripción de pago. Solo debe invocarse tras confirmar el pago
   * (webhook firmado o marcado manual por un admin).
   */
  async activatePaidSubscription(
    tenantId: string,
    planId: string,
    opts: { subscriptionId?: string; invoiceId?: string; paymentMethod?: string } = {}
  ) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan not found");
    if (Number(plan.price) === 0) {
      throw new BadRequestException("El plan gratuito no requiere activación de pago");
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.subscription.findFirst({
        where: { tenantId, status: "active" },
      });

      const sub = opts.subscriptionId
        ? await tx.subscription.update({
            where: { id: opts.subscriptionId },
            data: {
              planId: plan.id,
              status: "active",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              paymentMethod: opts.paymentMethod || "payphone",
              canceledAt: null,
              endedAt: null,
            },
            include: { plan: true },
          })
        : await tx.subscription.create({
            data: {
              tenantId,
              planId: plan.id,
              status: "active",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              paymentMethod: opts.paymentMethod || "payphone",
            },
            include: { plan: true },
          });

      if (existing && existing.id !== sub.id) {
        await tx.subscription.update({
          where: { id: existing.id },
          data: { status: "canceled", canceledAt: now },
        });
      }

      // Cancela otras suscripciones pending del tenant para el mismo plan.
      await tx.subscription.updateMany({
        where: { tenantId, status: "pending", NOT: { id: sub.id } },
        data: { status: "canceled", canceledAt: now },
      });

      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          planId: plan.id,
          subscriptionEndsAt: periodEnd,
          maxUsers: plan.maxUsers,
          maxSites: plan.maxSites,
          maxStorage: plan.maxStorage,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          action: "subscription.activated",
          resource: "Subscription",
          resourceId: sub.id,
          metadata: {
            planId: plan.id,
            invoiceId: opts.invoiceId || null,
          } as any,
        },
      });

      return sub;
    });
  }

  async downgrade(tenantId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan not found");

    const current = await this.prisma.subscription.findFirst({
      where: { tenantId, status: "active" },
      include: { plan: true },
    });

    // Bajar a gratuito: aplicar de inmediato.
    if (Number(plan.price) === 0) {
      return this.applyFreePlan(tenantId, plan);
    }

    const currentPrice = current ? Number(current.plan.price) : 0;
    const targetPrice = Number(plan.price);

    // No es un downgrade (más caro o sin plan previo): requiere pago.
    if (targetPrice > currentPrice) {
      throw new ForbiddenException(
        "Para cambiar a un plan superior debes completar el pago."
      );
    }

    // Bajar a un plan de pago igual o más barato: aplicar sin cobro adicional.
    return this.activatePaidSubscription(tenantId, plan.id, {
      subscriptionId: current?.id,
      paymentMethod: current?.paymentMethod || undefined,
    });
  }

  async cancel(tenantId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId, status: "active" },
    });

    if (!sub) throw new NotFoundException("No active subscription");

    return this.prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "canceled", canceledAt: new Date() },
    });
  }

  async getHistory(tenantId: string) {
    return this.prisma.subscription.findMany({
      where: { tenantId },
      include: { plan: { select: { name: true, slug: true, price: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async checkAndSuspendExpired() {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const expired = await this.prisma.subscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: { lt: now },
      },
    });

    const toSuspend = expired.filter(
      (sub) => sub.currentPeriodEnd <= threeDaysAgo
    );

    if (toSuspend.length > 0) {
      const tenantIds = [...new Set(toSuspend.map((s) => s.tenantId))];
      await this.prisma.$transaction([
        this.prisma.subscription.updateMany({
          where: { id: { in: toSuspend.map((s) => s.id) } },
          data: { status: "suspended" },
        }),
        this.prisma.tenant.updateMany({
          where: { id: { in: tenantIds } },
          data: { isActive: false },
        }),
      ]);
      this.logger.log(`${tenantIds.length} tenants suspended (${toSuspend.length} subscriptions)`);
    }

    return { processed: expired.length };
  }
}
