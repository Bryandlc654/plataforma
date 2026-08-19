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
    });
  }

  async findAll(filters?: { tenantId?: string; status?: string; priority?: string; assignedTo?: string }) {
    const where: any = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;

    return this.prisma.supportTicket.findMany({
      where,
      include: {
        tenant: { select: { name: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async findById(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        tenant: { select: { name: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
        replies: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  private async getStatus(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket.status;
  }

  async addReply(ticketId: string, userId: string, message: string, isStaff: boolean, images?: any) {
    if (!message?.trim()) throw new BadRequestException("El mensaje es obligatorio");

    const status = await this.getStatus(ticketId);
    if (status === "closed") throw new BadRequestException("No se puede responder a un ticket cerrado");

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "in_progress" },
    });

    return this.prisma.supportTicketReply.create({
      data: { ticketId, userId, message, isStaff, images: images || null },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  async updateStatus(id: string, status: string) {
    if (!STATUSES.includes(status)) throw new BadRequestException("Estado inválido");
    await this.getStatus(id);

    return this.prisma.supportTicket.update({
      where: { id },
      data: { status, closedAt: status === "closed" ? new Date() : null },
    });
  }

  async updatePriority(id: string, priority: string) {
    if (!PRIORITIES.includes(priority)) throw new BadRequestException("Prioridad inválida");
    await this.getStatus(id);
    return this.prisma.supportTicket.update({ where: { id }, data: { priority } });
  }

  async remove(id: string) {
    await this.getStatus(id);
    return this.prisma.supportTicket.delete({ where: { id } });
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
