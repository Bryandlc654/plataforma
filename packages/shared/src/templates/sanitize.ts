/**
 * Saneamiento del contenido de los bloques antes de insertarlo en el HTML de una plantilla.
 *
 * Las variantes arman el HTML con plantillas de texto (`${c.title}`), así que el
 * contenido que escribe el usuario debe llegar ya escapado:
 * - Se escapan `& < > " '` (las entidades ya válidas, como `&amp;`, se conservan).
 * - Se permiten unas pocas etiquetas de formato sin atributos peligrosos
 *   (`<br>`, `<strong>`, `<em>`, `<b>`, `<i>`, `<u>`, `<small>`, `<span class="…">`).
 * - Las URLs con esquemas ejecutables (`javascript:`, `vbscript:`, `data:` que no sea
 *   una imagen) se reemplazan por `#`.
 */

const ALLOWED_TAG_RE = /<\s*(\/?)\s*(br|strong|em|b|i|u|small|span)\b((?:\s+(?:class|style)\s*=\s*(?:"[^"<>]*"|'[^'<>]*'))*)\s*\/?\s*>/gi;
/** Caracteres seguros dentro de class: sin comillas, `=`, paréntesis ni `<>`. */
const SAFE_CLASS_RE = /^[A-Za-z0-9_\-:\/\[\]#.% ]*$/;
/** Estilos en línea simples (colores, bordes de texto): sin comillas, `=`, `url(` ni `expression(`. */
const SAFE_STYLE_RE = /^[A-Za-z0-9_\-#:;.,%()\s]*$/;
const UNSAFE_STYLE_RE = /url\s*\(|expression\s*\(|@import/i;

function readAttr(attrs: string, name: "class" | "style"): string | null {
  const re = name === "class" ? /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i : /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i;
  const m = re.exec(attrs);
  return m ? (m[1] ?? m[2] ?? "") : null;
}
const ENTITY_RE = /&(?!(?:#\d{1,7}|#x[0-9a-fA-F]{1,6}|[A-Za-z][A-Za-z0-9]{1,31});)/g;
const PLACEHOLDER = "\u0000";

/** Escapa HTML sin volver a escapar entidades que ya lo están (es idempotente). */
export function escapeHtmlText(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .replace(ENTITY_RE, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escapa el texto conservando solo las etiquetas de formato permitidas. */
export function escapeRichText(value: string): string {
  const kept: string[] = [];
  const marked = value.split(PLACEHOLDER).join("").replace(ALLOWED_TAG_RE, (_m, slash: string, tag: string, attrs: string) => {
    const name = tag.toLowerCase();
    let extra = "";
    if (!slash && name === "span" && attrs) {
      const cls = readAttr(attrs, "class");
      if (cls && SAFE_CLASS_RE.test(cls)) extra += ` class="${cls}"`;
      const style = readAttr(attrs, "style");
      if (style && SAFE_STYLE_RE.test(style) && !UNSAFE_STYLE_RE.test(style)) extra += ` style="${style}"`;
    }
    kept.push(name === "br" ? "<br>" : `<${slash}${name}${slash ? "" : extra}>`);
    return `${PLACEHOLDER}${kept.length - 1}${PLACEHOLDER}`;
  });
  return escapeHtmlText(marked).replace(/\u0000(\d+)\u0000/g, (_m, i: string) => kept[Number(i)] ?? "");
}

const UNSAFE_SCHEME_RE = /^(?:javascript|vbscript|data|file):/i;
const SAFE_DATA_IMAGE_RE = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[A-Za-z0-9+/=\s]+$/i;

/** Devuelve la URL si su esquema es seguro; si no, `#`. */
export function safeUrl(value: string): string {
  // Los navegadores ignoran espacios y caracteres de control dentro del esquema.
  const compact = value.replace(/[\u0000- \u007f-\u009f]/g, "");
  if (UNSAFE_SCHEME_RE.test(compact) && !SAFE_DATA_IMAGE_RE.test(value.trim())) return "#";
  return value;
}

/** Codifica los caracteres que permitirían salir de `url('…')` o de un atributo. */
function hardenUrl(value: string): string {
  // Un texto con espacios (p. ej. "/ mes") no es una URL: se deja para el escape normal.
  if (/\s/.test(value) || !/^(?:https?:|\/|data:image\/)/i.test(value)) return value;
  return value.replace(/['"()<>\\]/g, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase());
}

export interface SanitizeOptions {
  /** false: solo se filtran URLs peligrosas (la variante ya escapa los valores, p. ej. raw-html). */
  escapeHtml?: boolean;
  /** Claves cuyo valor se deja tal cual (p. ej. el `html` de una plantilla importada). */
  skipKeys?: string[];
}

function sanitizeString(value: string, escape: boolean): string {
  let v = safeUrl(value);
  if (v !== value) return v;
  v = hardenUrl(v);
  return escape ? escapeRichText(v) : v;
}

/** Sanea recursivamente todos los textos del contenido de un bloque. */
export function sanitizeTemplateContent<T = any>(content: T, opts: SanitizeOptions = {}): T {
  const escape = opts.escapeHtml !== false;
  const skip = new Set(opts.skipKeys || []);
  const walk = (node: any, depth: number): any => {
    if (depth > 40) return node;
    if (typeof node === "string") return sanitizeString(node, escape);
    if (Array.isArray(node)) return node.map((v) => walk(v, depth + 1));
    if (node && typeof node === "object") {
      const out: any = {};
      for (const k of Object.keys(node)) out[k] = depth === 0 && skip.has(k) ? node[k] : walk(node[k], depth + 1);
      return out;
    }
    return node;
  };
  return walk(content, 0);
}
