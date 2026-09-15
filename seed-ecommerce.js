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
            variant: "urban-noir",
            logoText: "URBAN NOIR",
            links: [
              { label: "Inicio", url: "/" },
              { label: "Catálogo", url: "#catalogo" },
              { label: "Promos", url: "#promociones" },
              { label: "Nosotros", url: "#beneficios" },
            ],
          },
          styles: { sticky: true },
        },
        {
          type: "hero",
          sortOrder: 1,
          content: {
            variant: "urban-noir",
            anchor: "inicio",
            kicker: "Colección Fall/Winter",
            title: "REDEFINE YOUR STREETS",
            subtitle:
              "Estilo urbano, minimalista y sin compromisos. Descubre prendas diseñadas para la ciudad moderna.",
            buttonText: "Explorar Colección",
            buttonUrl: "#catalogo",
            backgroundImage:
              "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2048&auto=format&fit=crop",
          },
        },
        {
          type: "features",
          sortOrder: 2,
          content: {
            variant: "urban-noir",
            anchor: "catalogo",
            title: "Catálogo",
            linkText: "Ver todas las categorías",
            linkUrl: "#",
            items: [
              { image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop", title: "Hombres", link: "#" },
              { image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop", title: "Mujeres", link: "#" },
              { image: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=800&auto=format&fit=crop", title: "Accesorios", link: "#" },
              { image: "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=800&auto=format&fit=crop", title: "Streetwear", link: "#" },
            ],
          },
        },
        {
          type: "cta",
          sortOrder: 3,
          content: {
            variant: "urban-noir",
            anchor: "promociones",
            newsletter: false,
            kicker: "Oferta Especial",
            title: "HASTA 50%\nDE DESCUENTO",
            subtitle:
              "Actualiza tu armario con nuestras piezas de temporada a mitad de precio. Solo por tiempo limitado.",
            buttonText: "Comprar Ahora",
            buttonUrl: "#",
            watermark: "SALE SALE SALE",
            backgroundImage:
              "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop",
          },
        },
        {
          type: "portfolio",
          sortOrder: 4,
          content: {
            variant: "urban-noir",
            anchor: "productos",
            title: "MÁS BUSCADOS",
            subtitle: "Las piezas clave de esta temporada que no pueden faltar en tu rotación.",
            buttonText: "Ver Todo el Catálogo",
            buttonUrl: "#",
            items: [
              { image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop", title: "Camiseta Oversize", desc: "Algodón Heavyweight", price: "45.00" },
              { image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop", tag: "Nuevo", title: "Hoodie Esencial", desc: "Negro Intenso", price: "89.00" },
              { image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop", title: "Chaqueta Utility", desc: "Resistente al agua", price: "120.00" },
              { image: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=600&auto=format&fit=crop", tag: "-20%", title: "Pantalón Cargo", desc: "Ajuste relajado", price: "75.00", compareAt: "95.00" },
            ],
          },
        },
        {
          type: "benefits",
          sortOrder: 5,
          content: {
            variant: "urban-noir",
            anchor: "beneficios",
            items: [
              { icon: "🚚", title: "Envío Gratis", desc: "En todas las órdenes superiores a $100. Entregas express disponibles globalmente." },
              { icon: "🛡️", title: "Calidad Premium", desc: "Materiales seleccionados meticulosamente para garantizar durabilidad y confort." },
              { icon: "💳", title: "Pagos Seguros", desc: "Procesamiento cifrado y múltiples opciones de pago internacional para tu tranquilidad." },
            ],
          },
        },
        {
          type: "cta",
          sortOrder: 6,
          content: {
            variant: "urban-noir",
            newsletter: true,
            title: "ÚNETE AL CLUB",
            subtitle:
              "Suscríbete a nuestra newsletter y obtén un 15% de descuento en tu primera compra. Acceso anticipado a colecciones y eventos exclusivos.",
            buttonText: "Suscribirse",
          },
        },
        {
          type: "footer",
          sortOrder: 7,
          content: {
            variant: "urban-noir",
            companyName: "URBAN NOIR",
            description:
              "Definiendo la estética de la calle contemporánea. Menos ruido, más actitud. Diseñado para el individuo moderno.",
            columns: [
              { title: "Tienda", links: [{ label: "Hombres", url: "#" }, { label: "Mujeres", url: "#" }, { label: "Accesorios", url: "#" }, { label: "Novedades", url: "#" }, { label: "Ofertas", url: "#" }] },
              { title: "Ayuda", links: [{ label: "FAQ", url: "#" }, { label: "Envíos y Devoluciones", url: "#" }, { label: "Rastreo de Pedido", url: "#" }, { label: "Guía de Tallas", url: "#" }, { label: "Contacto", url: "#" }] },
            ],
            social: [
              { label: "Instagram", url: "#" },
              { label: "Twitter", url: "#" },
            ],
            copyright: "© 2026 URBAN NOIR. Todos los derechos reservados.",
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