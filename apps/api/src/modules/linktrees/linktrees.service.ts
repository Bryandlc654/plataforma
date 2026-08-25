import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const RESERVED_SLUGS = ["admin", "login", "register", "api", "dashboard", "auth", "linktrees"];

@Injectable()
export class LinktreesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;
    const where = { tenantId };

    const [data, total] = await Promise.all([
      this.prisma.linkPage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit,
      }),
      this.prisma.linkPage.count({ where }),
    ]);

    return {
      items: data,
      total,
      page,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findById(id: string, tenantId: string) {
    const linktree = await this.prisma.linkPage.findFirst({
      where: { id, tenantId },
    });
    if (!linktree) throw new NotFoundException("Bio Link no encontrado");
    return linktree;
  }

  async create(tenantId: string, data: {
    title: string; slug: string; description?: string;
    logoUrl?: string; background?: any; socials?: any; links?: any; isActive?: boolean;
  }) {
    const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    if (!slug || slug.length < 2) throw new BadRequestException("Slug inválido");
    if (RESERVED_SLUGS.includes(slug)) throw new BadRequestException("Este slug está reservado");

    const existing = await this.prisma.linkPage.findFirst({ where: { tenantId, slug } });
    if (existing) throw new BadRequestException("Ya existe un enlace con este slug");

    return this.prisma.linkPage.create({
      data: {
        tenantId,
        title: data.title,
        slug,
        description: data.description || null,
        logoUrl: data.logoUrl || null,
        background: data.background || null,
        socials: data.socials || [],
        links: data.links || [],
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, tenantId: string, data: {
    title?: string; slug?: string; description?: string;
    logoUrl?: string; background?: any; socials?: any; links?: any; isActive?: boolean;
  }) {
    const linktree = await this.prisma.linkPage.findFirst({ where: { id, tenantId } });
    if (!linktree) throw new NotFoundException("Bio Link no encontrado");

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.background !== undefined) updateData.background = data.background || null;
    if (data.socials !== undefined) updateData.socials = data.socials;
    if (data.links !== undefined) updateData.links = data.links;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.slug && data.slug !== linktree.slug) {
      const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
      if (RESERVED_SLUGS.includes(slug)) throw new BadRequestException("Este slug está reservado");
      const dup = await this.prisma.linkPage.findFirst({ where: { tenantId, slug, NOT: { id } } });
      if (dup) throw new BadRequestException("Ya existe un enlace con este slug");
      updateData.slug = slug;
    }

    return this.prisma.linkPage.update({ where: { id }, data: updateData });
  }

  async remove(id: string, tenantId: string) {
    const linktree = await this.prisma.linkPage.findFirst({ where: { id, tenantId } });
    if (!linktree) throw new NotFoundException("Bio Link no encontrado");
    await this.prisma.linkPage.delete({ where: { id } });
    return { deleted: true };
  }
}
