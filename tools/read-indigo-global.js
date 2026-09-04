process.env.DATABASE_URL = 'mysql://u560058480_plataforma:6%7CnNqVdD%3EUvE@srv1067.hstgr.io:3306/u560058480_plataforma?charset=utf8mb4';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const t = await p.template.findUnique({ where: { id: '418570e9-da73-4993-9fe7-46b754d5b1ab' }, select: { globalStyles: true, name: true } });
  console.log('TEMPLATE:', t.name);
  console.log('globalStyles:', JSON.stringify(t.globalStyles, null, 2));
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
