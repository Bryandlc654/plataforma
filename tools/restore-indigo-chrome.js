process.env.DATABASE_URL = 'mysql://u560058480_plataforma:6%7CnNqVdD%3EUvE@srv1067.hstgr.io:3306/u560058480_plataforma?charset=utf8mb4';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const LOGO = 'https://indigopublicidad.com/wp-content/uploads/2026/05/ChatGPT_Image_15_may_2026__02_55_47_p.m.-removebg-preview.png';

function headerContent(path) {
  const isWhite = path !== '/';
  const c = {
    variant: 'indigo',
    companyName: 'Indigo Publicidad',
    logoImage: LOGO,
    links: [
      { label: 'Agencia', url: '/agencia' },
      { label: 'Letras 3D', url: '/letras-3d' },
      { label: 'Branding', url: '/branding' },
      { label: 'Portafolio', url: '/portafolio' },
      { label: 'Contacto', url: '/contacto' },
    ],
  };
  if (isWhite) c.navbarStyle = 'white';
  return c;
}

function footerContent() {
  return {
    variant: 'indigo',
    companyName: 'Indigo Publicidad',
    logoImage: LOGO,
    email: 'hola@indigopublicidad.com',
    phone: '+1 (555) 123-4567',
    address: 'Ciudad Creativa, Distrito de Diseño 0987',
    links: [
      { label: 'Nosotros', url: '/agencia' },
      { label: 'Letras 3D & Neón', url: '/letras-3d' },
      { label: 'Branding Estratégico', url: '/branding' },
      { label: 'Portafolio', url: '/portafolio' },
    ],
    social: [
      { label: 'Instagram', url: '#' },
      { label: 'Behance', url: '#' },
      { label: 'LinkedIn', url: '#' },
    ],
  };
}

async function addChromeBlocks(blocks, pageId, create) {
  // remove any existing header/footer
  const existing = blocks.filter((b) => b.type === 'header' || b.type === 'footer');
  for (const b of existing) {
    await create.delete({ where: { id: b.id } });
  }
  const rest = blocks.filter((b) => b.type !== 'header' && b.type !== 'footer').sort((a, b) => a.sortOrder - b.sortOrder);
  const path = 0; // replaced below
}

async function main() {
  // 1. Clear template globalStyles for indigo
  await p.template.update({
    where: { id: '418570e9-da73-4993-9fe7-46b754d5b1ab' },
    data: { globalStyles: null },
  });
  console.log('Template globalStyles cleared.');

  // 2. Remove leftover global header/footer blocks on template pages
  const tPages = await p.templatePage.findMany({
    where: { templateId: '418570e9-da73-4993-9fe7-46b754d5b1ab' },
    include: { blocks: true },
  });
  let tRemoved = 0;
  for (const pg of tPages) {
    const hf = pg.blocks.filter((b) => b.type === 'header' || b.type === 'footer');
    for (const b of hf) { await p.templateBlock.delete({ where: { id: b.id } }); tRemoved++; }
    const rest = pg.blocks.filter((b) => b.type !== 'header' && b.type !== 'footer').sort((a, b) => a.sortOrder - b.sortOrder);
    for (let i = 0; i < rest.length; i++) { await p.templateBlock.update({ where: { id: rest[i].id }, data: { sortOrder: i + 1 } }); }
    await p.templateBlock.create({
      data: { templatePageId: pg.id, type: 'header', content: headerContent(pg.path), styles: {}, sortOrder: 0 },
    });
    await p.templateBlock.create({
      data: { templatePageId: pg.id, type: 'footer', content: footerContent(), styles: {}, sortOrder: rest.length + 1 },
    });
  }
  console.log('Template pages processed:', tPages.length, '| removed stale blocks:', tRemoved);

  // 3. Restore header/footer blocks on the indigo SITE pages
  const siteId = 'ec9beb2b-ab02-42fa-a317-c37413cb3d41';
  const sPages = await p.sitePage.findMany({ where: { siteId }, include: { blocks: true } });
  for (const pg of sPages) {
    const hf = pg.blocks.filter((b) => b.type === 'header' || b.type === 'footer');
    for (const b of hf) { await p.pageBlock.delete({ where: { id: b.id } }); }
    const rest = pg.blocks.filter((b) => b.type !== 'header' && b.type !== 'footer').sort((a, b) => a.sortOrder - b.sortOrder);
    for (let i = 0; i < rest.length; i++) { await p.pageBlock.update({ where: { id: rest[i].id }, data: { sortOrder: i + 1 } }); }
    await p.pageBlock.create({
      data: { sitePageId: pg.id, type: 'header', content: headerContent(pg.path), styles: {}, sortOrder: 0 },
    });
    await p.pageBlock.create({
      data: { sitePageId: pg.id, type: 'footer', content: footerContent(), styles: {}, sortOrder: rest.length + 1 },
    });
    console.log(`  site page ${pg.path}: header + footer restored (${pg.blocks.length} -> header,[${rest.length} blocks],footer)`);
  }

  await p.$disconnect();
  console.log('DONE');
}
main().catch((e) => { console.error(e); process.exit(1); });
