process.env.DATABASE_URL = 'mysql://u560058480_plataforma:6%7CnNqVdD%3EUvE@srv1067.hstgr.io:3306/u560058480_plataforma?charset=utf8mb4';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const site = await p.site.findUnique({ where: { id: 'ec9beb2b-ab02-42fa-a317-c37413cb3d41' }, include: { pages: { include: { blocks: true } } } });
  const home = site.pages.find((pg) => pg.path === '/');
  const feat = home.blocks.find((b) => b.type === 'features');
  console.log('BEFORE:', JSON.stringify(feat.content, null, 2));
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
