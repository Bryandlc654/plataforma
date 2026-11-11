import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";

function makeService(prisma: any) {
  return new AuthService(prisma, {} as any, { get: () => undefined } as any, {} as any);
}

describe("AuthService.verifyEmail (intentos en la base)", () => {
  const pending = (attempts: number) => ({ id: "v1", email: "a@b.com", code: "123456", attempts, expiresAt: new Date(Date.now() + 60_000), usedAt: null });

  it("un código incorrecto suma un intento en la base (vale entre instancias)", async () => {
    const prisma: any = {
      emailVerification: { findFirst: jest.fn().mockResolvedValue(pending(0)), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    await expect(makeService(prisma).verifyEmail({ email: "A@B.com ", code: "000000" } as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.emailVerification.updateMany).toHaveBeenCalledWith({
      where: { id: "v1", attempts: { lt: 5 } },
      data: { attempts: { increment: 1 } },
    });
  });

  it("tras 5 intentos rechaza incluso el código correcto (hay que pedir otro)", async () => {
    const prisma: any = {
      emailVerification: { findFirst: jest.fn().mockResolvedValue(pending(5)), updateMany: jest.fn() },
      user: { findUnique: jest.fn() },
    };
    await expect(makeService(prisma).verifyEmail({ email: "a@b.com", code: "123456" } as any)).rejects.toThrow(/Demasiados intentos/);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("genera códigos de 6 dígitos con aleatoriedad criptográfica", () => {
    const service: any = makeService({});
    for (let i = 0; i < 200; i++) expect(service.generateVerificationCode()).toMatch(/^[1-9]\d{5}$/);
  });
});

describe("AuthService.login (bloqueo por cuenta)", () => {
  const user = { id: "u1", email: "a@b.com", passwordHash: bcrypt.hashSync("Correcta123", 4), isActive: true, isVerified: true, lastLoginAt: null };

  it("bloquea tras 10 contraseñas incorrectas en 15 minutos, aunque sea la correcta", async () => {
    const prisma: any = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      auditLog: { count: jest.fn().mockResolvedValue(10), create: jest.fn() },
    };
    await expect(makeService(prisma).login({ email: "a@b.com", password: "Correcta123" } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    const where = prisma.auditLog.count.mock.calls[0][0].where;
    expect(where).toEqual(expect.objectContaining({ userId: "u1", action: "auth.failed_login", metadata: { path: "$.reason", equals: "invalid_password" } }));
  });

  it("cuenta solo los fallos posteriores al último login correcto", async () => {
    const lastLoginAt = new Date(Date.now() - 60_000);
    const prisma: any = {
      user: { findUnique: jest.fn().mockResolvedValue({ ...user, lastLoginAt }) },
      auditLog: { count: jest.fn().mockResolvedValue(10), create: jest.fn() },
    };
    await expect(makeService(prisma).login({ email: "a@b.com", password: "x" } as any)).rejects.toThrow(/Demasiados intentos/);
    expect(prisma.auditLog.count.mock.calls[0][0].where.createdAt).toEqual({ gt: lastLoginAt });
  });
});

describe("AuthService refresh tokens (guardados como hash)", () => {
  const { hashToken } = require("./auth.service");
  const jwt: any = { verify: jest.fn().mockReturnValue({ sub: "u1" }), signAsync: jest.fn().mockResolvedValue("nuevo.jwt") };
  const config: any = { get: (k: string, d?: any) => d ?? "x" };
  const svc = (prisma: any) => new AuthService(prisma, jwt, config, {} as any);

  it("al emitir tokens guarda solo el hash SHA-256", async () => {
    const prisma: any = { refreshToken: { create: jest.fn().mockResolvedValue({}) } };
    const out = await (svc(prisma) as any).generateTokens({ id: "u1", email: "a@b.com" }, { roles: [], permissions: [] });
    const stored = prisma.refreshToken.create.mock.calls[0][0].data.token;
    expect(stored).toBe(hashToken(out.refreshToken));
    expect(stored).not.toBe(out.refreshToken);
    expect(stored).toMatch(/^[0-9a-f]{64}$/);
  });

  it("busca por hash y acepta tokens antiguos guardados en claro", async () => {
    const prisma: any = { refreshToken: { findFirst: jest.fn().mockResolvedValue(null) } };
    await expect(svc(prisma).refreshToken({ refreshToken: "token.antiguo" } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({ where: { token: { in: [hashToken("token.antiguo"), "token.antiguo"] } } });
  });

  it("si se reutiliza un token rotado hace más de 60 s, revoca todas las sesiones del usuario", async () => {
    const prisma: any = {
      refreshToken: {
        findFirst: jest.fn().mockResolvedValue({ id: "rt1", userId: "u1", revokedAt: new Date(Date.now() - 5 * 60_000) }),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
    };
    await expect(svc(prisma).refreshToken({ refreshToken: "robado" } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({ where: { userId: "u1", revokedAt: null }, data: { revokedAt: expect.any(Date) } });
  });

  it("dentro del margen (dos pestañas a la vez) no revoca las demás sesiones", async () => {
    const prisma: any = {
      refreshToken: {
        findFirst: jest.fn().mockResolvedValue({ id: "rt1", userId: "u1", revokedAt: new Date(Date.now() - 5_000) }),
        updateMany: jest.fn(),
      },
    };
    await expect(svc(prisma).refreshToken({ refreshToken: "t" } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });
});
