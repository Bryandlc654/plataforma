require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const tpl = {
  name: "Prestige Corp",
  description: "Plantilla premium para firmas de consultoría, corporaciones y servicios B2B",
  category: "Negocios",
  pages: [
    {
      name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0,
      blocks: [
        { type: "header", content: { variant: "prestige", logoText: "PRESTIGE CORP", links: [{ label: "Servicios", url: "#servicios" }, { label: "Nosotros", url: "#nosotros" }, { label: "Clientes", url: "#clientes" }, { label: "Contacto", url: "#contacto" }] }, sortOrder: 0 },
        { type: "hero", content: { variant: "prestige", title: "Elevamos tu Visión Empresarial", subtitle: "Transformamos desafíos complejos en ventajas competitivas. Nuestro equipo de expertos ofrece consultoría estratégica de alto nivel para corporaciones que buscan liderazgo y crecimiento sostenible.", buttonText: "Agenda una Sesión", buttonUrl: "#contacto", backgroundImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCU29CaMpcauBw66zIT8_U_NX3lcijaYGO0uHF4Y7L1bxjR3bB0dOuZ_dE3_tvNHxso_x3FNNGGl9s7-XXyaW7r25GO72k5lX0P4QNjfL6zz1FYJolmuh0_6jPhH8LHNtOmvOIY8-rtTtZaWJFI8CA5wqZ6EQyd1jjp2toWimTmroPGQLj5veYNPVzYn-ZAyaHlc8jKlY5w-HdWXg11E0QKAUlbwOBKTv83HwdPv3yphWI3uKLLrTXKhA" }, sortOrder: 1 },
        { type: "services", content: { variant: "prestige", title: "Áreas de Especialización", subtitle: "Soluciones integrales diseñadas para optimizar el rendimiento y acelerar la innovación corporativa.", items: [{ title: "Estrategia Corporativa", desc: "Desarrollamos hojas de ruta claras y accionables para alinear sus operaciones con objetivos de crecimiento a largo plazo.", icon: "insights" }, { title: "Desarrollo Organizacional", desc: "Reestructuramos equipos y procesos para maximizar la eficiencia operativa y fomentar una cultura de excelencia.", icon: "architecture" }, { title: "Innovación Digital", desc: "Implementamos tecnologías emergentes y metodologías ágiles para mantener a su empresa a la vanguardia de la industria.", icon: "lightbulb" }] }, sortOrder: 2 },
        { type: "about", content: { variant: "prestige", title: "Excelencia en cada Estrategia", description: "En Prestige Corp, nos dedicamos a redefinir el éxito corporativo a través de la integridad, la innovación y un compromiso inquebrantable con la excelencia. Creemos que cada desafío es una oportunidad para fortalecer la visión de nuestros clientes.", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAyedKhWrkp0Oxc8c68XIYo_IrMNgIHYhjVNQC19IovzvXE7bWoM5Un6uy_87hLnZxdHdIHFok2ggPOVp-cI6fHOLrHJiYc9cd9G6FsdgTlxcCurfBq--dWTYpTGlfEAbaBG0O4EkXbea0CSgan8gBCPHW91YoCKcB56RRNMuQ2pZRQDtfcBjDAo8J6e4CHDV9HqBsM_8OcXPlBffGsiW3u69MBnvS7ZDy9Im7v1EwMtdgq4EmcqRx92w", buttonText: "Conócenos", buttonUrl: "#" }, sortOrder: 3 },
        { type: "contact", content: { variant: "prestige", title: "Contáctenos", subtitle: "Estamos listos para llevar su empresa al siguiente nivel. Envíenos un mensaje y nos pondremos en contacto a la brevedad.", buttonText: "Enviar Mensaje", fields: [{ label: "Nombre", type: "text", name: "name", required: true }, { label: "Email", type: "email", name: "email", required: true }, { label: "Mensaje", type: "textarea", name: "message", required: true }] }, sortOrder: 4 },
        { type: "footer", content: { variant: "prestige", companyName: "PRESTIGE CORP", copyright: "© 2024 Prestige Corp. Todos los derechos reservados.", columns: [{ title: "Enlaces", links: [{ label: "Privacidad", url: "#" }, { label: "Términos", url: "#" }, { label: "Soporte", url: "#" }, { label: "Carreras", url: "#" }] }] }, sortOrder: 5 }
      ]
    }
  ]
};

async function main() {
  console.log("Inyectando plantilla Prestige Corp con variante...");
  
  const existing = await p.template.findFirst({ where: { name: tpl.name } });
  if (existing) {
    console.log("Eliminando plantilla existente para regenerarla...");
    await p.template.delete({ where: { id: existing.id } });
  }

  let cat = await p.templateCategory.findUnique({ where: { slug: tpl.category.toLowerCase().replace(/\s+/g, "-") } });
  if (!cat) {
    cat = await p.templateCategory.create({
      data: {
        name: tpl.category,
        slug: tpl.category.toLowerCase().replace(/\s+/g, "-"),
        sortOrder: 0,
      },
    });
  }

  const template = await p.template.create({
    data: {
      name: tpl.name,
      description: tpl.description,
      categoryId: cat.id,
      isActive: true,
      tags: JSON.stringify([tpl.category.toLowerCase()]),
    },
  });

  for (const page of tpl.pages) {
    const tp = await p.templatePage.create({
      data: {
        templateId: template.id,
        name: page.name,
        slug: page.slug,
        path: page.path,
        isDefault: page.isDefault,
        sortOrder: page.sortOrder,
      },
    });

    if (page.blocks.length > 0) {
      await p.templateBlock.createMany({
        data: page.blocks.map((b) => ({
          templatePageId: tp.id,
          type: b.type,
          content: b.content,
          sortOrder: b.sortOrder,
        })),
      });
    }
  }

  console.log("Plantilla Prestige Corp variante añadida exitosamente!");
}

main().catch(console.error).finally(() => p.$disconnect());
