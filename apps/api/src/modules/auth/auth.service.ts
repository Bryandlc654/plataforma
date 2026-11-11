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
import { createHash, randomInt, timingSafeEqual } from "crypto";
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
  StartAuthDto,
} from "../../shared/index";

const TRIAL_DAYS = 3;
/** Intentos fallidos por código; al llegar, hay que pedir uno nuevo (contador en la base). */
const MAX_CODE_ATTEMPTS = 5;
/** Bloqueo de login: N contraseñas incorrectas de una cuenta dentro de la ventana. */
const MAX_LOGIN_FAILURES = 10;
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
/** Un refresh token revocado que se vuelve a usar después de este margen indica robo. */
const REFRESH_REUSE_GRACE_MS = 60 * 1000;

/**
 * Los tokens (refresh y reseteo de contraseña) se guardan como SHA-256: si se filtra la
 * base, no sirven para entrar. Se aceptan también en claro solo para los creados antes
 * de este cambio (vencen solos: 7 días el refresh, 1 hora el reseteo).
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(String(token || "")).digest("hex");
}
const tokenLookup = (token: string) => ({ in: [hashToken(token), token] });

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

  /**
   * Flujo "solo correo": si el correo ya existe envía un código de acceso; si no,
   * crea la cuenta (sin contraseña) con su negocio y 3 días de prueba, y envía el
   * código de verificación. En ambos casos el usuario entra con verifyEmail.
   */
  async startWithEmail(dto: StartAuthDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (!existing.isActive) {
        throw new ForbiddenException("La cuenta está desactivada");
      }
      // El código solo sirve para completar un registro pendiente: una cuenta ya
      // activa con contraseña entra con correo + contraseña.
      if (existing.isVerified && existing.passwordHash) {
        throw new ConflictException("Este correo ya tiene una cuenta. Inicia sesión.");
      }
      await this.createVerificationCode(existing.id, existing.email);
      return { email: existing.email, isNew: false };
    }

    const localPart = email.split("@")[0];
    const businessName =
      localPart
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim() || "Mi negocio";
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const user = await this.prisma.$transaction(
      async (tx) => {
        const newUser = await tx.user.create({
          data: { email, isVerified: false },
        });

        const freePlan = await tx.plan.findUnique({ where: { slug: "free" } });

        const tenant = await tx.tenant.create({
          data: {
            name: businessName,
            slug: this.generateSlug(localPart),
            subdomain: this.generateSlug(localPart),
            planId: freePlan?.id,
            maxUsers: freePlan?.maxUsers ?? 1,
            maxSites: freePlan?.maxSites ?? 1,
            maxStorage: freePlan?.maxStorage ?? BigInt(52428800),
            subscriptionEndsAt: trialEndsAt,
            settings: {
              trial: { startedAt: new Date().toISOString(), endsAt: trialEndsAt.toISOString() },
              onboarding: { completed: false, goals: [] },
            } as any,
          },
        });

        const ownerRole = await tx.role.findFirst({
          where: { name: "owner", tenantId: null, isSystem: true },
        });

        const userTenant = await tx.userTenant.create({
          data: { userId: newUser.id, tenantId: tenant.id, isOwner: true },
        });

        if (ownerRole) {
          await tx.userTenantRole.create({
            data: { userTenantId: userTenant.id, roleId: ownerRole.id },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: newUser.id,
            tenantId: tenant.id,
            action: "user.register",
            resource: "User",
            resourceId: newUser.id,
          },
        });

        return newUser;
      },
      { maxWait: 10_000, timeout: 30_000 }
    );

    await this.createVerificationCode(user.id, user.email);
    return { email: user.email, isNew: true };
  }

  /** Define la contraseña inicial tras verificar el correo (solo si aún no tiene una). */
  async setInitialPassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, isVerified: true },
    });
    if (!user || !user.isVerified) {
      throw new ForbiddenException("Verifica tu correo primero.");
    }
    if (user.passwordHash) {
      throw new ForbiddenException("Esta cuenta ya tiene contraseña.");
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(password, 12) },
    });

    try {
      const profile = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          userTenants: {
            orderBy: { joinedAt: "asc" },
            take: 1,
            select: { tenant: { select: { name: true } } },
          },
        },
      });
      if (profile?.email) {
        await this.emailService.sendWelcomeEmail({
          to: profile.email,
          name: profile.firstName || "",
          tenantName: profile.userTenants[0]?.tenant?.name || "",
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed to send welcome email: ${err?.message || err}`);
    }

    return { message: "Contraseña creada correctamente." };
  }

  /** Compara en tiempo constante (no revela cuántos dígitos coinciden). */
  private sameCode(a: string, b: string): boolean {
    const x = Buffer.from(String(a || ""));
    const y = Buffer.from(String(b || ""));
    return x.length === y.length && timingSafeEqual(x, y);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    dto.email = dto.email.trim().toLowerCase();

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

    // El contador vive en la base: vale igual con varias instancias del API.
    if (verification.attempts >= MAX_CODE_ATTEMPTS) {
      throw new BadRequestException("Demasiados intentos fallidos. Solicita un código nuevo.");
    }
    if (!this.sameCode(verification.code, dto.code)) {
      await this.prisma.emailVerification.updateMany({
        where: { id: verification.id, attempts: { lt: MAX_CODE_ATTEMPTS } },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException("El código es incorrecto. Revisa el correo enviado.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException("No existe una cuenta con este correo.");
    }

    if (!user.isActive) {
      throw new ForbiddenException("La cuenta está desactivada");
    }

    // Verificar el correo no es un inicio de sesión alternativo: si la cuenta ya
    // está activa y tiene contraseña, hay que usarla.
    if (user.isVerified && user.passwordHash) {
      throw new BadRequestException("Esta cuenta ya está activa. Inicia sesión con tu contraseña.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { isVerified: true, lastLoginAt: new Date() },
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

    await this.assertLoginNotLocked(user);

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

      const stored = await this.prisma.refreshToken.findFirst({
        where: { token: tokenLookup(dto.refreshToken) },
      });

      if (!stored) {
        throw new UnauthorizedException("Invalid refresh token");
      }
      if (stored.revokedAt) {
        // Reutilizar un token ya rotado es señal de robo: se cierran todas las sesiones del
        // usuario. Se deja un margen por si dos pestañas refrescaron casi a la vez.
        if (Date.now() - stored.revokedAt.getTime() > REFRESH_REUSE_GRACE_MS) {
          await this.prisma.refreshToken.updateMany({
            where: { userId: stored.userId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          this.logger.warn(`Refresh token reutilizado (usuario ${stored.userId}): sesiones revocadas`);
        }
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Revocación condicional: dos peticiones con el mismo token no rotan las dos.
      const revoked = await this.prisma.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (revoked.count === 0) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const rp = await this.getUserRolesAndPermissions(user.id);
      const isSystemUser =
        rp.roles.includes("super_admin") ||
        rp.roles.includes("platform_admin") ||
        rp.roles.includes("support");

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
        data: { token: hashToken(resetToken), userId: user.id, expiresAt },
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
    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: { token: tokenLookup(dto.token) },
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
        where: { token: tokenLookup(refreshToken) },
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
    // Aleatorio criptográfico (Math.random es predecible).
    return String(randomInt(100000, 1000000));
  }

  private async createVerificationCode(userId: string, email: string) {
    const code = this.generateVerificationCode();

    // Secuencial (sin transacción): en MySQL/MariaDB el updateMany + create en una
    // misma transacción puede chocar por bloqueos de índice y devolver un 500.
    await this.prisma.emailVerification.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    });
    await this.prisma.emailVerification.create({
      data: {
        email,
        code,
        userId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

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
      rp.roles.includes("super_admin") ||
      rp.roles.includes("platform_admin") ||
      rp.roles.includes("support");

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
        token: hashToken(refreshToken),
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

  /**
   * Bloquea temporalmente una cuenta tras demasiadas contraseñas incorrectas. Se cuenta en
   * la base (auditLog) para que valga con varias instancias y aunque el atacante cambie de IP.
   */
  private async assertLoginNotLocked(user: { id: string; lastLoginAt?: Date | null }) {
    const windowStart = new Date(Date.now() - LOGIN_FAILURE_WINDOW_MS);
    // Un login correcto reinicia el contador.
    const since = user.lastLoginAt && user.lastLoginAt > windowStart ? user.lastLoginAt : windowStart;
    const failures = await this.prisma.auditLog.count({
      where: {
        userId: user.id,
        action: "auth.failed_login",
        createdAt: { gt: since },
        metadata: { path: "$.reason", equals: "invalid_password" },
      },
    });
    if (failures >= MAX_LOGIN_FAILURES) {
      throw new UnauthorizedException("Demasiados intentos fallidos. Espera 15 minutos o restablece tu contraseña.");
    }
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
