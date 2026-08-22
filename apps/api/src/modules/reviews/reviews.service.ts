
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.review.create({
      data: {
        tenantId: data.tenantId,
        siteId: data.siteId,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        rating: data.rating ? parseInt(data.rating) : 5,
        content: data.content,
        avatarUrl: data.avatarUrl,
        isPublished: false, // Always requires moderation
      }
    });
  }

  async findAll(tenantId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { tenantId } })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updateStatus(id: string, tenantId: string, isPublished: boolean) {
    const review = await this.prisma.review.findFirst({ where: { id, tenantId } });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.review.update({
      where: { id },
      data: { isPublished }
    });
  }

  async remove(id: string, tenantId: string) {
    const review = await this.prisma.review.findFirst({ where: { id, tenantId } });
    if (!review) throw new NotFoundException('Review not found');

    await this.prisma.review.delete({ where: { id } });
    return { deleted: true };
  }
}

