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
    const existing = await this.prisma.permission.count();
    if (existing > 0) {
      this.logger.log("Permissions already seeded, skipping");
      return;
    }

    const permissionEntries = (Object.values(PERMISSIONS) as string[]).map((name: string) => {
      const [resource, action] = name.split(".");
      return { name, resource, action };
    });

    await this.prisma.permission.createMany({
      data: permissionEntries,
      skipDuplicates: true,
    });

    this.logger.log(`Seeded ${permissionEntries.length} permissions`);
  }

  private async seedRoles() {
    const existing = await this.prisma.role.count();
    if (existing > 0) {
      this.logger.log("Roles already seeded, skipping");
      return;
    }

    const roleEntries = (Object.entries(ROLES) as Array<[string, string]>).map(([key, name]: [string, string]) => ({
      name,
      description: this.getRoleDescription(name),
      level: name === "super_admin" || name === "support" ? "platform" : "tenant",
      isSystem: true,
    }));

    await this.prisma.role.createMany({
      data: roleEntries,
      skipDuplicates: true,
    });

    this.logger.log(`Seeded ${roleEntries.length} roles`);
  }

  private async seedRolePermissions() {
    const existing = await this.prisma.rolePermission.count();
    if (existing > 0) {
      this.logger.log("Role permissions already seeded, skipping");
      return;
    }

    const roles = await this.prisma.role.findMany({ select: { id: true, name: true } });
    const permissions = await this.prisma.permission.findMany({ select: { id: true, name: true } });

    const roleMap = new Map(roles.map((r) => [r.name, r.id]));
    const permMap = new Map(permissions.map((p) => [p.name, p.id]));

    const entries: Array<{ roleId: string; permissionId: string }> = [];

    for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS) as Array<[string, string[]]>) {
      const roleId = roleMap.get(roleName);
      if (!roleId) continue;
      for (const permName of permNames) {
        const permissionId = permMap.get(permName);
        if (permissionId) entries.push({ roleId, permissionId });
      }
    }

    if (entries.length > 0) {
      await this.prisma.rolePermission.createMany({ data: entries, skipDuplicates: true });
    }

    this.logger.log(`Seeded ${entries.length} role permissions`);
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
