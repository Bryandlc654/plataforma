import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import {
  RegisterUserDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from "../../shared/index";

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService
  ) {}

  onModuleInit() {
    this.cleanupInterval = setInterval(() => {
      this.prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      }).catch(() => {});
    }, 6 * 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
  }

  async register(dto: RegisterUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException("Este correo ya está registrado");
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
          isVerified: false,
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

      const ownerRole = await tx.role.findFirst({
        where: { name: "owner", tenantId: null, isSystem: true },
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

    await this.createVerificationCode(result.user.id, result.user.email);

    return {
      message: "Revisa tu correo para ingresar el código de verificación y activar tu cuenta.",
      email: result.user.email,
      requiresVerification: true,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const verification = await this.prisma.emailVerification.findFirst({
      where: { email: dto.email, usedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      throw new BadRequestException("No hay un código pendiente para este correo. Solicita uno nuevo.");
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException("El código ha expirado. Solicita uno nuevo.");
    }

    if (verification.code !== dto.code) {
      throw new BadRequestException("El código es incorrecto. Revisa el correo enviado.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException("No existe una cuenta con este correo.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });

      await tx.emailVerification.updateMany({
        where: { email: dto.email, usedAt: null },
        data: { usedAt: new Date() },
      });
    });

    return this.buildAuthPayload(user);
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, isVerified: true },
    });

    if (!user) {
      return { message: "Si el correo existe, recibirás un código de verificación." };
    }

    if (user.isVerified) {
      return { message: "Tu correo ya está verificado. Ya puedes iniciar sesión." };
    }

    await this.createVerificationCode(user.id, user.email);

    return { message: "Te enviamos un nuevo código a tu correo." };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      await this.logFailedAttempt(dto.email, ipAddress, userAgent, "user_not_found");
      throw new UnauthorizedException("Credenciales incorrectas");
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      await this.logFailedAttempt(dto.email, ipAddress, userAgent, "invalid_password");
      throw new UnauthorizedException("Credenciales incorrectas");
    }

    if (!user.isActive) {
      await this.logFailedAttempt(dto.email, ipAddress, userAgent, "account_disabled");
      throw new UnauthorizedException("La cuenta está desactivada");
    }

    if (!user.isVerified) {
      const pending = await this.prisma.emailVerification.findFirst({
        where: { email: user.email, usedAt: null },
      });

      if (pending) {
        await this.logFailedAttempt(dto.email, ipAddress, userAgent, "email_not_verified");
        throw new ForbiddenException(
          "Tu correo aún no ha sido verificado. Revisa tu bandeja de entrada e ingresa el código de verificación."
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
      user = { ...user, isVerified: true };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    return this.buildAuthPayload(user);
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

      const rp = await this.getUserRolesAndPermissions(user.id);
      const isSystemUser =
        rp.roles.includes("super_admin") || rp.roles.includes("support");

      if (!isSystemUser) {
        const memberships = await this.prisma.userTenant.findMany({
          where: { userId: user.id },
          select: { tenant: { select: { isActive: true } } },
        });
        if (
          memberships.length > 0 &&
          !memberships.some((m) => m.tenant.isActive)
        ) {
          throw new ForbiddenException("El negocio está suspendido");
        }
      }

      return this.generateTokens(user, rp);
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  async forgotPassword(dto: ForgotPasswordDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return { message: "Si el correo existe, recibirás un enlace para restablecer tu contraseña." };
    }

    const resetToken = uuid();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.create({
        data: { token: resetToken, userId: user.id, expiresAt },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "auth.password_reset_requested",
        resource: "User",
        resourceId: user.id,
        ipAddress,
        userAgent,
      },
    });

    this.logger.log(`Password reset requested for ${user.email}`);

    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (err: any) {
      this.logger.warn(`Failed to send reset email: ${err.message}`);
    }

    return { message: "Si el correo existe, recibirás un enlace para restablecer tu contraseña." };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!resetRecord || resetRecord.usedAt) {
      throw new BadRequestException("El enlace de restablecimiento es inválido o ya fue usado.");
    }

    if (resetRecord.expiresAt < new Date()) {
      throw new BadRequestException("El enlace ha expirado. Solicita uno nuevo.");
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: hashedPassword },
      });

      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId: resetRecord.userId,
          action: "auth.password_reset",
          resource: "User",
          resourceId: resetRecord.userId,
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { message: "Contraseña restablecida correctamente. Ya puedes iniciar sesión." };
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

        const ownerRole = await tx.role.findFirst({
            where: { name: "owner", tenantId: null, isSystem: true },
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

    return this.buildAuthPayload(user);
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

  private generateVerificationCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private async createVerificationCode(userId: string, email: string) {
    const code = this.generateVerificationCode();

    await this.prisma.$transaction([
      this.prisma.emailVerification.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.emailVerification.create({
        data: {
          email,
          code,
          userId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      }),
    ]);

    try {
      await this.emailService.sendVerificationEmail(email, code);
    } catch (err: any) {
      this.logger.warn(`Failed to send verification email: ${err.message}`);
      if (!this.emailService.isConfigured) {
        this.logger.warn(`[DEV] Verification code for ${email}: ${code}`);
      }
    }
  }

  private async buildAuthPayload(user: any) {
    const rp = await this.getUserRolesAndPermissions(user.id);

    const userTenants = await this.prisma.userTenant.findMany({
      where: { userId: user.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            subdomain: true,
            isActive: true,
          },
        },
      },
    });

    const isSystemUser =
      rp.roles.includes("super_admin") || rp.roles.includes("support");

    const accessibleTenants = isSystemUser
      ? userTenants
      : userTenants.filter((ut) => ut.tenant.isActive);

    if (!isSystemUser && userTenants.length > 0 && accessibleTenants.length === 0) {
      throw new ForbiddenException(
        "El negocio está suspendido. Contacta al administrador."
      );
    }

    const tokens = await this.generateTokens(user, rp);

    const enriched = await this.enrichUser(user, rp);

    return {
      user: enriched,
      tenants: accessibleTenants.map((ut) => ({
        id: ut.tenant.id,
        name: ut.tenant.name,
        slug: ut.tenant.slug,
        subdomain: ut.tenant.subdomain,
        isOwner: ut.isOwner,
      })),
      ...tokens,
    };
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
