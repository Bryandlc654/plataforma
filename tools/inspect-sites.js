process.env.DATABASE_URL = 'mysql://u560058480_plataforma:6%7CnNqVdD%3EUvE@srv1067.hstgr.io:3306/u560058480_plataforma?charset=utf8mb4';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const sites = await p.site.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, subdomain: true, tenantId: true, templateId: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log('SITES:');
  for (const s of sites) {
    const t = s.templateId ? await p.template.findUnique({ where: { id: s.templateId }, select: { name: true } }) : null;
    console.log(`${s.subdomain} | ${s.name} | template=${t?.name || '(none)'} | ${s.id}`);
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
