import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const rating = data.rating ? Math.min(5, Math.max(1, parseInt(data.rating) || 5)) : 5;
    return this.prisma.review.create({
      data: {
        tenantId: data.tenantId,
        siteId: data.siteId || undefined,
        authorName: data.authorName,
        authorEmail: data.authorEmail || undefined,
        rating,
        content: data.content,
        avatarUrl: data.avatarUrl || undefined,
        isPublished: false,
      },
      select: { id: true, authorName: true, rating: true, createdAt: true },
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
