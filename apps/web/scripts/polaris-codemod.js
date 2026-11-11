#!/usr/bin/env node
/**
 * Migra las clases de Tailwind del panel a la paleta del admin de Shopify (Polaris):
 * grises slate → grises neutros de Shopify, tarjetas con borde → tarjetas con sombra sutil,
 * títulos de página más compactos. Solo toca archivos del panel (no plantillas ni lienzo).
 *   node apps/web/scripts/polaris-codemod.js [--dry]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../src");
const TARGETS = [
  "app/dashboard",
  "components/dashboard",
  "components/admin",
  "components/media",
  "components/media-picker.tsx",
  "components/kb",
  "components/providers/confirm-provider.tsx",
  "components/ui/skeleton.tsx",
  // Paneles del editor (no el lienzo ni las plantillas).
  "components/editor/site-settings-panel.tsx",
  "components/editor/section-picker.tsx",
  "components/editor/domain-search-modal.tsx",
  "components/editor/editor-tour.tsx",
  "components/editor/site-editor.tsx",
  "app/dashboard/sites/new/page.tsx",
];
// El editor y el lienzo ya tienen su propio estilo; las plantillas no se tocan.
const SKIP = [/app\/dashboard\/sites\/\[siteId\]\/page\.tsx$/];

const MAP = {
  text: { 950: "#303030", 900: "#303030", 800: "#303030", 700: "#303030", 600: "#616161", 500: "#616161", 400: "#8a8a8a", 300: "#b5b5b5", 200: "#d4d4d4" },
  bg: { 50: "#f7f7f7", 100: "#f1f1f1", 200: "#e3e3e3", 300: "#d4d4d4", 700: "#303030", 800: "#303030", 900: "#1a1a1a" },
  border: { 50: "#ebebeb", 100: "#ebebeb", 200: "#e3e3e3", 300: "#d4d4d4", 400: "#b5b5b5" },
  divide: { 50: "#ebebeb", 100: "#ebebeb", 200: "#e3e3e3" },
  ring: { 100: "#ebebeb", 200: "#e3e3e3", 300: "#d4d4d4" },
  placeholder: { 300: "#b5b5b5", 400: "#8a8a8a", 500: "#8a8a8a" },
  from: { 50: "#f7f7f7", 100: "#f1f1f1" },
  to: { 50: "#f7f7f7", 100: "#f1f1f1" },
};
const CARD_SHADOW = "shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)]";

function files(target) {
  const full = path.join(ROOT, target);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [full];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((d) => files(path.join(target, d.name)));
}

function migrate(src) {
  let out = src.replace(
    /(?<=[\s"'`:{])(text|bg|border|divide|ring|placeholder|from|to)-slate-(\d{2,3})(\/\d{1,3})?(?=[\s"'`}])/g,
    (m, prefix, shade, alpha) => {
      const hex = MAP[prefix]?.[shade];
      return hex ? `${prefix}-[${hex}]${alpha || ""}` : m;
    },
  );
  // Tarjetas blancas con borde gris → tarjeta con sombra sutil (como Polaris).
  out = out.replace(/(className=(?:"|\{`))([^"`]*)("|`\})/g, (m, open, cls, close) => {
    if (!/\bbg-white\b/.test(cls) || !/\brounded-(xl|2xl|lg)\b/.test(cls) || !/\bborder border-\[#e3e3e3\]/.test(cls)) return m;
    const next = cls.replace(/\bborder border-\[#e3e3e3\]/, CARD_SHADOW).replace(/\brounded-2xl\b/, "rounded-xl");
    return `${open}${next}${close}`;
  });
  // Títulos de página: text-2xl/3xl font-bold → text-xl (Polaris).
  out = out.replace(/<h1 className="([^"]*)\btext-(2xl|3xl)\b([^"]*)"/g, (m, a, _size, b) => `<h1 className="${a}text-xl${b}"`);
  // Contenedores de página con fondo propio: el fondo gris lo pone el layout.
  out = out.replace(/<main className="flex-1 p-8 bg-\[#f7f7f7\]/g, '<main className="mx-auto w-full max-w-[1200px] flex-1 p-4 sm:p-6');
  return out;
}

const dry = process.argv.includes("--dry");
let changed = 0;
let replacements = 0;
for (const file of TARGETS.flatMap(files)) {
  if (!/\.(tsx|ts)$/.test(file) || SKIP.some((re) => re.test(file.replace(/\\/g, "/")))) continue;
  const src = fs.readFileSync(file, "utf8");
  const out = migrate(src);
  if (out !== src) {
    changed++;
    replacements += (src.match(/-slate-\d/g) || []).length - (out.match(/-slate-\d/g) || []).length;
    if (!dry) fs.writeFileSync(file, out);
  }
}
console.log(`[polaris] ${changed} archivos, ${replacements} clases slate migradas${dry ? " (simulación)" : ""}`);
