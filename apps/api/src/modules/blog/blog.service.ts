import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { normalizeBlogSlug, resolveBlogSettings } from "./blog.util";

const RESERVED_SLUGS = [
  "admin", "login", "register", "api", "dashboard", "auth", "blog",
  "checkout", "dejar-opinion", "404", "mantenimiento", "sitemap.xml", "robots.txt",
];

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  private normalizeArticleSlug(input: unknown): string {
    return normalizeBlogSlug(input);
  }

  private async getSite(siteId: string, tenantId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id: siteId, tenantId, deletedAt: null },
      select: { id: true, settings: true },
    });
    if (!site) throw new NotFoundException("Sitio no encontrado");
    return site;
  }

  async getSettings(siteId: string, tenantId: string) {
    const site = await this.getSite(siteId, tenantId);
    return resolveBlogSettings(site.settings);
  }

  async updateSettings(
    siteId: string,
    tenantId: string,
    body: { enabled?: boolean; title?: string; slug?: string },
  ) {
    const site = await this.getSite(siteId, tenantId);
    const settings = (site.settings as any) || {};
    const current = resolveBlogSettings(settings);

    const nextSlug =
      body.slug !== undefined
        ? this.normalizeArticleSlug(body.slug) || "blog"
        : current.slug;
    if (nextSlug.length < 2) throw new BadRequestException("Slug inválido");

    const next = {
      enabled: body.enabled !== undefined ? body.enabled === true : current.enabled,
      title:
        body.title !== undefined && String(body.title).trim()
          ? String(body.title).trim().slice(0, 60)
          : current.title,
      slug: nextSlug,
    };

    await this.prisma.site.update({
      where: { id: site.id },
      data: { settings: { ...settings, blog: next } as any },
    });

    return next;
  }

  async list(
    siteId: string,
    tenantId: string,
    page = 1,
    limit = 20,
    status?: string,
  ) {
    await this.getSite(siteId, tenantId);
    const safeLimit = Math.min(100, Math.max(1, limit || 20));
    const safePage = Math.max(1, page || 1);
    const where: any = { siteId, tenantId };
    if (status === "published") where.isPublished = true;
    if (status === "draft") where.isPublished = false;

    const [items, total] = await Promise.all([
      this.prisma.blogArticle.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.blogArticle.count({ where }),
    ]);

    return {
      items,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async get(siteId: string, tenantId: string, id: string) {
    const article = await this.prisma.blogArticle.findFirst({
      where: { id, siteId, tenantId },
    });
    if (!article) throw new NotFoundException("Artículo no encontrado");
    return article;
  }

  async create(siteId: string, tenantId: string, body: any) {
    await this.getSite(siteId, tenantId);
    const title = String(body?.title || "").trim();
    if (!title) throw new BadRequestException("El título es obligatorio");

    const slug = this.normalizeArticleSlug(body?.slug || title);
    if (!slug || slug.length < 2) throw new BadRequestException("Slug inválido");
    if (RESERVED_SLUGS.includes(slug)) {
      throw new BadRequestException("Este slug está reservado");
    }

    const existing = await this.prisma.blogArticle.findFirst({
      where: { siteId, slug },
      select: { id: true },
    });
    if (existing) throw new BadRequestException("Ya existe un artículo con este slug");

    const isPublished = body?.isPublished === true;
    return this.prisma.blogArticle.create({
      data: {
        tenantId,
        siteId,
        title,
        slug,
        excerpt: body?.excerpt ? String(body.excerpt).slice(0, 500) : null,
        content: typeof body?.content === "string" ? body.content : "",
        coverImage: body?.coverImage || null,
        authorName: body?.authorName ? String(body.authorName).slice(0, 120) : null,
        tags: Array.isArray(body?.tags) ? body.tags : [],
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        seoTitle: body?.seoTitle ? String(body.seoTitle).slice(0, 200) : null,
        seoDesc: body?.seoDesc ? String(body.seoDesc).slice(0, 300) : null,
        seoImage: body?.seoImage || null,
      },
    });
  }

  async update(siteId: string, tenantId: string, id: string, body: any) {
    const article = await this.get(siteId, tenantId, id);
    const data: any = {};

    if (body?.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) throw new BadRequestException("El título es obligatorio");
      data.title = title;
    }
    if (body?.slug !== undefined) {
      const slug = this.normalizeArticleSlug(body.slug);
      if (!slug || slug.length < 2) throw new BadRequestException("Slug inválido");
      if (RESERVED_SLUGS.includes(slug)) {
        throw new BadRequestException("Este slug está reservado");
      }
      const existing = await this.prisma.blogArticle.findFirst({
        where: { siteId, slug, NOT: { id } },
        select: { id: true },
      });
      if (existing) throw new BadRequestException("Ya existe un artículo con este slug");
      data.slug = slug;
    }
    if (body?.excerpt !== undefined) {
      data.excerpt = body.excerpt ? String(body.excerpt).slice(0, 500) : null;
    }
    if (body?.content !== undefined) {
      data.content = typeof body.content === "string" ? body.content : "";
    }
    if (body?.coverImage !== undefined) data.coverImage = body.coverImage || null;
    if (body?.authorName !== undefined) {
      data.authorName = body.authorName ? String(body.authorName).slice(0, 120) : null;
    }
    if (body?.tags !== undefined) data.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body?.seoTitle !== undefined) {
      data.seoTitle = body.seoTitle ? String(body.seoTitle).slice(0, 200) : null;
    }
    if (body?.seoDesc !== undefined) {
      data.seoDesc = body.seoDesc ? String(body.seoDesc).slice(0, 300) : null;
    }
    if (body?.seoImage !== undefined) data.seoImage = body.seoImage || null;

    if (body?.isPublished !== undefined) {
      const isPublished = body.isPublished === true;
      data.isPublished = isPublished;
      if (isPublished && !article.publishedAt) data.publishedAt = new Date();
      if (!isPublished) data.publishedAt = null;
    }

    return this.prisma.blogArticle.update({ where: { id }, data });
  }

  async remove(siteId: string, tenantId: string, id: string) {
    await this.get(siteId, tenantId, id);
    await this.prisma.blogArticle.delete({ where: { id } });
    return { deleted: true };
  }
}
