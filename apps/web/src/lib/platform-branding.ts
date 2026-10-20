export interface PlatformBranding {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export const DEFAULT_BRANDING: PlatformBranding = {
  logoUrl: null,
  primaryColor: "#201b51",
  secondaryColor: "#f29200",
};

const HEX = /^#[0-9a-fA-F]{6}$/;

function safeHex(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX.test(value) ? value.toLowerCase() : fallback;
}

function toRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mix(hex: string, target: string, amount: number): string {
  const a = toRgb(hex);
  const b = toRgb(target);
  return toHex([
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ]);
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastColor(hex: string): string {
  return luminance(hex) > 0.45 ? "#111827" : "#ffffff";
}

function readableOnWhite(hex: string): string {
  let candidate = hex;
  for (let i = 0; i < 6; i++) {
    const [r, g, b] = toRgb(candidate).map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    const ratio = 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
    if (ratio >= 4.5) return candidate;
    candidate = mix(candidate, "#000000", 0.14);
  }
  return candidate;
}

export function normalizeBranding(value: Partial<PlatformBranding> | null | undefined): PlatformBranding {
  return {
    logoUrl: typeof value?.logoUrl === "string" && value.logoUrl.trim() ? value.logoUrl.trim() : null,
    primaryColor: safeHex(value?.primaryColor, DEFAULT_BRANDING.primaryColor),
    secondaryColor: safeHex(value?.secondaryColor, DEFAULT_BRANDING.secondaryColor),
  };
}

export function brandingCssVars(branding: PlatformBranding): Record<string, string> {
  const primary = safeHex(branding.primaryColor, DEFAULT_BRANDING.primaryColor);
  const secondary = safeHex(branding.secondaryColor, DEFAULT_BRANDING.secondaryColor);
  const primaryRgb = toRgb(primary).join(", ");
  const secondaryRgb = toRgb(secondary).join(", ");

  const primaryShades: Record<string, string> = {
    50: mix(primary, "#ffffff", 0.95),
    100: mix(primary, "#ffffff", 0.9),
    200: mix(primary, "#ffffff", 0.75),
    300: mix(primary, "#ffffff", 0.55),
    400: mix(primary, "#ffffff", 0.3),
    500: primary,
    600: mix(primary, "#000000", 0.1),
    700: mix(primary, "#000000", 0.22),
    800: mix(primary, "#000000", 0.34),
    900: mix(primary, "#000000", 0.46),
    950: mix(primary, "#000000", 0.6),
  };

  const vars: Record<string, string> = {
    "--color-primary": primary,
    "--color-primary-default": primary,
    "--color-primary-rgb": primaryRgb,
    "--color-secondary": secondary,
    "--color-secondary-rgb": secondaryRgb,
    "--color-on-primary": contrastColor(primary),
    "--color-on-secondary": contrastColor(secondary),
    "--brand-primary-hover": mix(primary, "#000000", 0.15),
    "--brand-primary-darker": mix(primary, "#000000", 0.6),
    "--brand-secondary-hover": mix(secondary, "#000000", 0.12),
    "--brand-secondary-light": mix(secondary, "#ffffff", 0.1),
    "--brand-secondary-text": readableOnWhite(secondary),
  };

  for (const [shade, color] of Object.entries(primaryShades)) {
    vars[`--color-primary-${shade}`] = color;
  }

  return vars;
}

export function resolveBrandingLogo(url: string | null): string {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith("/uploads/")) {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    const origin = base.replace(/\/api\/v1\/?$/, "");
    return `${origin}${url}`;
  }
  return url;
}

export async function fetchPlatformBranding(): Promise<PlatformBranding> {
  const base = process.env.NEXT_PUBLIC_API_URL || "https://plataforma-api-rkav7vkxia-uc.a.run.app/api/v1";
  try {
    const res = await fetch(`${base}/platform/branding`, { cache: "no-store" });
    if (!res.ok) return DEFAULT_BRANDING;
    const payload: any = await res.json();
    return normalizeBranding(payload?.data || payload);
  } catch {
    return DEFAULT_BRANDING;
  }
}
