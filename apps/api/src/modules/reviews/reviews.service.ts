import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from '../../shared';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const content = typeof data.content === 'string' ? data.content.trim() : '';
    if (content.length < 2) {
      throw new BadRequestException('El comentario debe tener al menos 2 caracteres');
    }
    if (content.length > 2000) {
      throw new BadRequestException('El comentario es demasiado largo');
    }

    const authorName = typeof data.authorName === 'string' ? data.authorName.trim().slice(0, 100) : '';
    if (!authorName) {
      throw new BadRequestException('Falta el nombre');
    }

    let authorEmail: string | undefined;
    if (data.authorEmail) {
      const email = typeof data.authorEmail === 'string' ? data.authorEmail.trim() : '';
      if (email) {
        if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new BadRequestException('Correo inválido');
        }
        authorEmail = email.toLowerCase();
      }
    }

    const rating = data.rating ? Math.min(5, Math.max(1, parseInt(data.rating, 10) || 5)) : 5;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: data.tenantId },
      select: { id: true },
    });
    if (!tenant) {
      throw new BadRequestException('Tenant inválido');
    }

    return this.prisma.review.create({
      data: {
        tenantId: data.tenantId,
        siteId: data.siteId || undefined,
        authorName,
        authorEmail,
        rating,
        content,
        avatarUrl: data.avatarUrl || undefined,
        isPublished: false,
        ipAddress: data.ipAddress || undefined,
        userAgent: data.userAgent ? String(data.userAgent).slice(0, 300) : undefined,
      },
      select: { id: true, authorName: true, rating: true, createdAt: true, isPublished: true },
    });
  }

  async createManual(tenantId: string, dto: CreateReviewDto) {
    return this.prisma.review.create({
      data: {
        tenantId,
        siteId: dto.siteId || undefined,
        authorName: dto.authorName.trim(),
        authorEmail: dto.authorEmail?.trim().toLowerCase() || undefined,
        rating: dto.rating,
        content: dto.content.trim(),
        isPublished: dto.isPublished ?? true,
      },
      select: { id: true, authorName: true, authorEmail: true, rating: true, content: true, createdAt: true, isPublished: true },
    });
  }

  async findAll(tenantId: string, page = 1, limit = 30) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        select: {
          id: true, authorName: true, authorEmail: true, rating: true,
          content: true, avatarUrl: true, isPublished: true, createdAt: true,
          ipAddress: true, userAgent: true,
        },
      }),
      this.prisma.review.count({ where: { tenantId } }),
    ]);

    return {
      data,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async findPublished(tenantId: string, siteId?: string) {
    const where: any = { tenantId, isPublished: true };
    if (siteId) where.siteId = siteId;
    return this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, authorName: true, rating: true, content: true,
        avatarUrl: true, createdAt: true,
      },
    });
  }

  async updateStatus(id: string, tenantId: string, isPublished: boolean) {
    const updated = await this.prisma.review.updateMany({
      where: { id, tenantId },
      data: { isPublished },
    });
    if (updated.count === 0) throw new NotFoundException('Review not found');
    return { success: true, isPublished };
  }

  async remove(id: string, tenantId: string) {
    const deleted = await this.prisma.review.deleteMany({
      where: { id, tenantId },
    });
    if (deleted.count === 0) throw new NotFoundException('Review not found');
    return { deleted: true };
  }
}