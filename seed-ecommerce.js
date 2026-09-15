require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const tpl = {
  name: "URBAN NOIR",
  description:
    "Tienda streetwear en escala de grises. Catalogo por categorias, promociones, beneficios y newsletter para conversion.",
  thumbnail: "https://placehold.co/1200x800/111827/FFFFFF?text=URBAN+NOIR",
  category: "ecommerce",
  globalStyles: {
    backgroundColor: "#0A0A0B",
    color: "#F1F1F1",
    fontFamily: "system-ui, sans-serif",
  },
  pages: [
    {
      name: "Inicio",
      slug: "home",
      path: "/",
      isDefault: true,
      sortOrder: 0,
      seoTitle: "URBAN NOIR — Ropa urbana",
      seoDesc: "Tienda streetwear con catalogo, promociones y envio rapido",
      blocks: [
        {
          type: "header",
          sortOrder: 0,
          content: {
            logoText: "URBAN NOIR",
            links: [
              { label: "Inicio", url: "/" },
              { label: "Hombres", url: "#hombres" },
              { label: "Mujeres", url: "#mujeres" },
              { label: "Ofertas", url: "#ofertas" },
            ],
            ctaText: "Suscribirse",
            ctaUrl: "#newsletter",
          },
          styles: { sticky: true },
        },
        {
          type: "hero",
          sortOrder: 1,
          content: {
            kicker: "STREETWEAR · ECOMMERCE",
            title: "Redefine tu calle",
            subtitle:
              "Una coleccion con una sola regla: estetica por encima del ruido. Bordado, corte y tela que hablan por si solos.",
            buttonText: "Comprar Ahora",
            buttonUrl: "#productos",
            secondaryButtonText: "Ver el catalogo",
            secondaryButtonUrl: "#categorias",
            primaryColor: "#0A0A0B",
            secondaryColor: "#111827",
            backgroundImage:
              "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1600&q=80",
          },
        },
        {
          type: "hero",
          sortOrder: 2,
          content: {
            kicker: "CATEGORIA · HOMBRES",
            title: "Hombres",
            subtitle: "Corte recto, telas pesadas y detalles de taller",
            buttonText: "Ver productos",
            buttonUrl: "#hombres",
            primaryColor: "#0A0A0B",
            secondaryColor: "#1F2937",
            backgroundImage:
              "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1600&q=80",
          },
        },
        {
          type: "hero",
          sortOrder: 3,
          content: {
            kicker: "CATEGORIA · MUJERES",
            title: "Mujeres",
            subtitle: "Siluetas limpias con actitud de calle",
            buttonText: "Ver productos",
            buttonUrl: "#mujeres",
            primaryColor: "#0A0A0B",
            secondaryColor: "#1F2937",
            backgroundImage:
              "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1600&q=80",
          },
        },
        {
          type: "features",
          sortOrder: 4,
          content: {
            title: "El drop de la temporada",
            subtitle: "Piezas en edicion limitada. Cuando se acaban, se acaban.",
            items: [
              { icon: "🚚", title: "Envio en 24h", desc: "Gratis en pedidos superiores a $50" },
              { icon: "🛡️", title: "Pago seguro", desc: "Checkout cifrado y multiples medios" },
              { icon: "🔄", title: "Devolucion facil", desc: "30 dias sin preguntas" },
            ],
          },
        },
        {
          type: "cta",
          sortOrder: 5,
          content: {
            kicker: "FLASH SALE",
            title: "50% de descuento en tu primera compra",
            subtitle: "Usa el codigo NOIR24 antes de que termine el dia.",
            buttonText: "Suscribirme y comprar",
            buttonUrl: "#oferta",
            primaryColor: "#0A0A0B",
            secondaryColor: "#1F2937",
          },
        },
        {
          type: "footer",
          sortOrder: 6,
          content: {
            companyName: "URBAN NOIR",
            description: "Ropa urbana hecha para durar. Disenada en la ciudad, bordada a mano.",
            columns: [
              { title: "Tienda", links: [{ label: "Hombres", url: "#" }, { label: "Mujeres", url: "#" }, { label: "Ofertas", url: "#" }] },
              { title: "Ayuda", links: [{ label: "Envios", url: "#" }, { label: "Devoluciones", url: "#" }, { label: "Tallas", url: "#" }] },
              { title: "Legal", links: [{ label: "Privacidad", url: "#" }, { label: "Terminos", url: "#" }] },
            ],
            social: [
              { label: "Instagram", url: "#" },
              { label: "Twitter", url: "#" },
              { label: "WhatsApp", url: "#" },
            ],
          },
        },
      ],
    },
  ],
};

async function main() {
  console.log("Inyectando plantilla URBAN NOIR (ecommerce)...");

  const existing = await p.template.findFirst({ where: { name: tpl.name } });
  if (existing) {
    console.log("Eliminando plantilla existente para regenerarla...");
    await p.template.delete({ where: { id: existing.id } });
  }

  let cat = await p.templateCategory.findUnique({ where: { slug: tpl.category } });
  if (!cat) {
    cat = await p.templateCategory.create({
      data: {
        name: "E-commerce",
        slug: tpl.category,
        description: "Plantillas para tiendas online con catalogo de productos",
        sortOrder: 10,
      },
    });
  }

  const template = await p.template.create({
    data: {
      name: tpl.name,
      description: tpl.description,
      thumbnail: tpl.thumbnail,
      categoryId: cat.id,
      tags: ["ecommerce", "e-commerce", "tienda", "shop", "streetwear", "urbano", "calle"],
      isPremium: false,
      isActive: true,
      globalStyles: tpl.globalStyles,
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
        seoTitle: page.seoTitle,
        seoDesc: page.seoDesc,
      },
    });

    if (page.blocks.length > 0) {
      await p.templateBlock.createMany({
        data: page.blocks.map((b) => ({
          templatePageId: tp.id,
          type: b.type,
          content: b.content,
          styles: b.styles,
          sortOrder: b.sortOrder,
        })),
      });
    }
  }

  console.log("Plantilla URBAN NOIR (ecommerce) anadida exitosamente!");
}

main().catch(console.error).finally(() => p.$disconnect());