import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export const KB_CATEGORIES = [
  "Comenzar",
  "Dominio",
  "Sitio Web",
  "Blog",
  "SEO",
  "E-commerce",
  "Media",
  "Facturación",
] as const;

const KB_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  category: true,
  excerpt: true,
  isPublished: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class KnowledgeBaseService {
  constructor(private prisma: PrismaService) {}

  slugify(input: string): string {
    const base = String(input || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return base || "articulo";
  }

  private async resolveUniqueSlug(slug: string, exceptId?: string): Promise<string> {
    const base = this.slugify(slug);
    let candidate = base;
    let i = 2;
    for (;;) {
      const existing = await this.prisma.knowledgeBaseArticle.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || (exceptId && existing.id === exceptId)) return candidate;
      candidate = `${base}-${i}`;
      i += 1;
    }
  }

  async listPublished() {
    return this.prisma.knowledgeBaseArticle.findMany({
      where: { isPublished: true },
      select: KB_LIST_SELECT,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
  }

  async listAll() {
    return this.prisma.knowledgeBaseArticle.findMany({
      select: KB_LIST_SELECT,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
  }

  async counts() {
    const published = await this.prisma.knowledgeBaseArticle.findMany({
      where: { isPublished: true },
      select: { category: true },
    });
    const map = new Map<string, number>();
    for (const a of published) map.set(a.category, (map.get(a.category) || 0) + 1);
    return KB_CATEGORIES.filter((c) => map.has(c)).map((c) => ({
      name: c,
      count: map.get(c) || 0,
    }));
  }

  async getOne(identificador: string, canSeeAll: boolean) {
    const where = {
      OR: [{ id: identificador }, { slug: identificador }],
      ...(canSeeAll ? {} : { isPublished: true }),
    };
    const article = await this.prisma.knowledgeBaseArticle.findFirst({
      where,
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!article) throw new NotFoundException("Artículo no encontrado");
    return article;
  }

  async create(data: any, userId?: string) {
    const title = String(data.title || "").trim();
    if (title.length < 3) throw new BadRequestException("El título es obligatorio (mín. 3 caracteres)");
    const content = String(data.content || "").trim();
    if (content.length < 10) throw new BadRequestException("El contenido es obligatorio (mín. 10 caracteres)");

    const slug = await this.resolveUniqueSlug(data.slug || title);
    const category = KB_CATEGORIES.includes(data.category) ? data.category : "General";
    const excerpt = String(data.excerpt || "").trim().slice(0, 300) || null;

    return this.prisma.knowledgeBaseArticle.create({
      data: {
        title,
        slug,
        category,
        excerpt,
        content,
        isPublished: data.isPublished !== false,
        sortOrder: Number.isFinite(data.sortOrder) ? Math.max(0, Number(data.sortOrder)) : 0,
        createdById: userId || null,
      },
    });
  }

  async update(id: string, data: any) {
    const current = await this.prisma.knowledgeBaseArticle.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Artículo no encontrado");

    const title = data.title !== undefined ? String(data.title).trim() : current.title;
    if (data.title !== undefined && title.length < 3)
      throw new BadRequestException("El título debe tener al menos 3 caracteres");
    if (data.content !== undefined && String(data.content).trim().length < 10)
      throw new BadRequestException("El contenido debe tener al menos 10 caracteres");

    const slug = data.slug !== undefined && String(data.slug).trim()
      ? await this.resolveUniqueSlug(data.slug, id)
      : current.slug;

    return this.prisma.knowledgeBaseArticle.update({
      where: { id },
      data: {
        title,
        slug,
        category: data.category !== undefined
          ? (KB_CATEGORIES.includes(data.category) ? data.category : current.category)
          : current.category,
        excerpt: data.excerpt !== undefined ? (String(data.excerpt).trim().slice(0, 300) || null) : current.excerpt,
        content: data.content !== undefined ? String(data.content) : current.content,
        isPublished: data.isPublished !== undefined ? data.isPublished === true : current.isPublished,
        sortOrder: data.sortOrder !== undefined ? Math.max(0, Number(data.sortOrder) || 0) : current.sortOrder,
      },
    });
  }

  async remove(id: string) {
    const current = await this.prisma.knowledgeBaseArticle.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Artículo no encontrado");
    await this.prisma.knowledgeBaseArticle.delete({ where: { id } });
    return { ok: true };
  }
}