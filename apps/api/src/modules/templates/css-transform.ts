import * as postcss from "postcss";
import * as valueParser from "postcss-value-parser";
import selectorParser = require("postcss-selector-parser");

export const CSS_TOKEN_OPEN = "{{__ED::";
export const CSS_TOKEN_CLOSE = "}}";
export const TEMPLATE_SCOPE_CLASS = "ed-template-scope";

export interface CssAssetContext {
  /** Resuelve una ruta relativa a la clave normalizada con la que se guardó en el ZIP. */
  resolveRef: (ref: string, baseDir: string) => string;
  /** Devuelve el CSS crudo de esa clave (para inlinear `@import` locales). */
  getCss: (ref: string) => string | undefined;
  /** Convierte una clave normalizada en el token de asset usado en el HTML publicado. */
  assetUrl: (ref: string) => string;
}

function isExternalUrl(v: string): boolean {
  return /^(https?:|data:|mailto:|tel:|#|\/\/)/i.test(v || "");
}

function dirOf(posixPath: string): string {
  const parts = String(posixPath || "").split("/");
  parts.pop();
  return parts.join("/") || ".";
}

interface ImportInfo {
  url: string;
  external: boolean;
  extra: string;
}

function parseImport(params: string): ImportInfo | null {
  const parsed = valueParser(params || "");
  const first = parsed.nodes[0];
  if (!first) return null;
  const extra = valueParser.stringify(parsed.nodes.slice(1)).trim();
  if (first.type === "string") {
    return { url: first.value, external: isExternalUrl(first.value), extra };
  }
  if (first.type === "function" && first.value.toLowerCase() === "url") {
    const arg = first.nodes[0];
    if (arg && (arg.type === "string" || arg.type === "word")) {
      return { url: arg.value, external: isExternalUrl(arg.value), extra };
    }
  }
  return null;
}

/**
 * Reescribe `url()` (y `image-set()`) usando postcss-value-parser, resolviendo
 * referencias locales a assets empaquetados en el ZIP. Exportada para poder
 * aplicarse también a atributos `style=""` (fondos inline).
 */
export function rewriteInlineUrls(value: string, baseDir: string, ctx: CssAssetContext): string {
  if (!value || value.indexOf("url") === -1) return value;
  let parsed: valueParser.ParsedValue;
  try {
    parsed = valueParser(value);
  } catch {
    return value;
  }
  let changed = false;
  parsed.walk((node) => {
    if (node.type !== "function") return;
    const name = node.value.toLowerCase();
    if (name === "url") {
      const arg = node.nodes[0];
      if (arg && (arg.type === "string" || arg.type === "word")) {
        const raw = (arg.value || "").trim();
        if (raw && !isExternalUrl(raw) && !raw.includes(CSS_TOKEN_OPEN)) {
          const resolved = ctx.resolveRef(raw, baseDir);
          if (resolved) {
            arg.value = ctx.assetUrl(resolved);
            changed = true;
          }
        }
      }
      return false;
    }
    if (name === "image-set" || name === "-webkit-image-set") {
      return;
    }
  });
  return changed ? parsed.toString() : value;
}

/**
 * Expande `@import` locales inlinando el CSS referenciado (con sus propias rutas
 * reescritas), evita duplicados y ciclos. Los `@import` externos se mantienen.
 */
function expandCss(css: string, baseDir: string, ctx: CssAssetContext, seen: Set<string>): string {
  let root: postcss.Root;
  try {
    root = postcss.parse(css || "");
  } catch {
    return css || "";
  }

  root.walkAtRules(/^import$/i, (atRule) => {
    const info = parseImport(atRule.params);
    if (!info || info.external) return;
    const resolved = ctx.resolveRef(info.url, baseDir);
    if (!resolved) return;
    const key = resolved.toLowerCase();
    if (seen.has(key)) {
      atRule.remove();
      return;
    }
    const raw = ctx.getCss(resolved);
    // Si el import trae media/supports/layer, no se inlina: se mantiene como
    // url() token para no perder el calificador.
    if (raw == null || info.extra) {
      atRule.params = `url("${ctx.assetUrl(resolved)}")${info.extra ? ` ${info.extra}` : ""}`;
      return;
    }
    seen.add(key);
    let childRoot: postcss.Root;
    try {
      childRoot = postcss.parse(expandCss(raw, dirOf(resolved), ctx, seen));
    } catch {
      atRule.remove();
      return;
    }
    atRule.replaceWith(...childRoot.nodes);
  });

  root.walkDecls((decl) => {
    const next = rewriteInlineUrls(decl.value, baseDir, ctx);
    if (next !== decl.value) decl.value = next;
  });

  return root.toString();
}

/**
 * Construye el CSS final de una hoja: inlinar imports locales + reescribir assets.
 * Devuelve null si no hay CSS utilizable.
 */
export function buildCss(raw: string, baseDir: string, ctx: CssAssetContext): string {
  const cleaned = String(raw || "").replace(/expression\s*\([^)]*\)/gi, "none");
  if (!cleaned.trim()) return "";
  const seen = new Set<string>();
  return expandCss(cleaned, baseDir, ctx, seen).trim();
}

function isRootTag(node: any): boolean {
  return node && node.type === "tag" && /^(html|body)$/i.test(node.value);
}

function isRootPseudo(node: any): boolean {
  return node && node.type === "pseudo" && node.value === ":root";
}

const ATTACHED_TYPES = new Set(["id", "class", "attribute", "pseudo"]);

/**
 * Aísla un selector dentro de `scope`:
 * - `html`, `body`, `:root` (y sus combinaciones) se mapean al contenedor scope,
 *   preservando clases/atributos/pseudos (`body.dark` -> `.scope.dark`).
 * - El resto se prefija con un combinador descendente (`.scope .card`).
 */
function scopeCompound(sel: any, scope: string): void {
  const nodes: any[] = sel.nodes || [];
  const extras: any[] = [];
  let i = 0;
  let sawRoot = false;

  while (i < nodes.length) {
    const node = nodes[i];
    if (isRootTag(node) || isRootPseudo(node)) {
      sawRoot = true;
      i++;
      while (i < nodes.length && ATTACHED_TYPES.has(nodes[i].type)) {
        extras.push(nodes[i]);
        i++;
      }
      const comb = nodes[i];
      const next = nodes[i + 1];
      if (
        comb &&
        comb.type === "combinator" &&
        String(comb.value).trim() === "" &&
        (isRootTag(next) || isRootPseudo(next))
      ) {
        i++;
        continue;
      }
      break;
    }
    break;
  }

  const scopeNode = selectorParser.className({ value: scope });
  if (sawRoot) {
    sel.nodes = [scopeNode, ...extras, ...nodes.slice(i)];
  } else if (nodes.length === 0) {
    sel.nodes = [scopeNode];
  } else {
    sel.nodes = [scopeNode, selectorParser.combinator({ value: " " }), ...nodes];
  }
}

function scopeSelector(selector: string, scope: string): string {
  try {
    const processor = selectorParser((root: any) => {
      root.each((sel: any) => scopeCompound(sel, scope));
    });
    return processor.processSync(selector);
  } catch {
    return selector;
  }
}

/**
 * Sube todos los `@import` al inicio del CSS combinado (el navegador ignora
 * los que aparecen después de otras reglas). Deduplica por contenido.
 */
export function hoistCssImports(css: string): string {
  if (!css || !css.trim()) return "";
  let root: postcss.Root;
  try {
    root = postcss.parse(css);
  } catch {
    return css;
  }
  const imports: postcss.AtRule[] = [];
  const seenParams = new Set<string>();
  root.walkAtRules(/^import$/i, (atRule) => {
    const key = atRule.params.trim();
    if (seenParams.has(key)) {
      atRule.remove();
      return;
    }
    seenParams.add(key);
    imports.push(atRule);
  });
  if (imports.length === 0) return css;
  for (const atRule of imports) atRule.remove();
  for (let i = imports.length - 1; i >= 0; i--) root.prepend(imports[i]);
  return root.toString();
}

/**
 * Aplica el scope a todos los selectores, sin tocar interiores de `@keyframes`
 * ni reglas de `@font-face`/`@page`.
 */
export function scopeCss(css: string, scope: string = TEMPLATE_SCOPE_CLASS): string {
  if (!css || !css.trim()) return "";
  let root: postcss.Root;
  try {
    root = postcss.parse(css);
  } catch {
    return css;
  }
  const transform = (container: postcss.Container) => {
    container.each((node: any) => {
      if (node.type === "rule") {
        node.selector = scopeSelector(node.selector, scope);
      } else if (node.type === "atrule" && node.nodes && !/keyframes$/i.test(node.name)) {
        transform(node as postcss.Container);
      }
    });
  };
  transform(root);
  return root.toString();
}

export function escapeHtmlAttr(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function externalHref(url: string): string | null {
  const v = String(url || "").trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (/^\/\//.test(v)) return `https:${v}`;
  return null;
}

/**
 * Convierte los `@import` externos (p. ej. Google Fonts) en `<link>` para que
 * el navegador los cargue en paralelo desde el `<head>` en lugar de bloquear
 * el render dentro del CSS. Devuelve el CSS sin esos imports y la lista de
 * `<link>` normalizada (deduplicada).
 */
export function extractExternalImports(css: string): { css: string; links: string[] } {
  if (!css || !css.trim()) return { css: css || "", links: [] };
  let root: postcss.Root;
  try {
    root = postcss.parse(css);
  } catch {
    return { css, links: [] };
  }
  const links: string[] = [];
  const seen = new Set<string>();
  root.walkAtRules(/^import$/i, (atRule) => {
    const info = parseImport(atRule.params);
    if (!info) return;
    const href = externalHref(info.url);
    if (!href) return;
    const mediaAttr = info.extra ? ` media="${escapeHtmlAttr(info.extra)}"` : "";
    const tag = `<link rel="stylesheet" href="${escapeHtmlAttr(href)}"${mediaAttr}>`;
    if (!seen.has(tag)) {
      seen.add(tag);
      links.push(tag);
    }
    atRule.remove();
  });
  return { css: root.toString(), links };
}

export interface TemplateTheme {
  primaryVar?: string;
  secondaryVar?: string;
  vars: Record<string, string>;
}

function pickThemeVar(names: string[], exact: RegExp, loose: RegExp): string | undefined {
  return names.find((n) => exact.test(n)) || names.find((n) => loose.test(n));
}

/**
 * Detecta variables de tema declaradas en `:root`/`html` para poder mapearlas
 * a los colores editables del sitio (marca) sin tocar el CSS.
 */
export function extractThemeVars(css: string): TemplateTheme {
  const vars: Record<string, string> = {};
  if (!css || !css.trim()) return { vars };
  let root: postcss.Root;
  try {
    root = postcss.parse(css);
  } catch {
    return { vars };
  }
  root.walkRules((rule) => {
    const selectors: string[] =
      (rule as any).selectors || [rule.selector];
    const onRoot = selectors.some((s) => /(^|,)\s*(:root|html|\*)\s*($|,)/i.test(s));
    if (!onRoot) return;
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith("--")) vars[decl.prop] = decl.value.trim();
    });
  });
  const names = Object.keys(vars);
  const primaryVar = pickThemeVar(
    names,
    /^--(primary|brand|main|accent)(-color|-colour)?$/i,
    /(primary|brand|main|accent)/i,
  );
  const secondaryVar = pickThemeVar(
    names,
    /^--(secondary)(-color|-colour)?$/i,
    /(secondary|accent-2|second)/i,
  );
  return {
    primaryVar,
    secondaryVar: secondaryVar && secondaryVar !== primaryVar ? secondaryVar : undefined,
    vars,
  };
}

export interface InlineStyleImage {
  key: string;
  path: string;
}

/**
 * Extrae los `url()` de un `style=""` que ya fueron tokenizados como assets y
 * los reemplaza por un token de campo editable (`{{__ED::bg0}}`), devolviendo
 * el mapa clave -> ruta para exponerlos como campos de imagen en el editor.
 */
export function extractInlineStyleImages(
  style: string,
  nextKey: () => string,
): { style: string; images: InlineStyleImage[] } {
  if (!style || style.indexOf(CSS_TOKEN_OPEN) === -1) return { style, images: [] };
  let parsed: valueParser.ParsedValue;
  try {
    parsed = valueParser(style);
  } catch {
    return { style, images: [] };
  }
  const images: InlineStyleImage[] = [];
  parsed.walk((node) => {
    if (node.type !== "function" || node.value.toLowerCase() !== "url") return;
    const arg = node.nodes[0];
    if (!arg || (arg.type !== "string" && arg.type !== "word")) return;
    const raw = (arg.value || "").trim();
    const prefix = `${CSS_TOKEN_OPEN}asset:`;
    if (!raw.startsWith(prefix)) return;
    const inner = raw.slice(prefix.length);
    const path = (inner.endsWith(CSS_TOKEN_CLOSE) ? inner.slice(0, -CSS_TOKEN_CLOSE.length) : inner).trim();
    if (!path) return;
    const key = nextKey();
    arg.value = `${CSS_TOKEN_OPEN}${key}${CSS_TOKEN_CLOSE}`;
    images.push({ key, path });
    return false;
  });
  return { style: images.length ? parsed.toString() : style, images };
}
