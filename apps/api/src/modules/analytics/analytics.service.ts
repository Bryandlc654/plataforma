import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async track(tenantId: string, dto: { type: string; siteId?: string; path?: string; referrer?: string; metadata?: any }, ip?: string, userAgent?: string) {
    if (dto.type === "pageview") {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const duplicate = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM analytics_events
        WHERE tenant_id = ${tenantId}
          AND type = 'pageview'
          AND ip_address = ${ip || null}
          AND path = ${dto.path || null}
          AND created_at >= ${thirtyMinutesAgo}
        LIMIT 1
      `;

      if (duplicate.length > 0) {
        return { skipped: true, reason: "duplicate_pageview" };
      }

      let siteName = "tu web";
      if (dto.siteId) {
        const site = await this.prisma.site.findUnique({ where: { id: dto.siteId }, select: { name: true } });
        if (site?.name) siteName = site.name;
      }

      this.notificationsService.sendPushNotificationToTenant(
        tenantId,
        "¡Nueva visita web!",
        `Alguien está navegando en ${siteName}.`,
        { url: "/analytics" }
      ).catch(e => console.error("Error sending visit push notification", e));
    }

    return this.prisma.analyticsEvent.create({
      data: {
        tenantId,
        siteId: dto.siteId,
        type: dto.type,
        path: dto.path,
        referrer: dto.referrer,
        ipAddress: ip,
        userAgent,
        metadata: dto.metadata as any,
      },
    });
  }

  private async countByType(tenantId: string, types: string[], start: Date, siteId?: string): Promise<number> {
    if (siteId) {
      const rows = await this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM analytics_events
        WHERE tenant_id = ${tenantId} AND type IN (${Prisma.raw(`'${types.join("','")}'`)}) AND created_at >= ${start} AND site_id = ${siteId}
      `;
      return Number(rows[0]?.count || 0);
    }
    const rows = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM analytics_events
      WHERE tenant_id = ${tenantId} AND type IN (${Prisma.raw(`'${types.join("','")}'`)}) AND created_at >= ${start}
    `;
    return Number(rows[0]?.count || 0);
  }

  async getOverview(tenantId: string, siteId?: string, period?: string) {
    const now = new Date();
    const days = period === "90d" ? 90 : period === "7d" ? 7 : 30;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const [totalViews, totalConversions, totalClicks] = await Promise.all([
      this.countByType(tenantId, ["pageview"], start, siteId),
      this.countByType(tenantId, ["conversion"], start, siteId),
      this.countByType(tenantId, ["click", "whatsapp_click"], start, siteId),
    ]);

    let dailyRows: { date: string; views: bigint }[];
    if (siteId) {
      dailyRows = await this.prisma.$queryRaw<{ date: string; views: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*) as views FROM analytics_events
        WHERE tenant_id = ${tenantId} AND type = 'pageview' AND created_at >= ${start} AND site_id = ${siteId}
        GROUP BY DATE(created_at) ORDER BY date ASC
      `;
    } else {
      dailyRows = await this.prisma.$queryRaw<{ date: string; views: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*) as views FROM analytics_events
        WHERE tenant_id = ${tenantId} AND type = 'pageview' AND created_at >= ${start}
        GROUP BY DATE(created_at) ORDER BY date ASC
      `;
    }

    const dailyMap = new Map<string, number>();
    for (const row of dailyRows) {
      dailyMap.set(String(row.date), Number(row.views));
    }

    const dailyViews: { date: string; views: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dailyViews.push({ date: key, views: dailyMap.get(key) || 0 });
    }

    let topPagesRaw: { path: string; views: bigint }[];
    if (siteId) {
      topPagesRaw = await this.prisma.$queryRaw<{ path: string; views: bigint }[]>`
        SELECT path, COUNT(*) as views FROM analytics_events
        WHERE tenant_id = ${tenantId} AND type = 'pageview' AND path IS NOT NULL AND created_at >= ${start} AND site_id = ${siteId}
        GROUP BY path ORDER BY views DESC LIMIT 10
      `;
    } else {
      topPagesRaw = await this.prisma.$queryRaw<{ path: string; views: bigint }[]>`
        SELECT path, COUNT(*) as views FROM analytics_events
        WHERE tenant_id = ${tenantId} AND type = 'pageview' AND path IS NOT NULL AND created_at >= ${start}
        GROUP BY path ORDER BY views DESC LIMIT 10
      `;
    }

    let referrersRaw: { referrer: string; count: bigint }[];
    if (siteId) {
      referrersRaw = await this.prisma.$queryRaw<{ referrer: string; count: bigint }[]>`
        SELECT referrer, COUNT(*) as count FROM analytics_events
        WHERE tenant_id = ${tenantId} AND referrer IS NOT NULL AND referrer != '' AND created_at >= ${start} AND site_id = ${siteId}
        GROUP BY referrer ORDER BY count DESC LIMIT 10
      `;
    } else {
      referrersRaw = await this.prisma.$queryRaw<{ referrer: string; count: bigint }[]>`
        SELECT referrer, COUNT(*) as count FROM analytics_events
        WHERE tenant_id = ${tenantId} AND referrer IS NOT NULL AND referrer != '' AND created_at >= ${start}
        GROUP BY referrer ORDER BY count DESC LIMIT 10
      `;
    }

    return {
      summary: { totalViews, totalConversions, totalClicks },
      dailyViews,
      topPages: topPagesRaw.map(p => ({ path: p.path, views: Number(p.views) })),
      referrers: referrersRaw.map(r => ({ referrer: r.referrer, count: Number(r.count) })),
    };
  }
}
