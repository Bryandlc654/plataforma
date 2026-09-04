process.env.DATABASE_URL = 'mysql://u560058480_plataforma:6%7CnNqVdD%3EUvE@srv1067.hstgr.io:3306/u560058480_plataforma?charset=utf8mb4';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const site = await p.site.findUnique({ where: { id: 'ec9beb2b-ab02-42fa-a317-c37413cb3d41' }, include: { pages: { include: { blocks: true } } } });
  const home = site.pages.find((pg) => pg.path === '/');
  const svc = home.blocks.find((b) => b.type === 'services');
  const content = {
    variant: 'indigo',
    kicker: '01',
    title: "LETRAS <span style='color:#fdcb0c'>3D</span>",
    description: 'Dale volumen a tu identidad. Fabricamos letreros en 3D que capturan miradas y dominan el espacio. Materiales de primera, acabados surrealistas e iluminación impactante para que tu marca nunca pase desapercibida.',
    imageUrl: 'https://pub-448097f708f142c4b44913cfc7d82c4f.r2.dev/indigo/indigo_3d_letters_1787761011422.jpg',
    features: [
      'Acero inoxidable y acrílico.',
      'Iluminación LED Neon de alto brillo.',
      'Instalación profesional interior y exterior.',
    ],
    buttonText: 'Cotizar Letras 3D',
    buttonUrl: '#contacto',
  };
  await p.pageBlock.update({ where: { id: svc.id }, data: { content } });
  console.log('services block updated:', JSON.stringify(content, null, 2));
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
