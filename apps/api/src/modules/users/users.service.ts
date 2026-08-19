import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateUserDto } from "../../shared/index";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        isActive: true,
        isVerified: true,
        locale: true,
        timezone: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        isActive: true,
        isVerified: true,
        locale: true,
        timezone: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        locale: true,
        timezone: true,
      },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw new ForbiddenException("Cannot change password for this account");
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ForbiddenException("Current password is incorrect");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });

    return { message: "Password changed successfully" };
  }

  async getTenantsByUser(userId: string) {
    const userTenants = await this.prisma.userTenant.findMany({
      where: { userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            subdomain: true,
            customDomain: true,
            logoUrl: true,
            isActive: true,
            planId: true,
            createdAt: true,
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

    return userTenants.map((ut) => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
      slug: ut.tenant.slug,
      subdomain: ut.tenant.subdomain,
      customDomain: ut.tenant.customDomain,
      logoUrl: ut.tenant.logoUrl,
      isActive: ut.tenant.isActive,
      isOwner: ut.isOwner,
      roles: ut.roles.map((r) => r.role.name),
      joinedAt: ut.joinedAt,
    }));
  }

  async adminFindAll(filters?: { role?: string; tenantId?: string; search?: string; page?: number; limit?: number }) {
    const where: any = { deletedAt: null };
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(100, Math.max(1, filters?.limit || 50));

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }

    if (filters?.role) {
      where.userTenants = {
        some: {
          roles: { some: { role: { name: filters.role } } },
        },
      };
    }

    if (filters?.tenantId) {
      where.userTenants = {
        ...(where.userTenants || {}),
        some: {
          ...((where.userTenants as any)?.some || {}),
          tenantId: filters.tenantId,
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          isActive: true, isVerified: true, lastLoginAt: true, lastLoginIp: true,
          createdAt: true, updatedAt: true,
          userTenants: {
            include: {
              tenant: { select: { id: true, name: true } },
              roles: { include: { role: { select: { id: true, name: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async adminToggleBlock(userId: string, actorUserId?: string) {
    if (actorUserId && actorUserId === userId) {
      throw new ForbiddenException("You cannot block your own account");
    }
    const user = await this.findById(userId);
    return this.prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  }

  async adminAssignTenant(userId: string, tenantId: string, roleId?: string, actorUserId?: string) {
    await this.findById(userId);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId, deletedAt: null } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const existing = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });

    if (existing) throw new ForbiddenException("User is already a member of this tenant");

    const role = roleId
      ? await this.prisma.role.findUnique({ where: { id: roleId }, select: { id: true, name: true } })
      : null;
    if (roleId && !role) throw new NotFoundException("Role not found");
    const isOwner = role?.name === "owner";

    const userTenant = await this.prisma.userTenant.create({
      data: { userId, tenantId, isOwner },
    });

    if (role?.id) {
      await this.prisma.userTenantRole.create({
        data: { userTenantId: userTenant.id, roleId: role.id },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId || null,
        tenantId,
        action: "user.assigned",
        resource: "UserTenant",
        resourceId: userTenant.id,
        metadata: { assignedUserId: userId, roleId: role?.id || null } as any,
      },
    });

    return userTenant;
  }

  async adminRemoveTenant(userId: string, tenantId: string) {
    const userTenant = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });

    if (!userTenant) throw new NotFoundException("User is not a member of this tenant");
    if (userTenant.isOwner) throw new ForbiddenException("Cannot remove the tenant owner");

    await this.prisma.userTenant.delete({ where: { id: userTenant.id } });
    return { deleted: true };
  }
}
