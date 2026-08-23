import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

const VALID_STATUSES = ["new", "contacted", "qualified", "converted", "archived"];

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
      const term = filters.search;
      where.OR = [
        { name: { contains: term } },
        { email: { contains: term } },
        { phone: { contains: term } },
      ];
    }
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const safePageSize = Math.min(Math.max(pageSize, 1), 100);
    const skip = (page - 1) * safePageSize;

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: safePageSize,
        select: {
          id: true, name: true, email: true, phone: true,
          status: true, source: true, data: true, createdAt: true,
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { items, total, page, pageSize: safePageSize, totalPages: Math.ceil(total / safePageSize) };
  }

  async findById(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    const lead = await this.prisma.lead.findFirst({ where });
    if (!lead) throw new NotFoundException("Lead not found");
    return lead;
  }

  async updateStatus(id: string, status: string, tenantId?: string) {
    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    }
    await this.findById(id, tenantId);
    return this.prisma.lead.update({ where: { id }, data: { status } });
  }

  async updateManyStatus(tenantId: string, ids: string[], status: string) {
    if (!ids?.length) return { count: 0 };
    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    }
    return this.prisma.lead.updateMany({
      where: { tenantId, id: { in: ids } },
      data: { status },
    });
  }

  async getStats(tenantId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const baseWhere = { tenantId };

    const [total, last30Days, last7Days, byStatus, bySourceRaw] = await Promise.all([
      this.prisma.lead.count({ where: baseWhere }),
      this.prisma.lead.count({ where: { ...baseWhere, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.lead.count({ where: { ...baseWhere, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.lead.groupBy({ by: ["status"], where: baseWhere, _count: true }),
      this.prisma.lead.groupBy({ by: ["source"], where: { ...baseWhere, source: { not: null } }, _count: true }),
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

    const BATCH_SIZE = 500;
    const MAX_EXPORT = 10000;
    const header = "Nombre,Email,Teléfono,Estado,Origen,Fecha,Datos";
    const rows: string[] = [];
    let cursor: string | undefined;

    for (let fetched = 0; fetched < MAX_EXPORT; fetched += BATCH_SIZE) {
      const batch = await this.prisma.lead.findMany({
        where,
        orderBy: { id: "asc" },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: { id: true, name: true, email: true, phone: true, status: true, source: true, createdAt: true, data: true },
      });
      if (batch.length === 0) break;
      cursor = batch[batch.length - 1].id;
      for (const l of batch) {
        const name = l.name || "";
        const email = l.email || "";
        const phone = l.phone || "";
        const jsondata = l.data ? `"${JSON.stringify(l.data).replace(/"/g, '""')}"` : "";
        rows.push([`"${name}"`, `"${email}"`, `"${phone}"`, l.status, l.source || "", l.createdAt.toISOString(), jsondata].join(","));
      }
      if (batch.length < BATCH_SIZE) break;
    }

    if (rows.length === 0) return "Sin datos";
    return `\uFEFF${header}\${rows.join("\n")}`;
  }

  async submitPublicLead(tenantId: string, siteId: string, data: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const email = data.email || "";
    const phone = data.phone || data.telefono || data.whatsapp || "";
    const name = data.name || data.nombre || data.fullName || "Sin nombre";

    const lead = await this.prisma.lead.create({
      data: {
        tenantId, siteId, email, phone, name, data,
        source: "website_contact",
      },
    });

    this.prisma.analyticsEvent.create({
      data: {
        tenantId, siteId, type: "conversion",
        metadata: { formType: "contact", leadId: lead.id } as any,
      },
    }).catch(() => {});

    this.notifications.sendPushNotificationToTenant(
      tenantId, "¡Nuevo Lead Recibido!",
      `Has recibido un nuevo prospecto: ${name}`,
      { leadId: lead.id, url: "/leads" }
    ).catch(() => {});

    return lead;
  }
}
