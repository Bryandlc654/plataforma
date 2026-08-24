import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const RESERVED_SLUGS = ["admin", "login", "register", "api", "dashboard", "auth", "sorteos"];

@Injectable()
export class SorteosService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;
    const where = { tenantId };

    const [data, total] = await Promise.all([
      this.prisma.sorteo.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit,
        include: { _count: { select: { participants: true } } },
      }),
      this.prisma.sorteo.count({ where }),
    ]);

    return {
      items: data.map(s => ({ ...s, participantCount: s._count.participants })),
      total,
      page,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findById(id: string, tenantId: string) {
    const sorteo = await this.prisma.sorteo.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { participants: true } } },
    });
    if (!sorteo) throw new NotFoundException("Sorteo no encontrado");
    return { ...sorteo, participantCount: sorteo._count.participants };
  }

  async create(tenantId: string, data: {
    title: string; slug: string; description?: string;
    fields: any[]; isActive?: boolean; startDate?: string; endDate?: string;
  }) {
    const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    if (!slug || slug.length < 2) throw new BadRequestException("Slug inválido");
    if (RESERVED_SLUGS.includes(slug)) throw new BadRequestException("Este slug está reservado");
    if (!data.fields || !Array.isArray(data.fields) || data.fields.length === 0) {
      throw new BadRequestException("Debes definir al menos un campo");
    }

    const existing = await this.prisma.sorteo.findFirst({ where: { tenantId, slug } });
    if (existing) throw new BadRequestException("Ya existe un sorteo con este slug");

    return this.prisma.sorteo.create({
      data: {
        tenantId,
        title: data.title,
        slug,
        description: data.description || null,
        fields: data.fields,
        isActive: data.isActive ?? true,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  async update(id: string, tenantId: string, data: {
    title?: string; slug?: string; description?: string;
    fields?: any[]; isActive?: boolean; startDate?: string; endDate?: string;
  }) {
    const sorteo = await this.prisma.sorteo.findFirst({ where: { id, tenantId } });
    if (!sorteo) throw new NotFoundException("Sorteo no encontrado");

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.fields !== undefined) {
      if (!Array.isArray(data.fields) || data.fields.length === 0) {
        throw new BadRequestException("Debes definir al menos un campo");
      }
      updateData.fields = data.fields;
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    if (data.slug && data.slug !== sorteo.slug) {
      const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
      if (RESERVED_SLUGS.includes(slug)) throw new BadRequestException("Este slug está reservado");
      const dup = await this.prisma.sorteo.findFirst({ where: { tenantId, slug, NOT: { id } } });
      if (dup) throw new BadRequestException("Ya existe un sorteo con este slug");
      updateData.slug = slug;
    }

    return this.prisma.sorteo.update({ where: { id }, data: updateData });
  }

  async remove(id: string, tenantId: string) {
    const sorteo = await this.prisma.sorteo.findFirst({ where: { id, tenantId } });
    if (!sorteo) throw new NotFoundException("Sorteo no encontrado");
    await this.prisma.sorteo.delete({ where: { id } });
    return { deleted: true };
  }

  async getParticipants(sorteoId: string, tenantId: string, page = 1, limit = 50) {
    const sorteo = await this.prisma.sorteo.findFirst({ where: { id: sorteoId, tenantId } });
    if (!sorteo) throw new NotFoundException("Sorteo no encontrado");

    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const skip = (page - 1) * safeLimit;
    const where = { sorteoId };

    const [data, total] = await Promise.all([
      this.prisma.sorteoParticipant.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit,
      }),
      this.prisma.sorteoParticipant.count({ where }),
    ]);

    return {
      items: data,
      total,
      page,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async removeParticipant(id: string, tenantId: string) {
    const participant = await this.prisma.sorteoParticipant.findFirst({
      where: { id, tenantId },
    });
    if (!participant) throw new NotFoundException("Participante no encontrado");
    await this.prisma.sorteoParticipant.delete({ where: { id } });
    return { deleted: true };
  }

  async findPublic(tenantId: string, slug: string) {
    const sorteo = await this.prisma.sorteo.findFirst({
      where: { tenantId, slug, isActive: true },
      select: { id: true, title: true, slug: true, description: true, fields: true, endDate: true },
    });
    if (!sorteo) throw new NotFoundException("Sorteo no encontrado");
    return sorteo;
  }

  async participate(tenantId: string, slug: string, data: any, ip?: string, ua?: string) {
    const sorteo = await this.prisma.sorteo.findFirst({
      where: { tenantId, slug, isActive: true },
    });
    if (!sorteo) throw new NotFoundException("Sorteo no encontrado o inactivo");

    if (sorteo.endDate && new Date() > sorteo.endDate) {
      throw new BadRequestException("Este sorteo ha finalizado");
    }

    const fields = (sorteo.fields as any[]) || [];
    for (const field of fields) {
      if (field.required && !data[field.name]) {
        throw new BadRequestException(`El campo "${field.label}" es obligatorio`);
      }
    }

    return this.prisma.sorteoParticipant.create({
      data: {
        sorteoId: sorteo.id,
        tenantId,
        data,
        ipAddress: ip || null,
        userAgent: ua || null,
      },
    });
  }
}
