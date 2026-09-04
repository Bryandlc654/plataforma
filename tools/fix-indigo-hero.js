process.env.DATABASE_URL = 'mysql://u560058480_plataforma:6%7CnNqVdD%3EUvE@srv1067.hstgr.io:3306/u560058480_plataforma?charset=utf8mb4';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const site = await p.site.findUnique({ where: { id: 'ec9beb2b-ab02-42fa-a317-c37413cb3d41' }, include: { pages: { include: { blocks: true } } } });
  const home = site.pages.find((pg) => pg.path === '/');
  const hero = home.blocks.find((b) => b.type === 'hero');
  const c = { ...hero.content };
  const slideImg = c.slides && c.slides[0] && c.slides[0].backgroundImage;
  if (slideImg && !c.backgroundImage) {
    c.backgroundImage = slideImg;
    await p.pageBlock.update({ where: { id: hero.id }, data: { content: c } });
    console.log('backgroundImage set:', c.backgroundImage);
  } else {
    console.log('No change. bgImage=', c.backgroundImage, 'slide=', slideImg);
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
