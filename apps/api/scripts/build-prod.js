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

  // Modules that are referenced via dynamic require by @nestjs/core but are optional.
  // Bundling them fails because they aren't installed; leaving them external lets Nest
  // handle their absence gracefully at runtime (or they're copied below if used).
  const external = [
    "@prisma/client",
    "@prisma/engines",
    ".prisma",
    "sharp",
    "@aws-sdk",
    "@nestjs/websockets",
    "@nestjs/platform-socket.io",
    "socket.io",
    "pg-native",
    "@nestjs/microservices",
    "@nestjs/mapped-types",
    "class-transformer/storage",
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
  const extraDeps = ["@prisma/engines", ".prisma", "@prisma/client", "@nestjs/mapped-types", "class-transformer", "tslib", "reflect-metadata", "rxjs", "class-validator", "@img/sharp-linux-x64", "@img/sharp-libvips-linux-x64"];

  const seen = new Set();
  async function copyWithDeps(name) {
    if (seen.has(name)) return;
    seen.add(name);
    const src = path.join(ROOT, "node_modules", name);
    if (!fs.existsSync(src)) return;
    const dest = path.join(outdir, "node_modules", name);
    await copyDir(src, dest);

    // Recursively copy this package's own dependencies (including optional, for native binaries)
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

  for (const name of [...depNames, ...extraDeps]) {
    await copyWithDeps(name);
  }

  // Copy the vendored Linux sharp binaries (committed in apps/api/vendor) into dist,
  // since the local node_modules only has the current platform's binary. Hostinger runs
  // on linux-x64 and needs these prebuilt binaries.
  {
    const vendorImg = path.join(__dirname, "..", "vendor", "@img");
    if (fs.existsSync(vendorImg)) {
      for (const sub of fs.readdirSync(vendorImg)) {
        const src = path.join(vendorImg, sub);
        const dest = path.join(outdir, "node_modules", "@img", sub);
        if (!fs.existsSync(dest)) await copyDir(src, dest);
      }
    }
  }

  // Copy common transitive runtime deps that external packages need at runtime
  for (const name of ["tslib", "rxjs", "class-validator", "class-transformer", "reflect-metadata", "@nestjs/common", "@nestjs/core", "@nestjs/swagger", "@nestjs/config", "@nestjs/jwt", "@nestjs/passport", "@nestjs/platform-express", "@nestjs/mapped-types", "bcryptjs", "cookie-parser", "cors", "express", "helmet", "compression", "winston", "nest-winston", "passport", "passport-jwt", "passport-google-oauth20", "uuid", "ioredis", "nodemailer", "expo-server-sdk"]) {
    await copyWithDeps(name);
  }

  // Ensure the whole @aws-sdk scope is copied (client-s3 pulls several sub-packages)
  const awsScope = path.join(ROOT, "node_modules", "@aws-sdk");
  if (fs.existsSync(awsScope)) {
    for (const sub of fs.readdirSync(awsScope)) {
      await copyWithDeps(`@aws-sdk/${sub}`);
    }
  }

  // Ensure @nestjs scoped helpers are available if referenced as external at runtime
  const nestScope = path.join(ROOT, "node_modules", "@nestjs");
  if (fs.existsSync(nestScope)) {
    for (const sub of fs.readdirSync(nestScope)) {
      const candidate = path.join(nestScope, sub, "package.json");
      if (fs.existsSync(candidate)) {
        try {
          const p = JSON.parse(fs.readFileSync(candidate, "utf8"));
          if (p.binary || /native|binding/.test(JSON.stringify(p))) {
            await copyWithDeps(`@nestjs/${sub}`);
          }
        } catch {}
      }
    }
  }

  console.log("✅ Bundle producido en dist/main.js (externos copiados)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
