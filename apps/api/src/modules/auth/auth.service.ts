import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";
import {
  RegisterUserDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "../../shared/index";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async register(dto: RegisterUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
        },
      });

      const freePlan = await tx.plan.findUnique({
        where: { slug: "free" },
      });

      const tenant = await tx.tenant.create({
        data: {
          name: `${dto.firstName} ${dto.lastName}`,
          slug: this.generateSlug(`${dto.firstName} ${dto.lastName}`),
          subdomain: this.generateSlug(`${dto.firstName} ${dto.lastName}`),
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
          userId: user.id,
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
          userId: user.id,
          tenantId: tenant.id,
          action: "user.register",
          resource: "User",
          resourceId: user.id,
        },
      });

      return { user, tenant };
      },
      { maxWait: 10_000, timeout: 30_000 }
    );

    const rp = await this.getUserRolesAndPermissions(result.user.id);
    const tokens = await this.generateTokens(result.user, rp);
    const user = await this.enrichUser(result.user, rp);

    return {
      user,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        subdomain: result.tenant.subdomain,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      await this.logFailedAttempt(dto.email, ipAddress, userAgent, "user_not_found");
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      await this.logFailedAttempt(dto.email, ipAddress, userAgent, "invalid_password");
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      await this.logFailedAttempt(dto.email, ipAddress, userAgent, "account_disabled");
      throw new UnauthorizedException("Account is disabled");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    const rp = await this.getUserRolesAndPermissions(user.id);
    const tokens = await this.generateTokens(user, rp);

    const userTenants = await this.prisma.userTenant.findMany({
      where: { userId: user.id },
      include: { tenant: true },
    });

    const enriched = await this.enrichUser(user, rp);

    return {
      user: enriched,
      tenants: userTenants.map((ut) => ({
        id: ut.tenant.id,
        name: ut.tenant.name,
        slug: ut.tenant.slug,
        subdomain: ut.tenant.subdomain,
        isOwner: ut.isOwner,
      })),
      ...tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>("jwt.refreshSecret"),
      });

      const stored = await this.prisma.refreshToken.findUnique({
        where: { token: dto.refreshToken },
      });

      if (!stored || stored.revokedAt) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  async forgotPassword(dto: ForgotPasswordDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return { message: "If the email exists, a reset link will be sent" };
    }

    const resetToken = uuid();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "auth.password_reset_requested",
        resource: "User",
        resourceId: user.id,
        metadata: { token: resetToken, expiresAt: expiresAt.toISOString() } as any,
        ipAddress,
        userAgent,
      },
    });

    this.logger.log(`Password reset requested for ${user.email}`);

    return { message: "If the email exists, a reset link will be sent" };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const log = await this.prisma.auditLog.findFirst({
      where: {
        action: "auth.password_reset_requested",
        createdAt: { gte: oneHourAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!log?.metadata) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const metadata = log.metadata as any;
    if (metadata.token !== dto.token) {
      throw new BadRequestException("Invalid reset token");
    }

    if (metadata.expiresAt && new Date(metadata.expiresAt) < new Date()) {
      throw new BadRequestException("Reset token has expired");
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: log.userId! },
        data: { passwordHash: hashedPassword },
      });

      await tx.auditLog.create({
        data: {
          userId: log.userId,
          action: "auth.password_reset",
          resource: "User",
          resourceId: log.userId,
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: log.userId!, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { message: "Password reset successfully" };
  }

  async googleLogin(profile: any) {
    if (!profile?.emails?.[0]?.value) {
      throw new BadRequestException("No email from Google");
    }

    const email = profile.emails[0].value;

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            googleId: profile.id,
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            isVerified: true,
          },
        });

        const freePlan = await tx.plan.findUnique({
          where: { slug: "free" },
        });

        const tenant = await tx.tenant.create({
          data: {
            name: `${newUser.firstName} ${newUser.lastName}`.trim() || email,
            slug: this.generateSlug(email.split("@")[0]),
            subdomain: this.generateSlug(email.split("@")[0]),
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
            userId: newUser.id,
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

        return newUser;
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.id },
      });
    }

    const rp = await this.getUserRolesAndPermissions(user.id);
    const tokens = await this.generateTokens(user, rp);

    const userTenants = await this.prisma.userTenant.findMany({
      where: { userId: user.id },
      include: { tenant: true },
    });

    const enriched = await this.enrichUser(user, rp);

    return {
      user: enriched,
      tenants: userTenants.map((ut) => ({
        id: ut.tenant.id,
        name: ut.tenant.name,
        slug: ut.tenant.slug,
        subdomain: ut.tenant.subdomain,
        isOwner: ut.isOwner,
      })),
      ...tokens,
    };
  }

  async logout(refreshToken: string, userId?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });
    }
    // Also revoke all tokens for this user on explicit logout
    if (userId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { message: "Logged out successfully" };
  }

  private async generateTokens(user: any, rp?: { roles: string[]; permissions: string[] }): Promise<{ accessToken: string; refreshToken: string }> {
    const userRp = rp ?? (await this.getUserRolesAndPermissions(user.id));

    const payload = {
      sub: user.id,
      email: user.email,
      roles: userRp.roles,
      permissions: userRp.permissions,
    };

    const jti = uuid();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.secret"),
        expiresIn: this.configService.get<string>("jwt.expiration", "15m"),
      }),
      this.jwtService.signAsync(
        { ...payload, jti, type: "refresh" },
        {
          secret: this.configService.get<string>("jwt.refreshSecret"),
          expiresIn: this.configService.get<string>("jwt.refreshExpiration", "7d"),
        }
      ),
    ]);
    // Delete expired tokens to keep the database clean while allowing multiple devices
    await this.prisma.refreshToken.deleteMany({
      where: { 
        userId: user.id,
        expiresAt: { lt: new Date() }
      },
    }).catch(() => {});

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private async enrichUser(user: any, rp?: { roles: string[]; permissions: string[] }) {
    const { passwordHash, deletedAt, ...rest } = user;
    const rolesAndPermissions = rp ?? (await this.getUserRolesAndPermissions(user.id));
    return { ...rest, roles: rolesAndPermissions.roles, permissions: rolesAndPermissions.permissions };
  }

  private async getUserRolesAndPermissions(userId: string) {
    const userTenant = await this.prisma.userTenant.findFirst({
      where: { userId },
      include: { roles: { include: { role: true } } },
    });

    if (!userTenant) return { roles: [], permissions: [] };

    const roles = userTenant.roles.map((r) => r.role.name);
    const roleIds = userTenant.roles.map((r) => r.role.id);

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: { in: roleIds } },
      include: { permission: { select: { name: true } } },
    });

    const permissions = rolePermissions.map((rp) => rp.permission.name);

    return { roles, permissions };
  }

  private async logFailedAttempt(email: string, ipAddress?: string, userAgent?: string, reason?: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
      await this.prisma.auditLog.create({
        data: {
          userId: user?.id || null,
          action: "auth.failed_login",
          resource: "User",
          resourceId: user?.id || null,
          ipAddress,
          userAgent,
          metadata: { email, reason } as any,
        },
      });
    } catch {}
  }

  private generateSlug(text: string): string {
    const base = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const random = Math.random().toString(36).substring(2, 8);
    return `${base}-${random}`;
  }
}
