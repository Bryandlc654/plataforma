import { Injectable, BadRequestException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import { TextDecoder } from "util";
import AdmZip = require("adm-zip");
import * as cheerio from "cheerio";
import { PrismaService } from "../../prisma/prisma.service";
import {
  buildCss,
  scopeCss,
  hoistCssImports,
  extractExternalImports,
  extractThemeVars,
  extractInlineStyleImages,
  rewriteInlineUrls,
  escapeHtmlAttr,
  TEMPLATE_SCOPE_CLASS,
  CssAssetContext,
  TemplateTheme,
} from "./css-transform";
import {
  TemplateJsFeatures,
  emptyTemplateJsFeatures,
  mergeTemplateJsFeatures,
  detectTemplateJsFeatures,
  buildTemplateCompatScript,
} from "./template-compat";

export interface ImportLimits {
  texts: number;
  images: number;
  urls: number;
  arrayItems: number;
  navItems: number;
  /** Techo absoluto por tipo para evitar páginas patológicas. */
  hard: number;
}

export const DEFAULT_IMPORT_LIMITS: ImportLimits = {
  texts: 200,
  images: 100,
  urls: 100,
  arrayItems: 200,
  navItems: 100,
  hard: 1000,
};

export interface ImportZipDto {
  name?: string;
  description?: string;
  categoryId?: string;
  isPremium?: boolean;
  limits?: Partial<ImportLimits>;
  /** Si es true solo analiza el ZIP y devuelve el mapeo, sin persistir ni escribir archivos. */
  dryRun?: boolean;
}

interface FieldSchemaItem {
  key: string;
  label: string;
  type: string;
  fields?: FieldSchemaItem[];
  options?: Array<{ label: string; value: string }>;
  /** Para `type: "icon"`: familia Bootstrap Icons. */
  bi?: boolean;
  /** Para `type: "icon"`: icono de marca (redes sociales). */
  brand?: boolean;
}

interface ExtractedBlock {
  type: string;
  content: Record<string, any>;
}

export interface BlockStats {
  texts: number;
  images: number;
  urls: number;
  lists: number;
  navs: number;
  forms: number;
  icons: number;
  svgs: number;
  discardedTexts: number;
  discardedImages: number;
  discardedUrls: number;
}

function emptyBlockStats(): BlockStats {
  return {
    texts: 0, images: 0, urls: 0, lists: 0, navs: 0, forms: 0, icons: 0, svgs: 0,
    discardedTexts: 0, discardedImages: 0, discardedUrls: 0,
  };
}

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });
const CP1252_DECODER = new TextDecoder("windows-1252");

/**
 * Decodifica una entrada del ZIP a texto. Los zips viejos suelen venir en
 * windows-1252/ISO-8859-1: un `toString("utf8")` directo rompería acentos
 * (aparecen `�`). Se detecta UTF-8 válido y, si no, se cae a windows-1252.
 */
function decodeEntryData(buf: Buffer): string {
  if (!buf || buf.length === 0) return "";
  let bytes: Uint8Array = buf;
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    bytes = bytes.subarray(3);
  }
  try {
    return UTF8_DECODER.decode(bytes);
  } catch {
    try {
      return CP1252_DECODER.decode(bytes);
    } catch {
      return Buffer.from(bytes).toString("latin1");
    }
  }
}

/** Contexto compartido por las rutinas de extracción de un bloque. */
interface BuildCtx {
  $: cheerio.CheerioAPI;
  values: Record<string, any>;
  schema: FieldSchemaItem[];
  keyFor: (base: string, fallback: string) => string;
  token: (scope: string, idx: number, field: string) => string;
  stats: BlockStats;
  limits: ImportLimits;
  isToken: (value: string) => boolean;
  isHeaderFooter: boolean;
}

interface PageCssFileInfo {
  cssPath: string;
  scopedCssPath: string;
  cssHash: string;
  scopedCssHash: string;
}

interface PageGlobalStyle extends Partial<PageCssFileInfo> {
  /** Fallback inline (solo si no se pudo escribir el archivo en disco). */
  css?: string;
  scopedCss?: string;
  head: string;
  htmlAttrs: Record<string, string>;
  bodyAttrs: Record<string, string>;
  theme?: TemplateTheme;
}

const ASSET_EXT = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "ico",
  "css", "js", "woff", "woff2", "ttf", "otf", "eot",
  "mp4", "webm", "pdf", "webmanifest", "json", "txt", "xml",
]);

const SCALAR_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "button", "li", "span",
  "label", "figcaption", "blockquote", "cite", "strong", "em", "dt", "dd",
  "td", "th", "small", "b", "legend",
]);

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

const TOKEN_OPEN = "{{__ED::";
const TOKEN_CLOSE = "}}";
const POSIX_JOIN = (a: string, b: string) => path.posix.join(a, b);

const RESERVED_KEYS = new Set(["variant", "html", "fieldSchema", "items", "fields"]);

const TAG_LABELS: Record<string, string> = {
  h1: "Título principal",
  h2: "Título de sección",
  h3: "Subtítulo",
  h4: "Subtítulo 2",
  h5: "Subtítulo 3",
  h6: "Subtítulo 4",
  p: "Texto",
  a: "Texto del botón",
  button: "Texto del botón",
  li: "Ítem",
  span: "Texto",
  label: "Etiqueta",
  blockquote: "Cita",
  cite: "Cita",
  figcaption: "Pie de imagen",
  small: "Texto pequeño",
  strong: "Texto destacado",
  em: "Texto",
  td: "Celda",
  th: "Encabezado de tabla",
  legend: "Leyenda",
};

function slugKey(input: string): string {
  return String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

function humanizeKey(input: string): string {
  const s = String(input || "").replace(/[_-]+/g, " ").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Genera claves únicas y legibles (evita colisiones y claves reservadas). */
function makeKeyFactory() {
  const used = new Set<string>(RESERVED_KEYS);
  return (base: string, fallback: string): string => {
    let b = slugKey(base);
    if (!b || b.length < 2 || /^\d+$/.test(b)) b = fallback;
    if (RESERVED_KEYS.has(b)) b = `${b}_campo`;
    let key = b;
    let n = 2;
    while (used.has(key)) key = `${b}_${n++}`;
    used.add(key);
    return key;
  };
}

/** Texto visible asociado a un control (`<label for>` o `<label>` contenedor). */
function controlLabelText($: cheerio.CheerioAPI, el: any, scope?: any): string {
  const $el = $(el);
  const id = ($el.attr("id") || "").trim();
  if (id) {
    const byFor = (scope ? scope.find("label[for]") : $("label[for]"))
      .filter((_: any, l: any) => ($(l).attr("for") || "").trim() === id)
      .first();
    if (byFor.length) {
      const clone = byFor.clone();
      clone.find("input,textarea,select,button").remove();
      const t = (clone.text() || "").trim();
      if (t) return t;
    }
  }
  const wrap = $el.closest("label");
  if (wrap.length) {
    const clone = wrap.clone();
    clone.find("input,textarea,select,button").remove();
    const t = (clone.text() || "").trim();
    if (t) return t;
  }
  return "";
}

const CLASS_NOISE_RE =
  /^(container|row|col|column|wrapper|inner|outer|item|text|content|section|block|group|btn|button|link|icon|image|img|card|grid|flex|nav|menu|list|active|open|clearfix|sr-only|visually-hidden|d-|col-|flex-|w-|h-|m[tblrxy]?-|p[tblrxy]?-|g-|mt-|mb-|pt-|pb-|font-|leading-|tracking-|rounded|shadow|border|bg-|opacity|z-|inset|top-|left-|right-|bottom-|inline|absolute|relative|fixed|sticky|hidden|block|overflow|cursor|transition|duration|ease|translate|scale|rotate|transform|space-|gap-|order-|basis-|grow|shrink|self-|justify-|items-|place-|aspect-|object-|fill-|stroke-|decoration|underline|uppercase|lowercase|capitalize|whitespace-|truncate|break-|align-|select-|pointer-events|resize|outline|ring|divide-|from-|via-|to-)/i;

const SEMANTIC_CLASS_RE =
  /(title|heading|headline|subtitle|name|price|desc|description|caption|label|email|phone|tel|address|date|time|message|kicker|eyebrow|badge|logo|tagline|slogan|brand)/i;

/** Deduce un nombre semántico desde id/name/aria-label/label/placeholder/class. */
function semanticBaseName($: cheerio.CheerioAPI, el: any, scope?: any): string {
  const $el = $(el);
  const classBase = ($el.attr("class") || "")
    .split(/\s+/)
    .map((c) => c.trim())
    .find(
      (c) =>
        c.length >= 3 &&
        !CLASS_NOISE_RE.test(c) &&
        SEMANTIC_CLASS_RE.test(c) &&
        !/\d{3,}/.test(c),
    );
  const candidates = [
    $el.attr("aria-label"),
    controlLabelText($, el, scope),
    $el.attr("name"),
    $el.attr("id"),
    $el.attr("placeholder"),
    classBase,
    $el.attr("title"),
    $el.attr("alt"),
  ];
  for (const candidate of candidates) {
    const s = String(candidate || "").trim();
    if (s.includes(TOKEN_OPEN)) continue;
    if (s.length >= 2 && s.length <= 40 && !/^\d+$/.test(s)) return s;
  }
  return "";
}

function inferFieldType(tag: string, $el: any, hint = ""): string {
  const inputType = ($el.attr("type") || "").toLowerCase();
  const href = ($el.attr("href") || "").toLowerCase();
  const hay = `${$el.attr("name") || ""} ${$el.attr("id") || ""} ${$el.attr("class") || ""} ${
    $el.attr("placeholder") || ""
  } ${$el.attr("aria-label") || ""} ${hint}`.toLowerCase();
  if (tag === "textarea") return "textarea";
  if (inputType === "email") return "email";
  if (inputType === "tel") return "tel";
  if (inputType === "number") return "number";
  if (inputType === "date" || inputType === "datetime-local" || inputType === "month") return "date";
  if (inputType === "time") return "time";
  if (inputType === "url") return "url";
  if (href.startsWith("mailto:")) return "email";
  if (href.startsWith("tel:")) return "tel";
  if (/(e-?mail|correo)/.test(hay)) return "email";
  if (/(tel[eé]fono|phone|celular|m[oó]vil|whatsapp|\btel\b)/.test(hay)) return "tel";
  if (/(precio|price|monto|amount|costo|cost|valor|total|presupuesto)/.test(hay)) return "number";
  if (/(nacimiento|birth|\bfecha\b|\bdate\b)/.test(hay)) return "date";
  if (/(horario|\bhora\b|\btime\b)/.test(hay)) return "time";
  if (/(website|sitio|\burl\b|p[aá]gina|enlace)/.test(hay)) return "url";
  if (/(mensaje|message|comentario|consulta|descripci[oó]n|description|detalle)/.test(hay)) return "textarea";
  return "text";
}

const FA_STYLE_CLASSES = new Set([
  "fa", "fas", "far", "fal", "fat", "fad", "fab",
  "fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands", "fa-sharp",
]);

const FA_UTILITY_RE =
  /^fa-(fw|ul|li|border|pull-(left|right)|spin|spin-reverse|pulse|beat|fade|beat-fade|bounce|flip(-horizontal|-vertical|-both)?|rotate-(90|180|270|by)|stack(-1x|-2x)?|inverse|(?:[1-9]|10)x|xs|sm|lg)$/;

interface DetectedIcon {
  value: string;
  bi: boolean;
  brand: boolean;
  classes: string[];
}

/**
 * Detecta un icono de fuente (Bootstrap Icons o Font Awesome) en el atributo
 * `class` y devuelve el valor que entiende el `IconPicker` del editor.
 */
function detectIconClasses(classAttr: string): DetectedIcon | null {
  const tokens = String(classAttr || "").split(/\s+/).filter(Boolean);
  if (tokens.some((t) => t.includes(TOKEN_OPEN))) return null;
  const biIcon = tokens.find((c) => c.startsWith("bi-"));
  if (tokens.includes("bi") && biIcon) {
    return { value: biIcon, bi: true, brand: false, classes: [biIcon] };
  }
  const faStyle = tokens.find((c) => FA_STYLE_CLASSES.has(c));
  const faNames = tokens.filter(
    (c) => c.startsWith("fa-") && !FA_STYLE_CLASSES.has(c) && !FA_UTILITY_RE.test(c),
  );
  if (faStyle && faNames.length > 0) {
    return {
      value: [faStyle, ...faNames].join(" "),
      bi: false,
      brand: faStyle === "fab" || faStyle === "fa-brands",
      classes: [faStyle, ...faNames],
    };
  }
  return null;
}

const LEAD_FIELD_RULES: Array<{ field: string; re: RegExp }> = [
  { field: "email", re: /(e-?mail|correo)/i },
  { field: "phone", re: /(tel[eé]fono|phone|celular|m[oó]vil|whatsapp|contacto)/i },
  { field: "name", re: /(nombre|full[_ ]?name|apellido|\bname\b)/i },
  { field: "message", re: /(mensaje|message|comentario|consulta|detalle|descripci[oó]n)/i },
  { field: "subject", re: /(asunto|subject|motivo|servicio|inter[eé]s)/i },
  { field: "company", re: /(empresa|company|negocio|organizaci[oó]n)/i },
  { field: "website", re: /(sitio|website|\bweb\b|p[aá]gina)/i },
];

/** Mapea un control al campo de lead que espera la plataforma. */
function mapLeadField(
  name: string,
  id: string,
  type: string,
  placeholder: string,
  label: string,
): string {
  if (type === "email") return "email";
  if (type === "tel") return "phone";
  if (type === "textarea" && !name) return "message";
  const hay = `${name} ${id} ${placeholder} ${label}`.trim();
  for (const rule of LEAD_FIELD_RULES) {
    if (rule.re.test(hay)) return rule.field;
  }
  return "";
}

/** PNG/hero-1.png -> "Hero 1" (fallback para nombrar imágenes sin texto). */
function baseFromSrc(src: string): string {
  const clean = String(src || "").split(/[?#]/)[0];
  const file = clean.split("/").pop() || "";
  return file.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
}

/** Reemplaza el texto de un `<label>` (incluso dentro de spans) conservando iconos. */
function setLabelText($: cheerio.CheerioAPI, labelEl: any, token: string): void {
  const $label = $(labelEl);
  let replaced = false;
  const walk = (container: any) => {
    $(container)
      .contents()
      .each((_, node: any) => {
        if (node.type === "text" && String(node.data || "").trim()) {
          node.data = replaced ? " " : token;
          replaced = true;
        } else if (
          node.type === "tag" &&
          !/^(input|textarea|select|button|svg)$/i.test(String(node.tagName || ""))
        ) {
          walk(node);
        }
      });
  };
  walk(labelEl);
  if (!replaced) $label.prepend(token);
}

function normalizeSlug(input: string): string {
  return (
    String(input || "")
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "plantilla"
  );
}

function extOf(p: string): string {
  return p.split(".").pop()?.toLowerCase() || "";
}

function posixNormalize(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "");
}

function isExternalUrl(v: string): boolean {
  return /^(https?:|data:|mailto:|tel:|#|\/\/)/i.test(v || "");
}

function stripToken(value: string): string {
  if (value.startsWith(TOKEN_OPEN) && value.endsWith(TOKEN_CLOSE)) {
    return value.slice(TOKEN_OPEN.length, value.length - TOKEN_CLOSE.length);
  }
  return value;
}

function assetPathOf(src: string): string {
  const inner = stripToken(src);
  return inner.startsWith("asset:") ? inner.slice("asset:".length) : inner;
}

/**
 * Normaliza una ruta de asset a la clave con la que se guardó en el ZIP:
 * colapsa `.` y `..`, elimina segmentos iniciales `../` y la barra inicial.
 * Así `/assets/css/style.css`, `./assets/css/style.css` y
 * `../../assets/css/style.css` resuelven todos a `assets/css/style.css`.
 */
function normalizeStoreRef(p: string): string {
  let out = path.posix.normalize(String(p || "").replace(/\\/g, "/"));
  while (out.startsWith("../")) out = out.slice(3);
  return out.replace(/^\.\/+/, "").replace(/^\/+/, "");
}

function resolveStorePath(ref: string, baseDir: string): string {
  const clean = String(ref || "").trim().replace(/[?#].*$/, "");
  if (!clean) return "";
  const joined = /^\//.test(clean) ? clean : POSIX_JOIN(baseDir, clean);
  return normalizeStoreRef(joined);
}

@Injectable()
export class TemplatesImportService {
  constructor(private prisma: PrismaService) {}

  async importZip(file: Express.Multer.File, dto: ImportZipDto) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException("Se requiere un archivo ZIP");
    }
    const name = (dto.name || "").trim();
    if (!name) throw new BadRequestException("Se requiere un nombre para la plantilla");

    let zip: AdmZip;
    try {
      zip = new AdmZip(file.buffer);
    } catch {
      throw new BadRequestException("El archivo no es un ZIP válido");
    }

    const entries = zip.getEntries().filter((e) => !e.isDirectory);
    if (entries.length === 0) throw new BadRequestException("El ZIP está vacío");

    const htmlEntries = entries
      .filter((e) => e.entryName.toLowerCase().endsWith(".html"))
      .sort((a, b) => {
        const aName = (posixNormalize(a.entryName).split("/").pop() || "").toLowerCase();
        const bName = (posixNormalize(b.entryName).split("/").pop() || "").toLowerCase();
        if (aName === "index.html") return -1;
        if (bName === "index.html") return 1;
        return a.entryName.localeCompare(b.entryName);
      });
    if (htmlEntries.length === 0) {
      throw new BadRequestException("El ZIP debe contener al menos un archivo .html");
    }

    // ------ Directorio de assets ------
    const dryRun = Boolean(dto.dryRun);
    const slug = normalizeSlug(name);
    const storageRoot = path.join(this.configStoragePath(), "templates", slug);
    if (!dryRun) {
      fs.rmSync(storageRoot, { recursive: true, force: true });
      fs.mkdirSync(storageRoot, { recursive: true });

      // Copiar assets (todo lo que no sea html)
      for (const entry of entries) {
        const lower = entry.entryName.toLowerCase();
        if (lower.endsWith(".html")) continue;
        const assetName = posixNormalize(entry.entryName);
        if (!ASSET_EXT.has(extOf(assetName))) continue;
        const dest = path.join(storageRoot, assetName);
        const rel = path.relative(storageRoot, dest);
        if (rel.startsWith("..") || path.isAbsolute(rel)) continue;
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        try {
          fs.writeFileSync(dest, entry.getData());
        } catch {
          /* ignora entradas ilegibles */
        }
      }
    }

    const existsInZip = new Set(entries.map((e) => posixNormalize(e.entryName).toLowerCase()));
    const existsInZipFn = (p: string) => existsInZip.has(p.toLowerCase());
    const toUploadsUrl = (entryPosix: string) =>
      `/uploads/templates/${slug}/${posixNormalize(entryPosix)}`;

    // ------ CSS del zip (para inline + reescribir url()) ------
    const cssCache = new Map<string, string>();
    const cssCacheLower = new Map<string, string>();
    for (const entry of entries) {
      const lower = entry.entryName.toLowerCase();
      if (!lower.endsWith(".css")) continue;
      try {
        const content = decodeEntryData(entry.getData());
        const key = normalizeStoreRef(entry.entryName);
        cssCache.set(key, content);
        cssCacheLower.set(key.toLowerCase(), content);
      } catch {
        /* skip */
      }
    }
    const getCss = (ref: string): string | undefined =>
      cssCache.get(ref) || cssCacheLower.get(ref.toLowerCase());

    const cssCtx: CssAssetContext = {
      resolveRef: resolveStorePath,
      getCss,
      assetUrl: (ref: string) => `${TOKEN_OPEN}asset:${toUploadsUrl(ref)}${TOKEN_CLOSE}`,
    };

    // ------ Procesar cada página html ------
    const pagesResult: Array<{
      name: string;
      slug: string;
      path: string;
      isDefault: boolean;
      blocks: ExtractedBlock[];
      seoTitle: string;
      seoDesc: string;
      styles: PageGlobalStyle;
    }> = [];

    const limits: ImportLimits = { ...DEFAULT_IMPORT_LIMITS, ...(dto.limits || {}) };
    const pageReports: Array<{ path: string; blocks: number; stats: BlockStats }> = [];

    // Recursos externos detectados (fuentes, CDNs...) para reportarlos.
    const externalResources = new Set<string>();
    const trackExternal = (href: string) => {
      const v = String(href || "").trim();
      if (/^https?:\/\//i.test(v)) externalResources.add(v);
    };

    // Escribe un `.css` por bundle único (deduplicado por hash de contenido) y
    // devuelve sus rutas para referenciarlo con un solo `<link>` cacheable.
    const apiBase = this.apiBaseUrl();
    const cssFileCache = new Map<string, PageCssFileInfo>();
    const resolveTokensToAbs = (css: string) =>
      String(css || "").replace(/\{\{__ED::asset:([^{}]+)\}\}/g, (_m, ref: string) => {
        const rel = String(ref || "").trim();
        if (/^https?:\/\//i.test(rel)) return rel;
        return `${apiBase}${rel.startsWith("/") ? "" : "/"}${rel}`;
      });
    const writeCssFiles = (css: string, scopedCss: string): PageCssFileInfo | null => {
      if (!css.trim()) return null;
      const cssHash = this.hash8(css);
      const scopedCssHash = this.hash8(scopedCss);
      const cacheKey = `${cssHash}:${scopedCssHash}`;
      const cached = cssFileCache.get(cacheKey);
      if (cached) return cached;
      const rawName = `__page-${cssHash}.css`;
      const scopedName = `__page-${cssHash}.scoped.css`;
      const info: PageCssFileInfo = {
        cssPath: `/uploads/templates/${slug}/${rawName}`,
        scopedCssPath: `/uploads/templates/${slug}/${scopedName}`,
        cssHash,
        scopedCssHash,
      };
      if (!dryRun) {
        try {
          fs.writeFileSync(path.join(storageRoot, rawName), resolveTokensToAbs(css), "utf8");
          fs.writeFileSync(path.join(storageRoot, scopedName), resolveTokensToAbs(scopedCss), "utf8");
        } catch {
          return null;
        }
      }
      cssFileCache.set(cacheKey, info);
      return info;
    };

    // Detecta librerías JS (script src/inline + markup) para el reporte y para
    // generar un runtime vainilla que sustituya menús/carruseles/modales.
    let jsFeatures: TemplateJsFeatures = emptyTemplateJsFeatures();

    for (const entry of htmlEntries) {
      const entryPosix = posixNormalize(entry.entryName);
      const fileName = (entryPosix.split("/").pop() || "index.html").toLowerCase();
      let htmlRaw: string;
      try {
        htmlRaw = decodeEntryData(entry.getData());
      } catch {
        continue;
      }
      if (!htmlRaw.trim()) continue;

      jsFeatures = mergeTemplateJsFeatures(jsFeatures, detectTemplateJsFeatures(htmlRaw));

      const $ = cheerio.load(htmlRaw);
      this.sanitize($);

      const isDefault = fileName === "index.html";
      const base = (entryPosix.split("/").pop() || "").replace(/\.html$/i, "");
      const pageSlug = isDefault ? "home" : base;
      const pagePath = isDefault ? "/" : `/${base}`;

      const seoTitle = ($("title").first().text().trim() || name).slice(0, 160);
      const seoDesc = ($('meta[name="description"]').first().attr("content") || "").slice(0, 300);

      // CSS del head: se procesa con PostCSS (inlina @import locales y reescribe
      // url()) y se guarda aparte para publicarlo una sola vez en el <head>.
      const htmlDir = this.dirOf(entryPosix);
      const cssParts: string[] = [];
      const extHead: string[] = [];
      $("style").each((_, el) => {
        const raw = $(el).html() || "";
        if (raw.trim()) cssParts.push(buildCss(raw, htmlDir, cssCtx));
      });
      $("link").each((_, el) => {
        const rel = ($(el).attr("rel") || "").toLowerCase();
        if (!rel.split(/\s+/).includes("stylesheet")) return;
        const href = $(el).attr("href") || "";
        if (isExternalUrl(href)) {
          trackExternal(href);
          const tag = `<link rel="stylesheet" href="${escapeHtmlAttr(href)}">`;
          if (!extHead.includes(tag)) extHead.push(tag);
          return;
        }
        // Resuelve rutas relativas, `../` y absolutas (`/assets/...`) a la clave
        // con la que quedó guardado el CSS en el ZIP.
        const cssPath = resolveStorePath(href, htmlDir);
        const cached = cssPath ? getCss(cssPath) : undefined;
        if (cached) cssParts.push(buildCss(cached, this.dirOf(cssPath), cssCtx));
      });
      // `@import` externos (p. ej. Google Fonts) -> `<link>` en el head.
      const hoisted = hoistCssImports(cssParts.filter(Boolean).join("\n").trim());
      const { css: pageCss, links: externalLinks } = extractExternalImports(hoisted);
      for (const link of externalLinks) {
        const m = link.match(/href="([^"]+)"/);
        if (m) trackExternal(m[1]);
        if (!extHead.includes(link)) extHead.push(link);
      }
      const pageTheme = extractThemeVars(pageCss);
      const pageScopedCss = pageCss ? scopeCss(pageCss) : "";
      const extHeadHtml = extHead.join("\n");
      const cssFiles = writeCssFiles(pageCss, pageScopedCss);

      const htmlAttrs = this.collectAttrs($, "html");
      const bodyAttrs = this.collectAttrs($, "body");

      // Quitar styles/links css del body: ahora viven en globalStyles del template
      $("style").remove();
      $("link").each((_, el) => {
        const rel = ($(el).attr("rel") || "").toLowerCase();
        if (rel.split(/\s+/).includes("stylesheet")) $(el).remove();
      });

      // Reescribir assets del HTML
      this.rewriteHtmlAssets($, htmlDir, toUploadsUrl, existsInZipFn, pagePath);

      // Definir raíz de secciones
      let root = $("body").children();
      if (root.length === 1) {
        const only = root.first();
        if (only.find(">section, >div, >main, >header, >footer, >nav").length >= 2) {
          root = only.children();
        } else {
          const tag = String(only.prop("tagName") || "").toLowerCase();
          if (["section", "div", "main"].includes(tag) && only.children().length >= 1) {
            root = only.children();
          }
        }
      }

      const stats = emptyBlockStats();
      const topEls = root.toArray();
      const blocks: ExtractedBlock[] = [];
      topEls.forEach((el, idx) => {
        const block = this.buildBlock($, el, idx, limits, stats);
        if (block) blocks.push(block);
      });
      if (blocks.length === 0) {
        const block = this.buildBlock($, root.first(), 0, limits, stats);
        if (block) blocks.push(block);
      }
      pageReports.push({ path: pagePath, blocks: blocks.length, stats });

      pagesResult.push({
        name: seoTitle || name,
        slug: pageSlug,
        path: pagePath,
        isDefault,
        blocks,
        seoTitle,
        seoDesc,
        styles: {
          ...(cssFiles || { css: pageCss, scopedCss: pageScopedCss }),
          head: extHeadHtml,
          htmlAttrs,
          bodyAttrs,
          theme: pageTheme,
        },
      });
    }

    if (pagesResult.length === 0) {
      throw new BadRequestException("No se pudo procesar ningún archivo HTML del ZIP");
    }

    const totals = pageReports.reduce(
      (acc, p) => {
        for (const key of Object.keys(acc)) {
          (acc as any)[key] += (p.stats as any)[key] || 0;
        }
        return acc;
      },
      emptyBlockStats(),
    );

    // ------ Vista previa del mapeo (sin persistir ni escribir archivos) ------
    if (dryRun) {
      return {
        dryRun: true,
        name,
        slug,
        pages: pagesResult.map((p) => ({
          name: p.name,
          slug: p.slug,
          path: p.path,
          isDefault: p.isDefault,
          blocks: p.blocks.map((b) => ({
            type: b.type,
            fields: ((b.content.fieldSchema || []) as FieldSchemaItem[]).map((f) => ({
              key: f.key,
              label: f.label,
              type: f.type,
            })),
          })),
          css: p.styles.cssPath
            ? { mode: "file", cssPath: p.styles.cssPath, hash: p.styles.cssHash }
            : p.styles.css
              ? { mode: "inline" }
              : { mode: "none" },
          hasExternalHead: Boolean(p.styles.head),
        })),
        externalResources: Array.from(externalResources),
        js: {
          libraries: jsFeatures.libraries,
          unsupported: jsFeatures.unsupported,
          shims: jsFeatures.shims,
        },
        report: {
          limits,
          pages: pageReports,
          totals,
          discarded:
            totals.discardedTexts + totals.discardedImages + totals.discardedUrls > 0,
        },
      };
    }

    // ------ Persistir ------
    let categoryId: string | null = null;
    if (dto.categoryId) {
      const cat = await this.prisma.templateCategory.findUnique({ where: { id: dto.categoryId } });
      if (cat) categoryId = cat.id;
    }

    const template = await this.prisma.$transaction(async (tx) => {
      const runtimeScript = buildTemplateCompatScript(jsFeatures);
      const globalStyles = {
        version: 2,
        scopeClass: TEMPLATE_SCOPE_CLASS,
        external: Array.from(externalResources),
        pages: Object.fromEntries(pagesResult.map((p) => [p.path, p.styles])),
        runtime: {
          libraries: jsFeatures.libraries,
          unsupported: jsFeatures.unsupported,
          shims: jsFeatures.shims,
          script: runtimeScript,
        },
      };
      const created = await tx.template.create({
        data: {
          name,
          description: (dto.description || "Plantilla importada desde un archivo ZIP.").trim(),
          categoryId,
          isActive: true,
          isPremium: Boolean(dto.isPremium),
          tags: [slug, "zip"],
          globalStyles: globalStyles as any,
        },
        select: { id: true },
      });

      for (let i = 0; i < pagesResult.length; i++) {
        const page = pagesResult[i];
        const tp = await tx.templatePage.create({
          data: {
            templateId: created.id,
            name: page.name,
            slug: page.slug,
            path: page.path,
            isDefault: page.isDefault,
            seoTitle: page.seoTitle || undefined,
            seoDesc: page.seoDesc || undefined,
            sortOrder: i,
          },
          select: { id: true },
        });

        await tx.templateBlock.createMany({
          data: page.blocks.map((b, j) => ({
            templatePageId: tp.id,
            type: b.type,
            content: b.content as any,
            sortOrder: j,
          })),
        });
      }

      return created;
    });

    return {
      id: template.id,
      name,
      pages: pagesResult.length,
      blocks: pagesResult.reduce((n, p) => n + p.blocks.length, 0),
      assetsPath: `/uploads/templates/${slug}`,
      externalResources: Array.from(externalResources),
      js: {
        libraries: jsFeatures.libraries,
        unsupported: jsFeatures.unsupported,
        shims: jsFeatures.shims,
      },
      report: {
        limits,
        pages: pageReports,
        totals,
        discarded:
          totals.discardedTexts + totals.discardedImages + totals.discardedUrls > 0,
      },
    };
  }

  private configStoragePath(): string {
    return process.env.STORAGE_PATH || "./uploads";
  }

  private hash8(value: string): string {
    return createHash("sha1").update(String(value ?? ""), "utf8").digest("hex").slice(0, 8);
  }

  private apiBaseUrl(): string {
    const url = process.env.PUBLIC_API_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (url && !url.includes("localhost")) return url.replace(/\/+$/, "");
    return "https://plataforma-api-71743315793.us-central1.run.app";
  }

  private dirOf(entryPosix: string): string {
    const parts = entryPosix.split("/");
    parts.pop();
    return parts.join("/") || ".";
  }

  /**
   * Captura los atributos de `<html>` / `<body>` (class, id, style, data-*)
   * para reaplicarlos al publicar y en las vistas previas.
   */
  private collectAttrs($: cheerio.CheerioAPI, tag: "html" | "body"): Record<string, string> {
    const attribs: Record<string, string> = {};
    const el = $(tag).first().get(0) as any;
    const raw = el?.attribs || {};
    for (const [name, value] of Object.entries(raw)) {
      const key = String(name).toLowerCase();
      if (key.startsWith("on")) continue;
      if (value == null) continue;
      attribs[key] = String(value);
    }
    return attribs;
  }

  private sanitize($: cheerio.CheerioAPI): void {
    $("script").remove();
    $("iframe").remove();
    $("object").remove();
    $("embed").remove();
    $("*").each((_, el) => {
      const node = el as any;
      const attribs = node.attribs || {};
      for (const name of Object.keys(attribs)) {
        if (name.toLowerCase().startsWith("on")) delete node.attribs[name];
      }
      if (attribs.href && /^\s*javascript\s*:/i.test(attribs.href)) delete node.attribs["href"];
      if (attribs.src && /^\s*javascript\s*:/i.test(attribs.src)) delete node.attribs["src"];
      if (attribs.style && /expression\s*\(/i.test(attribs.style)) delete node.attribs["style"];
    });
  }

  private rewriteHtmlAssets(
    $: cheerio.CheerioAPI,
    htmlDir: string,
    toUploadsUrl: (p: string) => string,
    _existsInZip: (p: string) => boolean,
    pagePath: string
  ): void {
    const resolveRef = (ref: string): string | null => {
      const trimmed = (ref || "").trim();
      if (!trimmed || isExternalUrl(trimmed)) return null;
      const resolved = resolveStorePath(trimmed, htmlDir);
      return resolved || null;
    };
    const assetToken = (posix: string) => `${TOKEN_OPEN}asset:${toUploadsUrl(posix)}${TOKEN_CLOSE}`;

    const rewriteSrc = (value: string): string => {
      const posix = resolveRef(value);
      if (!posix) return value;
      return assetToken(posix);
    };
    const rewriteSrcset = (value: string): string =>
      String(value || "")
        .split(",")
        .map((part) => {
          const m = part.trim().match(/^(\S+)(\s+.*)?$/);
          if (!m) return part;
          return `${rewriteSrc(m[1])}${m[2] || ""}`;
        })
        .join(", ");

    $("img, source, video, audio").each((_, el) => {
      const tag = String(el.tagName || "").toLowerCase();
      if ($(el).attr("src")) $(el).attr("src", rewriteSrc($(el).attr("src") || ""));
      if (tag !== "img" && tag !== "source") return;
      const srcset = $(el).attr("srcset");
      if (srcset) $(el).attr("srcset", rewriteSrcset(srcset));
    });

    // `style="background-image:url(...)"`: reescribe los url() locales a tokens
    // para que no queden con rutas rotas.
    const styleCtx: CssAssetContext = {
      resolveRef: (ref: string) => resolveStorePath(ref, htmlDir),
      getCss: () => undefined,
      assetUrl: (posix: string) => assetToken(posix),
    };
    $("[style]").each((_, el) => {
      const style = $(el).attr("style") || "";
      if (!style || !/url\(/i.test(style)) return;
      const next = rewriteInlineUrls(style, htmlDir, styleCtx);
      if (next !== style) $(el).attr("style", next);
    });

    $("script[src], link[href]").each((_, el) => {
      const rel = ($(el).attr("rel") || "").toLowerCase();
      if (rel.split(/\s+/).includes("stylesheet")) return;
      const attr = el.tagName?.toLowerCase() === "script" ? "src" : "href";
      const current = $(el).attr(attr);
      if (!current) return;
      const posix = resolveRef(current);
      if (posix) $(el).attr(attr, assetToken(posix));
    });

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!href) return;
      const lower = href.toLowerCase();
      if (/^(https?:|mailto:|tel:|#|\/\/)/i.test(lower)) return;

      // Enlace interno entre páginas del zip
      if (lower.endsWith(".html")) {
        const targetName = (href.split("/").pop() || "index.html").toLowerCase();
        $(el).attr("href", targetName === "index.html" ? "/" : `/${targetName.replace(/\.html$/i, "")}`);
        return;
      }
      const posix = resolveRef(href);
      if (posix && ASSET_EXT.has(extOf(posix))) {
        $(el).attr("href", assetToken(posix));
      }
    });
  }

  private classifySection($: cheerio.CheerioAPI, el: any, index: number): string {
    const tag = String(el.tagName || "").toLowerCase();
    const $el = $(el);
    if (tag === "header" || tag === "nav") return "header";
    if (tag === "footer") return "footer";
    if ($el.find("form, input, textarea, select").length > 0) return "contact";
    if ($el.find("details").length >= 2 || $el.find("[data-accordion], .accordion, .accordion-item").length >= 2) return "faq";
    const group = this.findRepeatableGroup($, el);
    if (group) {
      const firstItem = $(group.parent).children().eq(0);
      const text = (firstItem.text() || "").toLowerCase();
      if (/\$\s?\d|price|precio|usd|€|£/i.test(text) && firstItem.find(".price, [class*=price]").length > 0) return "pricing";
      if (firstItem.find("img").length > 0) return "portfolio";
      if (firstItem.find("[class*=star], blockquote, [class*=quote], [class*=card]").length > 0 && $el.find("[class*=card]").length >= 3) return "testimonials";
      return "services";
    }
    if ($el.find("img").length >= 4) return "gallery";
    if ($el.find("h1").length > 0 && $el.find("img").length === 0) return "hero";
    if (index === 0 && $el.find("h1, h2").length > 0) return "hero";
    return "html";
  }

  private findRepeatableGroup($: cheerio.CheerioAPI, root: any): { parent: any; sig: string; count: number } | null {
    const sigOf = (el: any): string => {
      const elTag = String(el.tagName || "").toLowerCase();
      const classes = (el.attribs?.class || "").split(/\s+/).filter(Boolean).sort().join(".");
      const kids = $(el).children().toArray();
      const childStr = kids.map((k) => sigOf(k)).sort().join(",");
      const textLeaves = kids.filter((k: any) => {
        const t = String(k.tagName || "").toLowerCase();
        return SCALAR_TAGS.has(t) && $(k).children().length === 0;
      }).length;
      const imgCount = kids.filter((k: any) => String(k.tagName || "").toLowerCase() === "img").length;
      return `${elTag}.${classes}|${childStr}|t${textLeaves}i${imgCount}`;
    };

    const SKIP_TAGS = new Set(["ul", "ol", "nav", "header", "footer"]);
    const candidates: Array<{ parent: any; sig: string; count: number }> = [];
    const inspect = (el: any, depth: number) => {
      if (depth > 3) return;
      const children = $(el)
        .children()
        .toArray()
        .filter((c: any) => !SKIP_TAGS.has(String(c.tagName || "").toLowerCase()));
      if (children.length >= 2) {
        const counts = new Map<string, { sig: string; count: number }>();
        for (const child of children) {
          const sig = sigOf(child);
          const prev = counts.get(sig);
          if (prev) prev.count++;
          else counts.set(sig, { sig, count: 1 });
        }
        let best: { sig: string; count: number } | null = null;
        for (const v of counts.values()) {
          if (v.count >= 2 && (!best || v.count > best.count)) best = v;
        }
        if (best) candidates.push({ parent: el, sig: best.sig, count: best.count });
      }
      for (const child of children) {
        const ct = String(child.tagName || "").toLowerCase();
        if (SKIP_TAGS.has(ct)) continue;
        inspect(child, depth + 1);
      }
    };
    inspect(root, 0);
    candidates.sort((a, b) => b.count - a.count || 0);
    return candidates[0] || null;
  }

  private buildBlock(
    $: cheerio.CheerioAPI,
    el: any,
    index: number,
    limits: ImportLimits,
    stats: BlockStats,
  ): ExtractedBlock | null {
    const type = this.classifySection($, el, index);
    const isHeaderFooter = type === "header" || type === "footer";

    const $root = $(el).clone();
    const rootEl = $root.get(0) as any;
    if (!rootEl) return null;

    const values: Record<string, any> = {};
    const schema: FieldSchemaItem[] = [];
    const keyFor = makeKeyFactory();
    const token = (scope: string, idx: number, field: string) =>
      `${TOKEN_OPEN}${scope}::${idx}::${field}${TOKEN_CLOSE}`;
    const isToken = (t: string) => t.includes(TOKEN_OPEN);
    const ctx: BuildCtx = { $, values, schema, keyFor, token, stats, limits, isToken, isHeaderFooter };

    // Límites dinámicos: nunca truncar contenido realmente detectado, pero sí
    // frenar páginas patológicas o generadas (techo `hard`).
    const textLeaves = $root.find("*").toArray().filter((n: any) => {
      const t = String(n.tagName || "").toLowerCase();
      return SCALAR_TAGS.has(t) && $(n).children().length === 0 && ($(n).text() || "").trim().length >= 2;
    });
    const imgEls = $root.find("img").toArray().filter((img: any) => {
      const src = $(img).attr("src") || "";
      return !(isToken(src) && !src.startsWith(`${TOKEN_OPEN}asset:`));
    });
    const linkEls = $root.find("a[href]").toArray();
    const maxTexts = Math.min(Math.max(limits.texts, textLeaves.length), limits.hard);
    const maxImages = Math.min(Math.max(limits.images, imgEls.length), limits.hard);
    const maxUrls = Math.min(Math.max(limits.urls, linkEls.length), limits.hard);

    const group = this.findRepeatableGroup($, rootEl);

    // --- 1) Formularios como schema real mapeado a campos de lead ---
    this.processForms(ctx, $root);

    // --- 2) Menús de navegación editables (header/footer) ---
    if (isHeaderFooter) this.processNavs(ctx, $root);

    // --- 3) Listas (ul/ol) como arrays editables ---
    this.processLists(ctx, $root, group);

    // --- 4) Grupo repetible (tarjetas: servicios, precios, testimonios...) ---
    this.processGroup(ctx, group);

    // --- 5) URLs de enlaces accionables (internos, mailto:, tel:) ---
    // Se procesan antes que los textos para poder leer href/title/aria originales.
    let urlIdx = 0;
    $root.find("a[href]").each((_, node: any) => {
      const href = $(node).attr("href") || "";
      if (!href || isToken(href) || href.startsWith("#")) return;
      if (/^(https?:)?\/\//i.test(href) || /^(data|javascript):/i.test(href)) return;
      if (urlIdx >= maxUrls) {
        stats.discardedUrls++;
        return;
      }
      const base =
        semanticBaseName($, node, $root) || ($(node).text() || "").trim().slice(0, 24) || "enlace";
      const key = keyFor(`${base}_url`, `url${urlIdx + 1}`);
      const inferred = inferFieldType("a", $(node), $(node).text() || "");
      const fieldType = inferred === "text" ? "url" : inferred;
      values[key] = href;
      schema.push({ key, label: humanizeKey(base) || "URL del botón", type: fieldType });
      $(node).attr("href", `${TOKEN_OPEN}${key}${TOKEN_CLOSE}`);
      const title = $(node).attr("title");
      if (title != null && title.trim()) {
        const titleKey = keyFor(`${key}_title`, `${key}_title`);
        values[titleKey] = title;
        schema.push({ key: titleKey, label: "Título del enlace", type: "text" });
        $(node).attr("title", `${TOKEN_OPEN}${titleKey}${TOKEN_CLOSE}`);
      }
      const aria = $(node).attr("aria-label");
      if (aria != null && aria.trim()) {
        const ariaKey = keyFor(`${key}_aria`, `${key}_aria`);
        values[ariaKey] = aria;
        schema.push({ key: ariaKey, label: "Etiqueta accesible", type: "text" });
        $(node).attr("aria-label", `${TOKEN_OPEN}${ariaKey}${TOKEN_CLOSE}`);
      }
      urlIdx++;
      stats.urls++;
    });

    // --- 6) Textos escalares con nombres semánticos ---
    let scalarIdx = 0;
    $root.find("*").each((_, node: any) => {
      const ct = String(node.tagName || "").toLowerCase();
      if (!SCALAR_TAGS.has(ct)) return;
      if (isHeaderFooter && ct === "a" && $(node).parents("nav").length > 0) return;
      if ($(node).children().length > 0) return;
      const text = ($(node).text() || "").trim();
      if (text.length < 2) return;
      if (isToken(text)) return;
      if (scalarIdx >= maxTexts) {
        stats.discardedTexts++;
        return;
      }
      const isLink = ct === "a" || ct === "button";
      const base = semanticBaseName($, node, $root) || (isLink ? text : "");
      const fallback = isLink ? "boton" : `texto${scalarIdx + 1}`;
      const key = keyFor(base, fallback);
      const fieldType = isLink
        ? inferFieldType(ct, $(node), text)
        : ["p", "li", "blockquote", "cite", "figcaption"].includes(ct)
          ? "textarea"
          : "text";
      values[key] = text;
      schema.push({
        key,
        label: humanizeKey(base) || TAG_LABELS[ct] || "Texto",
        type: fieldType,
      });
      $(node).text(`${TOKEN_OPEN}${key}${TOKEN_CLOSE}`);
      if (isLink) {
        const title = $(node).attr("title");
        if (title != null && title.trim() && !isToken(title)) {
          const titleKey = keyFor(`${key}_title`, `${key}_title`);
          values[titleKey] = title;
          schema.push({ key: titleKey, label: "Título del enlace", type: "text" });
          $(node).attr("title", `${TOKEN_OPEN}${titleKey}${TOKEN_CLOSE}`);
        }
        const aria = $(node).attr("aria-label");
        if (aria != null && aria.trim() && !isToken(aria)) {
          const ariaKey = keyFor(`${key}_aria`, `${key}_aria`);
          values[ariaKey] = aria;
          schema.push({ key: ariaKey, label: "Etiqueta accesible", type: "text" });
          $(node).attr("aria-label", `${TOKEN_OPEN}${ariaKey}${TOKEN_CLOSE}`);
        }
      }
      scalarIdx++;
      stats.texts++;
    });

    // --- 7) Imágenes (src + alt + title editables) ---
    let imgIdx = 0;
    imgEls.forEach((img: any) => {
      const src = $(img).attr("src") || "";
      if (isToken(src) && !src.startsWith(`${TOKEN_OPEN}asset:`)) return;
      if (imgIdx >= maxImages) {
        stats.discardedImages++;
        return;
      }
      const base = semanticBaseName($, img, $root) || baseFromSrc(src) || "imagen";
      const key = keyFor(base, `imagen${imgIdx + 1}`);
      const nice = humanizeKey(base) || `Imagen ${imgIdx + 1}`;
      values[key] = assetPathOf(src);
      schema.push({ key, label: nice, type: "image" });
      $(img).attr("src", `${TOKEN_OPEN}${key}${TOKEN_CLOSE}`);
      const alt = $(img).attr("alt");
      if (alt != null) {
        const altKey = keyFor(`${key}_alt`, `${key}_alt`);
        values[altKey] = alt;
        schema.push({ key: altKey, label: `Texto alternativo (${nice})`, type: "text" });
        $(img).attr("alt", `${TOKEN_OPEN}${altKey}${TOKEN_CLOSE}`);
      }
      const title = $(img).attr("title");
      if (title != null && title.trim()) {
        const titleKey = keyFor(`${key}_title`, `${key}_title`);
        values[titleKey] = title;
        schema.push({ key: titleKey, label: `Título (${nice})`, type: "text" });
        $(img).attr("title", `${TOKEN_OPEN}${titleKey}${TOKEN_CLOSE}`);
      }
      imgIdx++;
      stats.images++;
    });

    // --- 8) Fondos/imágenes dentro de style="" expuestos como campos ---
    let bgIdx = 0;
    $root.find("[style]").add($root.filter("[style]")).each((_, node: any) => {
      const style = $(node).attr("style") || "";
      if (!style || !/url\(/i.test(style)) return;
      const { style: nextStyle, images } = extractInlineStyleImages(style, () =>
        keyFor("fondo", `fondo${++bgIdx}`),
      );
      if (images.length === 0) return;
      for (const img of images) {
        values[img.key] = img.path;
        schema.push({ key: img.key, label: "Imagen de fondo", type: "image" });
        stats.images++;
      }
      $(node).attr("style", nextStyle);
    });

    // --- 9) Iconos de fuente (Bootstrap Icons / Font Awesome) editables ---
    this.processIcons(ctx, $root);

    const html = $.html(rootEl);

    return {
      type,
      content: { variant: "raw-html", html, fieldSchema: schema, ...values },
    };
  }

  /**
   * Convierte `<i class="bi bi-star">` / `<i class="fa-solid fa-star">` en un
   * campo `icon` editable con el `IconPicker` del editor, preservando el resto
   * de clases (tamaños, colores). Los iconos de otras familias se dejan como
   * HTML avanzado pero se cuentan en el reporte.
   */
  private processIcons(ctx: BuildCtx, $root: any): void {
    const { $, values, schema, keyFor, stats } = ctx;
    stats.svgs += $root.find("svg").length;
    const els = $root.find("i, span").add($root.filter("i, span")).toArray();
    let idx = 0;
    for (const el of els) {
      if (el.type !== "tag") continue;
      const $el = $(el);
      const cls = $el.attr("class") || "";
      if (!cls || cls.includes(TOKEN_OPEN)) continue;
      const detected = detectIconClasses(cls);
      if (!detected) continue;
      const base = semanticBaseName($, el, $root) || "icono";
      const key = keyFor(base === "icono" ? "icono" : `${base}_icono`, `icono${idx + 1}`);
      const nice = humanizeKey(base);
      values[key] = detected.value;
      schema.push({
        key,
        label: nice && nice.toLowerCase() !== "icono" ? `Icono (${nice})` : "Icono",
        type: "icon",
        bi: detected.bi,
        brand: detected.brand,
      });
      const remaining = String(cls)
        .split(/\s+/)
        .filter((c) => c && !detected.classes.includes(c));
      $el.attr("class", [...remaining, `${TOKEN_OPEN}${key}${TOKEN_CLOSE}`].join(" "));
      idx++;
      stats.icons++;
    }
  }

  private processForms(ctx: BuildCtx, $root: any): void {
    const { $, values, schema, token, stats } = ctx;
    const forms = $root.find("form").add($root.filter("form"));
    if (!forms.length) return;
    const fields: Array<Record<string, any>> = [];
    forms.each((_, form: any) => {
      stats.forms++;
      $(form)
        .find("input, textarea, select")
        .each((__, ctrl: any) => {
          const tag = String(ctrl.tagName || "").toLowerCase();
          const inputType = ($(ctrl).attr("type") || "").toLowerCase();
          if (
            tag === "input" &&
            ["hidden", "submit", "reset", "button", "image", "file", "checkbox", "radio", "range", "color"].includes(
              inputType,
            )
          ) {
            return;
          }
          const existingName = ($(ctrl).attr("name") || "").trim();
          const id = ($(ctrl).attr("id") || "").trim();
          const placeholder = ($(ctrl).attr("placeholder") || "").trim();
          const label = controlLabelText($, ctrl, $root);
          const fieldType = inferFieldType(tag, $(ctrl), `${label} ${placeholder}`);
          const idx = fields.length;
          const leadField = mapLeadField(existingName, id, fieldType, placeholder, label);
          const name = leadField || slugKey(existingName) || `campo_${idx + 1}`;
          const fallbackLabel =
            fieldType === "email"
              ? "Email"
              : fieldType === "tel"
                ? "Teléfono"
                : fieldType === "textarea"
                  ? "Mensaje"
                  : humanizeKey(existingName) || `Campo ${idx + 1}`;
          fields.push({
            name,
            label: label || fallbackLabel,
            type: fieldType,
            placeholder: placeholder || label || "",
          });
          $(ctrl).attr("name", token("fields", idx, "name"));
          if ($(ctrl).attr("type") != null) $(ctrl).attr("type", token("fields", idx, "type"));
          if ($(ctrl).attr("placeholder") != null) {
            $(ctrl).attr("placeholder", token("fields", idx, "placeholder"));
          }
          const labelEl = this.findLabelElement($, ctrl, $root);
          if (labelEl) setLabelText($, labelEl, token("fields", idx, "label"));
          if ($(ctrl).attr("aria-label") != null) {
            $(ctrl).attr("aria-label", token("fields", idx, "label"));
          }
        });
    });
    if (!fields.length) return;
    values["fields"] = fields;
    schema.push({
      key: "fields",
      label: "Campos del formulario",
      type: "array",
      fields: [
        { key: "label", label: "Etiqueta", type: "text" },
        { key: "placeholder", label: "Texto de ayuda", type: "text" },
        {
          key: "type",
          label: "Tipo de campo",
          type: "select",
          options: [
            { label: "Texto", value: "text" },
            { label: "Email", value: "email" },
            { label: "Teléfono", value: "tel" },
            { label: "Número", value: "number" },
            { label: "Fecha", value: "date" },
            { label: "Hora", value: "time" },
            { label: "URL", value: "url" },
            { label: "Área de texto", value: "textarea" },
          ],
        },
        {
          key: "name",
          label: "Campo de lead",
          type: "select",
          options: [
            { label: "Nombre", value: "name" },
            { label: "Email", value: "email" },
            { label: "Teléfono", value: "phone" },
            { label: "Mensaje", value: "message" },
            { label: "Asunto", value: "subject" },
            { label: "Empresa", value: "company" },
            { label: "Sitio web", value: "website" },
          ],
        },
      ],
    });
  }

  private findLabelElement($: cheerio.CheerioAPI, ctrl: any, scope: any): any | null {
    const id = ($(ctrl).attr("id") || "").trim();
    if (id) {
      const byFor = scope
        .find("label[for]")
        .filter((_: any, l: any) => ($(l).attr("for") || "").trim() === id)
        .first();
      if (byFor.length) return byFor.get(0);
    }
    const wrap = $(ctrl).closest("label");
    if (wrap.length) return wrap.get(0);
    return null;
  }

  private processNavs(ctx: BuildCtx, $root: any): void {
    const { $, values, schema, keyFor, token, stats, limits } = ctx;
    const navs = $root.find("nav").add($root.filter("nav"));
    if (!navs.length) return;
    const menus: Array<{ key: string; items: Array<{ label: string; url: string }> }> = [];
    navs.each((_, nav: any) => {
      let anchors = $(nav).find("a[href]").toArray();
      if (anchors.length < 2) return;
      if (anchors.length > limits.navItems) anchors = anchors.slice(0, limits.navItems);
      const labels = anchors.map((a) => ($(a).text() || "").trim());
      let menu = menus.find(
        (m) => m.items.length === anchors.length && m.items.every((it, i) => it.label === labels[i]),
      );
      if (!menu) {
        menu = {
          key: keyFor("menu", `menu${menus.length + 1}`),
          items: anchors.map((a) => ({
            label: ($(a).text() || "").trim(),
            url: ($(a).attr("href") || "").trim() || "#",
          })),
        };
        menus.push(menu);
      }
      const menuKey = menu.key;
      anchors.forEach((a, i) => {
        $(a).text(token(menuKey, i, "label"));
        $(a).attr("href", token(menuKey, i, "url"));
      });
      stats.navs += anchors.length;
    });
    menus.forEach((menu, i) => {
      values[menu.key] = menu.items;
      schema.push({
        key: menu.key,
        label: menus.length > 1 ? `Menú de navegación ${i + 1}` : "Menú de navegación",
        type: "array",
        fields: [
          { key: "label", label: "Texto", type: "text" },
          { key: "url", label: "Enlace", type: "url" },
        ],
      });
    });
  }

  private processLists(
    ctx: BuildCtx,
    $root: any,
    group: { parent: any; sig: string; count: number } | null,
  ): void {
    const { $, values, schema, keyFor, token, stats, limits } = ctx;
    const lists = $root.find("ul, ol").add($root.filter("ul, ol")).toArray();
    if (!lists.length) return;
    const groupItems = group
      ? (Array.from(group.parent.children || []) as any[]).filter(
          (c: any) => c.type === "tag" && c.tagName === group.sig.split(".")[0],
        )
      : [];
    const insideGroup = (node: any) =>
      groupItems.some((it: any) => it !== node && $(it).find(node).length > 0);
    let listCount = 0;
    for (const listEl of lists) {
      const lis = $(listEl).children("li").toArray();
      if (lis.length < 2) continue;
      if ($(listEl).closest("nav, header, footer").length > 0) continue;
      if (insideGroup(listEl)) continue;
      stats.lists++;
      listCount++;
      const key = keyFor("lista", `lista${listCount}`);
      const items: Array<Record<string, any>> = [];
      lis.forEach((li: any, i: number) => {
        if (i >= limits.arrayItems) return;
        const $li = $(li);
        const links = $li.find("a[href]").toArray();
        const liText = ($li.text() || "").trim();
        if (links.length === 1) {
          const a = links[0];
          const aText = ($(a).text() || "").trim();
          if (liText.length <= aText.length + 4) {
            items.push({ label: aText, url: ($(a).attr("href") || "").trim() || "#" });
            $(a).text(token(key, i, "label"));
            $(a).attr("href", token(key, i, "url"));
            return;
          }
        }
        const heading = $li.find("h1,h2,h3,h4,h5,h6,strong,b").first();
        const desc = $li.find("p").first();
        const rec: Record<string, any> = {};
        if (heading.length && ($(heading).text() || "").trim()) {
          rec.titulo = ($(heading).text() || "").trim();
          $(heading).text(token(key, i, "titulo"));
        }
        const descEl: any = desc.length ? desc : $li.find("span").length ? $li.find("span").last() : null;
        if (descEl && ($(descEl).text() || "").trim()) {
          rec.descripcion = ($(descEl).text() || "").trim();
          $(descEl).text(token(key, i, "descripcion"));
        }
        if (Object.keys(rec).length === 0) {
          rec.texto = liText;
          $li.text(token(key, i, "texto"));
        }
        items.push(rec);
      });
      if (!items.length) continue;
      const keys: string[] = [];
      for (const it of items) {
        for (const k of Object.keys(it)) if (!keys.includes(k)) keys.push(k);
      }
      const fieldLabels: Record<string, string> = {
        texto: "Texto",
        titulo: "Título",
        descripcion: "Descripción",
        label: "Texto",
        url: "Enlace",
      };
      const fields: FieldSchemaItem[] = keys.map((k) => ({
        key: k,
        label: fieldLabels[k] || humanizeKey(k),
        type: k === "descripcion" ? "textarea" : k === "url" ? "url" : "text",
      }));
      values[key] = items;
      schema.push({ key, label: `Lista ${listCount}`, type: "array", fields });
    }
  }

  private processGroup(
    ctx: BuildCtx,
    group: { parent: any; sig: string; count: number } | null,
  ): void {
    if (!group) return;
    const { $, values, schema, isToken } = ctx;
    const firstTag = group.sig.split(".")[0];
    const selected: any[] = Array.from(group.parent.children || []).filter(
      (c: any) => c.type === "tag" && c.tagName === firstTag,
    );
    const itemVals: Array<Record<string, any>> = [];
    selected.forEach((item: any, i) => {
      const rec: Record<string, any> = {};
      let ti = 0;
      let di = 0;
      const leafs = $(item)
        .find("*")
        .toArray()
        .filter((n: any) => {
          const t = String(n.tagName || "").toLowerCase();
          return SCALAR_TAGS.has(t) && $(n).children().length === 0 && ($(n).text() || "").trim().length >= 1;
        });
      for (const leaf of leafs) {
        const ct = String(leaf.tagName || "").toLowerCase();
        const text = ($(leaf).text() || "").trim();
        if (!text || isToken(text)) continue;
        let field = "";
        if (HEADING_TAGS.has(ct)) {
          field = ti === 0 ? "titulo" : `titulo${ti + 1}`;
          ti++;
        } else if (ct === "a" || ct === "button") {
          field = "linkTexto";
        } else {
          di++;
          field = di === 1 ? "descripcion" : `descripcion${di}`;
        }
        rec[field] = text;
        $(leaf).text(`${TOKEN_OPEN}items::${i}::${field}${TOKEN_CLOSE}`);
      }
      const firstImg = $(item).find("img").first();
      if (firstImg.length) {
        const src = firstImg.attr("src") || "";
        if (!(isToken(src) && !src.startsWith(`${TOKEN_OPEN}asset:`))) {
          rec.imagen = assetPathOf(src);
          firstImg.attr("src", `${TOKEN_OPEN}items::${i}::imagen${TOKEN_CLOSE}`);
          const alt = firstImg.attr("alt");
          if (alt != null && alt.trim() && !isToken(alt)) {
            rec.imagenAlt = alt;
            firstImg.attr("alt", `${TOKEN_OPEN}items::${i}::imagenAlt${TOKEN_CLOSE}`);
          }
          const title = firstImg.attr("title");
          if (title != null && title.trim() && !isToken(title)) {
            rec.imagenTitle = title;
            firstImg.attr("title", `${TOKEN_OPEN}items::${i}::imagenTitle${TOKEN_CLOSE}`);
          }
        }
      }
      const firstHref = $(item).find("a[href]").first();
      const href = firstHref.attr("href");
      if (href && !href.startsWith("#") && !isToken(href)) {
        rec.url = href;
        firstHref.attr("href", `${TOKEN_OPEN}items::${i}::url${TOKEN_CLOSE}`);
      }
      itemVals.push(rec);
    });
    if (itemVals.length < 2) return;
    const sample = itemVals.reduce(
      (a, b) => (Object.keys(a).length >= Object.keys(b).length ? a : b),
      itemVals[0] || {},
    );
    const labels: Record<string, string> = {
      titulo: "Título",
      descripcion: "Descripción",
      linkTexto: "Texto del botón",
      url: "URL del botón",
      imagen: "Imagen",
      imagenAlt: "Texto alternativo de la imagen",
      imagenTitle: "Título de la imagen",
    };
    const fields: FieldSchemaItem[] = Object.keys(sample).map((k) => ({
      key: k,
      label: labels[k] || humanizeKey(k),
      type:
        k === "imagen"
          ? "image"
          : k === "url"
            ? "url"
            : k.startsWith("descripcion")
              ? "textarea"
              : "text",
    }));
    if (!fields.length) return;
    schema.push({ key: "items", label: "Items", type: "array", fields });
    values["items"] = itemVals;
  }
}