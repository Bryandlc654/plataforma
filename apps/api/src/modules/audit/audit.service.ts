import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters?: { action?: string; userId?: string; from?: string; to?: string; limit?: number }) {
    const where: any = { tenantId };
    if (filters?.action) where.action = filters.action;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    return this.prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: Math.min(filters?.limit || 100, 500),
    });
  }

  async getActions(tenantId: string) {
    const result = await this.prisma.auditLog.groupBy({
      by: ["action"],
      where: { tenantId },
      _count: true,
      orderBy: { _count: { action: "desc" } },
    });
    return result.map((r) => ({ action: r.action, count: r._count }));
  }

  async getGlobal(filters?: { action?: string; from?: string; to?: string }) {
    const where: any = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }
}
