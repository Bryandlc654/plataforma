import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId =
      request.headers["x-tenant-id"] ||
      request.params.tenantId ||
      request.query.tenantId;

    if (!tenantId) {
      throw new BadRequestException("Tenant ID is required");
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, deletedAt: null },
    });

    if (!tenant) {
      throw new ForbiddenException("Tenant not found or inactive");
    }

    if (!tenant.isActive) {
      throw new ForbiddenException("Tenant is suspended");
    }

    const user = request.user;
    const isSystemUser =
      user?.roles?.includes("super_admin") || user?.roles?.includes("support");

    if (user?.id && !isSystemUser) {
      const membership = await this.prisma.userTenant.findUnique({
        where: {
          userId_tenantId: { userId: user.id, tenantId: String(tenantId) },
        },
        select: { id: true },
      });

      if (!membership) {
        throw new ForbiddenException("You are not a member of this tenant");
      }
    }

    request.tenant = tenant;
    return true;
  }
}
