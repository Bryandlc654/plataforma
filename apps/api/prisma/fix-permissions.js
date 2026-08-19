const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  // Get roles and permissions
  const [adminRole, marketingRole] = await Promise.all([
    p.role.findUnique({ where: { name: "admin" } }),
    p.role.findUnique({ where: { name: "marketing" } }),
  ]);

  const [integrationPerm, siteReadPerm] = await Promise.all([
    p.permission.findUnique({ where: { name: "integration.manage" } }),
    p.permission.findUnique({ where: { name: "site.read" } }),
  ]);

  // Add integration.manage to admin
  if (adminRole && integrationPerm) {
    const exists = await p.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: integrationPerm.id } },
    });
    if (!exists) {
      await p.rolePermission.create({ data: { roleId: adminRole.id, permissionId: integrationPerm.id } });
      console.log("✓ integration.manage → admin");
    } else {
      console.log("  integration.manage → admin (already exists)");
    }
  }

  // Add site.read to marketing
  if (marketingRole && siteReadPerm) {
    const exists = await p.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: marketingRole.id, permissionId: siteReadPerm.id } },
    });
    if (!exists) {
      await p.rolePermission.create({ data: { roleId: marketingRole.id, permissionId: siteReadPerm.id } });
      console.log("✓ site.read → marketing");
    } else {
      console.log("  site.read → marketing (already exists)");
    }
  }

  // Add integration.manage to marketing
  if (marketingRole && integrationPerm) {
    const exists = await p.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: marketingRole.id, permissionId: integrationPerm.id } },
    });
    if (!exists) {
      await p.rolePermission.create({ data: { roleId: marketingRole.id, permissionId: integrationPerm.id } });
      console.log("✓ integration.manage → marketing");
    } else {
      console.log("  integration.manage → marketing (already exists)");
    }
  }

  console.log("Done");
}

main().catch(console.error).finally(() => p.$disconnect());
