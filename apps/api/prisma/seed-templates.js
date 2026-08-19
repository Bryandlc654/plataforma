const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const templates = [
  {
    name: "Restaurante",
    description: "Plantilla para restaurantes, cafeterías y bares con menú, galería y reservas",
    category: "Restaurantes",
    tags: ["restaurantes", "reservas"],
    pages: [
      {
        name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0,
        blocks: [
          { type: "hero", content: { title: "Sabores que enamoran", subtitle: "Cocina artesanal con ingredientes frescos de la región", buttonText: "Ver menú", buttonUrl: "#menu" }, sortOrder: 0 },
          { type: "services", content: { title: "Nuestros Servicios", subtitle: "Todo lo que ofrecemos", items: [{ title: "Comedor", desc: "Ambiente acogedor para disfrutar" }, { title: "Delivery", desc: "A domicilio en 30 minutos" }, { title: "Eventos", desc: "Celebraciones y reuniones especiales" }] }, sortOrder: 1 },
          { type: "gallery", content: { title: "Nuestra Galería", images: [{ url: "https://placehold.co/600x400/DC2626/white?text=Platillo+1", alt: "Platillo especial" }, { url: "https://placehold.co/600x400/EA580C/white?text=Platillo+2", alt: "Platillo premium" }, { url: "https://placehold.co/600x400/CA8A04/white?text=Ambiente", alt: "Ambiente del restaurante" }] }, sortOrder: 2 },
          { type: "testimonials", content: { title: "Clientes satisfechos", items: [{ name: "María García", role: "Cliente frecuente", quote: "La mejor experiencia gastronómica de la ciudad. El servicio es impecable." }, { name: "Carlos Ruiz", role: "Foodie", quote: "Cada plato es una obra de arte. Recomiendo el menú de degustación." }] }, sortOrder: 3 },
          { type: "cta", content: { title: "¿Listo para una experiencia única?", subtitle: "Reserva tu mesa hoy y descubre nuestros sabores", buttonText: "Reservar ahora", buttonUrl: "#reservar" }, sortOrder: 4 },
        ]
      },
      { name: "Menú", slug: "menu", path: "/menu", sortOrder: 1, blocks: [] },
      { name: "Contacto", slug: "contacto", path: "/contacto", sortOrder: 2, blocks: [] },
    ]
  },
  {
    name: "Barbería Pro",
    description: "Plantilla moderna para barberías y salones de belleza con booking integrado",
    category: "Salud y Belleza",
    tags: ["salud-y-belleza", "reservas"],
    pages: [
      {
        name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0,
        blocks: [
          { type: "hero", content: { title: "Tu estilo, nuestra pasión", subtitle: "Cortes clásicos y modernos por barberos profesionales con más de 10 años de experiencia", buttonText: "Agendar cita", buttonUrl: "#cita" }, sortOrder: 0 },
          { type: "services", content: { title: "Servicios", items: [{ title: "Corte Clásico", desc: "Tijera y máquina, lavado incluido" }, { title: "Fade Premium", desc: "Degradado personalizado con detailing" }, { title: "Barba & Afeitado", desc: "Perfilado, toalla caliente y productos premium" }, { title: "Color & Mechas", desc: "Tintes profesionales sin amoníaco" }] }, sortOrder: 1 },
          { type: "gallery", content: { title: "Nuestro trabajo", images: [{ url: "https://placehold.co/600x400/1E293B/white?text=Corte+1", alt: "Corte fade" }, { url: "https://placehold.co/600x400/334155/white?text=Barba+1", alt: "Perfilado de barba" }, { url: "https://placehold.co/600x400/475569/white?text=Ambiente", alt: "Ambiente barbería" }] }, sortOrder: 2 },
          { type: "testimonials", content: { title: "Lo que dicen nuestros clientes", items: [{ name: "Diego López", role: "Cliente VIP", quote: "Desde que vengo aquí, no confío en nadie más para mi corte. Atención de otro nivel." }, { name: "Andrés Mora", role: "Cliente", quote: "El mejor fade de la ciudad. Puntuales y profesionales." }] }, sortOrder: 3 },
        ]
      },
    ]
  },
  {
    name: "Clínica Médica",
    description: "Plantilla profesional para clínicas, consultorios y centros de salud",
    category: "Salud y Belleza",
    tags: ["salud-y-belleza", "reservas"],
    pages: [
      {
        name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0,
        blocks: [
          { type: "hero", content: { title: "Tu salud en buenas manos", subtitle: "Atención médica integral con los mejores especialistas. Consultas, laboratorio y urgencias 24/7.", buttonText: "Agendar cita", buttonUrl: "#cita" }, sortOrder: 0 },
          { type: "services", content: { title: "Especialidades", items: [{ title: "Medicina General", desc: "Consultas, chequeos preventivos y seguimiento" }, { title: "Pediatría", desc: "Cuidado infantil, vacunación y control de crecimiento" }, { title: "Cardiología", desc: "Evaluación cardiovascular, electrocardiogramas y ecocardiogramas" }, { title: "Laboratorio Clínico", desc: "Análisis de sangre, orina y pruebas especializadas" }] }, sortOrder: 1 },
          { type: "faq", content: { title: "Preguntas Frecuentes", items: [{ question: "¿Aceptan seguros médicos?", answer: "Sí, trabajamos con las principales aseguradoras del país. Consulte la lista completa en recepción." }, { question: "¿Cuáles son los horarios de atención?", answer: "Lunes a Viernes: 8am - 8pm. Sábados: 9am - 2pm. Urgencias: 24 horas." }, { question: "¿Necesito cita previa?", answer: "Para consultas programadas sí. Para urgencias atendemos por orden de llegada." }] }, sortOrder: 2 },
        ]
      },
    ]
  },
  {
    name: "Consultora Business",
    description: "Plantilla corporativa para consultoras, firmas de abogados y servicios B2B",
    category: "Negocios",
    pages: [
      {
        name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0,
        blocks: [
          { type: "hero", content: { title: "Transformamos tu negocio", subtitle: "Estrategia, innovación y resultados medibles. Más de 15 años impulsando empresas.", buttonText: "Consultoría gratuita", buttonUrl: "#contacto" }, sortOrder: 0 },
          { type: "services", content: { title: "Áreas de expertise", items: [{ title: "Estrategia", desc: "Planes de crecimiento y posicionamiento de mercado" }, { title: "Transformación Digital", desc: "Automatización, cloud y modernización tecnológica" }, { title: "Finanzas", desc: "Optimización financiera, proyecciones y M&A" }, { title: "RRHH", desc: "Gestión del talento, cultura organizacional y compliance" }] }, sortOrder: 1 },
          { type: "testimonials", content: { title: "Casos de éxito", items: [{ name: "Empresa XYZ", role: "CEO", quote: "Duplicamos nuestras ventas en 12 meses gracias a su asesoría estratégica." }, { name: "Startup ABC", role: "Founder", quote: "Su guía fue fundamental para nuestra ronda de inversión Serie A." }] }, sortOrder: 2 },
          { type: "cta", content: { title: "Lleva tu empresa al siguiente nivel", subtitle: "Agenda una consultoría gratuita de 30 minutos con nuestros expertos", buttonText: "Empezar ahora", buttonUrl: "#contacto" }, sortOrder: 3 },
        ]
      },
    ]
  },
  {
    name: "Agencia Digital",
    description: "Plantilla para agencias de marketing, diseño web y estudios creativos",
    category: "Negocios",
    pages: [
      {
        name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0,
        blocks: [
          { type: "hero", content: { title: "Hacemos crecer tu marca", subtitle: "Marketing digital, diseño web y estrategia de contenido que genera resultados reales", buttonText: "Cotizar proyecto", buttonUrl: "#cotizar" }, sortOrder: 0 },
          { type: "services", content: { title: "Servicios", items: [{ title: "Desarrollo Web", desc: "Sitios responsive, e-commerce y aplicaciones web" }, { title: "SEO & SEM", desc: "Posicionamiento orgánico y campañas de Google Ads" }, { title: "Redes Sociales", desc: "Community management y pauta digital" }, { title: "Branding", desc: "Identidad visual, naming y estrategia de marca" }] }, sortOrder: 1 },
          { type: "testimonials", content: { title: "Clientes felices", items: [{ name: "Marca Líder", role: "CMO", quote: "Nuestra presencia digital se transformó completamente. ROI increíble." }, { name: "Tienda Online", role: "Dueño", quote: "Aumentamos tráfico web un 300% en 6 meses. Profesionales excelentes." }] }, sortOrder: 2 },
          { type: "cta", content: { title: "¿Creamos algo increíble juntos?", subtitle: "Cuéntanos tu proyecto y te enviaremos una propuesta personalizada", buttonText: "Contáctanos", buttonUrl: "#contacto" }, sortOrder: 3 },
        ]
      },
    ]
  },
  {
    name: "Tienda Online",
    description: "Plantilla básica para tiendas online y catálogos de productos",
    category: "Negocios",
    tags: ["negocios", "ecommerce"],
    pages: [
      {
        name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0,
        blocks: [
          { type: "hero", content: { title: "Descubre productos únicos", subtitle: "Calidad premium a precios increíbles. Envío gratis en compras mayores a $50.", buttonText: "Ver productos", buttonUrl: "#productos" }, sortOrder: 0 },
          { type: "services", content: { title: "¿Por qué elegirnos?", items: [{ title: "Envío Rápido", desc: "Entrega en 24-48 horas a todo el país" }, { title: "Garantía", desc: "30 días de devolución sin preguntas" }, { title: "Atención 24/7", desc: "Soporte por WhatsApp y chat en vivo" }] }, sortOrder: 1 },
          { type: "cta", content: { title: "Ofertas especiales cada semana", subtitle: "Suscríbete y recibe 10% de descuento en tu primera compra", buttonText: "Suscribirme", buttonUrl: "#" }, sortOrder: 2 },
        ]
      },
    ]
  },
  {
    name: "Landing Page",
    description: "Plantilla minimalista de una sola página para productos, apps y startups",
    category: "Landing Pages",
    pages: [
      {
        name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0,
        blocks: [
          { type: "hero", content: { title: "Lanza tu producto al mundo", subtitle: "La plataforma todo en uno que necesitas para escalar tu negocio digital. Sin código, sin estrés.", buttonText: "Comenzar gratis", buttonUrl: "#" }, sortOrder: 0 },
          { type: "services", content: { title: "Todo lo que necesitas", items: [{ title: "Fácil", desc: "Arrastra y suelta, sin código" }, { title: "Rápido", desc: "Publica en minutos, no en días" }, { title: "Seguro", desc: "SSL, backups y CDN incluidos" }] }, sortOrder: 1 },
          { type: "testimonials", content: { title: "Usado por miles", items: [{ name: "Usuario feliz", role: "Emprendedor", quote: "Nunca fue tan fácil crear mi presencia online." }] }, sortOrder: 2 },
          { type: "cta", content: { title: "Empieza hoy, es gratis", subtitle: "Sin tarjeta de crédito. Cancela cuando quieras.", buttonText: "Crear cuenta gratis", buttonUrl: "/register" }, sortOrder: 3 },
        ]
      },
    ]
  },
  {
    name: "Portafolio Creativo",
    description: "Plantilla para portfolios de diseñadores, fotógrafos y artistas visuales",
    category: "Landing Pages",
    pages: [
      {
        name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0,
        blocks: [
          { type: "hero", content: { title: "Diseño que inspira", subtitle: "Portfolio de diseño gráfico, fotografía y dirección de arte con 8 años de experiencia", buttonText: "Ver trabajos", buttonUrl: "#trabajos" }, sortOrder: 0 },
          { type: "gallery", content: { title: "Proyectos recientes", images: [{ url: "https://placehold.co/600x400/8B5CF6/white?text=Proyecto+1", alt: "Diseño editorial" }, { url: "https://placehold.co/600x400/6366F1/white?text=Proyecto+2", alt: "Branding" }, { url: "https://placehold.co/600x400/4F46E5/white?text=Proyecto+3", alt: "Web design" }, { url: "https://placehold.co/600x400/4338CA/white?text=Proyecto+4", alt: "Fotografía" }] }, sortOrder: 1 },
          { type: "testimonials", content: { title: "Colaboraciones", items: [{ name: "Estudio X", role: "Director Creativo", quote: "Un ojo excepcional para el detalle y la composición." }] }, sortOrder: 2 },
          { type: "cta", content: { title: "¿Tienes un proyecto en mente?", subtitle: "Hablemos y hagamos realidad tu visión creativa", buttonText: "Contactar", buttonUrl: "#contacto" }, sortOrder: 3 },
        ]
      },
    ]
  },
];

async function main() {
  console.log("Iniciando seed de plantillas...");

  const count = await p.template.count();
  if (count > 0) {
    console.log(`${count} plantillas ya existen. Saltando.`);
    await p.$disconnect();
    return;
  }

  for (const tpl of templates) {
    // Find or create category
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

    // Create template
    const template = await p.template.create({
      data: {
        name: tpl.name,
        description: tpl.description,
        categoryId: cat.id,
        isActive: true,
        tags: JSON.stringify(tpl.tags || [tpl.category.toLowerCase()]),
      },
    });

    // Create pages and blocks
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

    console.log(`✓ ${tpl.name} (${tpl.pages.length} páginas)`);
  }

  console.log(`\n${templates.length} plantillas creadas.`);
  await p.$disconnect();
}

main().catch(console.error).finally(() => p.$disconnect());
