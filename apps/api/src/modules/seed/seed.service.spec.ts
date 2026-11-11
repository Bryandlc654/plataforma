import { SeedService } from "./seed.service";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../../shared/index";

function makePrisma() {
  const perms = (Object.values(PERMISSIONS) as string[]).map((name, i) => ({ id: `p${i}`, name }));
  return {
    permission: { upsert: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue(perms) },
    role: {
      findFirst: jest.fn().mockResolvedValue({ id: "r" }),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([{ id: "role-viewer", name: "viewer" }]),
    },
    rolePermission: { createMany: jest.fn().mockResolvedValue({}), deleteMany: jest.fn().mockResolvedValue({}) },
    plan: { count: jest.fn().mockResolvedValue(1) },
    perms,
  } as any;
}

describe("SeedService", () => {
  const env = { ...process.env };
  afterEach(() => { process.env = { ...env }; });

  it("sincroniza permisos de roles en producción aunque SEED_ON_STARTUP no esté definido", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.SEED_ON_STARTUP;
    const prisma = makePrisma();
    const service = new SeedService(prisma);
    await service.onModuleInit();

    expect(prisma.role.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isSystem: true, tenantId: null } }));
    // No borra todo: agrega lo que falta (sin duplicar) y quita solo lo que sobra.
    const created = prisma.rolePermission.createMany.mock.calls[0][0];
    expect(created.skipDuplicates).toBe(true);
    const ids = created.data.map((d: any) => d.permissionId);
    const expected = ROLE_PERMISSIONS.viewer.map((n: string) => prisma.perms.find((p: any) => p.name === n).id);
    expect(ids.sort()).toEqual(expected.sort());
    expect(ROLE_PERMISSIONS.viewer).toContain("site.read");
    expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({ where: { roleId: "role-viewer", permissionId: { notIn: expected } } });
    // Los datos de ejemplo siguen desactivados en producción.
    expect(prisma.plan.count).not.toHaveBeenCalled();
  });
});
