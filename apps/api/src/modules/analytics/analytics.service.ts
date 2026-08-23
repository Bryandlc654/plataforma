import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class AnalyticsService {
  private readonly lastNotification = new Map<string, number>();
  private static readonly NOTIFICATION_COOLDOWN = 5 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async track(tenantId: string, dto: { type: string; siteId?: string; path?: string; referrer?: string; metadata?: any }, ip?: string, userAgent?: string) {
    if (!tenantId || !dto.type) return { tracked: false };

    if (dto.type === "pageview" && dto.siteId) {
      const now = Date.now();
      const last = this.lastNotification.get(dto.siteId) || 0;
      if (now - last > AnalyticsService.NOTIFICATION_COOLDOWN) {
        this.lastNotification.set(dto.siteId, now);
        this.notificationsService.sendPushNotificationToTenant(
          tenantId, "¡Nueva visita web!", "Alguien está navegando en tu sitio.",
          { url: "/analytics" }
        ).catch(() => {});
      }
    }

    await this.prisma.analyticsEvent.create({
      data: {
        tenantId,
        siteId: dto.siteId || undefined,
        type: dto.type,
        path: dto.path || undefined,
        referrer: dto.referrer || undefined,
        ipAddress: ip || undefined,
        userAgent: userAgent || undefined,
        metadata: dto.metadata || undefined,
      },
    });
    return { tracked: true };
  }

  async getOverview(tenantId: string, siteId?: string, period?: string) {
    const now = new Date();
    const days = period === "90d" ? 90 : period === "7d" ? 7 : 30;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const siteFilter = siteId ? this.prisma.$queryRaw` AND site_id = ${siteId}` : this.prisma.$queryRaw``;

    const [summaryRows, dailyRows, topPages, referrers] = await Promise.all([
      this.prisma.$queryRaw<{ type: string; count: bigint }[]>`
        SELECT type, COUNT(*) as count FROM analytics_events
        WHERE tenant_id = ${tenantId} AND created_at >= ${start}
        ${siteId ? this.prisma.$queryRaw` AND site_id = ${siteId}` : this.prisma.$queryRaw``}
        GROUP BY type
      `,
      this.prisma.$queryRaw<{ date: string; views: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*) as views FROM analytics_events
        WHERE tenant_id = ${tenantId} AND type = 'pageview' AND created_at >= ${start}
        ${siteId ? this.prisma.$queryRaw` AND site_id = ${siteId}` : this.prisma.$queryRaw``}
        GROUP BY DATE(created_at) ORDER BY date ASC
      `,
      this.prisma.$queryRaw<{ path: string; views: bigint }[]>`
        SELECT path, COUNT(*) as views FROM analytics_events
        WHERE tenant_id = ${tenantId} AND type = 'pageview' AND path IS NOT NULL AND created_at >= ${start}
        ${siteId ? this.prisma.$queryRaw` AND site_id = ${siteId}` : this.prisma.$queryRaw``}
        GROUP BY path ORDER BY views DESC LIMIT 10
      `,
      this.prisma.$queryRaw<{ referrer: string; count: bigint }[]>`
        SELECT referrer, COUNT(*) as count FROM analytics_events
        WHERE tenant_id = ${tenantId} AND referrer IS NOT NULL AND referrer != '' AND created_at >= ${start}
        ${siteId ? this.prisma.$queryRaw` AND site_id = ${siteId}` : this.prisma.$queryRaw``}
        GROUP BY referrer ORDER BY count DESC LIMIT 10
      `,
    ]);

    const typeMap = new Map<string, number>();
    for (const row of summaryRows) typeMap.set(row.type, Number(row.count));

    const dailyMap = new Map<string, number>();
    for (const row of dailyRows) dailyMap.set(String(row.date), Number(row.views));

    const dailyViews: { date: string; views: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dailyViews.push({ date: key, views: dailyMap.get(key) || 0 });
    }

    return {
      summary: {
        totalViews: typeMap.get("pageview") || 0,
        totalConversions: typeMap.get("conversion") || 0,
        totalClicks: (typeMap.get("click") || 0) + (typeMap.get("whatsapp_click") || 0),
      },
      dailyViews,
      topPages: topPages.map(p => ({ path: p.path, views: Number(p.views) })),
      referrers: referrers.map(r => ({ referrer: r.referrer, count: Number(r.count) })),
    };
  }
}
