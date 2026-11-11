#!/usr/bin/env node
/**
 * Copia las plantillas de packages/shared/src/templates a apps/web/src/lib/templates.
 *
 * La fuente única es packages/shared (la usa el API para publicar). El web guarda una
 * copia generada y versionada porque el despliegue del web (Vercel) no siempre tiene
 * acceso a packages/. No edites los archivos generados: edita packages/shared y ejecuta
 *   npm run sync:templates -w apps/web
 * Con --check falla si la copia no coincide (lo usa la CI).
 */
const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "../../../packages/shared/src/templates");
const DEST = path.resolve(__dirname, "../src/lib/templates");
const HEADER = "// ARCHIVO GENERADO desde packages/shared/src/templates — no editar aquí.\n// Ejecuta `npm run sync:templates -w apps/web` tras cambiar la fuente.\n\n";
const check = process.argv.includes("--check");

if (!fs.existsSync(SRC)) {
  console.log("[sync-templates] packages/shared no está disponible; se usa la copia versionada.");
  process.exit(0);
}

const normalize = (s) => s.replace(/\r\n/g, "\n");
const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".ts"));
const expected = new Map(files.map((f) => [f, HEADER + normalize(fs.readFileSync(path.join(SRC, f), "utf8"))]));

if (check) {
  const problems = [];
  for (const [f, content] of expected) {
    const dest = path.join(DEST, f);
    if (!fs.existsSync(dest)) problems.push(`falta ${f}`);
    else if (normalize(fs.readFileSync(dest, "utf8")) !== content) problems.push(`${f} desactualizado`);
  }
  if (fs.existsSync(DEST)) {
    for (const f of fs.readdirSync(DEST)) if (!expected.has(f)) problems.push(`${f} sobra`);
  }
  if (problems.length) {
    console.error(`[sync-templates] La copia del web no coincide con packages/shared:\n  - ${problems.join("\n  - ")}\nEjecuta: npm run sync:templates -w apps/web`);
    process.exit(1);
  }
  console.log("[sync-templates] OK");
  process.exit(0);
}

fs.mkdirSync(DEST, { recursive: true });
for (const f of fs.readdirSync(DEST)) if (!expected.has(f)) fs.unlinkSync(path.join(DEST, f));
for (const [f, content] of expected) fs.writeFileSync(path.join(DEST, f), content);
console.log(`[sync-templates] ${expected.size} archivos copiados a src/lib/templates`);
