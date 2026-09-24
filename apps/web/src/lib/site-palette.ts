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

export const PALETTE_LABELS: Record<PaletteRole, string> = {
  primary: "Primario",
  secondary: "Secundario",
  accent: "Acento",
  background: "Fondo",
  surface: "Superficie",
  text: "Texto",
};

export const PALETTE_PRESETS: Array<{ name: string; palette: SitePalette }> = [
  { name: "Océano", palette: { primary: "#2563eb", secondary: "#1e40af", accent: "#f59e0b", background: "#ffffff", surface: "#f8fafc", text: "#1e293b" } },
  { name: "Esmeralda", palette: { primary: "#10b981", secondary: "#047857", accent: "#f59e0b", background: "#ffffff", surface: "#f0fdf4", text: "#0f172a" } },
  { name: "Coral", palette: { primary: "#f43f5e", secondary: "#be123c", accent: "#fbbf24", background: "#ffffff", surface: "#fff1f2", text: "#1f2937" } },
  { name: "Violeta", palette: { primary: "#7c3aed", secondary: "#5b21b6", accent: "#f472b6", background: "#ffffff", surface: "#f5f3ff", text: "#1e1b4b" } },
  { name: "Nocturno", palette: { primary: "#fbbf24", secondary: "#f59e0b", accent: "#38bdf8", background: "#0f172a", surface: "#1e293b", text: "#f8fafc" } },
  { name: "Bosque", palette: { primary: "#4fad33", secondary: "#3d8f29", accent: "#84cc16", background: "#ffffff", surface: "#f1f5f9", text: "#0f172a" } },
];

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function isHex(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

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

export function hasExplicitPalette(settings: any): boolean {
  return explicitPaletteRoles(settings).length > 0;
}

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

export function applyPaletteToVariantHtml(
  html: string,
  variant: string | undefined,
  palette?: SitePalette,
): string {
  if (!html || !variant || !palette) return html;
  const seeds = VARIANT_COLOR_SEEDS[variant];
  if (!seeds) return html;
  let out = html;
  for (const [hex, role] of Object.entries(seeds)) {
    // Sin espacios: el valor puede ir dentro de clases arbitrarias de Tailwind.
    const replacement = `var(--site-${role},${hex})`;
    out = out.replace(new RegExp(`(?<![/\\w])${hex}`, "gi"), replacement);
  }
  return out;
}
