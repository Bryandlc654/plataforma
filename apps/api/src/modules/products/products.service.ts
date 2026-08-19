import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.product.create({ data: { ...dto, tenantId } });
  }

  async findAll(tenantId: string, categoryId?: string) {
    const where: any = { tenantId };
    if (categoryId) where.categoryId = categoryId;
    return this.prisma.product.findMany({ where, include: { category: true }, orderBy: { createdAt: "desc" }, take: 200 });
  }

  async findById(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!p) throw new NotFoundException("Product not found");
    return p;
  }

  private async assertExists(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!p) throw new NotFoundException("Product not found");
  }

  async update(id: string, data: any) {
    await this.assertExists(id);
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }

  async getCategories(tenantId: string) {
    return this.prisma.productCategory.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } });
  }

  async createCategory(tenantId: string, dto: { name: string; slug?: string }) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return this.prisma.productCategory.create({ data: { tenantId, name: dto.name, slug } });
  }
}
