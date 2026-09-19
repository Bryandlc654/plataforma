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

const PAYPHONE_TOKEN = "QA_TEST_TOKEN_dummy_payphone_123";
const PAYPHONE_STORE = "QA_STORE_12345";

let snapshot = null;
let activeToken = null;
let created = { productId: null, orderId: null, siteId: null };

async function setup() {
  const login = await req("POST", "/auth/login", {
    body: { email: "admin@plataforma.com", password: "Admin123!" },
  });
  const token = (login.data?.data || login.data)?.accessToken;
  activeToken = token || null;
  ok("POST /auth/login (admin)", login.status === 200 && typeof token === "string" && token.length > 20);
  if (!token) return null;
  return token;
}

async function restoreConfig(token) {
  if (!snapshot) return;
  token = token || activeToken;
  if (!token) return;
  const blank = (v) => (v ? v : " ");
  try {
    await req("PUT", "/payments/config", {
      token,
      body: {
        defaultMethod: snapshot.defaultMethod,
        providers: {
          paypal: {
            enabled: snapshot.providers?.paypal?.enabled === true,
            mode: snapshot.providers?.paypal?.mode || "sandbox",
            clientId: snapshot.providers?.paypal?.clientId || "",
          },
          payphone: {
            enabled: snapshot.providers?.payphone?.enabled === true,
            mode: snapshot.providers?.payphone?.mode || "sandbox",
            token: blank(snapshot.providers?.payphone?.token),
            storeId: blank(snapshot.providers?.payphone?.storeId),
          },
        },
      },
    });
  } catch (e) {}
}

async function cleanup(token) {
  if (created.orderId) { try { await req("DELETE", `/orders/${created.orderId}`, { token }); } catch {} }
  if (created.productId) { try { await req("DELETE", `/products/${created.productId}`, { token }); } catch {} }
  if (created.siteId) { try { await req("DELETE", `/sites/${created.siteId}`, { token }); } catch {} }
}

async function main() {
  const token = await setup();
  if (!token) return report();

  log.info(" PAYPHONE - config inicial");
  const cfg0 = await req("GET", "/payments/config", { token });
  ok("GET /payments/config (200 + shape)", cfg0.status === 200 && cfg0.data?.data?.providers?.payphone
    && typeof cfg0.data.data.providers.payphone.storeId === "string"
    && typeof cfg0.data.data.providers.paypal.hasSecret === "boolean",
    JSON.stringify(cfg0.data?.data || {}).slice(0, 220));
  snapshot = cfg0.data?.data || null;

  ok("GET /payments/config sin auth (401)", (await req("GET", "/payments/config", {})).status === 401);
  ok("PUT /payments/config sin auth (401)", [401, 403].includes((await req("PUT", "/payments/config", {
    body: { providers: { payphone: { enabled: true } } },
  })).status));

  const pp = { enabled: true, mode: "sandbox", token: PAYPHONE_TOKEN, storeId: PAYPHONE_STORE };
  const pal = { enabled: !!snapshot?.providers?.paypal?.enabled, mode: snapshot?.providers?.paypal?.mode || "sandbox", clientId: snapshot?.providers?.paypal?.clientId || "" };

  log.info(" PAYPHONE - guardado de config (sandbox)");
  const put1 = await req("PUT", "/payments/config", {
    token,
    body: { defaultMethod: "payphone", providers: { paypal: pal, payphone: pp } },
  });
  ok("PUT /payments/config (payphone sandbox)", put1.status === 200);

  let cfg1 = (await req("GET", "/payments/config", { token })).data?.data;
  ok("Token persistido", cfg1?.providers?.payphone?.token === PAYPHONE_TOKEN);
  ok("Store ID persistido", cfg1?.providers?.payphone?.storeId === PAYPHONE_STORE);
  ok("Modo sandbox persistido", cfg1?.providers?.payphone?.mode === "sandbox");
  ok("defaultMethod=payphone", cfg1?.defaultMethod === "payphone");

  log.info(" PAYPHONE - modo live");
  const putLive = await req("PUT", "/payments/config", {
    token,
    body: { defaultMethod: "payphone", providers: { paypal: pal, payphone: { ...pp, mode: "live" } } },
  });
  ok("PUT config mode=live (200)", putLive.status === 200);
  ok("Modo live persistido", (await req("GET", "/payments/config", { token })).data?.data?.providers?.payphone?.mode === "live");

  const putSandbox = await req("PUT", "/payments/config", {
    token,
    body: { defaultMethod: "payphone", providers: { paypal: pal, payphone: pp } },
  });
  ok("Vuelve a sandbox (200)", putSandbox.status === 200);

  log.info(" PAYPHONE - merge de credenciales (no se envian de nuevo)");
  const putMerge = await req("PUT", "/payments/config", {
    token,
    body: { defaultMethod: "payphone", providers: { paypal: pal, payphone: { enabled: true } } },
  });
  ok("PUT sin token (200)", putMerge.status === 200);
  ok("Token preservado al no enviarse", (await req("GET", "/payments/config", { token })).data?.data?.providers?.payphone?.token === PAYPHONE_TOKEN);

  log.info(" PAYPHONE - validacion de defaultMethod");
  const putBad = await req("PUT", "/payments/config", {
    token,
    body: { defaultMethod: "bitcoin", providers: { paypal: pal, payphone: pp } },
  });
  ok("defaultMethod invalido cae a cod", putBad.status === 200 && (await req("GET", "/payments/config", { token })).data?.data?.defaultMethod === "cod");
  await req("PUT", "/payments/config", {
    token,
    body: { defaultMethod: "payphone", providers: { paypal: pal, payphone: pp } },
  });

  log.info(" PAYPHONE - setup sitio + producto");
  const ts = Date.now();
  const templates = await req("GET", "/templates", { token });
  const tplList = templates.data?.data || templates.data || [];
  const tpl = Array.isArray(tplList) ? tplList.find((x) => String(x.name || "").toUpperCase() === "URBAN NOIR") : null;
  ok("Template URBAN NOIR encontrado", !!tpl?.id);
  if (!tpl?.id) { await restoreConfig(token); return report(); }

  const subd = `qa-pp-${ts % 100000000}`;
  const site = await req("POST", "/sites", {
    token,
    body: { name: `QA Payphone ${ts}`, templateId: tpl.id, subdomain: subd },
  });
  created.siteId = (site.data?.data || site.data)?.id;
  ok("POST /sites (URBAN NOIR)", site.status < 300 && !!created.siteId);

  const product = await req("POST", "/products", {
    token,
    body: { name: `QA Payphone Product ${ts}`, slug: `qa-pp-prod-${ts}`, price: "25.50", stock: 100, currency: "USD" },
  });
  created.productId = (product.data?.data || product.data)?.id;
  ok("POST /products", product.status < 300 && !!created.productId);

  if (!created.siteId || !created.productId) {
    await restoreConfig(token);
    await cleanup(token);
    return report();
  }

  log.info(" PAYPHONE - HTML publicado (checkout, habilitado)");
  let html = "";
  const ckRes = await fetch(`${BASE}/p/${subd}/checkout`);
  html = ckRes.status === 200 ? await ckRes.text() : "";
  ok("GET /p/:sub/checkout (200)", ckRes.status === 200 && html.length > 500, "status=" + ckRes.status + " len=" + html.length);
  if (ckRes.status === 200) {
    ok("data-payphone-enabled=1", html.includes('data-payphone-enabled="1"'));
    ok("Radio 'Tarjeta / Payphone'", html.includes("Tarjeta / Payphone") && html.includes('value="payphone"'));
    ok("Contenedor #un-payphone-box", html.includes('id="un-payphone-box"'));
    ok("Contenedor #pp-button", html.includes('id="pp-button"'));
    ok("Nota #un-payphone-note", html.includes('id="un-payphone-note"'));
    ok("CSS de la cajita payphone", html.includes("https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css"));
    ok("JS de la cajita payphone", html.includes("https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js"));
    ok("JS renderPayphoneWidget", html.includes("renderPayphoneWidget"));
    ok("JS handlePayphoneReturn", html.includes("handlePayphoneReturn"));
    ok("JS initPayphone", html.includes("initPayphone"));
    ok("JS var payphoneEnabled", html.includes("payphoneEnabled"));
    ok("JS confirma en checkoutBase/payphone/confirm", html.includes("/payphone/confirm"));
  }

  log.info(" PAYPHONE - create-order (endpoint publico)");
  const cartPayload = {
    items: [{ productId: created.productId, quantity: 2 }],
    customerName: "QA Cliente",
    customerEmail: "qa.cliente@test.com",
    customerPhone: "+593999999999",
    address: "Av. Test 123, Quito",
    paymentMethod: "payphone",
  };
  const co = await req("POST", `/p/${subd}/payphone/create-order`, { body: cartPayload });
  const coData = co.data?.data || co.data;
  ok("POST create-order sin auth (201)", co.status === 201 || co.status === 200, "status=" + co.status);
  ok("Devuelve orderId", typeof coData?.orderId === "string" && coData.orderId.length > 10);
  ok("clientTransactionId == orderId (UUID)", coData?.clientTransactionId === coData?.orderId);
  created.orderId = coData?.orderId || null;
  ok("amount en centavos (51.00 -> 5100)", coData?.amount === 5100, "amount=" + coData?.amount);
  ok("totalAmount = 51.00", coData?.totalAmount === "51.00");
  ok("currency = USD", coData?.currency === "USD");
  ok("provider.token = configurado", coData?.provider?.token === PAYPHONE_TOKEN);
  ok("provider.storeId = configurado", coData?.provider?.storeId === PAYPHONE_STORE);
  ok("provider.mode = sandbox", coData?.provider?.mode === "sandbox");
  ok("provider.defaultMethod = card", coData?.provider?.defaultMethod === "card");
  ok("NO expone secret/env en la respuesta", !JSON.stringify(coData || {}).toLowerCase().includes("secret")
    && !JSON.stringify(coData || {}).includes("access_token"));

  if (created.orderId) {
    const ord = await req("GET", `/orders/${created.orderId}`, { token });
    const od = ord.data?.data || ord.data;
    ok("GET /orders/:id (200)", ord.status === 200);
    ok("paymentMethod=payphone", od?.paymentMethod === "payphone");
    ok("paymentReference == orderId (clientTxId)", od?.paymentReference === created.orderId);
    ok("totalAmount == 51", Number(od?.totalAmount) === 51, "totalAmount=" + od?.totalAmount);
    ok("status NO es paid aún", od?.status !== "paid", "status=" + od?.status);
    ok("currency=USD en order", od?.currency === "USD");
  }

  log.info(" PAYPHONE - create-order (casos de error)");
  ok("Carrito vacío (400)", (await req("POST", `/p/${subd}/payphone/create-order`, { body: { items: [] } })).status === 400);
  ok("Ítems inválidos/qty 0 (400)", (await req("POST", `/p/${subd}/payphone/create-order`, { body: { items: [{ productId: created.productId, quantity: 0 }] } })).status === 400);
  ok("Producto inexistente (404)", (await req("POST", `/p/${subd}/payphone/create-order`, { body: { items: [{ productId: "no-existe", quantity: 1 }] } })).status === 404);
  ok("Subdominio inexistente (404)", (await req("POST", "/p/no-such-subdomain-xyz/payphone/create-order", { body: cartPayload })).status === 404);

  log.info(" PAYPHONE - confirm (casos de error)");
  ok("Faltan datos (400)", (await req("POST", `/p/${subd}/payphone/confirm`, { body: {} })).status === 400);
  ok("Transaction no existe (404)", (await req("POST", `/p/${subd}/payphone/confirm`, { body: { id: 1, clientTransactionId: "tx-inexistente-xyz" } })).status === 404);
  if (created.orderId) {
    const conf = await req("POST", `/p/${subd}/payphone/confirm`, {
      body: { id: 987654321, clientTransactionId: created.orderId },
    });
    ok("Confirm con token de prueba falla con 400 controlado (path externo OK)", conf.status === 400,
      "status=" + conf.status + " msg=" + JSON.stringify(conf.data?.message || conf.data || "").slice(0, 120));
  }

  log.info(" PAYPHONE - HTML publicado (checkout, deshabilitado)");
  const putDis = await req("PUT", "/payments/config", {
    token,
    body: { defaultMethod: "cod", providers: { paypal: pal, payphone: { ...pp, enabled: false } } },
  });
  ok("PUT config payphone disabled (200)", putDis.status === 200);
  ok("create-order con payphone deshabilitado (400)", (await req("POST", `/p/${subd}/payphone/create-order`, { body: cartPayload })).status === 400);
  log.info(" Esperando expiración del caché público (htmlCache TTL 60s)...");
  await new Promise((r) => setTimeout(r, 65000));
  const ck2 = await fetch(`${BASE}/p/${subd}/checkout`);
  const html2 = ck2.status === 200 ? await ck2.text() : "";
  ok("GET checkout tras disable (200)", ck2.status === 200);
  ok("data-payphone-enabled=0", html2.includes('data-payphone-enabled="0"'));
  ok("Sin #un-payphone-box", !html2.includes('id="un-payphone-box"'));
  ok("Sin #pp-button", !html2.includes('id="pp-button"'));
  ok("Sin CSS payphone", !html2.includes("cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css"));
  ok("Sin JS payphone", !html2.includes("cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js"));

  log.info(" PAYPHONE - entorno DASHBOARD (datos devueltos al front)");
  const cfgDash = (await req("GET", "/payments/config", { token })).data?.data;
  ok("getConfig expone payphone.enabled", typeof cfgDash?.providers?.payphone?.enabled === "boolean");
  ok("getConfig devuelve storeId para el dashboard", typeof cfgDash?.providers?.payphone?.storeId === "string");
  ok("defaultMethod disponible", ["cod", "paypal", "payphone"].includes(cfgDash?.defaultMethod));

  await restoreConfig(token);
  await cleanup(token);
  return report();
}

function report() {
  log.info(" RESULTADOS ");
  console.log(`\x1b[32m  ✓ PASS: ${pass}\x1b[0m`);
  console.log(`\x1b[31m  ✗ FAIL: ${fail}\x1b[0m`);
  console.log(`\x1b[33m  ⚠ WARN: ${warn}\x1b[0m`);
  console.log(`  Total: ${pass + fail + warn}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch(async (e) => {
  console.error("FATAL:", e.message);
  await restoreConfig(null).catch(() => {});
  await cleanup(null).catch(() => {});
  report();
});