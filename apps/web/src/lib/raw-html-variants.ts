const TOKEN_RE = /\{\{__ED::([^{}]+)\}\}/g;

function escapeHtmlValue(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolvePath(content: any, path: string): unknown {
  const segs = path.split("::");
  let v: any = content;
  for (const seg of segs) {
    if (v == null) return undefined;
    v = v[seg];
  }
  return v;
}

function resolveMedia(v: unknown, apiBaseUrl?: string): string {
  if (v == null) return "";
  const s = String(v);
  if (s.startsWith("/uploads/")) return `${apiBaseUrl || ""}${s}`;
  return s;
}

/**
 * Renderiza bloques importados desde ZIP (variant "raw-html").
 * Sustituye placeholders {{__ED::...}} por el contenido editable actual.
 * - Campo normal:  {{__ED::title}}  /  {{__ED::items::0::titulo}}
 * - Asset local:   {{__ED::asset:/uploads/templates/<slug>/img.png}}
 *
 * Si se pasa `site` se inyecta el envío AJAX de leads ({ action + data-pub-form }).
 */
export function getRawHtmlHtml(type: string, content: any, apiBaseUrl?: string, site?: any): string | null {
  if (!content || content.variant !== "raw-html") return null;
  if (typeof content.html !== "string" || !content.html.trim()) return null;

  let html = content.html.replace(TOKEN_RE, (_match: string, path: string) => {
    if (path.startsWith("asset:")) {
      const rel = path.slice("asset:".length);
      if (/^https?:\/\//i.test(rel)) return rel;
      return `${apiBaseUrl || ""}${rel}`;
    }
    return escapeHtmlValue(resolveMedia(resolvePath(content, path), apiBaseUrl));
  });

  if (site?.tenantId && html.includes("<form")) {
    const actionUrl = `${apiBaseUrl || ""}/api/v1/leads/submit/${site.tenantId}`;
    // Elimina siteId previos (algunas plantillas traen uno) para no duplicarlos.
    html = html.replace(/<input\b[^>]*\bname\s*=\s*["']?siteId\b["']?[^>]*>/gi, "");
    html = html.replace(/<form\b([^>]*)>/gi, (_m: string, attrs: string) => {
      const actionMatch = /\baction\s*=\s*["']?([^"'\s>]*)/i.exec(attrs);
      const needsAction = !actionMatch || actionMatch[1] === "" || actionMatch[1] === "#";
      let nextAttrs = attrs;
      if (needsAction) {
        nextAttrs = actionMatch
          ? nextAttrs.replace(/\baction\s*=\s*["']?[^"'\s>]*["']?/i, `action="${actionUrl}"`)
          : ` action="${actionUrl}"` + nextAttrs;
      }
      if (!/\bmethod\s*=/i.test(nextAttrs)) nextAttrs += ` method="POST"`;
      if (!/\bdata-pub-form\b/.test(nextAttrs)) nextAttrs += ` data-pub-form`;
      const hidden =
        `<input type="hidden" name="siteId" value="${site?.id || ""}">` +
        `<div data-pub-form-status style="display:none;padding:12px 16px;border-radius:10px;font-size:.9rem;text-align:center;font-weight:600;margin-bottom:1rem"></div>`;
      return `<form${nextAttrs}>${hidden}`;
    });
  }

  return html;
}