import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTenantDto } from "../../shared/index";
import { v4 as uuid } from "uuid";

@Injectable()
export class TenantsService {
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

  private randomSuffix(length = 6): string {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  async create(userId: string, dto: CreateTenantDto) {
    const slug =
      dto.slug ||
      dto.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 8);

    const existing = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException("Slug already taken");
    }

    const freePlan = await this.prisma.plan.findUnique({
      where: { slug: "free" },
    });

    const tenant = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug,
          subdomain: dto.subdomain || slug,
          planId: freePlan?.id,
          maxUsers: freePlan?.maxUsers ?? 1,
          maxSites: freePlan?.maxSites ?? 1,
          maxStorage: freePlan?.maxStorage ?? BigInt(52428800),
        },
      });

      const ownerRole = await tx.role.findUnique({
        where: { name: "owner" },
      });

      const userTenant = await tx.userTenant.create({
        data: {
          userId,
          tenantId: tenant.id,
          isOwner: true,
        },
      });

      if (ownerRole) {
        await tx.userTenantRole.create({
          data: {
            userTenantId: userTenant.id,
            roleId: ownerRole.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          tenantId: tenant.id,
          action: "tenant.create",
          resource: "Tenant",
          resourceId: tenant.id,
        },
      });

      return tenant;
    });

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      subdomain: tenant.subdomain,
      isActive: tenant.isActive,
      planId: tenant.planId,
      createdAt: tenant.createdAt,
    };
  }

  async findById(tenantId: string, userId: string) {
    const membership = await this.prisma.userTenant.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this tenant");
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        customDomain: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true,
        isActive: true,
        planId: true,
        subscriptionEndsAt: true,
        maxUsers: true,
        maxSites: true,
        maxStorage: true,
        storageUsed: true,
        settings: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return tenant;
  }

  async update(
    tenantId: string,
    userId: string,
    data: { name?: string; customDomain?: string; primaryColor?: string; secondaryColor?: string; logoUrl?: string; faviconUrl?: string }
  ) {
    const membership = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });

    if (!membership || !membership.isOwner) {
      throw new ForbiddenException("Only tenant owner can update settings");
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        customDomain: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true,
        isActive: true,
        settings: true,
        updatedAt: true,
      },
    });
  }

  async updateSettings(
    tenantId: string,
    userId: string,
    settings: { locale?: string; currency?: string; timezone?: string; branding?: unknown }
  ) {
    const membership = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });

    if (!membership || !membership.isOwner) {
      throw new ForbiddenException("Only tenant owner can update settings");
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const current = (tenant.settings as any) || {};
    const merged = { ...current, ...settings };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: merged },
    });

    return merged;
  }

  async getSettings(tenantId: string, userId: string) {
    const membership = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });

    if (!membership) throw new ForbiddenException("Not a member");

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    return {
      name: tenant.name,
      slug: tenant.slug,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain,
      logoUrl: tenant.logoUrl,
      faviconUrl: tenant.faviconUrl,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      settings: tenant.settings || {},
    };
  }

  async getStats(tenantId: string) {
    const [siteCount, leadCount, userCount] = await Promise.all([
      this.prisma.site.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.lead.count({ where: { tenantId } }),
      this.prisma.userTenant.count({ where: { tenantId } }),
    ]);

    return {
      sites: siteCount,
      leads: leadCount,
      users: userCount,
    };
  }

  async getUsers(tenantId: string) {
    const members = await this.prisma.userTenant.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        roles: {
          include: {
            role: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return members.map((m) => ({
      id: m.id,
      user: m.user,
      isOwner: m.isOwner,
      roles: m.roles.map((r) => r.role),
      joinedAt: m.joinedAt,
    }));
  }

  async removeMember(
    tenantId: string,
    userTenantId: string,
    actorUserId: string
  ) {
    const userTenant = await this.prisma.userTenant.findUnique({
      where: { id: userTenantId },
    });

    if (!userTenant || userTenant.tenantId !== tenantId) {
      throw new NotFoundException("Member not found in this tenant");
    }

    if (userTenant.isOwner) {
      throw new ForbiddenException("No puedes eliminar al propietario del negocio");
    }

    if (userTenant.userId === actorUserId) {
      throw new ForbiddenException("No puedes eliminarte a ti mismo");
    }

    const member = await this.prisma.user.findUnique({
      where: { id: userTenant.userId },
      select: { email: true, firstName: true, lastName: true },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.userTenantRole.deleteMany({
        where: { userTenantId },
      });
      await tx.userTenant.delete({
        where: { id: userTenantId },
      });
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          tenantId,
          action: "user.removed",
          resource: "UserTenant",
          resourceId: userTenantId,
          metadata: {
            removedUserId: userTenant.userId,
            removedEmail: member?.email || null,
          } as any,
        },
      });
    });

    return { deleted: true };
  }

  // Admin methods
  async adminFindAll() {
    return this.prisma.tenant.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true,
        createdAt: true,
        planId: true,
        plan: { select: { id: true, name: true, slug: true } },
        _count: { select: { userTenants: true, sites: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async adminCreate(dto: { name: string; slug?: string; subdomain?: string; planId?: string }) {
    const name = dto?.name?.trim();
    if (!name) throw new BadRequestException("Name is required");

    const hasCustomSlug = Boolean(dto.slug && dto.slug.trim());
    const base = this.normalizeSlug(hasCustomSlug ? dto.slug!.trim() : name);
    if (!base) throw new BadRequestException("Invalid slug");

    let slug = base;
    if (!hasCustomSlug) {
      slug = `${base}-${this.randomSuffix(6)}`;
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await this.prisma.tenant.findUnique({ where: { slug } });
      if (!existing) break;
      if (hasCustomSlug) throw new ConflictException("Slug already taken");
      slug = `${base}-${this.randomSuffix(6)}`;
    }

    const subdomainRaw = dto.subdomain?.trim();
    const subdomain = subdomainRaw ? this.normalizeSlug(subdomainRaw) : slug;
    if (!subdomain) throw new BadRequestException("Invalid subdomain");

    const existingSubdomain = await this.prisma.tenant.findUnique({ where: { subdomain } });
    if (existingSubdomain) throw new ConflictException("Subdomain already taken");

    const plan = dto.planId
      ? await this.prisma.plan.findUnique({ where: { id: dto.planId } })
      : await this.prisma.plan.findUnique({ where: { slug: "free" } });

    if (dto.planId && !plan) throw new NotFoundException("Plan not found");
    if (!plan) throw new NotFoundException("Default plan not found");

    return this.prisma.tenant.create({
      data: {
        name,
        slug,
        subdomain,
        planId: plan.id,
        maxUsers: plan.maxUsers,
        maxSites: plan.maxSites,
        maxStorage: plan.maxStorage,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true,
        createdAt: true,
        planId: true,
        plan: { select: { id: true, name: true, slug: true } },
        _count: { select: { userTenants: true, sites: true } },
      },
    });
  }

  async adminUpdate(id: string, dto: { name?: string; slug?: string; subdomain?: string; planId?: string }) {
    await this.findByIdAdmin(id);

    const data: { name?: string; slug?: string; subdomain?: string; planId?: string; maxUsers?: number; maxSites?: number; maxStorage?: bigint } = {};
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException("Name is required");
      data.name = name;
    }

    if (dto.slug !== undefined) {
      const slug = this.normalizeSlug(dto.slug.trim());
      if (!slug) throw new BadRequestException("Invalid slug");
      const existing = await this.prisma.tenant.findUnique({ where: { slug } });
      if (existing && existing.id !== id) throw new ConflictException("Slug already taken");
      data.slug = slug;
    }

    if (dto.subdomain !== undefined) {
      const subdomain = this.normalizeSlug(dto.subdomain.trim());
      if (!subdomain) throw new BadRequestException("Invalid subdomain");
      const existing = await this.prisma.tenant.findUnique({ where: { subdomain } });
      if (existing && existing.id !== id) throw new ConflictException("Subdomain already taken");
      data.subdomain = subdomain;
    }

    if (dto.planId !== undefined) {
      const plan = dto.planId
        ? await this.prisma.plan.findUnique({ where: { id: dto.planId } })
        : await this.prisma.plan.findUnique({ where: { slug: "free" } });
      if (!plan) throw new NotFoundException("Plan not found");
      data.planId = plan.id;
      data.maxUsers = plan.maxUsers;
      data.maxSites = plan.maxSites;
      data.maxStorage = plan.maxStorage;
    }

    return this.prisma.tenant.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true,
        createdAt: true,
        planId: true,
        plan: { select: { id: true, name: true, slug: true } },
        _count: { select: { userTenants: true, sites: true } },
      },
    });
  }

  async adminSuspend(id: string) {
    await this.findByIdAdmin(id);
    return this.prisma.tenant.update({ where: { id }, data: { isActive: false } });
  }

  async adminReactivate(id: string) {
    await this.findByIdAdmin(id);
    return this.prisma.tenant.update({ where: { id }, data: { isActive: true } });
  }

  async adminChangePlan(tenantId: string, planId: string) {
    const plan = planId
      ? await this.prisma.plan.findUnique({ where: { id: planId } })
      : await this.prisma.plan.findUnique({ where: { slug: "free" } });
    if (!plan) throw new NotFoundException("Plan not found");

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { planId: plan.id, maxUsers: plan.maxUsers, maxSites: plan.maxSites, maxStorage: plan.maxStorage },
    });
  }

  async adminDelete(id: string) {
    return this.prisma.tenant.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async findByIdAdmin(id: string) {
    const t = await this.prisma.tenant.findUnique({ where: { id } });
    if (!t || t.deletedAt) throw new NotFoundException("Tenant not found");
    return t;
  }
}
