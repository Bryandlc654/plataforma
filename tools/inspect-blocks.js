process.env.DATABASE_URL = 'mysql://u560058480_plataforma:6%7CnNqVdD%3EUvE@srv1067.hstgr.io:3306/u560058480_plataforma?charset=utf8mb4';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const subs = ['webrodriplast', 'indigo'];
  for (const sub of subs) {
    const s = await p.site.findFirst({ where: { subdomain: sub }, include: { pages: { include: { blocks: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } } } });
    if (!s) { console.log('NO SITE', sub); continue; }
    console.log(`==== ${sub} (${s.id}) ====`);
    for (const pg of s.pages) {
      console.log(`  PAGE: ${pg.path} (${pg.name}) - blocks=[${pg.blocks.map(b => b.type).join(', ')}]`);
      for (const b of pg.blocks) {
        if (b.type === 'header' || b.type === 'footer') {
          console.log(`     ${b.type} content:`, JSON.stringify(b.content));
        }
      }
    }
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
