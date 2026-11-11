import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  private async assertSiteOwned(siteId: string, tenantId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id: siteId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!site) throw new NotFoundException("Site not found");
    return site;
  }

  private async assertPageOwned(id: string, tenantId: string) {
    const page = await this.prisma.sitePage.findFirst({
      where: { id, site: { tenantId, deletedAt: null } },
      select: { id: true },
    });
    if (!page) throw new NotFoundException("Page not found");
    return page;
  }

  private async assertBlockOwned(blockId: string, tenantId: string) {
    const block = await this.prisma.pageBlock.findFirst({
      where: { id: blockId, page: { site: { tenantId, deletedAt: null } } },
    });
    if (!block) throw new NotFoundException("Block not found");
    return block;
  }

  async create(siteId: string, tenantId: string, dto: { name: string; slug: string; path?: string }) {
    await this.assertSiteOwned(siteId, tenantId);

    const maxOrder = await this.prisma.sitePage.aggregate({
      where: { siteId },
      _max: { sortOrder: true },
    });

    return this.prisma.sitePage.create({
      data: {
        siteId,
        name: dto.name,
        slug: dto.slug,
        path: dto.path || `/${dto.slug}`,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    });
  }

  async findAll(siteId: string, tenantId: string) {
    await this.assertSiteOwned(siteId, tenantId);
    return this.prisma.sitePage.findMany({
      where: { siteId },
      include: {
        blocks: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findById(id: string, tenantId: string) {
    const page = await this.prisma.sitePage.findFirst({
      where: { id, site: { tenantId, deletedAt: null } },
      include: {
        blocks: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!page) throw new NotFoundException("Page not found");
    return page;
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      seoTitle?: string;
      seoDesc?: string;
      isPublished?: boolean;
    }
  ) {
    await this.assertPageOwned(id, tenantId);
    // Solo campos editables: el body no puede mover la página a otro sitio.
    const allowed: Record<string, unknown> = {};
    for (const key of ["name", "seoTitle", "seoDesc", "isPublished"] as const) {
      if (data?.[key] !== undefined) allowed[key] = data[key];
    }
    return this.prisma.sitePage.update({ where: { id }, data: allowed });
  }

  async remove(id: string, tenantId: string) {
    await this.assertPageOwned(id, tenantId);
    await this.prisma.sitePage.delete({ where: { id } });
    return { deleted: true };
  }

  async reorderPages(siteId: string, tenantId: string, pageIds: string[]) {
    await this.assertSiteOwned(siteId, tenantId);
    await this.prisma.$transaction(
      pageIds.map((id, i) =>
        this.prisma.sitePage.updateMany({
          where: { id, siteId },
          data: { sortOrder: i },
        })
      )
    );
    return this.findAll(siteId, tenantId);
  }

  // Block operations
  /**
   * El HTML de las plantillas importadas (variant "raw-html") lo genera el importador de ZIP
   * y se publica sin escapar, así que el usuario no puede escribirlo:
   * - al editar se conserva el HTML que ya tenía el bloque;
   * - al crear solo se acepta si es copia exacta de un bloque raw-html del mismo sitio.
   */
  private async protectRawHtml(content: any, siteId: string, previous?: any): Promise<any> {
    if (!content || typeof content !== "object" || Array.isArray(content)) return content;
    if (previous?.variant === "raw-html") {
      return { ...content, variant: "raw-html", html: previous.html };
    }
    if (typeof content.html !== "string") return content;
    if (content.variant === "raw-html") {
      // Vale si es copia de un bloque del sitio o de la plantilla de la que salió
      // (así deshacer un borrado puede volver a crear el bloque).
      const site = await this.prisma.site.findUnique({ where: { id: siteId }, select: { templateId: true } });
      const [siteBlocks, templateBlocks] = await Promise.all([
        this.prisma.pageBlock.findMany({ where: { page: { siteId } }, select: { content: true } }),
        site?.templateId
          ? this.prisma.templateBlock.findMany({ where: { page: { templateId: site.templateId } }, select: { content: true } })
          : Promise.resolve([] as { content: any }[]),
      ]);
      const known = [...siteBlocks, ...templateBlocks].some(
        (b: any) => b.content?.variant === "raw-html" && b.content?.html === content.html,
      );
      if (known) return content;
    }
    const { html: _html, ...rest } = content;
    return rest;
  }

  async addBlock(pageId: string, tenantId: string, dto: { type: string; content: any; styles?: any; afterIndex?: number }) {
    const page = await this.findById(pageId, tenantId);
    const afterIndex = Number.isInteger(dto.afterIndex) ? Math.max(-1, Number(dto.afterIndex)) : undefined;
    const index = afterIndex !== undefined ? Math.min(afterIndex + 1, page.blocks.length) : page.blocks.length;
    const content = await this.protectRawHtml(dto.content ?? {}, page.siteId);

    await this.prisma.pageBlock.updateMany({
      where: { sitePageId: pageId, sortOrder: { gte: index } },
      data: { sortOrder: { increment: 1 } },
    });

    return this.prisma.pageBlock.create({
      data: {
        sitePageId: pageId,
        type: String(dto.type),
        content: content as any,
        ...(dto.styles && typeof dto.styles === "object" ? { styles: dto.styles } : {}),
        sortOrder: index,
      },
    });
  }

  async updateBlock(blockId: string, tenantId: string, body: { content?: any; styles?: any }) {
    const block = await this.assertBlockOwned(blockId, tenantId);
    const page = await this.prisma.sitePage.findUnique({
      where: { id: block.sitePageId },
      select: { siteId: true },
    });

    // Solo content y styles: el body no puede cambiar la página, el tipo ni el orden del bloque.
    const data: { content?: any; styles?: any } = {};
    if (body?.content !== undefined) data.content = await this.protectRawHtml(body.content, page?.siteId || "", block.content);
    if (body?.styles !== undefined) data.styles = body.styles;

    const updated = await this.prisma.pageBlock.update({ where: { id: blockId }, data });

    // Header and footer are shared site-wide: propagate edits to all pages of the site
    const blockType = block.type;
    if (blockType === "header" || blockType === "footer") {
      if (page) {
        const otherPages = await this.prisma.sitePage.findMany({
          where: { siteId: page.siteId, id: { not: block.sitePageId } },
          select: { id: true },
        });
        if (otherPages.length > 0) {
          await this.prisma.pageBlock.updateMany({
            where: {
              sitePageId: { in: otherPages.map((p) => p.id) },
              type: blockType,
            },
            data: { content: data.content, styles: data.styles },
          });
        }
      }
    }

    return updated;
  }

  async removeBlock(blockId: string, tenantId: string) {
    const block = await this.assertBlockOwned(blockId, tenantId);

    await this.prisma.pageBlock.delete({ where: { id: blockId } });

    await this.prisma.pageBlock.updateMany({
      where: { sitePageId: block.sitePageId, sortOrder: { gt: block.sortOrder } },
      data: { sortOrder: { decrement: 1 } },
    });

    return { deleted: true };
  }

  async reorderBlocks(pageId: string, tenantId: string, blockIds: string[]) {
    await this.assertPageOwned(pageId, tenantId);
    await this.prisma.$transaction(
      blockIds.map((id, i) =>
        this.prisma.pageBlock.updateMany({
          where: { id, sitePageId: pageId },
          data: { sortOrder: i },
        })
      )
    );
    return this.findById(pageId, tenantId);
  }
}
