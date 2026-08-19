import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

  async findAll(tenantId: string, filters?: { status?: string; search?: string; siteId?: string; from?: string; to?: string }, page = 1, pageSize = 25) {
    const where: any = { tenantId };

    if (filters?.status) where.status = filters.status;
    if (filters?.siteId) where.siteId = filters.siteId;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
      ];
    }
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          source: true,
          data: true,
          createdAt: true,
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException("Lead not found");
    return lead;
  }

  async updateStatus(id: string, status: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, select: { id: true } });
    if (!lead) throw new NotFoundException("Lead not found");
    return this.prisma.lead.update({ where: { id }, data: { status } });
  }

  async updateManyStatus(tenantId: string, ids: string[], status: string) {
    if (!ids?.length) return { count: 0 };
    return this.prisma.lead.updateMany({
      where: { tenantId, id: { in: ids } },
      data: { status },
    });
  }

  async getStats(tenantId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, last30Days, last7Days, byStatus, bySourceRaw] = await Promise.all([
      this.prisma.lead.count({ where: { tenantId } }),
      this.prisma.lead.count({ where: { tenantId, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.lead.count({ where: { tenantId, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.lead.groupBy({ by: ["status"], where: { tenantId }, _count: true }),
      this.prisma.lead.groupBy({ by: ["source"], where: { tenantId, source: { not: null } }, _count: true }),
    ]);

    return {
      total,
      last30Days,
      last7Days,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      bySource: bySourceRaw.map((s) => ({ source: s.source, count: s._count })),
    };
  }

  async exportCsv(tenantId: string, filters?: { status?: string; from?: string; to?: string }): Promise<string> {
    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const MAX_EXPORT = 10000;
    const leads = await this.prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: MAX_EXPORT,
    });

    if (leads.length === 0) return "Sin datos";

    const header = ["Nombre", "Email", "Teléfono", "Estado", "Origen", "Fecha", "Datos"].join(",");
    const rows = leads.map((l) => {
      const name = l.name || "";
      const email = l.email || "";
      const phone = l.phone || "";
      const jsondata = l.data ? `"${JSON.stringify(l.data).replace(/"/g, '""')}"` : "";
      return [`"${name}"`, `"${email}"`, `"${phone}"`, l.status, l.source || "", l.createdAt.toISOString(), jsondata].join(",");
    });

    return `\uFEFF${header}\n${rows.join("\n")}`;
  }

  async submitPublicLead(tenantId: string, siteId: string, data: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const email = data.email || "";
    const phone = data.phone || data.telefono || data.whatsapp || "";
    const name = data.name || data.nombre || data.fullName || "Sin nombre";

    const lead = await this.prisma.lead.create({
      data: {
        tenantId,
        siteId,
        email,
        phone,
        name,
        data,
        source: "website_contact",
      },
    });

    try {
      await this.prisma.analyticsEvent.create({
        data: {
          tenantId,
          siteId,
          type: "conversion",
          metadata: { formType: "contact", leadId: lead.id } as any,
        },
      });
    } catch {}

    // Send Push Notification asynchronously
    this.notifications.sendPushNotificationToTenant(
      tenantId,
      "¡Nuevo Lead Recibido!",
      `Has recibido un nuevo prospecto: ${name}`,
      { leadId: lead.id, url: "/leads" }
    ).catch(err => console.error("Error dispatching push", err));

    return lead;
  }
}
