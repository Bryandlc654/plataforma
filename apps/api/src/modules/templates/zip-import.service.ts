import { Injectable, BadRequestException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import AdmZip = require("adm-zip");
import * as cheerio from "cheerio";
import { PrismaService } from "../../prisma/prisma.service";

export interface ImportZipDto {
  name?: string;
  description?: string;
  categoryId?: string;
  isPremium?: boolean;
}

interface FieldSchemaItem {
  key: string;
  label: string;
  type: string;
  fields?: FieldSchemaItem[];
}

interface ExtractedBlock {
  type: string;
  content: Record<string, any>;
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
    const slug = normalizeSlug(name);
    const storageRoot = path.join(this.configStoragePath(), "templates", slug);
    fs.rmSync(storageRoot, { recursive: true, force: true });
    fs.mkdirSync(storageRoot, { recursive: true });

    const existsInZip = new Set(entries.map((e) => posixNormalize(e.entryName).toLowerCase()));
    const existsInZipFn = (p: string) => existsInZip.has(p.toLowerCase());
    const toUploadsUrl = (entryPosix: string) =>
      `/uploads/templates/${slug}/${posixNormalize(entryPosix)}`;

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

    // ------ CSS del zip (para inline + reescribir url()) ------
    const cssCache = new Map<string, string>();
    for (const entry of entries) {
      const lower = entry.entryName.toLowerCase();
      if (!lower.endsWith(".css")) continue;
      try {
        cssCache.set(posixNormalize(entry.entryName), entry.getData().toString("utf8"));
      } catch {
        /* skip */
      }
    }

    const rewriteCss = (css: string): string => {
      return String(css || "")
        .replace(/expression\s*\([^)]*\)/gi, "none")
        .replace(/url\(\s*(["']?)(.*?)\1\s*\)/g, (m, quote, rawUrl: string) => {
          const trimmed = (rawUrl || "").trim();
          if (!trimmed || isExternalUrl(trimmed)) return `url(${quote}${trimmed}${quote})`;
          const resolved = /^\//.test(trimmed)
            ? posixNormalize(trimmed)
            : posixNormalize(trimmed);
          return `url(${quote}${TOKEN_OPEN}asset:${toUploadsUrl(resolved)}${TOKEN_CLOSE}${quote})`;
        });
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
    }> = [];

    for (const entry of htmlEntries) {
      const entryPosix = posixNormalize(entry.entryName);
      const fileName = (entryPosix.split("/").pop() || "index.html").toLowerCase();
      let htmlRaw: string;
      try {
        htmlRaw = entry.getData().toString("utf8") || "";
      } catch {
        continue;
      }
      if (!htmlRaw.trim()) continue;

      const $ = cheerio.load(htmlRaw);
      this.sanitize($);

      const isDefault = fileName === "index.html";
      const base = (entryPosix.split("/").pop() || "").replace(/\.html$/i, "");
      const pageSlug = isDefault ? "home" : base;
      const pagePath = isDefault ? "/" : `/${base}`;

      const seoTitle = ($("title").first().text().trim() || name).slice(0, 160);
      const seoDesc = ($('meta[name="description"]').first().attr("content") || "").slice(0, 300);

      // CSS inline del head
      const htmlDir = this.dirOf(entryPosix);
      const cssParts: string[] = [];
      $("style").each((_, el) => {
        const raw = $(el).html() || "";
        if (raw.trim()) cssParts.push(rewriteCss(raw));
      });
      $('link[rel="stylesheet"]').each((_, el) => {
        const href = $(el).attr("href") || "";
        if (isExternalUrl(href)) return;
        const cssPath = /^\//.test(href)
          ? posixNormalize(href)
          : posixNormalize(POSIX_JOIN(htmlDir, href));
        const cached = cssCache.get(cssPath);
        if (cached) cssParts.push(rewriteCss(cached));
      });
      const pageCss = cssParts.join("\n");

      // Quitar styles/links css del body (quedan inline en el primer bloque)
      $("style").remove();
      $('link[rel="stylesheet"]').remove();

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

      const topEls = root.toArray();
      const blocks: ExtractedBlock[] = [];
      topEls.forEach((el, idx) => {
        const block = this.buildBlock($, el, idx, { pageCss: idx === 0 ? pageCss : "" });
        if (block) blocks.push(block);
      });
      if (blocks.length === 0) {
        const block = this.buildBlock($, root.first(), 0, { pageCss });
        if (block) blocks.push(block);
      }

      pagesResult.push({
        name: seoTitle || name,
        slug: pageSlug,
        path: pagePath,
        isDefault,
        blocks,
        seoTitle,
        seoDesc,
      });
    }

    if (pagesResult.length === 0) {
      throw new BadRequestException("No se pudo procesar ningún archivo HTML del ZIP");
    }

    // ------ Persistir ------
    let categoryId: string | null = null;
    if (dto.categoryId) {
      const cat = await this.prisma.templateCategory.findUnique({ where: { id: dto.categoryId } });
      if (cat) categoryId = cat.id;
    }

    const template = await this.prisma.$transaction(async (tx) => {
      const created = await tx.template.create({
        data: {
          name,
          description: (dto.description || "Plantilla importada desde un archivo ZIP.").trim(),
          categoryId,
          isActive: true,
          isPremium: Boolean(dto.isPremium),
          tags: [slug, "zip"],
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
    };
  }

  private configStoragePath(): string {
    return process.env.STORAGE_PATH || "./uploads";
  }

  private dirOf(entryPosix: string): string {
    const parts = entryPosix.split("/");
    parts.pop();
    return parts.join("/") || ".";
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
      return /^\//.test(trimmed)
        ? posixNormalize(trimmed)
        : posixNormalize(POSIX_JOIN(htmlDir, trimmed));
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

    $("script[src], link[href]").each((_, el) => {
      const rel = ($(el).attr("rel") || "").toLowerCase();
      if (rel === "stylesheet") return;
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

    const candidates: Array<{ parent: any; sig: string; count: number }> = [];
    const inspect = (el: any, depth: number) => {
      if (depth > 3) return;
      const children = $(el).children().toArray();
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
        if (["header", "footer", "nav"].includes(ct)) continue;
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
    opts: { pageCss: string }
  ): ExtractedBlock | null {
    const type = this.classifySection($, el, index);
    const isHeaderFooter = type === "header" || type === "footer";

    const $root = $(el).clone();
    const rootEl = $root.get(0) as any;
    if (!rootEl) return null;

    const maxScalar = isHeaderFooter ? 6 : 12;
    const values: Record<string, any> = {};
    const schema: FieldSchemaItem[] = [];
    let scalarIdx = 0;
    let imgIdx = 0;
    let urlIdx = 0;

    const isToken = (t: string) => t.includes(TOKEN_OPEN);

    // --- 1) Grupo repetible (tarjetas: servicios, precios, testimonios, portafolio, equipo) ---
    const group = this.findRepeatableGroup($, rootEl);
    if (group) {
      // Solo los hermanos del tipo repetido (ignorando nodos de texto y títulos)
      const firstTag = group.sig.split(".")[0];
      const selected: any[] = Array.from(group.parent.children || []).filter(
        (c: any) => c.type === "tag" && c.tagName === firstTag
      );

      const itemVals: Array<Record<string, any>> = [];
      selected.forEach((item: any, i) => {
        const rec: Record<string, any> = {};
        let ti = 0;
        let di = 0;
        const leafs = $(item).find("*").toArray().filter((n: any) => {
          const t = String(n.tagName || "").toLowerCase();
          return SCALAR_TAGS.has(t) && $(n).children().length === 0 && ($(n).text() || "").trim().length >= 1;
        });
        for (const leaf of leafs) {
          const ct = String(leaf.tagName || "").toLowerCase();
          const text = ($(leaf).text() || "").trim();
          if (!text) continue;
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
        $(item).find("img").each((_, img) => {
          if (rec.imagen) return;
          const src = $(img).attr("src") || "";
          rec.imagen = assetPathOf(src);
          $(img).attr("src", `${TOKEN_OPEN}items::${i}::imagen${TOKEN_CLOSE}`);
        });
        const firstHref = $(item).find("a[href]").first();
        const href = firstHref.attr("href");
        if (href && !href.startsWith("#") && !isToken(href)) {
          rec.url = href;
          firstHref.attr("href", `${TOKEN_OPEN}items::${i}::url${TOKEN_CLOSE}`);
        }
        itemVals.push(rec);
      });

      if (itemVals.length >= 2) {
        const sample = itemVals.reduce((a, b) => (Object.keys(a).length >= Object.keys(b).length ? a : b), itemVals[0] || {});
        const labels: Record<string, string> = {
          titulo: "Título",
          descripcion: "Descripción",
          linkTexto: "Texto del botón",
          url: "URL del botón",
          imagen: "Imagen",
        };
        const fields: FieldSchemaItem[] = Object.keys(sample).map((k) => ({
          key: k,
          label: labels[k] || k,
          type: k === "imagen" ? "image" : k.startsWith("descripcion") ? "textarea" : "text",
        }));
        if (fields.length) {
          schema.push({ key: "items", label: "Items", type: "array", fields });
          values["items"] = itemVals;
        }
      }
    }

    // --- 2) Textos escalares ---
    $root.find("*").each((_, node: any) => {
      const ct = String(node.tagName || "").toLowerCase();
      if (!SCALAR_TAGS.has(ct)) return;
      if (isHeaderFooter && ct === "a" && $(node).parents("nav").length > 0) return;
      if ($(node).children().length > 0) return;
      const text = ($(node).text() || "").trim();
      if (text.length < 2) return;
      if (scalarIdx >= maxScalar) return;
      if (isToken(text)) return;

      const key = `t${scalarIdx}`;
      const labels: Record<string, string> = {
        h1: "Título principal",
        h2: "Título de sección",
        h3: "Subtítulo",
        h4: "Subtítulo 2",
        p: "Texto",
        a: "Texto del botón",
        button: "Texto del botón",
        li: "Ítem",
        span: "Texto",
        label: "Etiqueta",
        blockquote: "Cita",
        figcaption: "Pie de imagen",
        small: "Texto pequeño",
      };
      values[key] = text;
      schema.push({
        key,
        label: labels[ct] || "Texto",
        type: ["p", "li", "blockquote"].includes(ct) ? "textarea" : "text",
      });
      $(node).text(`${TOKEN_OPEN}${key}${TOKEN_CLOSE}`);
      scalarIdx++;
    });

    // --- 3) Imágenes ---
    $root.find("img").each((_, img) => {
      const src = $(img).attr("src") || "";
      if (isToken(src) && !src.startsWith(TOKEN_OPEN + "asset:")) return;
      if (imgIdx >= 8) return;
      const key = `img${imgIdx}`;
      values[key] = assetPathOf(src);
      schema.push({ key, label: `Imagen ${imgIdx + 1}`, type: "image" });
      $(img).attr("src", `${TOKEN_OPEN}${key}${TOKEN_CLOSE}`);
      imgIdx++;
    });

    // --- 4) URLs de botones/CTA ---
    if (!isHeaderFooter) {
      $root.find("a[href]").each((_, node) => {
        const href = $(node).attr("href") || "";
        if (!href || isToken(href) || href.startsWith("#") || isExternalUrl(href)) return;
        if (urlIdx >= 3) return;
        const key = `url${urlIdx}`;
        values[key] = href;
        schema.push({ key, label: "URL del botón", type: "url" });
        $(node).attr("href", `${TOKEN_OPEN}${key}${TOKEN_CLOSE}`);
        urlIdx++;
      });
    }

    let html = $.html(rootEl);
    if (opts.pageCss) html = `<style>${opts.pageCss}</style>\n${html}`;

    return {
      type,
      content: { variant: "raw-html", html, fieldSchema: schema, ...values },
    };
  }
}