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
