import { TEMPLATE_SCHEMA, type TemplateFieldSchema } from "@/lib/templates";
import { sectionConfig, type SectionConfig } from "./section-config";

/**
 * Campos editables de una sección: los que declara el esquema de su plantilla (con sus
 * valores por defecto) más cualquier otro que ya tenga el contenido. Así todo lo que la
 * plantilla muestra se puede editar, aunque el contenido guardado aún no lo tenga.
 */

export type FieldKind = "text" | "textarea" | "image" | "url" | "color" | "icon" | "boolean" | "number" | "select" | "list" | "stringList" | "group" | "productCategory" | "picker";

export interface FieldDef {
  key: string;
  label: string;
  /** Ayuda corta bajo el campo. */
  hint?: string;
  kind: FieldKind;
  default?: unknown;
  options?: { label: string; value: string; art?: string }[];
  /** Lista que se puede llenar con productos de la tienda. */
  productList?: boolean;
  /** Para listas: campos de cada elemento. Para grupos (objetos): sus campos. */
  itemFields?: FieldDef[];
}

/** Claves internas o gestionadas por el sistema: no se muestran. */
const HIDDEN = new Set(["variant", "html", "anchor", "linktree", "sorteo", "tenantId", "siteId", "payment", "checkoutBase", "primaryColor", "secondaryColor"]);

const LABELS: Record<string, string> = {
  title: "Título", subtitle: "Subtítulo", kicker: "Antetítulo", eyebrow: "Antetítulo", description: "Descripción", desc: "Descripción",
  text: "Texto", content: "Contenido", body: "Texto", quote: "Cita", name: "Nombre", role: "Cargo", label: "Etiqueta", value: "Valor",
  buttonText: "Texto del botón", buttonUrl: "Enlace del botón", secondaryButtonText: "Texto del botón secundario", secondaryButtonUrl: "Enlace del botón secundario",
  ctaText: "Texto del botón", ctaUrl: "Enlace del botón", linkText: "Texto del enlace", linkUrl: "Enlace", url: "Enlace", link: "Enlace", href: "Enlace",
  image: "Imagen", imageUrl: "Imagen", backgroundImage: "Imagen de fondo", logoImage: "Logo", logoText: "Texto del logo", logoType: "Tipo de logo", logo: "Logo",
  icon: "Ícono", items: "Elementos", links: "Enlaces", columns: "Columnas", fields: "Campos del formulario", images: "Imágenes", slides: "Diapositivas",
  phone: "Teléfono", email: "Correo", address: "Dirección", hours: "Horario", companyName: "Nombre de la empresa", copyright: "Derechos reservados",
  price: "Precio", period: "Periodo", features: "Características", stats: "Estadísticas", alt: "Texto alternativo", caption: "Pie de foto",
  messageLabel: "Etiqueta del mensaje", messagePlaceholder: "Texto de ayuda del mensaje", highlight: "Texto destacado",
  question: "Pregunta", answer: "Respuesta", category: "Categoría", tag: "Etiqueta", tags: "Etiquetas", year: "Año", suffix: "Sufijo",
  placeholder: "Texto de ayuda", required: "Obligatorio", type: "Tipo", options: "Opciones", message: "Mensaje", number: "Número",
  reviewLinkText: "Texto del enlace de reseñas", privacyText: "Texto de privacidad", termsText: "Texto de términos", mapUrl: "Enlace del mapa",
  carousel: "Mostrar como carrusel", autoplay: "Reproducción automática", aspectRatio: "Proporción", alignment: "Alineación",
  // Comunes en las plantillas de diseño
  hideLogoText: "Ocultar el texto junto al logo", searchUrl: "Enlace del botón Buscar",
  autoplaySeconds: "Cambiar de diapositiva cada (segundos)", watermark: "Texto de fondo", newsletter: "Mostrar como formulario de suscripción",
  imageAlt: "Texto alternativo de la imagen", currency: "Símbolo de moneda", addToCartText: "Texto del botón «Añadir al carrito»",
  compareAt: "Precio anterior (tachado)", social: "Redes sociales", legalLinks: "Enlaces legales", socialTitle: "Título de redes sociales",
  id: "Código del producto", newsletterLabel: "Etiqueta del correo", scrollText: "Texto «Desplázate»", exploreText: "Texto del botón explorar",
  emptyText: "Texto cuando no hay reseñas", emptyTitle: "Título cuando no hay reseñas", ratingLabel: "Etiqueta de calificación",
  nameLabel: "Etiqueta del nombre", emailLabel: "Etiqueta del correo", commentLabel: "Etiqueta del comentario", submitText: "Texto del botón enviar",
  // Checkout (Urban Noir)
  coTitle: "Título", coSubtitle: "Subtítulo", coEmptyText: "Texto de carrito vacío", coBackText: "Texto «Volver a la tienda»",
  coTotalLabel: "Etiqueta del total", coDeliveryTitle: "Título de datos de entrega", coPaymentTitle: "Título de método de pago",
  coCodTitle: "Nombre del pago contra entrega", coCodDesc: "Descripción del pago contra entrega", coPaypalTitle: "Título del pago con PayPal",
  coPaypalDesc: "Descripción de PayPal", coPaypalNote: "Nota de PayPal", coPayphoneTitle: "Título del pago con Payphone",
  coPayphoneDesc: "Descripción de Payphone", coPayphoneNote: "Nota de Payphone", coConfirmText: "Texto del botón confirmar",
  coSuccessTitle: "Título de pedido recibido", coRegisteredText: "Texto de pedido registrado", coCodSuccess: "Mensaje de pago contra entrega",
  coContinueText: "Texto «Seguir comprando»",
};

const HINTS: Record<string, string> = {
  autoplaySeconds: "0 = las diapositivas no cambian solas.",
  slides: "Cada diapositiva tiene su imagen, textos y botón.",
  searchUrl: "Déjalo vacío para ocultar el botón de búsqueda.",
  hideLogoText: "Solo si subiste una imagen de logo.",
  id: "Debe coincidir con el producto de tu tienda para el carrito.",
  watermark: "Texto grande y tenue detrás del contenido.",
  newsletter: "Cambia la sección a un campo de correo con botón de suscribirse.",
};

const SELECTS: Record<string, { label: string; value: string }[]> = {
  logoType: [{ label: "Texto", value: "text" }, { label: "Imagen", value: "image" }, { label: "Imagen y texto", value: "both" }],
  alignment: [{ label: "Izquierda", value: "left" }, { label: "Centro", value: "center" }, { label: "Derecha", value: "right" }],
  aspectRatio: [{ label: "16:9", value: "16/9" }, { label: "4:3", value: "4/3" }, { label: "1:1", value: "1/1" }, { label: "9:16", value: "9/16" }],
};
const FORM_FIELD_TYPES = [
  { label: "Texto", value: "text" }, { label: "Correo", value: "email" }, { label: "Teléfono", value: "tel" },
  { label: "Texto largo", value: "textarea" }, { label: "Número", value: "number" }, { label: "Fecha", value: "date" },
];

/** "heroLeftTag" → "Hero left tag" (si no hay traducción). */
export function labelFor(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const spaced = key.replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase().trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// "imageUrl", "logoSrc", "storyImgBack"… también son imágenes aunque terminen en Url/Src.
const IMAGE_KEY = /(image|img|photo|avatar|logo|thumbnail|poster|background|bg|cover|banner|picture)(url|src|back|front)?$/i;
const URL_KEY = /(url|link|href)$/i;
const IMAGE_VALUE = /^(https?:|\/uploads\/|data:image\/).+\.(png|jpe?g|webp|gif|avif|svg)(\?|$)|googleusercontent\.com|unsplash\.com|placehold\.co/i;

function kindOf(key: string, value: unknown, listKey?: string): FieldKind {
  if (value && typeof value === "object" && !Array.isArray(value)) return "group";
  if (Array.isArray(value)) return value.every((v) => typeof v === "string") && value.length > 0 ? "stringList" : "list";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (SELECTS[key] || (listKey === "fields" && key === "type")) return "select";
  if (/icon$/i.test(key) && key !== "iconColor") return "icon";
  if (/colou?r$/i.test(key) || (typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value))) return "color";
  const s = typeof value === "string" ? value : "";
  if (IMAGE_KEY.test(key) || (s && IMAGE_VALUE.test(s) && !URL_KEY.test(key))) return "image";
  if (URL_KEY.test(key)) return "url";
  if (s.length > 70 || /\n|<br\s*\/?>/i.test(s) || /(desc|description|text|body|quote|answer|content|paragraph|p\d)$/i.test(key) && s.length > 40) return "textarea";
  return "text";
}

type SchemaFields = Record<string, TemplateFieldSchema>;

export function schemaFor(type: string, content: any): SchemaFields {
  const variant = content?.variant && TEMPLATE_SCHEMA[content.variant] ? content.variant : content?.variant ? null : "generic";
  return (variant && TEMPLATE_SCHEMA[variant]?.[type]) || {};
}

function itemFieldDefs(listKey: string, schemaItems: Record<string, TemplateFieldSchema> | undefined, values: any[], cfg: SectionConfig = {}): FieldDef[] {
  const keys: string[] = [];
  const hidden = new Set(cfg.itemHidden?.[listKey] || []);
  const labels = cfg.itemLabels?.[listKey] || {};
  const add = (k: string) => { if (!HIDDEN.has(k) && !hidden.has(k) && !keys.includes(k)) keys.push(k); };
  Object.keys(schemaItems || {}).forEach((k) => {
    const alias = schemaItems![k].aliasOf;
    // Alternativo (description de desc): solo si algún elemento lo usa.
    if (alias && !values.some((v) => v && v[k] != null && v[k] !== "")) return;
    add(k);
  });
  values.forEach((v) => { if (v && typeof v === "object" && !Array.isArray(v)) Object.keys(v).forEach(add); });
  return keys.map((k) => {
    const sample = values.find((v) => v && v[k] != null)?.[k] ?? schemaItems?.[k]?.default ?? "";
    const itemSelect = cfg.itemSelects?.[listKey]?.[k];
    const kind: FieldKind = itemSelect ? "select" : kindOf(k, sample, listKey);
    const def: FieldDef = {
      key: k,
      label: labels[k] || labelFor(k),
      kind,
      default: schemaItems?.[k]?.default,
      options: kind === "select" ? (itemSelect || (listKey === "fields" && k === "type" ? FORM_FIELD_TYPES : SELECTS[k])) : undefined,
    };
    // Lista dentro de cada elemento (p. ej. el submenú de un enlace): sus campos salen del esquema.
    if (kind === "list") def.itemFields = itemFieldDefs(`${listKey}.${k}`, schemaItems?.[k]?.items, Array.isArray(sample) ? sample : [], cfg);
    if (kind === "group") def.itemFields = groupFieldDefs(sample);
    return def;
  });
}

function groupFieldDefs(obj: any): FieldDef[] {
  return Object.keys(obj || {}).filter((k) => !HIDDEN.has(k) && typeof obj[k] !== "function").map((k) => {
    const v = obj[k];
    const kind = kindOf(k, v ?? "");
    const def: FieldDef = { key: k, label: labelFor(k), kind, options: kind === "select" ? SELECTS[k] : undefined };
    if (kind === "list") def.itemFields = itemFieldDefs(k, undefined, Array.isArray(v) ? v : []);
    if (kind === "group") def.itemFields = groupFieldDefs(v);
    return def;
  });
}

/** Lista ordenada de campos editables de una sección. */
export function fieldsFor(type: string, content: any): FieldDef[] {
  const c = content || {};
  const schema = schemaFor(type, c);
  const cfg = sectionConfig(c.variant, type);
  const hidden = new Set(cfg.hidden || []);
  // Según el diseño elegido (p. ej. "Tres columnas"), solo los campos que aplican.
  const visible = cfg.visible?.(c);
  const visibleSet = visible ? new Set(visible) : null;
  const keys: string[] = [];
  const add = (k: string) => {
    if (HIDDEN.has(k) || hidden.has(k) || keys.includes(k)) return;
    if (visibleSet && !visibleSet.has(k)) return;
    keys.push(k);
  };
  // Las opciones de diseño van primero: cambian qué campos se muestran.
  Object.keys(cfg.pickers || {}).forEach(add);
  Object.keys(cfg.selects || {}).forEach(add);
  Object.keys(cfg.dynamicFields || {}).forEach(add);
  Object.keys(schema).forEach((k) => {
    if (schema[k].aliasOf && (c[k] == null || c[k] === "")) return;
    add(k);
  });
  // Plantillas importadas (raw-html) y campos extra: lo que ya tenga el contenido.
  Object.keys(c).forEach((k) => {
    const v = c[k];
    if (v == null || typeof v === "function") return;
    add(k);
  });

  // Con `visible`, el orden es el de la configuración (p. ej. antetítulo antes del título).
  if (visible) keys.sort((a, b) => visible.indexOf(a) - visible.indexOf(b));
  const sectionLabels = cfg.labels || {};
  return keys.map((key) => {
    const s = schema[key];
    const value = c[key] ?? s?.default;
    const options = cfg.selects?.[key] || SELECTS[key];
    const kind: FieldKind = cfg.kinds?.[key]
      ? cfg.kinds[key]
      : cfg.pickers?.[key]
      ? "picker"
      : cfg.dynamicFields?.[key]
      ? cfg.dynamicFields[key]
      : cfg.selects?.[key]
      ? "select"
      : s?.list ? (Array.isArray(value) && value.length && value.every((v: unknown) => typeof v === "string") ? "stringList" : "list") : kindOf(key, value ?? "");
    const def: FieldDef = { key, label: sectionLabels[key] || labelFor(key), hint: cfg.hints?.[key] || HINTS[key], kind, default: s?.default, options: kind === "select" ? options : kind === "picker" ? cfg.pickers![key] : undefined };
    if (kind === "list") def.itemFields = itemFieldDefs(key, s?.items, Array.isArray(value) ? value : [], cfg);
    if (kind === "list" && cfg.productLists?.includes(key)) def.productList = true;
    // Objetos anidados (plantillas importadas): sus campos se editan agrupados.
    if (kind === "group") def.itemFields = groupFieldDefs(value);
    return def;
  });
}

const clone = <T,>(v: T): T => (v == null ? v : JSON.parse(JSON.stringify(v)));

/** Contenido con los valores por defecto de la plantilla rellenados (sin modificar el original). */
export function withDefaults(type: string, content: any): any {
  const c = { ...(content || {}) };
  const schema = schemaFor(type, c);
  for (const [k, s] of Object.entries(schema)) {
    if ((c[k] == null || c[k] === "") && s.default !== undefined && s.default !== "") c[k] = clone(s.default);
  }
  return c;
}

/**
 * Antes de editar algo que aún no está en el contenido (se ve el valor por defecto), se
 * copia el valor por defecto de su raíz: editar stats[0].label no debe perder stats[1..].
 */
export function materializeRoot(type: string, content: any, rootKey: string | number): any {
  const c = content || {};
  if (typeof rootKey !== "string" || (c[rootKey] != null && c[rootKey] !== "")) return c;
  const def = schemaFor(type, c)[rootKey]?.default;
  return def === undefined ? c : { ...c, [rootKey]: clone(def) };
}

/** Valor nuevo para un elemento de lista: copia vacía del último o de los valores por defecto. */
export function blankItem(field: FieldDef, list: any[]): any {
  const last = list[list.length - 1];
  if (typeof last === "string") return "";
  const item: Record<string, unknown> = {};
  for (const f of field.itemFields || []) {
    const sample = last && typeof last === "object" ? last[f.key] : undefined;
    item[f.key] = typeof sample === "boolean" ? false : typeof sample === "number" ? 0 : f.kind === "select" ? f.options?.[0]?.value ?? "" : "";
  }
  return item;
}
