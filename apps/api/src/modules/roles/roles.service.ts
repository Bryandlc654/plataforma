import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      where: { level: "tenant" },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async getPermissionsByUser(userId: string, tenantId: string) {
    const userTenant = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: {
                      select: { name: true, resource: true, action: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userTenant) return [];

    const permissions = userTenant.roles.flatMap((r) =>
      r.role.permissions.map((p) => p.permission.name)
    );

    const roles = userTenant.roles.map((r) => r.role.name);

    return { permissions, roles };
  }

  private async loadAssignableUserTenant(
    userTenantId: string,
    actorTenantId: string
  ) {
    const userTenant = await this.prisma.userTenant.findUnique({
      where: { id: userTenantId },
    });
    if (!userTenant) {
      throw new NotFoundException("Member not found");
    }
    if (userTenant.tenantId !== actorTenantId) {
      throw new ForbiddenException("No puedes modificar roles fuera de tu negocio");
    }
    if (userTenant.isOwner) {
      throw new ForbiddenException("No puedes modificar los roles del propietario");
    }
    return userTenant;
  }

  private async loadAssignableRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) throw new NotFoundException("Role not found");
    if (role.level !== "tenant" || role.name === "owner") {
      throw new ForbiddenException("No puedes asignar este rol");
    }
    return role;
  }

  async assignRole(
    userTenantId: string,
    roleId: string,
    actorUserId: string,
    actorTenantId: string
  ) {
    const userTenant = await this.loadAssignableUserTenant(userTenantId, actorTenantId);
    if (userTenant.userId === actorUserId) {
      throw new ForbiddenException("No puedes modificar tus propios roles");
    }
    const role = await this.loadAssignableRole(roleId);

    const exists = await this.prisma.userTenantRole.findUnique({
      where: {
        userTenantId_roleId: {
          userTenantId,
          roleId,
        },
      },
    });

    if (exists) return exists;

    return this.prisma.userTenantRole.create({
      data: {
        userTenantId,
        roleId,
      },
    });
  }

  async removeRole(userTenantId: string, roleId: string, actorTenantId: string) {
    const userTenant = await this.loadAssignableUserTenant(userTenantId, actorTenantId);
    const role = await this.loadAssignableRole(roleId);

    return this.prisma.userTenantRole.deleteMany({
      where: {
        userTenantId,
        roleId,
      },
    });
  }
}
