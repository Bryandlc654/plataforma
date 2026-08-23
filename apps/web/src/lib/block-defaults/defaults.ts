export type BlockType = "hero" | "services" | "faq" | "cta" | "testimonials" | "gallery" | "header" | "footer" | "form" | "about" | "contact" | "whatsapp" | "pricing" | "team" | "features" | "stats" | "portfolio" | "benefits" | "process" | "image" | "video" | "review-form";

export interface BlockData {
  type: string;
  content: any;
  styles?: any;
}

export const BLOCK_TYPES: BlockType[] = [
  "hero", "services", "faq", "cta", "testimonials", "gallery", "header", "footer",
  "form", "about", "contact", "whatsapp", "pricing", "team", "features", "stats", "portfolio", "benefits", "process", "image", "video", "review-form",
];

export function getBlockDefaultContent(type: BlockType): any {
  const defaults: Record<BlockType, any> = {
    hero: {
      title: "Título principal",
      subtitle: "Subtítulo descriptivo de tu negocio",
      buttonText: "Contáctanos",
      buttonUrl: "#contact",
      backgroundImage: "",
    },
    services: {
      title: "Nuestros Servicios",
      subtitle: "Lo que ofrecemos",
      items: [
        { title: "Servicio 1", desc: "Descripción breve del servicio", icon: "" },
        { title: "Servicio 2", desc: "Descripción breve del servicio", icon: "" },
        { title: "Servicio 3", desc: "Descripción breve del servicio", icon: "" },
      ],
    },
    faq: {
      title: "Preguntas Frecuentes",
      items: [
        { question: "¿Pregunta frecuente?", answer: "Respuesta a la pregunta frecuente." },
        { question: "¿Otra pregunta?", answer: "Otra respuesta detallada." },
      ],
    },
    cta: {
      title: "¿Listo para empezar?",
      subtitle: "Contáctanos hoy y transforma tu presencia digital",
      buttonText: "Empezar ahora",
      buttonUrl: "#contact",
    },
    testimonials: {
      title: "Lo que dicen nuestros clientes",
      items: [
        { name: "Cliente 1", role: "CEO, Empresa", quote: "Excelente servicio, muy recomendado." },
        { name: "Cliente 2", role: "Gerente", quote: "Transformó nuestro negocio digital." },
      ],
    },
    gallery: {
      title: "Galería",
      images: [
        { url: "https://placehold.co/600x400/2563EB/white?text=Imagen+1", alt: "Imagen 1" },
        { url: "https://placehold.co/600x400/1E40AF/white?text=Imagen+2", alt: "Imagen 2" },
      ],
    },
    header: {
      logoText: "Mi Negocio",
      links: [
        { label: "Inicio", url: "#" },
        { label: "Servicios", url: "#services" },
        { label: "Contacto", url: "#contact" },
      ],
    },
    footer: {
      companyName: "Mi Negocio",
      description: "Transformamos tu presencia digital",
      columns: [
        {
          title: "Enlaces",
          links: [
            { label: "Inicio", url: "#" },
            { label: "Servicios", url: "#services" },
          ],
        },
        {
          title: "Contacto",
          links: [
            { label: "Email", url: "mailto:info@ejemplo.com" },
            { label: "WhatsApp", url: "#" },
          ],
        },
      ],
      copyright: "© 2026 Mi Negocio. Todos los derechos reservados.",
    },
    form: {
      title: "Contáctanos",
      subtitle: "Déjanos tu mensaje y te responderemos pronto",
      buttonText: "Enviar",
      formId: "",
      fields: [],
    },
    about: { title: "Sobre nosotros", description: "Cuenta la historia de tu negocio", buttonText: "Conócenos", buttonUrl: "#", imageUrl: "" },
    contact: { title: "Contacto", subtitle: "Estamos aquí para ayudarte", buttonText: "Enviar", fields: [{ label: "Nombre", type: "text", name: "name", required: true }, { label: "Email", type: "email", name: "email", required: true }, { label: "Mensaje", type: "textarea", name: "message", required: true }] },
    whatsapp: { phone: "", message: "Hola, quisiera más información", position: "bottom-right", size: 56, color: "#25D366", tooltip: "Chatea con nosotros" },
    pricing: { title: "Nuestros planes", plans: [{ name: "Básico", price: "$9/mes", features: "Feature 1, Feature 2", buttonText: "Elegir", highlighted: "false" }] },
    team: { title: "Nuestro equipo", members: [{ name: "Nombre", role: "Cargo", image: "", bio: "" }] },
    features: { title: "¿Por qué elegirnos?", items: [{ icon: "🚀", title: "Característica 1", desc: "Descripción" }] },
    stats: { items: [{ icon: "bi-star", value: "100", suffix: "+", label: "Clientes felices" }] },
    portfolio: {
      kicker: "Portafolio",
      title: "Nuestros proyectos",
      subtitle: "Trabajos destacados",
      items: [{ image: "https://placehold.co/800x600/2563EB/white?text=Proyecto", tag: "Categoría", title: "Proyecto 1", icon: "bi-star", desc: "Descripción breve del proyecto" }],
    },
    benefits: { kicker: "Beneficios", title: "¿Por qué elegirnos?", items: [{ icon: "bi-shield-check", title: "Beneficio 1", desc: "Descripción del beneficio" }] },
    process: { kicker: "Proceso", title: "Nuestro proceso", items: [{ icon: "bi-arrow-repeat", title: "Paso 1", desc: "Descripción del paso" }] },
    image: { url: "https://placehold.co/800x400/2563EB/white?text=Imagen", alt: "Descripción de la imagen", link: "", caption: "", alignment: "center" },
    video: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Video", aspectRatio: "16/9", autoplay: false },
    "review-form": { title: "Déjanos tu opinión", subtitle: "Valoramos tu experiencia con nosotros", tenantId: "", siteId: "" },
  };
  return JSON.parse(JSON.stringify(defaults[type] || {}));
}

export function createBlockDefaults(type: BlockType, sortOrder: number): BlockData {
  return {
    type,
    content: getBlockDefaultContent(type),
    styles: {},
  };
}
