"use client";

import { useEffect } from "react";
import {
  buildCapturedThemeOverrides,
  paletteCssVariables,
  type SitePalette,
} from "@/lib/site-palette";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1")
  .replace(/\/api\/v1\/?$/i, "")
  .replace(/\/+$/, "");

const ASSET_RE = /\{\{__ED::asset:([^{}]+)\}\}/g;

export const DEFAULT_TEMPLATE_SCOPE_CLASS = "ed-template-scope";

function normalizePath(p?: string): string {
  const clean = String(p || "/").split(/[?#]/)[0].replace(/\/+$/, "");
  return clean || "/";
}

export function resolveTemplatePageStyles(globalStyles: any, pagePath?: string): any | null {
  const pages = globalStyles && typeof globalStyles === "object" ? globalStyles.pages : null;
  if (!pages || typeof pages !== "object") return null;
  if (pagePath) {
    const key = normalizePath(pagePath);
    if (pages[key]) return pages[key];
  }
  return pages["/"] || pages[Object.keys(pages)[0]] || null;
}

export function templateScopeClass(globalStyles: any): string {
  const value = globalStyles && typeof globalStyles === "object" ? globalStyles.scopeClass : "";
  return typeof value === "string" && value.trim() ? value.trim() : DEFAULT_TEMPLATE_SCOPE_CLASS;
}

export function templateWrapperClass(globalStyles: any, pagePath?: string): string {
  const page = resolveTemplatePageStyles(globalStyles, pagePath);
  const bodyClass =
    page?.bodyAttrs && typeof page.bodyAttrs.class === "string" ? page.bodyAttrs.class : "";
  return [templateScopeClass(globalStyles), bodyClass].filter(Boolean).join(" ");
}

function resolveAssets(css: string): string {
  return String(css || "").replace(ASSET_RE, (_match, ref: string) => {
    const rel = String(ref || "").trim();
    if (/^https?:\/\//i.test(rel)) return rel;
    return `${API_ORIGIN}${rel}`;
  });
}

export interface TemplateThemeColors {
  primary?: string;
  secondary?: string;
}

export type { SitePalette };

/**
 * Traduce las variables de tema capturadas en la plantilla a overrides sobre el
 * contenedor con scope, para reflejar los colores editables del sitio.
 */
function buildThemeCss(
  pageTheme: any,
  globalStyles: any,
  palette?: SitePalette,
  explicitRoles?: string[],
): string {
  if (!palette) return "";
  if (!pageTheme || typeof pageTheme !== "object") return "";
  const scope = templateScopeClass(globalStyles);
  const overrides = buildCapturedThemeOverrides(
    pageTheme,
    palette,
    (explicitRoles as any) || [],
  );
  if (!overrides) return "";
  const decls = overrides.replace(/^:root\{|\}$/g, "");
  return decls ? `.${scope}{${decls}}` : "";
}

/**
 * Inyecta el runtime de compatibilidad JS de una plantilla importada (menús,
 * carruseles, modales...). Se agrega como `<script>` real porque
 * `dangerouslySetInnerHTML` no ejecuta scripts en las vistas previas de React.
 */
function TemplateRuntimeScript({ script }: { script: string }) {
  useEffect(() => {
    if (!script) return;
    const el = document.createElement("script");
    el.setAttribute("data-ed-template-runtime", "1");
    el.textContent = script;
    document.body.appendChild(el);
    return () => {
      el.remove();
    };
  }, [script]);
  return null;
}

/**
 * Inyecta el CSS de la plantilla importada (ya con scope) y sus hojas externas.
 * Prefiere el archivo `<link>` cacheable; cae al CSS inline para plantillas viejas.
 * El contenedor que envuelve los bloques debe llevar la clase de scope.
 */
export function TemplateGlobalStyles({
  globalStyles,
  pagePath,
  colors,
  palette,
}: {
  globalStyles: any;
  pagePath?: string;
  colors?: TemplateThemeColors;
  palette?: SitePalette;
}) {
  const page = resolveTemplatePageStyles(globalStyles, pagePath);
  if (!page) return null;
  const runtime =
    typeof globalStyles?.runtime?.script === "string" ? globalStyles.runtime.script : "";
  const head = typeof page.head === "string" ? page.head : "";
  const scopedCss =
    typeof page.scopedCss === "string" && page.scopedCss ? page.scopedCss : "";
  const cssFallback =
    !scopedCss && typeof page.css === "string" ? page.css : "";
  const href =
    typeof page.scopedCssPath === "string" && page.scopedCssPath
      ? `${API_ORIGIN}${page.scopedCssPath}${page.scopedCssHash ? `?h=${page.scopedCssHash}` : ""}`
      : "";
  const effectivePalette: SitePalette | undefined =
    palette || (colors?.primary || colors?.secondary
      ? {
          background: "#ffffff",
          surface: "#f8fafc",
          text: "#1e293b",
          accent: "#f59e0b",
          primary: colors?.primary || "#2563EB",
          secondary: colors?.secondary || "#1E40AF",
        }
      : undefined);
  const explicitRoles = palette
    ? (Object.keys(palette) as Array<keyof SitePalette>)
    : colors
      ? (["primary", "secondary"] as Array<keyof SitePalette>)
      : [];
  const themeCss = buildThemeCss(page.theme, globalStyles, effectivePalette, explicitRoles as string[]);
  const paletteCss = palette
    ? `:root{${paletteCssVariables(palette)}}`
    : "";
  if (!head && !href && !scopedCss && !cssFallback && !themeCss && !paletteCss && !runtime) return null;
  return (
    <>
      {runtime ? <TemplateRuntimeScript script={runtime} /> : null}
      {head ? <div dangerouslySetInnerHTML={{ __html: head }} /> : null}
      {href ? <link rel="stylesheet" href={href} /> : null}
      {scopedCss || cssFallback ? (
        <style dangerouslySetInnerHTML={{ __html: resolveAssets(scopedCss || cssFallback) }} />
      ) : null}
      {themeCss ? <style dangerouslySetInnerHTML={{ __html: themeCss }} /> : null}
      {paletteCss ? <style dangerouslySetInnerHTML={{ __html: paletteCss }} /> : null}
    </>
  );
}
