const { build } = require("esbuild");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");

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

async function main() {
  const outdir = path.join(__dirname, "..", "dist");
  fs.rmSync(outdir, { recursive: true, force: true });

  // Native/heavy modules that must NOT be bundled (they have their own binaries/engines)
  const external = [
    "@prisma/client",
    "@prisma/engines",
    ".prisma",
    "sharp",
    "@aws-sdk",
    "@nestjs/microservices",
    "@nestjs/mapped-types",
    "@nestjs/websockets",
    "@nestjs/platform-socket.io",
    "socket.io",
    "pg-native",
  ];

  await build({
    entryPoints: [path.join(__dirname, "..", "src", "main.ts")],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    outfile: path.join(outdir, "main.js"),
    external,
    banner: {
      js: 'require("reflect-metadata");',
    },
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    sourcemap: false,
  });

  // Copy the runtime dependencies into dist/node_modules so the bundle can resolve
  // its external (native/heavy) requires at runtime. Reads the api package.json
  // dependencies and copies each from the monorepo root node_modules.
  const pkg = require(path.join(__dirname, "..", "package.json"));
  const depNames = Object.keys(pkg.dependencies || {});
  const extraDeps = ["@prisma/engines", ".prisma", "@prisma/client"];

  const seen = new Set();
  async function copyWithDeps(name) {
    if (seen.has(name)) return;
    seen.add(name);
    const src = path.join(ROOT, "node_modules", name);
    if (!fs.existsSync(src)) return;
    const dest = path.join(outdir, "node_modules", name);
    await copyDir(src, dest);
    // also copy nested node_modules of this package (e.g. prisma engine binaries)
    const nested = path.join(src, "node_modules");
    if (fs.existsSync(nested)) {
      for (const sub of fs.readdirSync(nested)) {
        await copyWithDeps(`${name}/node_modules/${sub}`);
      }
    }
  }

  for (const name of [...depNames, ...extraDeps]) {
    await copyWithDeps(name);
  }

  console.log("✅ Bundle producido en dist/main.js (externos copiados)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
