import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { v4 as uuid } from "uuid";

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, invitedBy: string, dto: { email: string; roleId: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException("Role not found");
    if (role.level !== "tenant" || role.name === "owner") {
      throw new ForbiddenException("No puedes invitar con este rol");
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      const member = await this.prisma.userTenant.findUnique({
        where: { userId_tenantId: { userId: existing.id, tenantId } },
      });
      if (member) throw new BadRequestException("User is already a member");

      // User exists, add directly
      const userTenant = await this.prisma.userTenant.create({
        data: { userId: existing.id, tenantId, invitedBy },
      });

      await this.prisma.userTenantRole.create({
        data: { userTenantId: userTenant.id, roleId: dto.roleId },
      });

      await this.prisma.auditLog.create({
        data: {
          userId: existing.id,
          tenantId,
          action: "user.invited",
          resource: "User",
          resourceId: existing.id,
          metadata: { by: invitedBy } as any,
        },
      });

      return { status: "added", email: dto.email, roleId: dto.roleId };
    }

    const token = uuid();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        tenantId,
        roleId: dto.roleId,
        token,
        invitedBy,
        expiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: "invitation.created",
        resource: "Invitation",
        resourceId: invitation.id,
        metadata: { email: dto.email } as any,
      },
    });

    return invitation;
  }

  async findAll(tenantId: string) {
    return this.prisma.invitation.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async accept(token: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) throw new NotFoundException("Invitation not found");
    if (invitation.status !== "pending") throw new BadRequestException("Invitation already used");
    if (invitation.expiresAt < new Date()) throw new BadRequestException("Invitation expired");

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException("La invitación no corresponde a tu cuenta");
    }

    const existing = await this.prisma.userTenant.findUnique({
      where: {
        userId_tenantId: { userId, tenantId: invitation.tenantId },
      },
    });
    if (existing) {
      throw new BadRequestException("Ya eres miembro de este negocio");
    }

    const userTenant = await this.prisma.userTenant.create({
      data: {
        userId,
        tenantId: invitation.tenantId,
        invitedBy: invitation.invitedBy,
      },
    });

    await this.prisma.userTenantRole.create({
      data: {
        userTenantId: userTenant.id,
        roleId: invitation.roleId,
      },
    });

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "accepted", acceptedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        tenantId: invitation.tenantId,
        action: "invitation.accepted",
        resource: "Invitation",
        resourceId: invitation.id,
      },
    });

    return { status: "accepted", tenantId: invitation.tenantId };
  }

  async revoke(id: string, tenantId: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { id } });
    if (!invitation) throw new NotFoundException("Invitation not found");
    if (invitation.tenantId !== tenantId) {
      throw new ForbiddenException("No puedes revocar esta invitación");
    }

    return this.prisma.invitation.update({
      where: { id },
      data: { status: "revoked" },
    });
  }

  async getUserInvitations(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    return this.prisma.invitation.findMany({
      where: { email: user.email, status: "pending" },
      include: {
        inviter: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
