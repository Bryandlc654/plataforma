import { Injectable, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => req?.cookies?.access_token,
      ]),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: configService.getOrThrow<string>("jwt.secret"),
    });
  }

  async validate(req: any, payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }

    const requestedTenantIdRaw = req?.headers?.["x-tenant-id"];
    const requestedTenantId = Array.isArray(requestedTenantIdRaw)
      ? requestedTenantIdRaw[0]
      : requestedTenantIdRaw;

    const includeRoles = {
      tenant: { select: { isActive: true, settings: true } },
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    };

    const userTenant = requestedTenantId
      ? await this.prisma.userTenant.findUnique({
          where: {
            userId_tenantId: { userId: user.id, tenantId: String(requestedTenantId) },
          },
          include: includeRoles,
        })
      : await this.prisma.userTenant.findFirst({
          where: { userId: user.id },
          orderBy: { joinedAt: "asc" },
          include: includeRoles,
        });

    if (requestedTenantId && !userTenant) {
      throw new ForbiddenException("You are not a member of this tenant");
    }

    const roles = userTenant?.roles.map((r) => r.role.name) ?? [];
    const permissions =
      userTenant?.roles.flatMap((r) =>
        r.role.permissions.map((p) => p.permission.name)
      ) ?? [];

    const isSuperAdmin = roles.includes("super_admin");
    const isSystemUser =
      isSuperAdmin || roles.includes("platform_admin") || roles.includes("support");

    if (!isSystemUser && userTenant?.tenant && !userTenant.tenant.isActive) {
      throw new ForbiddenException("El negocio está suspendido");
    }

    if (!isSystemUser && userTenant?.tenant && !this.isTrialBypassPath(req)) {
      const trialEndsRaw = (userTenant.tenant.settings as any)?.trial?.endsAt;
      const trialEndsAt = trialEndsRaw ? new Date(trialEndsRaw) : null;
      const trialExpired =
        !!trialEndsAt &&
        !Number.isNaN(trialEndsAt.getTime()) &&
        trialEndsAt.getTime() <= Date.now();

      if (trialExpired) {
        const activeSubs = await this.prisma.subscription.findMany({
          where: {
            tenantId: userTenant.tenantId,
            status: "active",
            currentPeriodEnd: { gt: new Date() },
          },
          select: { plan: { select: { price: true } } },
        });
        const hasPaidPlan = activeSubs.some((sub) => Number(sub.plan?.price || 0) > 0);
        if (!hasPaidPlan) {
          throw new ForbiddenException("Tu prueba gratis terminó. Elige un plan para continuar.");
        }
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions,
      tenantId: userTenant?.tenantId || null,
      isSuperAdmin,
    };
  }

  private isTrialBypassPath(req: any): boolean {
    const path = String(req?.originalUrl || req?.url || "").split("?")[0];
    const allowedPrefixes = [
      "/api/v1/auth",
      "/api/v1/billing",
      "/api/v1/subscriptions",
      "/api/v1/plans",
      "/api/v1/users/profile",
      "/api/v1/users/tenants",
      "/api/v1/sites/capabilities",
      "/api/v1/platform/branding",
    ];
    if (allowedPrefixes.some((prefix) => path.startsWith(prefix))) return true;
    return /^\/api\/v1\/tenants\/[^/]+\/settings\/?$/.test(path);
  }
}
