import { Injectable, NotFoundException, ForbiddenException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private prisma: PrismaService) {}

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

  async upgrade(tenantId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan not found");

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    if (Number(plan.price) === 0) {
      // Free plan - just update tenant limits
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          planId: plan.id,
          maxUsers: plan.maxUsers,
          maxSites: plan.maxSites,
          maxStorage: plan.maxStorage,
        },
      });

      // Cancel active subscriptions
      await this.prisma.subscription.updateMany({
        where: { tenantId, status: "active" },
        data: { status: "canceled", canceledAt: new Date() },
      });

      return { status: "free", plan };
    }

    // Paid plan
    const existing = await this.prisma.subscription.findFirst({
      where: { tenantId, status: "active" },
    });

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const sub = await this.prisma.subscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: { status: "canceled", canceledAt: now },
      });
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        planId: plan.id,
        subscriptionEndsAt: periodEnd,
        maxUsers: plan.maxUsers,
        maxSites: plan.maxSites,
        maxStorage: plan.maxStorage,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: "subscription.upgrade",
        resource: "Subscription",
        resourceId: sub.id,
        metadata: { from: existing?.planId || "free", to: plan.id } as any,
      },
    });

    return sub;
  }

  async downgrade(tenantId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan not found");

    const current = await this.prisma.subscription.findFirst({
      where: { tenantId, status: "active" },
      include: { plan: true },
    });

    if (current && Number(current.plan.price) > 0 && Number(plan.price) === 0) {
      // Downgrading to free - cancel subscription at period end, but apply limits now for free
      await this.prisma.subscription.update({
        where: { id: current.id },
        data: { status: "canceled", canceledAt: new Date() },
      });

      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          planId: plan.id,
          maxUsers: plan.maxUsers,
          maxSites: plan.maxSites,
          maxStorage: plan.maxStorage,
        },
      });

      return { status: "canceled", plan };
    }

    // For paid → paid downgrade
    return this.upgrade(tenantId, planId);
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
    const expired = await this.prisma.subscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: { lt: now },
      },
    });

    for (const sub of expired) {
      const daysOverdue = Math.floor((now.getTime() - sub.currentPeriodEnd.getTime()) / (24 * 60 * 60 * 1000));

      if (daysOverdue >= 3) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "suspended" },
        });

        await this.prisma.tenant.update({
          where: { id: sub.tenantId },
          data: { isActive: false },
        });

        this.logger.log(`Tenant ${sub.tenantId} suspended (${daysOverdue}d overdue)`);
      }
    }

    return { processed: expired.length };
  }
}
