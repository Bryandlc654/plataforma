import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const PRODUCT_FIELDS = [
  "name", "slug", "description", "price", "comparePrice", "currency",
  "sku", "stock", "isActive", "isFeatured", "images", "variants", "categoryId",
] as const;

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private pick(data: any, fields: readonly string[]) {
    const out: any = {};
    for (const key of fields) {
      if (data && data[key] !== undefined) out[key] = data[key];
    }
    return out;
  }

  private slugify(value: string): string {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async create(tenantId: string, dto: any) {
    const data = this.pick(dto, PRODUCT_FIELDS);
    if (!data.name) throw new BadRequestException("El nombre es obligatorio");
    if (!data.slug) data.slug = this.slugify(data.name) || `producto-${Date.now()}`;
    return this.prisma.product.create({ data: { ...data, tenantId } });
  }

  async findAll(tenantId: string, categoryId?: string) {
    const where: any = { tenantId };
    if (categoryId) where.categoryId = categoryId;
    return this.prisma.product.findMany({ where, include: { category: true }, orderBy: { createdAt: "desc" }, take: 200 });
  }

  async findById(id: string, tenantId: string) {
    const p = await this.prisma.product.findFirst({ where: { id, tenantId }, include: { category: true } });
    if (!p) throw new NotFoundException("Product not found");
    return p;
  }

  private async assertExists(id: string, tenantId: string) {
    const p = await this.prisma.product.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!p) throw new NotFoundException("Product not found");
  }

  async update(id: string, tenantId: string, data: any) {
    await this.assertExists(id, tenantId);
    const clean = this.pick(data, PRODUCT_FIELDS);
    return this.prisma.product.update({ where: { id }, data: clean });
  }

  async remove(id: string, tenantId: string) {
    await this.assertExists(id, tenantId);
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }

  async getCategories(tenantId: string) {
    return this.prisma.productCategory.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } });
  }

  async createCategory(tenantId: string, dto: { name: string; slug?: string }) {
    const name = String(dto?.name || "").trim();
    if (!name) throw new BadRequestException("El nombre es obligatorio");
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(name);
    return this.prisma.productCategory.create({ data: { tenantId, name, slug } });
  }
}
