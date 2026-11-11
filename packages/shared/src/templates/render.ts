import { getPrestigeHtml } from "./prestige-variants";
import { getArtCulinaireHtml } from "./art-culinaire-variants";
import { getRodriplastHtml } from "./rodriplast-variants";
import { getIndigoHtml } from "./indigo-variants";
import { getDishoraHtml } from "./dishora-variants";
import { getGraduateHtml } from "./graduate-variants";
import { getUrbanNoirHtml } from "./urban-noir-variants";
import { getRawHtmlHtml } from "./raw-html-variants";
import { sanitizeTemplateContent } from "./sanitize";

type VariantRenderer = (type: string, c: any, apiBaseUrl?: string, site?: any) => string | null;

/** Registro único de variantes de plantilla. Agregar una plantilla nueva empieza aquí. */
export const TEMPLATE_VARIANT_RENDERERS: Record<string, VariantRenderer> = {
  prestige: getPrestigeHtml,
  "art-culinaire": getArtCulinaireHtml,
  rodriplast: getRodriplastHtml,
  indigo: getIndigoHtml,
  dishora: getDishoraHtml,
  graduate: getGraduateHtml,
  "urban-noir": getUrbanNoirHtml,
  "raw-html": getRawHtmlHtml,
};

/** Variantes con diseño propio (tema Material: colores y tipografías de la plantilla). */
export const THEMED_TEMPLATE_VARIANTS = ["prestige", "art-culinaire", "rodriplast", "indigo", "dishora", "graduate", "urban-noir"] as const;

export function isTemplateVariant(variant: unknown): boolean {
  return typeof variant === "string" && Object.prototype.hasOwnProperty.call(TEMPLATE_VARIANT_RENDERERS, variant);
}

/**
 * Dibuja un bloque con su variante de plantilla, con el contenido ya saneado.
 * Devuelve null si el bloque no usa una variante (o la variante no define ese tipo).
 * Es el único punto de entrada: lo usan tanto el editor como el sitio publicado.
 */
export function renderTemplateVariantHtml(type: string, content: any, apiBaseUrl?: string, site?: any): string | null {
  const variant = content?.variant;
  if (!isTemplateVariant(variant)) return null;
  const isRaw = variant === "raw-html";
  // raw-html ya escapa cada valor que sustituye; su `html` lo genera el importador de ZIP.
  const safe = sanitizeTemplateContent(content, isRaw ? { escapeHtml: false, skipKeys: ["html"] } : {});
  return TEMPLATE_VARIANT_RENDERERS[variant](type, safe, apiBaseUrl, site);
}
