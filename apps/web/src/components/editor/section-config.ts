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
  /** Opciones con nombre dentro de los elementos de una lista (p. ej. el ícono de cada beneficio). */
  itemSelects?: Record<string, Record<string, SelectOption[]>>;
  /** Listas que se pueden llenar con productos de la tienda (módulo E-commerce). */
  productLists?: string[];
  /** Selectores cuyas opciones vienen de la tienda (p. ej. sus categorías). */
  dynamicFields?: Record<string, "productCategory">;
  /** Ayudas propias de la sección. */
  hints?: Record<string, string>;
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
    selects: {
      imageColor: [{ label: "Blanco y negro (estilo de la marca)", value: "" }, { label: "A color", value: "color" }],
      imageOpacity: [
        { label: "Imagen tenue (40%)", value: "40" }, { label: "Normal (60%)", value: "" }, { label: "Intensa (80%)", value: "80" }, { label: "Completa (100%)", value: "100" },
      ],
    },
    labels: {
      backgroundImage: "Imagen de fondo", kicker: "Antetítulo", title: "Título", subtitle: "Subtítulo",
      buttonText: "Texto del botón", buttonUrl: "Enlace del botón", slides: "Más diapositivas",
      imageColor: "Color de la imagen", imageOpacity: "Intensidad de la imagen",
    },
  },
  "urban-noir/header": { labels: { links: "Menú", logoImage: "Logo (imagen)", logoText: "Nombre de la tienda" } },
  "urban-noir/features": {
    selects: { layout: [{ label: "Automático", value: "" }, { label: "Categorías con foto", value: "catalog" }, { label: "Tarjetas de texto", value: "cards" }] },
    visible: (c) => {
      const catalog = c.layout ? c.layout === "catalog" : (c.items || []).some((it: any) => it && it.image);
      return catalog ? ["layout", "title", "linkText", "linkUrl", "items"] : ["layout", "title", "subtitle", "items"];
    },
    labels: { layout: "Diseño", items: "Categorías", linkText: "Texto del enlace «ver todo»", linkUrl: "Enlace «ver todo»" },
    itemLabels: { items: { link: "Enlace de la categoría" } },
  },
  "urban-noir/cta": {
    selects: { newsletter: [{ label: "Promoción con botón", value: "" }, { label: "Formulario de suscripción", value: "true" }] },
    visible: (c) => c.newsletter
      ? ["newsletter", "title", "subtitle", "placeholder", "buttonText"]
      : ["newsletter", "kicker", "title", "subtitle", "buttonText", "buttonUrl", "backgroundImage", "imageAlt", "watermark"],
    labels: { newsletter: "Tipo de sección", placeholder: "Texto dentro del campo de correo", backgroundImage: "Imagen de la promoción" },
  },
  "urban-noir/portfolio": {
    selects: {
      source: [{ label: "Productos de mi tienda (en vivo)", value: "" }, { label: "Elegidos a mano", value: "manual" }],
      catalogSort: [
        { label: "Destacados primero", value: "" }, { label: "Más nuevos", value: "newest" },
        { label: "Precio: menor a mayor", value: "price-asc" }, { label: "Precio: mayor a menor", value: "price-desc" }, { label: "Nombre (A–Z)", value: "name" },
      ],
      catalogLimit: [{ label: "4 productos", value: "4" }, { label: "8 productos", value: "8" }, { label: "12 productos", value: "" }, { label: "16 productos", value: "16" }, { label: "24 productos", value: "24" }],
      hideSoldOut: [{ label: "Mostrar también los agotados", value: "" }, { label: "Ocultar los agotados", value: "true" }],
    },
    dynamicFields: { catalogCategory: "productCategory" },
    visible: (c) => c.source === "manual"
      ? ["source", "items", "title", "subtitle", "currency", "addToCartText", "buttonText", "buttonUrl"]
      : ["source", "catalogCategory", "catalogSort", "catalogLimit", "hideSoldOut", "title", "subtitle", "currency", "addToCartText", "buttonText", "buttonUrl"],
    hints: {
      source: "En vivo: los productos, precios y fotos se toman de tu tienda y se actualizan solos.",
      catalogCategory: "Si la tienda no tiene productos todavía, se muestra la lista elegida a mano.",
    },
    labels: {
      items: "Productos", currency: "Símbolo de moneda", source: "Origen de los productos", catalogCategory: "Categoría",
      catalogSort: "Orden", catalogLimit: "Cantidad", hideSoldOut: "Productos agotados",
    },
    itemLabels: { items: { link: "Página del producto", tag: "Etiqueta (ej. NUEVO, -20%)", image: "Foto" } },
    productLists: ["items"],
  },
  "urban-noir/benefits": {
    labels: { items: "Beneficios" },
    itemSelects: {
      items: {
        icon: [
          { label: "Envío", value: "envio" }, { label: "Calidad", value: "calidad" }, { label: "Pago seguro", value: "pago" },
          { label: "Devoluciones", value: "devolucion" }, { label: "Soporte", value: "soporte" }, { label: "Regalo", value: "regalo" }, { label: "Estrella", value: "estrella" },
        ],
      },
    },
  },
  "urban-noir/footer": {
    labels: { columns: "Columnas de enlaces", links: "Enlaces", logoImage: "Logo (imagen)", companyName: "Nombre de la tienda" },
    itemLabels: { social: { label: "Nombre visible", network: "Red social" } },
    itemSelects: {
      social: {
        network: [
          { label: "Según el nombre", value: "" }, { label: "Instagram", value: "instagram" }, { label: "Facebook", value: "facebook" },
          { label: "TikTok", value: "tiktok" }, { label: "X (Twitter)", value: "x" }, { label: "YouTube", value: "youtube" },
          { label: "WhatsApp", value: "whatsapp" }, { label: "LinkedIn", value: "linkedin" }, { label: "Pinterest", value: "pinterest" },
        ],
      },
    },
  },
};

export function sectionConfig(variant: string | undefined, type: string): SectionConfig {
  return SECTION_CONFIG[`${variant || "generic"}/${type}`] || {};
}
