/**
 * Copia las plantillas (categorías, plantillas, páginas y bloques) de una BD
 * origen (producción) a una BD destino (demo), de forma idempotente.
 *
 * Solo LEE de la BD origen. En la destino, si ya existe una plantilla con el
 * mismo nombre, la omite (no la sobreescribe).
 *
 * Uso:
 *   SOURCE_DATABASE_URL="mysql://user:pass@host:3306/prod" \
 *   DEST_DATABASE_URL="mysql://user:pass@host:3306/demo" \
 *   node scripts/copy-templates.js
 *
 * Flags opcionales:
 *   REPLACE=1  -> reemplaza plantillas existentes (borra y recrea)
 */
const { PrismaClient } = require("@prisma/client");

const SOURCE = process.env.SOURCE_DATABASE_URL;
const DEST = process.env.DEST_DATABASE_URL;
const REPLACE = process.env.REPLACE === "1";

if (!SOURCE || !DEST) {
  console.error("ERROR: define SOURCE_DATABASE_URL y DEST_DATABASE_URL");
  process.exit(1);
}

const src = new PrismaClient({ datasources: { db: { url: SOURCE } } });
const dst = new PrismaClient({ datasources: { db: { url: DEST } } });

async function main() {
  const templates = await src.template.findMany({
    include: {
      category: { select: { id: true, name: true, slug: true, description: true, sortOrder: true } },
      pages: {
        include: { blocks: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Plantillas encontradas en origen: ${templates.length}`);

  let copied = 0;
  let skipped = 0;

  for (const t of templates) {
    try {
      const existing = await dst.template.findFirst({ where: { name: t.name } });
      if (existing) {
        if (!REPLACE) {
          console.log(`· Omitida (ya existe): ${t.name}`);
          skipped++;
          continue;
        }
        await dst.template.delete({ where: { id: existing.id } });
        console.log(`· Reemplazando: ${t.name}`);
      }

      let categoryId = null;
      if (t.category) {
        const c = await dst.templateCategory.upsert({
          where: { slug: t.category.slug },
          update: {},
          create: {
            name: t.category.name,
            slug: t.category.slug,
            description: t.category.description,
            sortOrder: t.category.sortOrder,
          },
        });
        categoryId = c.id;
      }

      const created = await dst.template.create({
        data: {
          id: t.id,
          name: t.name,
          description: t.description,
          thumbnail: t.thumbnail,
          categoryId,
          tags: t.tags ?? undefined,
          isActive: t.isActive,
          isPremium: t.isPremium,
          globalStyles: t.globalStyles ?? undefined,
        },
      });

      for (const p of t.pages) {
        const page = await dst.templatePage.create({
          data: {
            id: p.id,
            templateId: created.id,
            name: p.name,
            slug: p.slug,
            path: p.path,
            isDefault: p.isDefault,
            seoTitle: p.seoTitle,
            seoDesc: p.seoDesc,
            sortOrder: p.sortOrder,
          },
        });
        if (p.blocks.length > 0) {
          await dst.templateBlock.createMany({
            data: p.blocks.map((b) => ({
              id: b.id,
              templatePageId: page.id,
              type: b.type,
              content: b.content,
              styles: b.styles ?? undefined,
              sortOrder: b.sortOrder,
            })),
          });
        }
      }

      console.log(`✓ Copiada: ${t.name} (páginas=${t.pages.length})`);
      copied++;
    } catch (e) {
      console.error(`✗ Error copiando "${t.name}": ${e.message}`);
    }
  }

  console.log(`\nResumen: copiadas=${copied}, omitidas=${skipped}, total=${templates.length}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await src.$disconnect(); await dst.$disconnect(); });
