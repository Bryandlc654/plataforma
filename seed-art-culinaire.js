require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const tpl = {
  name: "L'Art Culinaire",
  description: "Plantilla premium de alta cocina (Fine Dining) con colores oscuros y tipografía serif clásica.",
  category: "Restaurantes",
  pages: [
    {
      name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0,
      blocks: [
        { type: "header", content: { variant: "art-culinaire", logoText: "L'ART CULINAIRE", buttonText: "Reservations", links: [{ label: "Menu", url: "#menu" }, { label: "Experience", url: "#experience" }, { label: "Location", url: "#location" }, { label: "Contact", url: "#contact" }] }, sortOrder: 0 },
        { type: "hero", content: { variant: "art-culinaire", title: "L'Art de Vivre", subtitle: "A symphony of flavor, curated with precision and served with uncompromising elegance in the heart of the city.", buttonText: "Book a Table", backgroundImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKkbNAS1pmw-xX2Yc1tR1b4GxAm6GZEw-D9FN5eJJm_OXRWaNNOmPe_9tdV8rWXyP9eqLsba21xYMSkWVzICYNUkwoSfyPOxQCgZq0mgfnTcFZ0km3_U_KxaTaiysb-2JlCAONFc9m-O4UoooR5gXLD-0N5okvuCQOq62MwO2lLR7EhilhaDcPnpg2fMKaZV25P2OUv1MyvbvUf6MjsUtRpXWBMqr3wiCuKHFFngv0fYZ9030stExg" }, sortOrder: 1 },
        { type: "about", content: { variant: "art-culinaire", title: "Craftsmanship & Terroir", description1: "Our philosophy is deeply rooted in the respect for the ingredient. We collaborate with local artisans and foragers to bring the most vibrant, seasonal produce to your plate.", description2: "Every dish is a dialogue between traditional techniques and modern innovation, designed to evoke memory and create new sensory experiences within a minimalist, serene environment.", linkText: "Discover our story", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuByUTh7x4x4rJv9f7n6ZuhnE6yxxrKhMww3SWus2VtdUz-5Eu8GrsXSAyHMFpExO2jCy1dnP_DS73n7di35-9L2s1wjikKwGdxIfIsTg-VNgkqgOgLzCvmn1q_AoimBbVC2prnoU_xqfThYWo6IO-BrCEbumUAi7J4g7XtgnuPD2vPDpwU0J792YnJ5AAvnYamx90VSqMu0zrxelOoUmGGoEWvb586DflXwmx7qVSN-VD2UW4gECP9m" }, sortOrder: 2 },
        { type: "services", content: { variant: "art-culinaire", title: "La Carte", categories: [
          { title: "Entrées", items: [
            { title: "Amuse-Bouche de Saison", description: "Chef's daily selection of miniature delights", price: "$24" },
            { title: "Saint-Jacques Grillées", description: "Seared scallops, cauliflower purée, truffle vinaigrette", price: "$32" }
          ]},
          { title: "Plats Principaux", items: [
            { title: "Pigeonneau Rôti", description: "Roasted squab, wild mushrooms, blackberry jus", price: "$58" },
            { title: "Bar de Ligne", description: "Line-caught sea bass, artichoke barigoule, saffron", price: "$54" }
          ]}
        ] }, sortOrder: 3 },
        { type: "location", content: { variant: "art-culinaire", title: "Ubicación", name: "L'Art Culinaire", address: "123 Avenue Montaigne\\n75008 Paris, France", hours: "Dinner: Tuesday - Saturday, 18:30 - 22:30\\nLunch: Friday & Saturday, 12:00 - 14:00\\nClosed Sunday & Monday" }, sortOrder: 4 },
        { type: "form", content: { variant: "art-culinaire", title: "Formulario de Contacto", subtitle: "For private events, press inquiries, or special requests, please use the form below.", buttonText: "Send Inquiry", fields: [
          { label: "Name", type: "text", name: "name" },
          { label: "Email", type: "email", name: "email" },
          { label: "Subject", type: "text", name: "subject" },
          { label: "Message", type: "textarea", name: "message" }
        ] }, sortOrder: 5 },
        { type: "footer", content: { variant: "art-culinaire", companyName: "L'ART CULINAIRE", copyright: "© 2024 L'ART CULINAIRE. ALL RIGHTS RESERVED.", columns: [{ links: [{ label: "Privacy Policy", url: "#" }, { label: "Terms of Service", url: "#" }, { label: "Careers", url: "#" }, { label: "Press Kit", url: "#" }] }] }, sortOrder: 6 }
      ]
    }
  ]
};

async function main() {
  console.log("Inyectando plantilla L'Art Culinaire con variante...");
  
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
        sortOrder: 1,
      },
    });
  }

  const template = await p.template.create({
    data: {
      name: tpl.name,
      description: tpl.description,
      categoryId: cat.id,
      isActive: true,
      tags: JSON.stringify(["fine dining", "restaurante", "gourmet"]),
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

  console.log("Plantilla L'Art Culinaire añadida exitosamente!");
}

main().catch(console.error).finally(() => p.$disconnect());
