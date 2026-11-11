export interface SeoSiteLike {
  domain?: string | null;
  subdomain?: string | null;
}

export function publicBaseUrl(): string {
  const explicit =
    process.env.PUBLIC_SITE_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  const base = explicit && !/localhost/.test(explicit)
    ? explicit.replace(/\/+$/, "")
    : "https://build.icebergup.com";
  return base;
}

export function resolvePublicSiteUrl(site: SeoSiteLike): string {
  if (site?.domain) return `https://${site.domain}`;
  return `${publicBaseUrl()}/${site?.subdomain || ""}`;
}

export function normalizePublicPath(p: string): string {
  if (!p || p === "/") return "/";
  return `/${String(p).replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

export function escapeHtml(value: string | null | undefined): string {
  // No vuelve a escapar entidades válidas: el contenido de los bloques ya llega saneado.
  return (value || "")
    .replace(/&(?!(?:#\d{1,7}|#x[0-9a-fA-F]{1,6}|[A-Za-z][A-Za-z0-9]{1,31});)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
