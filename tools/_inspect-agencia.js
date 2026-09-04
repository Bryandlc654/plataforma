process.env.DATABASE_URL = 'mysql://u560058480_plataforma:6%7CnNqVdD%3EUvE@srv1067.hstgr.io:3306/u560058480_plataforma?charset=utf8mb4';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const site = await p.site.findUnique({ where: { id: 'ec9beb2b-ab02-42fa-a317-c37413cb3d41' }, include: { pages: { include: { blocks: { orderBy: { sortOrder: 'asc' } } } } } });
  console.log('## SITE pages:');
  for (const pg of site.pages) console.log(' - ' + pg.name + ' | ' + pg.path);
  const page = site.pages.find((pg) => pg.path === '/agencia');
  if (page) {
    console.log('\n## BLOQUES /agencia:');
    for (const b of page.blocks) {
      console.log('=== [' + b.type + '] anchor=' + (b.content && b.content.anchor || '') + ' ===');
      console.log(JSON.stringify(b.content, null, 2));
    }
  } else {
    console.log('no /agencia page');
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
