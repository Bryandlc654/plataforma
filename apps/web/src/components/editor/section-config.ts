/**
 * Configuración del formulario por plantilla y sección, para que editar sea fácil:
 * - `hidden`: campos técnicos que no se muestran (tamaños, clases internas…).
 * - `itemHidden`: lo mismo dentro de los elementos de una lista.
 * - `selects`: opciones con nombre claro en lugar de texto libre.
 * - `visible`: según el diseño elegido, qué campos aplican (los demás se ocultan).
 * - `labels`: nombres propios de esa sección.
 */
export interface SelectOption { label: string; value: string; }

export interface SectionConfig {
  hidden?: string[];
  itemHidden?: Record<string, string[]>;
  selects?: Record<string, SelectOption[]>;
  visible?: (c: any) => string[] | null;
  labels?: Record<string, string>;
  itemLabels?: Record<string, Record<string, string>>;
}

const light: SelectOption = { label: "Claro", value: "" };

const indigoFeatures: SectionConfig = {
  selects: { layout: [{ label: "Imagen con lista de puntos", value: "" }, { label: "Tres columnas (filosofía)", value: "philosophy" }] },
  visible: (c) => c.layout === "philosophy"
    ? ["layout", "title", "subtitle", "items"]
    : ["layout", "kicker", "title", "description", "imageUrl", "features", "buttonText", "buttonUrl"],
  labels: { kicker: "Número grande de fondo", features: "Lista de puntos", items: "Columnas", layout: "Diseño" },
};

const indigoAbout: SectionConfig = {
  selects: {
    imageStyle: [{ label: "Imagen desplazada", value: "" }, { label: "Imagen con sombra", value: "shadow" }],
    reverse: [{ label: "Imagen a la derecha", value: "" }, { label: "Imagen a la izquierda", value: "true" }],
  },
  labels: { stats: "Cifras", features: "Lista de puntos", imageStyle: "Estilo de la imagen", reverse: "Posición de la imagen" },
};

const indigoCta: SectionConfig = {
  selects: { style: [{ label: "Contacto con formulario", value: "" }, { label: "Llamado a la acción grande", value: "funnel" }] },
  visible: (c) => c.style === "funnel"
    ? ["style", "title", "description", "buttonText", "buttonUrl"]
    : ["style", "kicker", "title", "description", "buttonText", "buttonUrl", "email", "fields", "messageLabel", "messagePlaceholder", "submitText"],
  labels: { style: "Diseño", kicker: "Primera línea del título", email: "Correo (si el botón no tiene enlace)", fields: "Campos del formulario", submitText: "Texto del botón enviar" },
};

export const SECTION_CONFIG: Record<string, SectionConfig> = {
  // ---------------------------------------------------------------- Indigo
  "indigo/header": {
    hidden: ["companyName"],
    selects: { navbarStyle: [{ label: "Transparente sobre la portada", value: "" }, { label: "Barra blanca", value: "white" }] },
    labels: { navbarStyle: "Estilo de la barra", links: "Menú", logoUrl: "Enlace del logo" },
    itemLabels: { links: { active: "Resaltar en la barra blanca" } },
  },
  "indigo/page-hero": {
    hidden: ["marqueeOpacity", "marqueeSize", "titleShadow"],
    selects: {
      background: [
        light, { label: "Color de marca", value: "brand" }, { label: "Oscuro", value: "dark" }, { label: "Oscuro simple", value: "dark-plain" },
        { label: "Con texto gigante (contacto)", value: "contact" }, { label: "Con texto gigante (trabajos)", value: "works" },
      ],
    },
    visible: (c) => (c.background === "contact" || c.background === "works") ? null : ["title", "description", "background"],
    labels: { background: "Fondo", marqueeText: "Texto gigante de fondo" },
  },
  "indigo/hero": {
    labels: { title: "Título (línea 1)", subtitle: "Título (línea 2, en color)", description: "Descripción", scrollText: "Texto «Scroll»" },
  },
  "indigo/marquee": { labels: { words: "Palabras que se desplazan" } },
  "indigo/about": indigoAbout,
  "indigo/agency": indigoAbout,
  "indigo/features": indigoFeatures,
  "indigo/services": indigoFeatures,
  "indigo/portfolio": { labels: { linkUrl: "Enlace al hacer clic en la imagen", exploreText: "Texto al pasar el mouse", imageUrl: "Imagen" } },
  "indigo/testimonials": { itemLabels: { items: { image: "Foto", role: "Empresa o cargo" } } },
  "indigo/awareness": {
    selects: { highlightStyle: [{ label: "Amarillo", value: "" }, { label: "Oscuro", value: "dark" }] },
    labels: { highlight: "Texto destacado", highlightStyle: "Estilo del destacado" },
  },
  "indigo/benefits": {
    selects: { accent: [{ label: "Blanco", value: "" }, { label: "Color de marca", value: "brand" }] },
    labels: { accent: "Color de los bordes", items: "Beneficios" },
  },
  "indigo/portfolio-grid": {
    hidden: ["shadow"],
    itemHidden: { projects: ["colSpan", "type", "imgHeight", "hover", "numberStyle", "mt"] },
    labels: { projects: "Proyectos", ctaText: "Texto del botón final", ctaUrl: "Enlace del botón final", title: "Título del recuadro final", projectLinkText: "Texto «Ver proyecto»" },
    itemLabels: { projects: { sub: "Subtítulo", img: "Imagen", url: "Enlace del proyecto", number: "Número" } },
  },
  "indigo/contact-section": {
    labels: {
      formTitle: "Título del formulario", serviceOptions: "Opciones de servicio", serviceLabel: "Etiqueta «Servicio»",
      namePlaceholder: "Texto de ayuda del nombre", emailFieldLabel: "Etiqueta del correo (formulario)", emailPlaceholder: "Texto de ayuda del correo",
      messagePlaceholder: "Texto de ayuda del mensaje", emailLabel: "Etiqueta del correo", phoneLabel: "Etiqueta del teléfono", addressLabel: "Etiqueta de la dirección",
    },
  },
  "indigo/cta": indigoCta,
  "indigo/contact": indigoCta,
  "indigo/stats": { selects: { style: [{ label: "Normal", value: "" }, { label: "Con sombra", value: "drop-shadow" }] }, labels: { style: "Estilo", items: "Cifras" } },
  "indigo/image": { selects: { background: [light, { label: "Oscuro", value: "dark" }] }, labels: { background: "Fondo", link: "Enlace al hacer clic" } },
  "indigo/form": { selects: { background: [light, { label: "Oscuro", value: "dark" }] }, labels: { background: "Fondo" } },
  "indigo/video": { hidden: ["imageUrl"], labels: { videoUrl: "Enlace del video (YouTube o Vimeo)", thumbnail: "Imagen si no hay video" } },
  "indigo/whatsapp": { labels: { phone: "Número de WhatsApp", message: "Mensaje predeterminado" } },
  "indigo/footer": {
    labels: {
      footerText: "Descripción", col1Title: "Título de la columna 1", col2Title: "Título de la columna 2", col3Title: "Título de redes",
      links: "Enlaces (columna 1)", social: "Redes sociales", privacyUrl: "Enlace de privacidad", termsUrl: "Enlace de términos", bigText: "Texto gigante de fondo",
    },
  },

  // ---------------------------------------------------------------- Urban Noir
  "urban-noir/hero": {
    labels: {
      backgroundImage: "Imagen de fondo", kicker: "Antetítulo", title: "Título", subtitle: "Subtítulo",
      buttonText: "Texto del botón", buttonUrl: "Enlace del botón", slides: "Más diapositivas",
    },
  },
  "urban-noir/footer": { labels: { columns: "Columnas de enlaces", links: "Enlaces" } },
  "urban-noir/header": { labels: { links: "Menú" } },
  "urban-noir/features": { labels: { items: "Categorías", linkText: "Texto del enlace «ver todo»", linkUrl: "Enlace «ver todo»" } },
  "urban-noir/portfolio": { labels: { items: "Productos" } },
  "urban-noir/benefits": { labels: { items: "Beneficios" } },
};

export function sectionConfig(variant: string | undefined, type: string): SectionConfig {
  return SECTION_CONFIG[`${variant || "generic"}/${type}`] || {};
}
