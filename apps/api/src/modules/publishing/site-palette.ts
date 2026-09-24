export interface SitePalette {
  background: string;
  text: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
}

export type PaletteRole = keyof SitePalette;

export const DEFAULT_SITE_PALETTE: SitePalette = {
  background: "#ffffff",
  text: "#1e293b",
  surface: "#f8fafc",
  primary: "#2563EB",
  secondary: "#1E40AF",
  accent: "#f59e0b",
};

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function isHex(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

/** Normaliza una paleta guardada en `site.settings.palette` con fallbacks. */
export function resolveSitePalette(
  settings: any,
  fallbackPrimary?: string,
  fallbackSecondary?: string,
): SitePalette {
  const palette: SitePalette = { ...DEFAULT_SITE_PALETTE };
  if (isHex(fallbackPrimary)) palette.primary = fallbackPrimary.trim();
  if (isHex(fallbackSecondary)) palette.secondary = fallbackSecondary.trim();

  const raw = settings && typeof settings === "object" ? settings.palette : null;
  if (raw && typeof raw === "object") {
    (Object.keys(palette) as PaletteRole[]).forEach((role) => {
      if (isHex(raw[role])) palette[role] = String(raw[role]).trim();
    });
  }
  return palette;
}

/** Indica si el sitio tiene una paleta configurada explícitamente. */
export function hasExplicitPalette(settings: any): boolean {
  return explicitPaletteRoles(settings).length > 0;
}

/** Roles de la paleta que el usuario definió explícitamente. */
export function explicitPaletteRoles(settings: any): PaletteRole[] {
  const raw = settings && typeof settings === "object" ? settings.palette : null;
  if (!raw || typeof raw !== "object") return [];
  return (Object.keys(DEFAULT_SITE_PALETTE) as PaletteRole[]).filter((role) =>
    isHex(raw[role]),
  );
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
}

/** Devuelve un color de texto legible sobre el color dado. */
export function contrastColor(hex: string, dark = "#0f172a", light = "#ffffff"): string {
  const rgb = parseHex(hex);
  if (!rgb) return light;
  const luminance = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return luminance > 150 ? dark : light;
}

export function paletteCssVariables(palette: SitePalette): string {
  return [
    `--site-background:${palette.background}`,
    `--site-text:${palette.text}`,
    `--site-surface:${palette.surface}`,
    `--site-primary:${palette.primary}`,
    `--site-secondary:${palette.secondary}`,
    `--site-accent:${palette.accent}`,
  ].join(";");
}

/** Clasifica el nombre de una variable CSS capturada de una plantilla. */
function classifyVarName(name: string): PaletteRole | null {
  const n = name.toLowerCase();
  if (/(foreground|on-[a-z]+|contrast|inverse)/.test(n)) return null;
  if (/(primary|brand|main)/.test(n)) return "primary";
  if (/(secondary)/.test(n)) return "secondary";
  if (/(accent|tertiary)/.test(n)) return "accent";
  if (/(background|bg)/.test(n)) return "background";
  if (/(surface|card|panel|paper)/.test(n)) return "surface";
  if (/(text|body|muted)/.test(n)) return "text";
  return null;
}

/**
 * Variables de tema capturadas al importar una plantilla (`page.theme.vars`),
 * reclasificadas por rol de la paleta global.
 */
export function buildCapturedThemeOverrides(
  theme: any,
  palette: SitePalette,
  explicitRoles: PaletteRole[] = [],
): string {
  if (!theme || typeof theme !== "object") return "";
  const decls: string[] = [];
  const allowed = new Set<PaletteRole>(explicitRoles);

  const vars: Record<string, string> =
    theme.vars && typeof theme.vars === "object" ? theme.vars : {};

  for (const [name, value] of Object.entries(vars)) {
    if (!name.startsWith("--") || typeof value !== "string") continue;
    const role = classifyVarName(name);
    if (role && palette[role] && allowed.has(role)) {
      decls.push(`${name}:${palette[role]}`);
    }
  }

  const applyDefaults = explicitRoles.length === 0;
  if (
    typeof theme.primaryVar === "string" &&
    theme.primaryVar &&
    (applyDefaults || allowed.has("primary"))
  ) {
    decls.push(`${theme.primaryVar}:${palette.primary}`);
  }
  if (
    typeof theme.secondaryVar === "string" &&
    theme.secondaryVar &&
    theme.secondaryVar !== theme.primaryVar &&
    (applyDefaults || allowed.has("secondary"))
  ) {
    decls.push(`${theme.secondaryVar}:${palette.secondary}`);
  }

  const unique = Array.from(new Set(decls));
  return unique.length ? `:root{${unique.join(";")}}` : "";
}

type VariantKeyRoles = Partial<Record<PaletteRole, string[]>>;

const MATERIAL_KEY_ROLES: VariantKeyRoles = {
  primary: ["primary"],
  secondary: ["secondary"],
  accent: ["tertiary"],
  background: ["background"],
  surface: ["surface"],
  text: ["on-background", "on-surface", "foreground"],
};

const VARIANT_KEY_ROLES: Record<string, VariantKeyRoles> = {
  rodriplast: {
    primary: ["rodri-primary", "rodri-primary-glow"],
    accent: ["rodri-accent"],
    background: ["rodri-background"],
    surface: ["rodri-card", "rodri-secondary"],
    text: ["rodri-foreground"],
  },
  indigo: MATERIAL_KEY_ROLES,
  "art-culinaire": MATERIAL_KEY_ROLES,
  dishora: MATERIAL_KEY_ROLES,
  graduate: MATERIAL_KEY_ROLES,
  prestige: MATERIAL_KEY_ROLES,
  "urban-noir": MATERIAL_KEY_ROLES,
  default: MATERIAL_KEY_ROLES,
};

/** Mapea el color semilla de marca (`rodri-charcoal`) al rol elegido por el usuario. */
const VARIANT_SECONDARY_ALIASES: Record<string, string> = {
  rodriplast: "rodri-charcoal",
};

/**
 * Reasigna los tokens de color del objeto `themeColors` (tailwind.config) según
 * la paleta global del sitio. Solo se sobrescriben los roles definidos
 * explícitamente por el usuario, de modo que las plantillas conservan su
 * identidad original salvo los colores que se hayan personalizado.
 */
export function applyPaletteToThemeColors(
  base: Record<string, string | undefined> | null | undefined,
  variant: string | undefined,
  palette: SitePalette,
  explicitRoles: PaletteRole[] = [],
): Record<string, string | undefined> | null {
  if (!base || typeof base !== "object") return base || null;
  const roles = VARIANT_KEY_ROLES[variant || "default"] || MATERIAL_KEY_ROLES;
  const next: Record<string, string | undefined> = { ...base };
  const allowed = new Set<PaletteRole>(explicitRoles);

  if (allowed.size === 0) return next;

  allowed.forEach((role) => {
    const keys = roles[role] || [];
    keys.forEach((key) => {
      if (key in next) next[key] = palette[role];
    });
    const alias = VARIANT_SECONDARY_ALIASES[variant || ""];
    if (role === "secondary" && alias && alias in next) {
      next[alias] = palette.secondary;
    }
  });

  // Contraste para texto sobre fondos de marca (variantes material).
  if (allowed.has("primary") && "on-primary" in next) {
    next["on-primary"] = contrastColor(palette.primary);
  }
  if (allowed.has("secondary") && "on-secondary" in next) {
    next["on-secondary"] = contrastColor(palette.secondary);
  }
  if (allowed.has("accent") && "on-tertiary" in next) {
    next["on-tertiary"] = contrastColor(palette.accent);
  }

  return next;
}

const VARIANT_COLOR_SEEDS: Record<string, Record<string, PaletteRole>> = {
  indigo: { "#fdcb0c": "primary" },
  graduate: {
    "#2d2e81": "primary",
    "#23246b": "primary",
    "#fa7202": "secondary",
    "#e86602": "secondary",
    "#21b1fe": "accent",
    "#58a83a": "accent",
    "#68bd49": "accent",
    "#7dd958": "accent",
  },
  dishora: {
    "#e64a19": "primary",
    "#d44424": "primary",
    "#d3411b": "primary",
    "#d0451b": "primary",
    "#df4622": "primary",
    "#de4b26": "primary",
    "#da370d": "primary",
    "#c43009": "primary",
    "#d96b4c": "primary",
    "#b83b14": "primary",
  },
  rodriplast: {
    "#4fad33": "primary",
    "#3d8f29": "primary",
    "#84cc16": "accent",
  },
};

/**
 * Reemplaza los colores de marca incrustados en el HTML de una variante por las
 * variables globales de la paleta del sitio (con fallback al color original).
 */
export function applyPaletteToVariantHtml(
  html: string,
  variant: string | undefined,
  palette: SitePalette,
): string {
  if (!html || !variant) return html;
  const seeds = VARIANT_COLOR_SEEDS[variant];
  if (!seeds) return html;
  let out = html;
  for (const [hex, role] of Object.entries(seeds)) {
    // Sin espacios: el valor puede ir dentro de clases arbitrarias de Tailwind.
    const replacement = `var(--site-${role},${hex})`;
    // No reemplazar dentro de URLs (p. ej. placehold.co/...#hex)
    out = out.replace(new RegExp(`(?<![/\\w])${hex}`, "gi"), replacement);
  }
  return out;
}
