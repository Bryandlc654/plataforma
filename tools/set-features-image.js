process.env.DATABASE_URL = 'mysql://u560058480_plataforma:6%7CnNqVdD%3EUvE@srv1067.hstgr.io:3306/u560058480_plataforma?charset=utf8mb4';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const site = await p.site.findUnique({ where: { id: 'ec9beb2b-ab02-42fa-a317-c37413cb3d41' }, include: { pages: { include: { blocks: true } } } });
  const home = site.pages.find((pg) => pg.path === '/');
  const feat = home.blocks.find((b) => b.type === 'features');
  const c = { ...feat.content };
  c.imageUrl = 'https://pub-448097f708f142c4b44913cfc7d82c4f.r2.dev/indigo/indigo_branding_1787761144193.jpg';
  await p.pageBlock.update({ where: { id: feat.id }, data: { content: c } });
  console.log('imageUrl set:', c.imageUrl);
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
