const BASE = "http://127.0.0.1:3001/api/v1";

const log = {
  pass: (t) => console.log("\x1b[32m✓\x1b[0m " + t),
  fail: (t, detail) => console.log("\x1b[31m✗\x1b[0m " + t + (detail ? " (" + detail + ")" : "")),
  info: (t) => console.log("\x1b[36m───\x1b[0m " + t),
  warn: (t) => console.log("\x1b[33m⚠\x1b[0m " + t),
};

let pass = 0, fail = 0, warn = 0;

function ok(name, condition, detail) {
  if (condition) { pass++; log.pass(name); }
  else { fail++; log.fail(name, detail); }
}

async function req(method, path, { body, token } = {}) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${BASE}${path}`, opts);
  let data = null;
  try { data = await r.json(); } catch {}
  return { status: r.status, data };
}

async function main() {
  // LOGIN
  const login = await req("POST", "/auth/login", {
    body: { email: "admin@plataforma.com", password: "Admin123!" },
  });
  const token = (login.data?.data || login.data)?.accessToken;
  if (!token) {
    log.fail("No se pudo obtener token");
    console.log(`\n  ✓ PASS: ${pass}\n  ✗ FAIL: ${fail}\n  Total: ${pass + fail}`);
    return;
  }
  log.pass("Login obtenido");

  // ========== 1. MEDIA ==========
  log.info(" 1. MEDIA - Listar, upload, delete ");

  const media1 = await req("GET", "/media?page=1&limit=5", { token });
  ok("GET /media?page=1&limit=5 (200)", media1.status === 200);

  const resp = media1.data?.data || media1.data;
  const list = resp.data || resp;
  const meta = resp.meta || media1.data?.meta;

  if (meta && typeof meta.total === "number") {
    log.pass("Paginación OK (meta presente)");
  } else {
    warn++; log.warn("Paginación no presente en backend (falta deploy nuevo)");
  }
  ok("Data es array", Array.isArray(list));

  // Upload test image
  const canvas = Buffer.alloc(68); // minimal 1x1 PNG header not needed, use tiny base64
  const byt = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const head = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="qa-test.png"\r\nContent-Type: image/png\r\n\r\n`;
  const foot = `\r\n--${boundary}--\r\n`;
  const full = Buffer.concat([Buffer.from(head), byt, Buffer.from(foot)]);

  const upRes = await fetch(`${BASE}/media/upload`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body: full,
  });
  let upData = null;
  try { upData = await upRes.json(); } catch {}
  const upOk = upRes.status === 201 || upRes.status === 200;
  const upItem = upData?.data || upData;
  ok("POST /media/upload", upOk && upItem?.url);

  if (upItem?.id) {
    const delRes = await req("DELETE", `/media/${upItem.id}`, { token });
    ok("DELETE /media/:id", delRes.status === 200);
  }

  // ========== 2. CREAR SITIO + PÁGINA + BLOQUES ==========
  log.info(" 2. Crear sitio + página + bloques ");

  const ts = Date.now();
  const subd = `qa-blocks-${ts}`;

  // Create site
  const siteRes = await req("POST", "/sites", {
    token, body: { name: `QA ${ts}`, subdomain: subd },
  });
  const siteId = (siteRes.data?.data || siteRes.data)?.id;
  ok("POST /sites", siteRes.status < 300);

  if (!siteId) {
    log.fail("No site - abortando");
    console.log(`\n  ✓ PASS: ${pass}\n  ✗ FAIL: ${fail}\n  Total: ${pass + fail}`);
    return;
  }

  // Get existing pages (site auto-creates a default page)
  const pagesListRes = await req("GET", `/sites/${siteId}/pages`, { token });
  const pagesData = (pagesListRes.data?.data || pagesListRes.data) || [];
  let pageId = pagesData[0]?.id;

  if (!pageId) {
    // Fallback: create page
    const pageRes2 = await req("POST", `/sites/${siteId}/pages`, {
      token, body: { name: "Inicio QA", slug: `home-${ts}`, path: "/" },
    });
    pageId = (pageRes2.data?.data || pageRes2.data)?.id;
  }
  ok("Página para bloques", !!pageId, "pageId=" + pageId);

  if (!pageId) {
    log.fail("No page - abortando");
    await req("DELETE", `/sites/${siteId}`, { token });
    console.log(`\n  ✓ PASS: ${pass}\n  ✗ FAIL: ${fail}\n  Total: ${pass + fail}`);
    return;
  }

  // Test new blocks
  const testBlocks = [
    { type: "whatsapp", content: { phone: "521234567890", message: "Hola QA", position: "bottom-right" } },
    { type: "pricing", content: { title: "Planes QA", plans: [{ name: "Básico", price: "$9", features: "A, B, C", buttonText: "Elegir" }] } },
    { type: "team", content: { title: "Equipo QA", members: [{ name: "Ana", role: "CEO", image: "", bio: "Bio" }] } },
    { type: "features", content: { title: "Features QA", items: [{ icon: "🚀", title: "Rápido", desc: "Veloz" }] } },
    { type: "testimonials", content: { title: "Test QA", columns: 2, carousel: true, items: [
      { name: "C1", role: "CEO", quote: "Excelente" },
      { name: "C2", role: "Dir", quote: "Recomendado" },
      { name: "C3", role: "Fnd", quote: "Increíble" },
    ] } },
    { type: "hero", content: { slides: [
      { title: "Slide 1", subtitle: "Primer slide", bgType: "gradient" },
      { title: "Slide 2", subtitle: "Segundo slide", bgType: "gradient" },
    ] } },
    { type: "header", content: { logoType: "text", logoText: "QA Header", links: [{ label: "Home", url: "#" }] } },
    { type: "footer", content: { companyName: "QA Footer Co", copyright: "© 2026 QA" } },
  ];

  for (const b of testBlocks) {
    const res = await req("POST", `/pages/${pageId}/blocks`, {
      token, body: { type: b.type, content: b.content },
    });
    ok(`POST /pages/:pid/blocks (${b.type})`, res.status === 201 || res.status === 200);
  }

  // ========== 3. PUBLICAR Y VERIFICAR HTML ==========
  log.info(" 3. Publicar y verificar HTML ");

  const pubRes = await req("POST", `/sites/${siteId}/publish`, { token });
  ok("POST /sites/:id/publish", pubRes.status === 200 || pubRes.status === 201, "status=" + pubRes.status);

  const htmlRes = await fetch(`${BASE}/p/${subd}`);
  const html = await htmlRes.text();

  ok("GET /p/:subdomain (200)", htmlRes.status === 200 && html.length > 200,
    "status="+htmlRes.status+" len="+html.length);
  // Debug: find header/footer content
  const hIdx = html.indexOf("Header");
  const fIdx = html.indexOf("Footer");
  console.log("   'Header' at:", hIdx, "| 'Footer' at:", fIdx);
  if (hIdx > 0) console.log("   Header context:", html.substring(hIdx - 20, hIdx + 80));
  if (fIdx > 0) console.log("   Footer context:", html.substring(fIdx - 20, fIdx + 80));

  if (htmlRes.status === 200) {
    ok("WhatsApp presente", html.includes("wa.me/"));
    ok("Pricing presente", html.includes("Planes QA"));
    ok("Team presente", html.includes("Equipo QA"));
    ok("Features presente", html.includes("Features QA"));
    ok("Testimonials presente", html.includes("Test QA"));
    ok("Hero slides presente", html.includes("Slide 1"));
    ok("Header presente", html.includes("QA Header"));
    ok("Footer presente", html.includes("QA Footer Co"));
    ok("Script carrusel presente", html.includes("setupCarousel"));
    ok("Sin URLs relativas /uploads/", !html.includes('src="/uploads/'));
  }

  // ========== 4. LIMPIEZA ==========
  await req("DELETE", `/sites/${siteId}`, { token });

  // ========== 5. RESULTADOS ==========
  log.info(" RESULTADOS ");
  console.log(`\x1b[32m  ✓ PASS: ${pass}\x1b[0m`);
  console.log(`\x1b[31m  ✗ FAIL: ${fail}\x1b[0m`);
  console.log(`\x1b[33m  ⚠ WARN: ${warn}\x1b[0m`);
  console.log(`  Total: ${pass + fail + warn}`);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
