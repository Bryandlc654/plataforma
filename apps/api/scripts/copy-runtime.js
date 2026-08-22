const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");
const OUTDIR = path.join(__dirname, "..", "dist");

async function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

const seen = new Set();
async function copyWithDeps(name) {
  if (seen.has(name)) return;
  seen.add(name);
  const src = path.join(ROOT, "node_modules", name);
  if (!fs.existsSync(src)) return;
  const dest = path.join(OUTDIR, "node_modules", name);
  await copyDir(src, dest);

  let pkgJson = null;
  try { pkgJson = JSON.parse(fs.readFileSync(path.join(src, "package.json"), "utf8")); } catch {}
  if (pkgJson) {
    const deps = { ...(pkgJson.dependencies || {}), ...(pkgJson.peerDependencies || {}), ...(pkgJson.optionalDependencies || {}) };
    for (const d of Object.keys(deps)) {
      if (d.startsWith(".")) continue;
      await copyWithDeps(d);
    }
  }
}

async function main() {
  const pkg = require(path.join(__dirname, "..", "package.json"));
  const depNames = Object.keys(pkg.dependencies || {});
  const extraDeps = [
    "@prisma/engines", ".prisma", "@prisma/client", "@nestjs/mapped-types",
    "tslib", "reflect-metadata", "rxjs", "class-validator", "class-transformer",
    "@img/sharp-linux-x64", "@img/sharp-libvips-linux-x64",
    "multer", "body-parser", "raw-body", "busboy",
  ];

  for (const name of [...depNames, ...extraDeps]) {
    await copyWithDeps(name);
  }

  // Vendored Linux binaries (sharp) committed in apps/api/vendor/@img
  const vendorImg = path.join(__dirname, "..", "vendor", "@img");
  if (fs.existsSync(vendorImg)) {
    for (const sub of fs.readdirSync(vendorImg)) {
      const src = path.join(vendorImg, sub);
      const dest = path.join(OUTDIR, "node_modules", "@img", sub);
      if (!fs.existsSync(dest)) await copyDir(src, dest);
    }
  }

  console.log("✅ Runtime deps copiadas a dist/node_modules");
}

main().catch((e) => { console.error(e); process.exit(1); });
