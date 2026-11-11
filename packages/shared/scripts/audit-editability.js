#!/usr/bin/env node
/**
 * Auditoría de "todo es editable": dibuja cada sección de cada plantilla con sus valores por
 * defecto y lista los textos visibles que NO salen de un campo de contenido (es decir, que
 * están fijos en el código y el editor no puede cambiar).
 *   node packages/shared/scripts/audit-editability.js [--json]
 * Requiere `npm run build -w packages/shared` antes.
 */
const shared = require("../dist");
const { TEMPLATE_SCHEMA, renderTemplateVariantHtml, renderGenericBlockHtml, sanitizeTemplateContent } = shared;

const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&times;/g, "×").replace(/&ldquo;|&rdquo;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const norm = (s) => decode(String(s)).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

function withDefaults(schema) {
  const c = {};
  for (const [k, f] of Object.entries(schema)) if (f.default !== undefined && f.default !== "") c[k] = JSON.parse(JSON.stringify(f.default));
  // Listas sin elementos por defecto: un elemento de ejemplo para que se dibujen.
  for (const [k, f] of Object.entries(schema)) {
    if (f.list && (!Array.isArray(c[k]) || c[k].length === 0) && f.items) {
      const item = {};
      for (const [ik, it] of Object.entries(f.items)) item[ik] = it.default !== undefined && it.default !== "" ? it.default : `Ejemplo ${ik}`;
      c[k] = [item];
    }
  }
  return c;
}

function contentTexts(node, out = new Set()) {
  if (typeof node === "string") { const n = norm(node); if (n) out.add(n); }
  else if (Array.isArray(node)) node.forEach((v) => contentTexts(v, out));
  else if (node && typeof node === "object") Object.values(node).forEach((v) => contentTexts(v, out));
  return out;
}

function visibleTexts(html) {
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    // Íconos de fuente (Material Symbols / Font Awesome): no son texto para el usuario.
    .replace(/<(span|i)[^>]*class="[^"]*(material-symbols|material-icons|bi |bi-|fa-|fa )[^"]*"[^>]*>[^<]*<\/\1>/gi, "");
  const texts = [];
  const re = />([^<>]+)</g;
  let m;
  while ((m = re.exec(clean))) {
    const t = norm(m[1]);
    // Solo textos con palabras (no símbolos como × o ·).
    if (t && /[a-záéíóúñ]{2}/i.test(t)) texts.push(t);
  }
  return texts;
}

const report = {};
let total = 0;
for (const [variant, types] of Object.entries(TEMPLATE_SCHEMA)) {
  for (const [type, schema] of Object.entries(types)) {
    // Su contenido lo gestiona otro módulo (Sorteos), no el editor.
    if (type === "sorteo-form") continue;
    const content = withDefaults(schema);
    let html = "";
    try {
      html = variant === "generic"
        ? renderGenericBlockHtml(type, sanitizeTemplateContent(content), { apiBaseUrl: "https://api.x", site: { id: "s", tenantId: "t", subdomain: "demo" } }) || ""
        : renderTemplateVariantHtml(type, { ...content, variant }, "https://api.x", { id: "s", tenantId: "t", subdomain: "demo" }) || "";
    } catch (e) { report[`${variant}/${type}`] = [`ERROR: ${e.message}`]; continue; }
    const editable = contentTexts(content);
    for (const f of Object.values(schema)) for (const it of Object.values(f.items || {})) contentTexts(it.default, editable);
    const clean = (t) => t.replace(/^["“”]+|["“”]+$/g, "").trim();
    const fixed = [...new Set(visibleTexts(html).map(clean).filter((t) => t && ![...editable].some((e) => e === t || e.includes(t) || t.includes(e))))];
    if (fixed.length) { report[`${variant}/${type}`] = fixed; total += fixed.length; }
  }
}
if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
else {
  for (const [k, v] of Object.entries(report)) console.log(`${k}: ${v.map((t) => JSON.stringify(t.slice(0, 50))).join(", ")}`);
  console.log(`\nTextos fijos (no editables): ${total} en ${Object.keys(report).length} secciones`);
}
