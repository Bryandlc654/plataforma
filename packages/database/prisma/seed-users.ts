import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Datos de seed
const PERMISSIONS = {
  SITE_CREATE: "site.create", SITE_READ: "site.read", SITE_UPDATE: "site.update",
  SITE_DELETE: "site.delete", SITE_PUBLISH: "site.publish", USER_CREATE: "user.create",
  USER_READ: "user.read", USER_UPDATE: "user.update", USER_DELETE: "user.delete",
  USER_INVITE: "user.invite", ROLE_MANAGE: "role.manage", BILLING_MANAGE: "billing.manage",
  BILLING_READ: "billing.read", SUBSCRIPTION_MANAGE: "subscription.manage",
  SUBSCRIPTION_READ: "subscription.read", ANALYTICS_VIEW: "analytics.view",
  ANALYTICS_EXPORT: "analytics.export", LEAD_CREATE: "lead.create", LEAD_READ: "lead.read",
  LEAD_UPDATE: "lead.update", LEAD_EXPORT: "lead.export", INTEGRATION_MANAGE: "integration.manage",
  CONFIG_TENANT: "config.tenant", CONFIG_SYSTEM: "config.system", AUDIT_VIEW: "audit.view",
  TEMPLATE_MANAGE: "template.manage", PLAN_MANAGE: "plan.manage",
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: Object.values(PERMISSIONS),
  support: [PERMISSIONS.AUDIT_VIEW, PERMISSIONS.BILLING_READ, PERMISSIONS.SUBSCRIPTION_READ],
  owner: [
    PERMISSIONS.SITE_CREATE, PERMISSIONS.SITE_READ, PERMISSIONS.SITE_UPDATE,
    PERMISSIONS.SITE_DELETE, PERMISSIONS.SITE_PUBLISH, PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ, PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_INVITE, PERMISSIONS.ROLE_MANAGE, PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.BILLING_READ, PERMISSIONS.SUBSCRIPTION_MANAGE, PERMISSIONS.SUBSCRIPTION_READ,
    PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_EXPORT, PERMISSIONS.LEAD_CREATE,
    PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_UPDATE, PERMISSIONS.LEAD_EXPORT,
    PERMISSIONS.INTEGRATION_MANAGE, PERMISSIONS.CONFIG_TENANT, PERMISSIONS.AUDIT_VIEW,
  ],
  admin: [
    PERMISSIONS.SITE_CREATE, PERMISSIONS.SITE_READ, PERMISSIONS.SITE_UPDATE,
    PERMISSIONS.SITE_PUBLISH, PERMISSIONS.USER_READ, PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.LEAD_CREATE, PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_UPDATE,
    PERMISSIONS.LEAD_EXPORT, PERMISSIONS.CONFIG_TENANT,
  ],
  editor: [PERMISSIONS.SITE_READ, PERMISSIONS.SITE_UPDATE],
  marketing: [
    PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_EXPORT, PERMISSIONS.LEAD_CREATE,
    PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_UPDATE, PERMISSIONS.LEAD_EXPORT,
  ],
  billing: [
    PERMISSIONS.BILLING_MANAGE, PERMISSIONS.BILLING_READ,
    PERMISSIONS.SUBSCRIPTION_MANAGE, PERMISSIONS.SUBSCRIPTION_READ,
  ],
  viewer: [PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.LEAD_READ],
};

async function main() {
  console.log("Iniciando seed...");

  // Seed permisos
  const permCount = await prisma.permission.count();
  if (permCount === 0) {
    const perms = Object.values(PERMISSIONS).map((name) => {
      const [resource, action] = name.split(".");
      return { name, resource, action };
    });
    await prisma.permission.createMany({ data: perms });
    console.log(`${perms.length} permisos creados`);
  } else {
    console.log(`${permCount} permisos ya existen`);
  }

  // Seed roles
  const roleCount = await prisma.role.count();
  if (roleCount === 0) {
    const roles = ["super_admin", "support", "owner", "admin", "editor", "marketing", "billing", "viewer"];
    await prisma.role.createMany({
      data: roles.map((name) => ({
        name,
        level: name === "super_admin" || name === "support" ? "platform" : "tenant",
        isSystem: true,
      })),
    });
    console.log(`${roles.length} roles creados`);
  } else {
    console.log(`${roleCount} roles ya existen`);
  }

  // Seed role_permissions
  const rpCount = await prisma.rolePermission.count();
  if (rpCount === 0) {
    const allRoles = await prisma.role.findMany();
    const allPerms = await prisma.permission.findMany();
    const permMap = new Map(allPerms.map((p) => [p.name, p.id]));

    for (const role of allRoles) {
      const perms = ROLE_PERMISSIONS[role.name] || [];
      // Si es super_admin, dale todos los permisos
      if (role.name === "super_admin") {
        await prisma.rolePermission.createMany({
          data: allPerms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        });
      } else {
        const data = perms
          .filter((p) => permMap.has(p))
          .map((p) => ({ roleId: role.id, permissionId: permMap.get(p)! }));
        if (data.length > 0) {
          await prisma.rolePermission.createMany({ data });
        }
      }
    }
    console.log("Role-permissions asignados");
  } else {
    console.log(`${rpCount} role-permissions ya existen`);
  }

  // Seed planes
  const planCount = await prisma.plan.count();
  if (planCount === 0) {
    await prisma.plan.createMany({
      data: [
        { name: "Free", slug: "free", price: 0, maxUsers: 1, maxSites: 1, maxStorage: 52428800, sortOrder: 0 },
        { name: "Pro", slug: "pro", price: 29.99, maxUsers: 3, maxSites: 3, maxStorage: 524288000, sortOrder: 1 },
        { name: "Business", slug: "business", price: 79.99, maxUsers: 10, maxSites: 10, maxStorage: 5368709120, sortOrder: 2 },
      ],
    });
    console.log("3 planes creados");
  } else {
    console.log(`${planCount} planes ya existen`);
  }

  // Crear usuarios
  const password = "Admin123!";
  const hashedPassword = await bcrypt.hash(password, 12);

  // Super Admin
  let superAdmin = await prisma.user.findUnique({ where: { email: "admin@plataforma.com" } });
  if (superAdmin) {
    console.log("Super Admin ya existe: admin@plataforma.com");
  } else {
    superAdmin = await prisma.user.create({
      data: { email: "admin@plataforma.com", passwordHash: hashedPassword, firstName: "Super", lastName: "Admin", isVerified: true },
    });
    console.log("Super Admin creado: admin@plataforma.com");
  }

  // Asignar rol super_admin al admin
  const superAdminRole = await prisma.role.findFirst({ where: { name: "super_admin", tenantId: null, isSystem: true } });
  if (superAdminRole) {
    let ut = await prisma.userTenant.findFirst({ where: { userId: superAdmin.id } });
    if (!ut) {
      const at = await prisma.tenant.create({
        data: { name: "Admin Plataforma", slug: "admin-" + Math.random().toString(36).substring(2, 6), isActive: true, maxUsers: 999, maxSites: 999, maxStorage: BigInt(10 * 1024 * 1024 * 1024) },
      });
      ut = await prisma.userTenant.create({
        data: { userId: superAdmin.id, tenantId: at.id, isOwner: true },
      });
    }
    const hasRole = await prisma.userTenantRole.findFirst({
      where: { userTenantId: ut.id, roleId: superAdminRole.id },
    });
    if (!hasRole) {
      await prisma.userTenantRole.create({ data: { userTenantId: ut.id, roleId: superAdminRole.id } });
      console.log("Rol super_admin asignado a admin@plataforma.com");
    }
  }

  // Tenant demo con roles reales y asignaciones reales
  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
  const ownerRole = await prisma.role.findFirst({ where: { name: "owner", tenantId: null, isSystem: true } });
  const adminRole = await prisma.role.findFirst({ where: { name: "admin", tenantId: null, isSystem: true } });
  const editorRole = await prisma.role.findFirst({ where: { name: "editor", tenantId: null, isSystem: true } });
  const marketingRole = await prisma.role.findFirst({ where: { name: "marketing", tenantId: null, isSystem: true } });

  const demoUsers = [
    { email: "owner@negocio.com", firstName: "Carlos", lastName: "Dueño", role: ownerRole, isOwner: true },
    { email: "admin@negocio.com", firstName: "María", lastName: "Admin", role: adminRole, isOwner: false },
    { email: "editor@negocio.com", firstName: "Lucía", lastName: "Editora", role: editorRole, isOwner: false },
    { email: "marketing@negocio.com", firstName: "Jorge", lastName: "Mkt", role: marketingRole, isOwner: false },
  ];

  let demoTenant = await prisma.tenant.findUnique({ where: { slug: "mi-negocio-demo" } });
  if (!demoTenant) {
    demoTenant = await prisma.tenant.create({
      data: {
        name: "Mi Negocio (Demo)",
        slug: "mi-negocio-demo",
        subdomain: "mi-negocio-demo",
        planId: freePlan?.id,
        maxUsers: 10,
        maxSites: freePlan?.maxSites ?? 1,
        maxStorage: freePlan?.maxStorage ?? BigInt(52428800),
      },
    });
    console.log("Tenant demo creado: Mi Negocio (Demo)");
  }

  for (const u of demoUsers) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: u.email, passwordHash: hashedPassword, firstName: u.firstName, lastName: u.lastName, isVerified: true },
      });
      console.log(`Usuario creado: ${u.email}`);
    }

    let ut = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId: demoTenant.id } },
    });
    if (!ut) {
      ut = await prisma.userTenant.create({
        data: { userId: user.id, tenantId: demoTenant.id, isOwner: u.isOwner },
      });
    }

    if (u.role) {
      const hasRole = await prisma.userTenantRole.findFirst({
        where: { userTenantId: ut.id, roleId: u.role.id },
      });
      if (!hasRole) {
        await prisma.userTenantRole.create({ data: { userTenantId: ut.id, roleId: u.role.id } });
        console.log(`Rol ${u.role.name} asignado a ${u.email} en tenant demo`);
      }
    }
  }

  const demoMembers = await prisma.userTenant.count({ where: { tenantId: demoTenant.id } });
  console.log(`Tenant demo listo: Mi Negocio (Demo) · ${demoMembers} miembros con roles asignados`);

  console.log("\n=== Usuarios ===");
  console.log("Super Admin: admin@plataforma.com / Admin123!");
  console.log("Owner:       owner@negocio.com  / Admin123!");
  console.log("Admin:       admin@negocio.com  / Admin123!");
  console.log("Editor:      editor@negocio.com / Admin123!");
  console.log("Marketing:   marketing@negocio.com / Admin123!");
  console.log("\nSeed completado.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
