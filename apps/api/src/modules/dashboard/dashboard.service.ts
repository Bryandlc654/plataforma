import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getTenantOverview(tenantId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalSites, totalLeads, totalUsers, leadsLast30Days, recentLeads, recentLogs] =
      await Promise.all([
        this.prisma.site.count({
          where: { tenantId, deletedAt: null },
        }),
        this.prisma.lead.count({
          where: { tenantId },
        }),
        this.prisma.userTenant.count({
          where: { tenantId },
        }),
        this.prisma.lead.count({
          where: {
            tenantId,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.lead.findMany({
          where: {
            tenantId,
            createdAt: { gte: sevenDaysAgo },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            source: true,
            createdAt: true,
          },
        }),
        this.prisma.auditLog.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            action: true,
            resource: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
      ]);

    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId, status: "active" },
      include: { plan: { select: { name: true, slug: true, price: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      summary: {
        totalSites,
        totalLeads,
        totalUsers,
        leadsLast30Days,
      },
      subscription: subscription
        ? {
            plan: subscription.plan,
            currentPeriodEnd: subscription.currentPeriodEnd,
            status: subscription.status,
          }
        : null,
      recentLeads,
      recentActivity: recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        user: log.user
          ? `${log.user.firstName} ${log.user.lastName}`
          : "System",
        createdAt: log.createdAt,
      })),
    };
  }

  async getAdminOverview() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalTenants, totalUsers, activeSubscriptions, activeTenants, suspendedTenants] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.subscription.count({ where: { status: "active" } }),
      this.prisma.tenant.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.tenant.count({ where: { deletedAt: null, isActive: false } }),
    ]);

    // MRR - Monthly Recurring Revenue (aggregated, avoids loading every subscription row)
    const { mrr } = await this.getActiveSubsAggregate();

    // Churn - subscriptions cancelled in last 30 days
    const cancelledCount = await this.prisma.subscription.count({
      where: { status: "canceled", canceledAt: { gte: thirtyDaysAgo } },
    });
    const totalSubs = await this.prisma.subscription.count();
    const churnRate = totalSubs > 0 ? Math.round((cancelledCount / totalSubs) * 100) : 0;

    // Total revenue
    const paidInvoices = await this.prisma.invoice.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    });
    const totalRevenue = Number(paidInvoices._sum.amount || 0);

    // Revenue this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRevenue = await this.prisma.invoice.aggregate({
      where: { status: "paid", paidAt: { gte: monthStart } },
      _sum: { amount: true },
    });

    // Total leads and sites
    const [totalLeads, totalSites] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.site.count({ where: { deletedAt: null } }),
    ]);

    // Recent tenants
    const recentTenants = await this.prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true,
        plan: { select: { name: true, slug: true } },
        createdAt: true,
        _count: { select: { userTenants: true, sites: true } },
      },
    });

    return {
      summary: {
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalUsers,
        activeSubscriptions,
        totalLeads,
        totalSites,
        mrr,
        churnRate,
        totalRevenue,
        monthRevenue: Number(monthRevenue._sum.amount || 0),
      },
      recentTenants,
    };
  }

  async getBillingOverview() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // MRR
    const { mrr, count: activeSubscriptionCount } = await this.getActiveSubsAggregate();

    // Revenue this month
    const monthRevenue = await this.prisma.invoice.aggregate({
      where: { status: "paid", paidAt: { gte: monthStart } },
      _sum: { amount: true },
    });

    // Total paid invoices
    const [totalInvoices, paidInvoices, pendingInvoices] = await Promise.all([
      this.prisma.invoice.count(),
      this.prisma.invoice.count({ where: { status: "paid" } }),
      this.prisma.invoice.count({ where: { status: "pending" } }),
    ]);

    // Recent invoices with tenant info
    const recentInvoices = await this.prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        tenant: { select: { name: true, slug: true } },
      },
    });

    // Subscriptions by plan
    const subsByPlan = await this.prisma.subscription.groupBy({
      by: ["status"],
      _count: true,
    });

    // Plans with subscriber count
    const plans = await this.prisma.plan.findMany({
      include: { _count: { select: { tenants: true, subscriptions: true } } },
    });

    return {
      metrics: {
        mrr,
        monthRevenue: Number(monthRevenue._sum.amount || 0),
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        activeSubscriptions: activeSubscriptionCount,
      },
      byStatus: subsByPlan.map((s) => ({ status: s.status, count: s._count })),
      plans: plans.map((p) => ({
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        currency: p.currency,
        tenants: p._count.tenants,
        subscriptions: p._count.subscriptions,
      })),
      recentInvoices: recentInvoices.map((inv) => ({
        id: inv.id,
        amount: Number(inv.amount),
        currency: inv.currency,
        status: inv.status,
        paidAt: inv.paidAt,
        createdAt: inv.createdAt,
        tenant: inv.tenant,
      })),
    };
  }

  private async getActiveSubsAggregate(): Promise<{ mrr: number; count: number }> {
    const subsByPlan = await this.prisma.subscription.groupBy({
      by: ["planId"],
      where: { status: "active" },
      _count: true,
    });

    const planIds = subsByPlan
      .map((s) => s.planId)
      .filter((id): id is string => Boolean(id));

    const count = subsByPlan.reduce((acc, s) => acc + s._count, 0);

    let mrr = 0;
    if (planIds.length) {
      const plans = await this.prisma.plan.findMany({
        where: { id: { in: planIds } },
        select: { id: true, price: true },
      });
      const priceMap = new Map(plans.map((p) => [p.id, p.price]));
      mrr = subsByPlan.reduce(
        (sum, s) => sum + (s.planId ? Number(priceMap.get(s.planId) || 0) * s._count : 0),
        0
      );
    }

    return { mrr, count };
  }
}
