import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async create(siteId: string, dto: { name: string; slug: string; path?: string }) {
    const site = await this.prisma.site.findUnique({ where: { id: siteId } });
    if (!site) throw new NotFoundException("Site not found");

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

  async findAll(siteId: string) {
    return this.prisma.sitePage.findMany({
      where: { siteId },
      include: {
        blocks: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findById(id: string) {
    const page = await this.prisma.sitePage.findUnique({
      where: { id },
      include: {
        blocks: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!page) throw new NotFoundException("Page not found");
    return page;
  }

  async update(id: string, data: {
    name?: string;
    seoTitle?: string;
    seoDesc?: string;
    isPublished?: boolean;
  }) {
    return this.prisma.sitePage.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.sitePage.delete({ where: { id } });
    return { deleted: true };
  }

  async reorderPages(siteId: string, pageIds: string[]) {
    await this.prisma.$transaction(
      pageIds.map((id, i) =>
        this.prisma.sitePage.update({
          where: { id },
          data: { sortOrder: i },
        })
      )
    );
    return this.findAll(siteId);
  }

  // Block operations
  async addBlock(pageId: string, dto: { type: string; content: any; afterIndex?: number }) {
    const page = await this.findById(pageId);
    const index = dto.afterIndex !== undefined ? dto.afterIndex + 1 : page.blocks.length;

    await this.prisma.pageBlock.updateMany({
      where: { sitePageId: pageId, sortOrder: { gte: index } },
      data: { sortOrder: { increment: 1 } },
    });

    return this.prisma.pageBlock.create({
      data: {
        sitePageId: pageId,
        type: dto.type,
        content: dto.content as any,
        sortOrder: index,
      },
    });
  }

  async updateBlock(blockId: string, data: { content?: any; styles?: any; type?: string }) {
    const block = await this.prisma.pageBlock.findUnique({ where: { id: blockId } });
    if (!block) throw new NotFoundException("Block not found");

    const updated = await this.prisma.pageBlock.update({ where: { id: blockId }, data });

    // Header and footer are shared site-wide: propagate edits to all pages of the site
    const blockType = data.type || block.type;
    if (blockType === "header" || blockType === "footer") {
      const page = await this.prisma.sitePage.findUnique({
        where: { id: block.sitePageId },
        select: { siteId: true },
      });
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

  async removeBlock(blockId: string) {
    const block = await this.prisma.pageBlock.findUnique({ where: { id: blockId } });
    if (!block) throw new NotFoundException("Block not found");

    await this.prisma.pageBlock.delete({ where: { id: blockId } });

    await this.prisma.pageBlock.updateMany({
      where: { sitePageId: block.sitePageId, sortOrder: { gt: block.sortOrder } },
      data: { sortOrder: { decrement: 1 } },
    });

    return { deleted: true };
  }

  async reorderBlocks(pageId: string, blockIds: string[]) {
    await this.prisma.$transaction(
      blockIds.map((id, i) =>
        this.prisma.pageBlock.update({
          where: { id },
          data: { sortOrder: i },
        })
      )
    );
    return this.findById(pageId);
  }
}
