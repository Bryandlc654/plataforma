process.env.DATABASE_URL = 'mysql://u560058480_plataforma:6%7CnNqVdD%3EUvE@srv1067.hstgr.io:3306/u560058480_plataforma?charset=utf8mb4';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const site = await p.site.findUnique({ where: { id: 'ec9beb2b-ab02-42fa-a317-c37413cb3d41' }, include: { pages: { include: { blocks: true } } } });
  for (const pg of site.pages) {
    const svc = pg.blocks.filter((b) => b.type === 'services');
    if (svc.length) {
      console.log('PAGE ' + pg.path);
      for (const b of svc) console.log('  ', JSON.stringify(b.content));
    }
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
