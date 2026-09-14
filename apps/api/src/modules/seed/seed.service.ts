import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DEFAULT_PLANS, PERMISSIONS, ROLE_PERMISSIONS, ROLES } from "../../shared/index";

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const enabled =
      process.env.SEED_ON_STARTUP === "true" || process.env.NODE_ENV !== "production";
    if (!enabled) {
      this.logger.log("Seed disabled, skipping");
      return;
    }
    try {
      await this.seedPermissions();
      await this.seedRoles();
      await this.seedRolePermissions();
      await this.seedPlans();
      this.logger.log("Database seeded successfully");
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Unknown error";
      this.logger.error(`Seed failed: ${msg}`);
    }
  }

  private async seedPermissions() {
    const permissionEntries = (Object.values(PERMISSIONS) as string[]).map((name: string) => {
      const [resource, action] = name.split(".");
      return { name, resource, action };
    });

    let synced = 0;
    for (const entry of permissionEntries) {
      try {
        await this.prisma.permission.upsert({
          where: { name: entry.name },
          update: {},
          create: entry,
        });
        synced++;
      } catch (err: any) {
        this.logger.warn(`Permission ${entry.name} sync failed: ${err?.message}`);
      }
    }

    this.logger.log(`Permissions synced (${synced}/${permissionEntries.length})`);
  }

  private async seedRoles() {
    const roleEntries = (Object.entries(ROLES) as Array<[string, string]>).map(([, name]: [string, string]) => ({
      name,
      description: this.getRoleDescription(name),
      level: name === "super_admin" || name === "support" ? "platform" : "tenant",
      isSystem: true,
    }));

    let synced = 0;
    for (const entry of roleEntries) {
      try {
        const existing = await this.prisma.role.findFirst({
          where: { name: entry.name, tenantId: null },
        });
        if (existing) {
          await this.prisma.role.update({
            where: { id: existing.id },
            data: {
              description: entry.description,
              level: entry.level,
              isSystem: true,
            },
          });
        } else {
          await this.prisma.role.create({ data: entry });
        }
        synced++;
      } catch (err: any) {
        this.logger.warn(`Role ${entry.name} sync failed: ${err?.message}`);
      }
    }

    this.logger.log(`System roles synced (${synced}/${roleEntries.length})`);
  }

  private async seedRolePermissions() {
    const roles = await this.prisma.role.findMany({
      where: { isSystem: true },
      select: { id: true, name: true },
    });
    const permissions = await this.prisma.permission.findMany({
      select: { id: true, name: true },
    });

    const permByName = new Map(permissions.map((p) => [p.name, p.id]));

    let total = 0;
    for (const role of roles) {
      const canonical =
        role.name === "super_admin"
          ? permissions.map((p) => p.id)
          : (ROLE_PERMISSIONS[role.name as keyof typeof ROLE_PERMISSIONS] || [])
              .map((name) => permByName.get(name))
              .filter((id): id is string => !!id);

      await this.prisma.$transaction([
        this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
        this.prisma.rolePermission.createMany({
          data: canonical.map((permissionId) => ({ roleId: role.id, permissionId })),
        }),
      ]);
      total += canonical.length;
    }

    this.logger.log(`System role-permissions reconciled (${total} assignments)`);
  }

  private async seedPlans() {
    const existing = await this.prisma.plan.count();
    if (existing > 0) {
      this.logger.log("Plans already seeded, skipping");
      return;
    }

    const planData = DEFAULT_PLANS.map((plan, index) => ({
      ...plan,
      currency: "USD",
      billingInterval: "monthly",
      features: JSON.parse(JSON.stringify(plan.features)),
      sortOrder: index,
    }));

    await this.prisma.plan.createMany({
      data: planData as any,
      skipDuplicates: true,
    });

    this.logger.log(`Seeded ${DEFAULT_PLANS.length} plans`);
  }

  private getRoleDescription(name: string): string {
    const descriptions: Record<string, string> = {
      super_admin: "Administrador principal de la plataforma SaaS",
      support: "Equipo de soporte tecnico y comercial",
      owner: "Propietario del negocio, maximo administrador del tenant",
      admin: "Administrador operativo del negocio",
      editor: "Usuario encargado de modificar contenido del sitio",
      marketing: "Responsable de campanas y conversion",
      billing: "Encargado financiero del tenant",
      viewer: "Usuario con acceso unicamente visual",
    };
    return descriptions[name] || "";
  }
}
