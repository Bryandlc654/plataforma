import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const CATEGORIES = ["general", "technical", "billing"];
const STATUSES = ["open", "in_progress", "closed"];

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: { tenantId?: string; userId?: string; subject: string; description: string; priority?: string; category?: string; images?: any }) {
    if (!dto.subject?.trim()) throw new BadRequestException("El asunto es obligatorio");
    if (!dto.description?.trim()) throw new BadRequestException("La descripción es obligatoria");
    if (dto.priority && !PRIORITIES.includes(dto.priority)) throw new BadRequestException("Prioridad inválida");
    if (dto.category && !CATEGORIES.includes(dto.category)) throw new BadRequestException("Categoría inválida");

    return this.prisma.supportTicket.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.userId,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority || "low",
        category: dto.category || "general",
        images: dto.images || null,
      },
      select: { id: true, subject: true, priority: true, status: true, category: true, createdAt: true },
    });
  }

  async findAll(filters?: { tenantId?: string; status?: string; priority?: string; assignedTo?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;

    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(100, Math.max(1, filters?.limit || 25));

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        select: {
          id: true, subject: true, priority: true, status: true, category: true, images: true,
          assignedTo: true, createdAt: true, updatedAt: true, closedAt: true,
          tenant: { select: { id: true, name: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      select: {
        id: true, subject: true, description: true, priority: true, status: true, category: true,
        images: true, assignedTo: true, createdAt: true, updatedAt: true, closedAt: true,
        tenant: { select: { id: true, name: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
        replies: {
          select: {
            id: true, message: true, isStaff: true, images: true, createdAt: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  async addReply(ticketId: string, userId: string, message: string, isStaff: boolean, images?: any) {
    if (!message?.trim()) throw new BadRequestException("El mensaje es obligatorio");

    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId }, select: { status: true } });
    if (!ticket) throw new NotFoundException("Ticket not found");
    if (ticket.status === "closed") throw new BadRequestException("No se puede responder a un ticket cerrado");

    const [, reply] = await this.prisma.$transaction([
      this.prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "in_progress" }, select: { id: true } }),
      this.prisma.supportTicketReply.create({
        data: { ticketId, userId, message, isStaff, images: images || null },
        select: {
          id: true, message: true, isStaff: true, images: true, createdAt: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return reply;
  }

  async updateStatus(id: string, status: string) {
    if (!STATUSES.includes(status)) throw new BadRequestException("Estado inválido");

    const ticket = await this.prisma.supportTicket.findUnique({ where: { id }, select: { id: true } });
    if (!ticket) throw new NotFoundException("Ticket not found");

    return this.prisma.supportTicket.update({
      where: { id },
      data: { status, closedAt: status === "closed" ? new Date() : null },
      select: { id: true, status: true, closedAt: true },
    });
  }

  async updatePriority(id: string, priority: string) {
    if (!PRIORITIES.includes(priority)) throw new BadRequestException("Prioridad inválida");

    const ticket = await this.prisma.supportTicket.findUnique({ where: { id }, select: { id: true } });
    if (!ticket) throw new NotFoundException("Ticket not found");

    return this.prisma.supportTicket.update({
      where: { id },
      data: { priority },
      select: { id: true, priority: true },
    });
  }

  async remove(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id }, select: { id: true } });
    if (!ticket) throw new NotFoundException("Ticket not found");

    await this.prisma.supportTicket.delete({ where: { id } });
    return { deleted: true };
  }

  async getStats(where: any = {}) {
    const [byStatus, highPriority] = await Promise.all([
      this.prisma.supportTicket.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
      this.prisma.supportTicket.count({ where: { ...where, priority: "high", status: { not: "closed" } } }),
    ]);

    const counts: Record<string, number> = { open: 0, in_progress: 0, closed: 0 };
    for (const row of byStatus) {
      if (row.status in counts) counts[row.status] = row._count;
    }

    return {
      open: counts.open,
      inProgress: counts.in_progress,
      closed: counts.closed,
      highPriority,
      total: counts.open + counts.in_progress + counts.closed,
    };
  }
}
