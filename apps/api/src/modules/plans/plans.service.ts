import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  private normalizeSlug(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private toInt(input: any, field: string, min: number): number {
    const n = typeof input === "string" ? Number(input) : input;
    if (!Number.isFinite(n)) throw new BadRequestException(`${field} must be a number`);
    const v = Math.trunc(n);
    if (v < min) throw new BadRequestException(`${field} must be >= ${min}`);
    return v;
  }

  private toBigInt(input: any, field: string, min: bigint): bigint {
    if (input === null || input === undefined) {
      throw new BadRequestException(`${field} is required`);
    }
    if (typeof input === "bigint") {
      if (input < min) throw new BadRequestException(`${field} must be >= ${min.toString()}`);
      return input;
    }
    if (typeof input === "number") {
      if (!Number.isFinite(input)) throw new BadRequestException(`${field} must be a number`);
      const v = BigInt(Math.trunc(input));
      if (v < min) throw new BadRequestException(`${field} must be >= ${min.toString()}`);
      return v;
    }
    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!/^\d+$/.test(trimmed)) throw new BadRequestException(`${field} must be an integer`);
      const v = BigInt(trimmed);
      if (v < min) throw new BadRequestException(`${field} must be >= ${min.toString()}`);
      return v;
    }
    throw new BadRequestException(`${field} must be an integer`);
  }

  async findAll() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async adminFindAll() {
    return this.prisma.plan.findMany({
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }, { name: "asc" }],
    });
  }

  async findBySlug(slug: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { slug },
    });

    if (!plan) {
      throw new NotFoundException("Plan not found");
    }

    return plan;
  }

  async findById(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException("Plan not found");
    }

    return plan;
  }

  async getCurrentPlan(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return {
      current: tenant.plan,
      subscriptionEndsAt: tenant.subscriptionEndsAt,
      limits: {
        maxUsers: tenant.maxUsers,
        maxSites: tenant.maxSites,
        maxStorage: tenant.maxStorage,
        storageUsed: tenant.storageUsed,
      },
    };
  }

  async create(dto: any) {
    const name = dto?.name?.trim();
    if (!name) throw new BadRequestException("Name is required");

    const slug = this.normalizeSlug(dto?.slug?.trim() || name);
    if (!slug) throw new BadRequestException("Invalid slug");

    const existingName = await this.prisma.plan.findUnique({ where: { name } });
    if (existingName) throw new ConflictException("Name already taken");

    const existingSlug = await this.prisma.plan.findUnique({ where: { slug } });
    if (existingSlug) throw new ConflictException("Slug already taken");

    const price = dto?.price ?? 0;
    const currency = (dto?.currency || "USD").toString().trim().toUpperCase();
    const billingInterval = (dto?.billingInterval || "monthly").toString().trim();
    if (!["monthly", "annual"].includes(billingInterval)) {
      throw new BadRequestException("billingInterval must be monthly or annual");
    }

    const maxUsers = this.toInt(dto?.maxUsers ?? 1, "maxUsers", 1);
    const maxSites = this.toInt(dto?.maxSites ?? 1, "maxSites", 1);
    const maxStorage = this.toBigInt(dto?.maxStorage ?? BigInt(52428800), "maxStorage", BigInt(0));
    const sortOrder = this.toInt(dto?.sortOrder ?? 0, "sortOrder", 0);

    const description = dto?.description ? String(dto.description) : undefined;
    const features = dto?.features ?? undefined;
    const isActive = dto?.isActive === undefined ? true : Boolean(dto.isActive);

    return this.prisma.plan.create({
      data: {
        name,
        slug,
        description,
        price,
        currency,
        billingInterval,
        maxUsers,
        maxSites,
        maxStorage,
        features,
        isActive,
        sortOrder,
      } as any,
    });
  }

  async update(id: string, dto: any) {
    const existing = await this.findById(id);

    if (dto?.isActive === false && existing.slug === "free") {
      throw new ForbiddenException("Free plan cannot be deactivated");
    }

    const data: any = {};

    if (dto?.name !== undefined) {
      const name = String(dto.name).trim();
      if (!name) throw new BadRequestException("Name is required");
      const other = await this.prisma.plan.findUnique({ where: { name } });
      if (other && other.id !== id) throw new ConflictException("Name already taken");
      data.name = name;
    }

    if (dto?.slug !== undefined) {
      const slug = this.normalizeSlug(String(dto.slug));
      if (!slug) throw new BadRequestException("Invalid slug");
      if (existing.slug === "free" && slug !== "free") {
        throw new ForbiddenException("Free plan slug cannot be changed");
      }
      const other = await this.prisma.plan.findUnique({ where: { slug } });
      if (other && other.id !== id) throw new ConflictException("Slug already taken");
      data.slug = slug;
    }

    if (dto?.price !== undefined) data.price = dto.price;
    if (dto?.currency !== undefined) data.currency = String(dto.currency).trim().toUpperCase();

    if (dto?.billingInterval !== undefined) {
      const billingInterval = String(dto.billingInterval).trim();
      if (!["monthly", "annual"].includes(billingInterval)) {
        throw new BadRequestException("billingInterval must be monthly or annual");
      }
      data.billingInterval = billingInterval;
    }

    if (dto?.maxUsers !== undefined) data.maxUsers = this.toInt(dto.maxUsers, "maxUsers", 1);
    if (dto?.maxSites !== undefined) data.maxSites = this.toInt(dto.maxSites, "maxSites", 1);
    if (dto?.maxStorage !== undefined) data.maxStorage = this.toBigInt(dto.maxStorage, "maxStorage", BigInt(0));
    if (dto?.sortOrder !== undefined) data.sortOrder = this.toInt(dto.sortOrder, "sortOrder", 0);
    if (dto?.description !== undefined) data.description = dto.description ? String(dto.description) : null;
    if (dto?.features !== undefined) data.features = dto.features;
    if (dto?.isActive !== undefined) data.isActive = Boolean(dto.isActive);

    return this.prisma.plan.update({ where: { id }, data });
  }
}
