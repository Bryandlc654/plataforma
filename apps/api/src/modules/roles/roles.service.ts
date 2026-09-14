import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRoleDto, UpdateRoleDto, SetRolePermissionsDto } from "../../shared";

const SYSTEM_ROLE_NAMES = new Set([
  "super_admin",
  "support",
  "owner",
  "admin",
  "editor",
  "marketing",
  "billing",
  "viewer",
]);

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(actorTenantId: string | null) {
    return this.prisma.role.findMany({
      where: {
        level: "tenant",
        OR: [{ isSystem: true }, { tenantId: actorTenantId }],
      },
      include: {
        permissions: {
          include: {
            permission: {
              select: { id: true, name: true, resource: true, action: true },
            },
          },
        },
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });
  }

  async findByName(name: string) {
    return this.prisma.role.findFirst({
      where: { name, level: "tenant" },
      include: {
        permissions: {
          include: {
            permission: {
              select: { id: true, name: true, resource: true, action: true },
            },
          },
        },
      },
    });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
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

  async create(actorTenantId: string | null, dto: CreateRoleDto) {
    if (!actorTenantId) {
      throw new ForbiddenException("Necesitas un negocio activo para crear roles");
    }

    const name = dto.name.trim();
    if (SYSTEM_ROLE_NAMES.has(name.toLowerCase())) {
      throw new ConflictException("El nombre del rol está reservado por el sistema");
    }

    const existing = await this.prisma.role.findFirst({
      where: {
        name,
        OR: [{ tenantId: actorTenantId }, { tenantId: null }],
      },
    });
    if (existing) {
      throw new ConflictException("Ya existe un rol con ese nombre");
    }

    const ids = [...new Set(dto.permissionIds)];
    const valid = await this.prisma.permission.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (valid.length !== ids.length) {
      throw new BadRequestException("Algunos permisos no son válidos");
    }
    if (ids.length === 0) {
      throw new BadRequestException("Debes seleccionar al menos un permiso");
    }

    const role = await this.prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          name,
          description: dto.description || null,
          level: "tenant",
          isSystem: false,
          tenantId: actorTenantId,
        },
      });
      await tx.rolePermission.createMany({
        data: valid.map((p) => ({ roleId: created.id, permissionId: p.id })),
        skipDuplicates: true,
      });
      return created;
    });

    return this.getRoleWithPermissions(role.id);
  }

  async update(
    roleId: string,
    actorTenantId: string | null,
    dto: UpdateRoleDto
  ) {
    const role = await this.loadCustomTenantRole(roleId, actorTenantId);

    const name = dto.name?.trim();
    if (name && name.toLowerCase() !== role.name.toLowerCase()) {
      if (SYSTEM_ROLE_NAMES.has(name.toLowerCase())) {
        throw new ConflictException("El nombre del rol está reservado por el sistema");
      }
      const clash = await this.prisma.role.findFirst({
        where: {
          name,
          id: { not: roleId },
          OR: [{ tenantId: actorTenantId }, { tenantId: null }],
        },
      });
      if (clash) {
        throw new ConflictException("Ya existe un rol con ese nombre");
      }
    }

    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: name || role.name,
        description: dto.description ?? role.description,
      },
    });

    return this.getRoleWithPermissions(roleId);
  }

  async delete(roleId: string, actorTenantId: string | null) {
    await this.loadCustomTenantRole(roleId, actorTenantId);

    const assignments = await this.prisma.userTenantRole.count({
      where: { roleId },
    });
    if (assignments > 0) {
      throw new ConflictException(
        "No puedes eliminar un rol que está asignado a usuarios"
      );
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.role.delete({ where: { id: roleId } }),
    ]);

    return { deleted: true };
  }

  async setPermissions(
    roleId: string,
    actorTenantId: string | null,
    dto: SetRolePermissionsDto
  ) {
    const role = await this.loadCustomTenantRole(roleId, actorTenantId);

    const ids = [...new Set(dto.permissionIds)];
    const valid = await this.prisma.permission.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (valid.length !== ids.length) {
      throw new BadRequestException("Algunos permisos no son válidos");
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: valid.map((p) => ({ roleId, permissionId: p.id })),
        skipDuplicates: true,
      }),
    ]);

    return this.getRoleWithPermissions(role.id);
  }

  private async getRoleWithPermissions(roleId: string) {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: {
              select: { id: true, name: true, resource: true, action: true },
            },
          },
        },
      },
    });
  }

  private async loadCustomTenantRole(
    roleId: string,
    actorTenantId: string | null
  ) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException("Role not found");
    if (role.isSystem) {
      throw new ForbiddenException("No puedes modificar un rol del sistema");
    }
    if (role.tenantId !== actorTenantId) {
      throw new ForbiddenException("No puedes modificar un rol de otro negocio");
    }
    return role;
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

  private async loadAssignableRole(
    roleId: string,
    actorTenantId: string | null
  ) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) throw new NotFoundException("Role not found");
    if (role.level !== "tenant" || role.name === "owner") {
      throw new ForbiddenException("No puedes asignar este rol");
    }
    if (role.tenantId !== null && role.tenantId !== actorTenantId) {
      throw new ForbiddenException("No puedes asignar un rol de otro negocio");
    }
    return role;
  }

  async assignRole(
    userTenantId: string,
    roleId: string,
    actorUserId: string,
    actorTenantId: string | null
  ) {
    const userTenant = await this.loadAssignableUserTenant(userTenantId, actorTenantId || "");
    if (userTenant.userId === actorUserId) {
      throw new ForbiddenException("No puedes modificar tus propios roles");
    }
    const role = await this.loadAssignableRole(roleId, actorTenantId);

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

  async removeRole(
    userTenantId: string,
    roleId: string,
    actorTenantId: string | null
  ) {
    const userTenant = await this.loadAssignableUserTenant(userTenantId, actorTenantId || "");
    await this.loadAssignableRole(roleId, actorTenantId);

    return this.prisma.userTenantRole.deleteMany({
      where: {
        userTenantId,
        roleId,
      },
    });
  }
}