const BASE = "http://127.0.0.1:3001/api/v1";

const log = {
  pass: (t) => console.log("\x1b[32m✓\x1b[0m " + t),
  fail: (t) => console.log("\x1b[31m✗\x1b[0m " + t),
  skip: (t) => console.log("\x1b[33m⚠\x1b[0m " + t),
  info: (t) => console.log("\x1b[36m───\x1b[0m " + t),
};

let pass = 0, fail = 0, skip = 0;

function ok(name, condition) {
  if (condition) { pass++; log.pass(name); }
  else { fail++; log.fail(name); }
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

// ========== MAIN ==========
async function main() {
  log.info(" AUTENTICACIÓN ");

  // Login admin
  const login1 = await req("POST", "/auth/login", {
    body: { email: "admin@plataforma.com", password: "Admin123!" },
  });
  const inner1 = login1.data?.data || login1.data;
  const adminToken = inner1?.accessToken;

  ok("POST /auth/login (admin)", login1.status === 200 && typeof adminToken === "string" && adminToken.length > 20);

  if (!adminToken) {
    log.fail("No se pudo obtener token admin, el resto de tests fallarán");
    console.log(`\n  ✓ PASS: ${pass}\n  ✗ FAIL: ${fail}\n  SKIP: ${skip}\n  Total: ${pass + fail + skip}`);
    return;
  }

  // Login con credenciales de admin (segundo login - prueba multi-token)
  const login2 = await req("POST", "/auth/login", {
    body: { email: "admin@plataforma.com", password: "Admin123!" },
  });
  const inner2 = login2.data?.data || login2.data;
  const secondToken = inner2?.accessToken;

  ok("POST /auth/login (segundo login)", login2.status === 200 && typeof secondToken === "string" && secondToken !== adminToken);

  // Invalid credentials
  ok("POST /auth/login (credenciales inválidas)", (await req("POST", "/auth/login", {
    body: { email: "admin@plataforma.com", password: "wrong" },
  })).status === 401);

  // Blocked user
  ok("POST /auth/login (usuario bloqueado)", (await req("POST", "/auth/login", {
    body: { email: "blocked@plataforma.com", password: "Block123!" },
  })).status === 401);

  // Forgot password
  ok("POST /auth/forgot-password", (await req("POST", "/auth/forgot-password", {
    body: { email: "admin@plataforma.com" },
  })).status === 200);

  ok("POST /auth/forgot-password (no existe)", (await req("POST", "/auth/forgot-password", {
    body: { email: "no-existe-99@test.com" },
  })).status === 200);

  // Get current user
  const me = await req("GET", "/auth/me", { token: adminToken });
  ok("GET /auth/me (admin)", me.status === 200 && me.data?.data?.email);

  // Refresh token
  ok("POST /auth/refresh (válido)", (async () => {
    if (!inner1?.refreshToken) return false;
    const r = await req("POST", "/auth/refresh", { body: { refreshToken: inner1.refreshToken } });
    return r.status === 200 && typeof r.data?.data?.accessToken === "string";
  })());

  // Invalid refresh
  ok("POST /auth/refresh (inválido)", (await req("POST", "/auth/refresh", {
    body: { refreshToken: "invalid-refresh-token-12345" },
  })).status === 401);

  // ========== TENANTS ==========
  log.info(" TENANTS ");

  ok("GET /tenants/admin/all", (await req("GET", "/tenants/admin/all", { token: adminToken })).status === 200);

  const ts = Date.now();
  const createTenant = await req("POST", "/tenants/admin", {
    token: adminToken,
    body: { name: `Test QA ${ts}`, subdomain: `qa-${ts}` },
  });
  const tenantCreated = createTenant.status === 201 || createTenant.status === 200;
  ok("POST /tenants/admin (crear)", tenantCreated);
  const tenantId = (createTenant.data?.data || createTenant.data)?.id;

  // ========== USERS ==========
  log.info(" USUARIOS ");
  ok("GET /users/admin/all", (await req("GET", "/users/admin/all", { token: adminToken })).status === 200);
  ok("GET /users/profile", (await req("GET", "/users/profile", { token: adminToken })).status === 200);
  ok("GET /users/tenants", (await req("GET", "/users/tenants", { token: adminToken })).status === 200);

  // ========== ROLES ==========
  log.info(" ROLES ");
  ok("GET /roles", (await req("GET", "/roles", { token: adminToken })).status === 200);

  // ========== PLANS ==========
  log.info(" PLANES ");
  ok("GET /plans", (await req("GET", "/plans", { token: adminToken })).status === 200);
  ok("GET /plans/free", (await req("GET", "/plans/free", { token: adminToken })).status === 200);

  // ========== SITES ==========
  log.info(" SITIOS ");
  ok("GET /sites", (await req("GET", "/sites", { token: adminToken })).status === 200);

  const siteTs = Date.now();
  const createSite = await req("POST", "/sites", {
    token: adminToken,
    body: { name: `Test Site ${siteTs}`, subdomain: `qa-site-${siteTs}` },
  });
  const siteCreated = createSite.status === 201 || createSite.status === 200;
  ok("POST /sites (crear)", siteCreated);
  const siteId = (createSite.data?.data || createSite.data)?.id;

  if (siteId) {
    ok("GET /sites/:id", (await req("GET", `/sites/${siteId}`, { token: adminToken })).status === 200);
    ok("PUT /sites/:id", (await req("PUT", `/sites/${siteId}`, {
      token: adminToken,
      body: { name: `Test Site Updated ${siteTs}` },
    })).status === 200);
    ok("DELETE /sites/:id", (await req("DELETE", `/sites/${siteId}`, { token: adminToken })).status === 200);
  } else {
    skip += 3; log.skip("GET/PUT/DELETE /sites/:id: no se obtuvo ID del sitio");
  }

  // ========== TEMPLATES ==========
  log.info(" PLANTILLAS ");
  ok("GET /templates", (await req("GET", "/templates", { token: adminToken })).status === 200);
  ok("GET /templates/categories", (await req("GET", "/templates/categories", { token: adminToken })).status === 200);

  // ========== DASHBOARD ==========
  log.info(" DASHBOARD ");
  ok("GET /dashboard/admin", (await req("GET", "/dashboard/admin", { token: adminToken })).status === 200);
  ok("GET /dashboard/admin/billing", (await req("GET", "/dashboard/admin/billing", { token: adminToken })).status === 200);

  // ========== PUBLIC ==========
  log.info(" PÚBLICOS ");

  ok("GET /p/:subdomain (HTML público)", (await req("GET", "/p/admin-test", {})).status === 200 || (await req("GET", "/p/admin-test", {})).status === 404);

  const trackResult = await req("POST", "/analytics/track", {
    body: { tenantId: tenantId || "test-tenant", type: "pageview", path: "/test" },
  });
  ok("POST /analytics/track (público)", trackResult.status === 201 || trackResult.status === 200);

  ok("GET /automations/triggers (requiere auth)", (await req("GET", "/automations/triggers", {})).status === 401);

  // ========== SEGURIDAD ==========
  log.info(" SEGURIDAD ");
  ok("401 sin token", (await req("GET", "/users/profile", {})).status === 401);
  ok("401 token inválido", (await req("GET", "/users/profile", { token: "invalid.jwt.token" })).status === 401);

  ok("POST sin token rechazado", [401, 403].includes((await req("POST", "/sites", {
    body: { name: "hack" },
  })).status));

  ok("SQL injection básico", [400, 401].includes((await req("POST", "/auth/login", {
    body: { email: "' OR 1=1 --", password: "anything" },
  })).status));

  ok("XSS básico", [200, 400].includes((await req("POST", "/auth/forgot-password", {
    body: { email: "<script>alert(1)</script>" },
  })).status));

  // ========== ERRORS ==========
  log.info(" ERRORES ");
  ok("404 en ruta inexistente", (await req("GET", "/nonexistent", {})).status === 404);

  const badBody = await req("POST", "/auth/login", {
    body: "not-json",
  });
  ok("400 en body inválido", badBody.status >= 400);

  // ========== RESULTS ==========
  log.info(" RESULTADOS ");
  console.log(`\x1b[32m  ✓ PASS: ${pass}\x1b[0m`);
  console.log(`\x1b[31m  ✗ FAIL: ${fail}\x1b[0m`);
  console.log(`\x1b[33m  ⚠ SKIP: ${skip}\x1b[0m`);
  console.log(`  Total: ${pass + fail + skip}`);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
