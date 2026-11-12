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
      throw new BadRequestException("El ID de la empresa es obligatorio");
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, deletedAt: null },
    });

    if (!tenant) {
      throw new ForbiddenException("Empresa no encontrada o inactiva");
    }

    const user = request.user;
    const isSystemUser =
      user?.roles?.includes("super_admin") ||
      user?.roles?.includes("platform_admin") ||
      user?.roles?.includes("support");

    if (!tenant.isActive && !isSystemUser) {
      throw new ForbiddenException("La empresa está suspendida");
    }

    if (user?.id && !isSystemUser) {
      const membership = await this.prisma.userTenant.findUnique({
        where: {
          userId_tenantId: { userId: user.id, tenantId: String(tenantId) },
        },
        select: { id: true },
      });

      if (!membership) {
        throw new ForbiddenException("No eres miembro de esta empresa");
      }
    }

    request.tenant = tenant;
    return true;
  }
}
