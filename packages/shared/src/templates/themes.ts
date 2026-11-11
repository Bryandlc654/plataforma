/**
 * Tema de cada variante de plantilla (colores Material y tipografías) para el
 * config de Tailwind del sitio publicado. Antes estaba fijo en publishing.service.
 */

export type ThemeColors = Record<string, string>;
export type ThemeFonts = Record<string, string[]>;

export function getTemplateThemeColors(variant: string | undefined | null): ThemeColors {
  return variant === "rodriplast" ? {
    "rodri-primary": "#4fad33",
    "rodri-primary-dark": "#3d8f29",
    "rodri-primary-glow": "#4fad33",
    "rodri-accent": "#84cc16",
    "rodri-charcoal": "#0f172a",
    "rodri-charcoal-foreground": "#f8fafc",
    "rodri-muted": "#64748b",
    "rodri-muted-foreground": "#64748b",
    "rodri-foreground": "#0f172a",
    "rodri-background": "#ffffff",
    "rodri-card": "#ffffff",
    "rodri-secondary": "#f8fafc",
    "rodri-border": "#e2e8f0",
    "rodri-input": "#e2e8f0",
    "rodri-primary-foreground": "#ffffff",
  } : variant === "indigo" ? {
    "indigo-brand": "#fdcb0c",
    "indigo-dark": "#050505",
    "indigo-light": "#fcfcfc",
    "indigo-gray": "#999999",
    "on-primary": "#fdcb0c",
    "primary": "#fdcb0c",
    "tertiary-container": "#050505",
    "error-container": "#ffdad6",
    "on-error": "#ffffff",
    "surface-container-lowest": "#fcfcfc",
    "primary-fixed-dim": "#fdcb0c",
    "on-background": "#050505",
  } : variant === "art-culinaire" ? {
    "on-primary": "#ffffff",
    "tertiary-container": "#261900",
    "error-container": "#ffdad6",
    "on-error": "#ffffff",
    "surface-container-lowest": "#ffffff",
    "primary-fixed-dim": "#c8c6c5",
    "on-background": "#1b1c1c",
    "surface-dim": "#dbd9d9",
    "inverse-on-surface": "#f2f0f0",
    "surface": "#fbf9f8",
    "on-tertiary-fixed": "#261900",
    "background": "#fbf9f8",
    "surface-bright": "#fbf9f8",
    "tertiary-fixed-dim": "#e9c176",
    "surface-container-low": "#f5f3f3",
    "tertiary": "#000000",
    "on-secondary-fixed-variant": "#474744",
    "outline": "#747878",
    "surface-variant": "#e4e2e2",
    "surface-container": "#efeded",
    "on-primary-container": "#858383",
    "on-error-container": "#93000a",
    "primary-container": "#1c1b1b",
    "on-secondary-fixed": "#1b1c19",
    "on-tertiary-fixed-variant": "#5d4201",
    "on-surface": "#1b1c1c",
    "on-surface-variant": "#444748",
    "secondary": "#5e5e5b",
    "error": "#ba1a1a",
    "secondary-container": "#e1dfdb",
    "on-tertiary-container": "#a17f3b",
    "outline-variant": "#c4c7c7",
    "surface-container-highest": "#e4e2e2",
    "inverse-primary": "#c8c6c5",
    "on-tertiary": "#ffffff",
    "on-secondary": "#ffffff",
    "secondary-fixed-dim": "#c8c6c2",
    "on-primary-fixed-variant": "#474646",
    "surface-tint": "#5f5e5e",
    "secondary-fixed": "#e4e2dd",
    "on-primary-fixed": "#1c1b1b",
    "primary-fixed": "#e5e2e1",
    "inverse-surface": "#303030",
    "tertiary-fixed": "#ffdea5",
    "on-secondary-container": "#63635f",
    "surface-container-high": "#eae8e7",
    "primary": "#000000"
  } : {
    "on-primary": "#ffffff",
    "tertiary-container": "#820801",
    "error-container": "#ffdad6",
    "on-error": "#ffffff",
    "surface-container-lowest": "#ffffff",
    "primary-fixed-dim": "#bcc2ff",
    "on-background": "#131b2e",
    "surface-dim": "#d2d9f4",
    "inverse-on-surface": "#eef0ff",
    "surface": "#faf8ff",
    "on-tertiary-fixed": "#400100",
    "background": "#faf8ff",
    "surface-bright": "#faf8ff",
    "tertiary-fixed-dim": "#ffb4a7",
    "surface-container-low": "#f2f3ff",
    "tertiary": "#590300",
    "on-secondary-fixed-variant": "#574500",
    "outline": "#757687",
    "surface-variant": "#dae2fd",
    "surface-container": "#eaedff",
    "on-primary-container": "#98a3ff",
    "on-error-container": "#93000a",
    "primary-container": "#0020c2",
    "on-secondary-fixed": "#241a00",
    "on-tertiary-fixed-variant": "#8e1307",
    "on-surface": "#131b2e",
    "on-surface-variant": "#444655",
    "secondary": "#735c00",
    "error": "#ba1a1a",
    "secondary-container": "#fed65b",
    "on-tertiary-container": "#ff8875",
    "outline-variant": "#c5c5d8",
    "surface-container-highest": "#dae2fd",
    "inverse-primary": "#bcc2ff",
    "on-tertiary": "#ffffff",
    "on-secondary": "#ffffff",
    "secondary-fixed-dim": "#e9c349",
    "on-primary-fixed-variant": "#152dc9",
    "surface-tint": "#374be0",
    "secondary-fixed": "#ffe088",
    "on-primary-fixed": "#000b62",
    "primary-fixed": "#dfe0ff",
    "inverse-surface": "#283044",
    "tertiary-fixed": "#ffdad4",
    "on-secondary-container": "#745c00",
    "surface-container-high": "#e2e7ff",
    "primary": "#001387"
  };
}

export function getTemplateThemeFonts(variant: string | undefined | null): ThemeFonts {
  return variant === "rodriplast" ? {
    "display": ["Inter"],
    "headline-md": ["Inter"],
    "headline-lg": ["Inter"],
    "headline-lg-mobile": ["Inter"],
    "headline-display": ["Inter"],
    "body-md": ["Inter"],
    "body-lg": ["Inter"],
    "label-sm": ["Inter"]
  } : variant === "indigo" ? {
    "display": ["Poppins"],
    "headline-md": ["Poppins"],
    "headline-lg": ["Poppins"],
    "headline-lg-mobile": ["Poppins"],
    "headline-display": ["Poppins"],
    "body-md": ["Poppins"],
    "body-lg": ["Poppins"],
    "label-sm": ["Poppins"]
  } : variant === "art-culinaire" ? {
    "headline-md": ["Playfair Display"],
    "headline-lg": ["Playfair Display"],
    "headline-lg-mobile": ["Playfair Display"],
    "headline-display": ["Playfair Display"],
    "body-md": ["Montserrat"],
    "body-lg": ["Montserrat"],
    "label-sm": ["Montserrat"]
  } : variant === "dishora" ? {
    "headline-md": ["Playfair Display"],
    "headline-lg": ["Playfair Display"],
    "headline-lg-mobile": ["Playfair Display"],
    "headline-display": ["Playfair Display"],
    "display-lg": ["Playfair Display"],
    "display-lg-mobile": ["Playfair Display"],
    "body-md": ["Montserrat"],
    "body-lg": ["Montserrat"],
    "label-sm": ["Montserrat"],
    "sans": ["Plus Jakarta Sans", "Montserrat", "Inter"]
  } : {
    "headline-md": ["Inter"],
    "headline-lg": ["Inter"],
    "headline-lg-mobile": ["Inter"],
    "headline-display": ["Inter"],
    "display-lg-mobile": ["Inter"],
    "display-lg": ["Inter"],
    "body-md": ["Inter"],
    "body-lg": ["Inter"],
    "label-sm": ["Inter"]
  };
}

/** Clases extra del contenedor de la vista previa (editor y página de la plantilla) por variante. */
const TEMPLATE_CANVAS_CLASSES: Record<string, string> = {
  "art-culinaire": "theme-art-culinaire bg-background text-on-background font-body-md text-body-md",
};

export function templateCanvasClass(variant: string | undefined | null): string {
  return (variant && TEMPLATE_CANVAS_CLASSES[variant]) || "";
}
