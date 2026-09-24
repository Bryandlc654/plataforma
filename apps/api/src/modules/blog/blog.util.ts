export interface BlogSettings {
  enabled: boolean;
  title: string;
  slug: string;
}

export function normalizeBlogSlug(input: unknown): string {
  return String(input || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Lee la configuración del blog desde `site.settings.blog`.
 * El blog es opt-in: solo se muestra si `enabled === true`.
 */
export function resolveBlogSettings(settings: any): BlogSettings {
  const raw =
    settings && typeof settings === "object" ? (settings as any).blog : null;
  const obj = raw && typeof raw === "object" ? raw : {};
  const slug = normalizeBlogSlug(obj.slug) || "blog";
  const title =
    typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : "Blog";
  return { enabled: obj.enabled === true, title, slug };
}
