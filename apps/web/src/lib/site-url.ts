/**
 * Dirección pública de un sitio:
 *  1. dominio propio (https://midominio.com)
 *  2. subdominio real (https://negocio.plataforma.com) si está definido NEXT_PUBLIC_SITE_BASE_DOMAIN
 *  3. si no, la ruta de la plataforma (https://plataforma.com/negocio)
 */
export function sitePublicUrl(site: { domain?: string | null; subdomain?: string | null }): string {
  if (site.domain) return `https://${site.domain}`;
  const base = (process.env.NEXT_PUBLIC_SITE_BASE_DOMAIN || "").trim().replace(/^\.+|\/+$/g, "");
  if (base && site.subdomain) return `https://${site.subdomain}.${base}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/${site.subdomain || ""}`;
}

/** Misma dirección sin el protocolo, para mostrarla en pantalla. */
export function siteDisplayUrl(site: { domain?: string | null; subdomain?: string | null }): string {
  return sitePublicUrl(site).replace(/^https?:\/\//, "");
}
