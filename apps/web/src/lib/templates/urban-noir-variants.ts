// ARCHIVO GENERADO desde packages/shared/src/templates — no editar aquí.
// Ejecuta `npm run sync:templates -w apps/web` tras cambiar la fuente.

import { escapeHtmlText } from "./sanitize";

export function getUrbanNoirHtml(type: string, c: any, apiBaseUrl?: string, site?: any): string | null {
  if (c.variant !== "urban-noir") return null;

  const nl = (s: any) => String(s || "").replace(/\n/g, "<br>");
  // Idempotente: el contenido ya llega saneado desde renderTemplateVariantHtml.
  const esc = (s: any) => escapeHtmlText(s);

  const siteBase = !site?.domain && site?.subdomain ? `/${String(site.subdomain).replace(/^\/+/, "")}` : "";
  const homeUrl = site?.domain ? `https://${site.domain}` : (site?.subdomain ? `/${String(site.subdomain).replace(/^\/+/, "")}` : "/");
  const siteHref = (url: string): string => {
    if (!url || url === "#") return url || "#";
    if (/^(https?:)?\/\//.test(url) || /^(mailto|tel|javascript):/i.test(url)) return url;
    if (url.startsWith("#")) return url;
    if (url.startsWith("/")) return `${siteBase}${url}`;
    return url;
  };

  const actionUrl = site?.tenantId ? `${apiBaseUrl || ""}/api/v1/leads/submit/${site.tenantId}` : "#";

  /** Íconos de beneficios: se elige uno por nombre (o se escribe un emoji). */
  const BENEFIT_ICONS: Record<string, string> = {
    envio: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />',
    calidad: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />',
    pago: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />',
    devolucion: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />',
    soporte: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M15 12a3 3 0 11-6 0 3 3 0 016 0z" />',
    regalo: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v13M5 12h14v9H5zM3 8h18v4H3zM12 8S10.5 3 8 3.5 7 8 12 8zm0 0s1.5-5 4-4.5S17 8 12 8z" />',
    estrella: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />',
  };
  const benefitSvg = (icon: any): string => {
    const raw = String((icon && (icon.text !== undefined ? icon.text : icon.name)) || icon || "");
    const n = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const key = BENEFIT_ICONS[n] ? n
      : /env|truck|entrega|shipping|🚚/.test(n) ? "envio"
      : /calid|shield|check|🛡/.test(n) ? "calidad"
      : /pago|card|secure|lock|💳/.test(n) ? "pago"
      : "";
    if (key) return `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">${BENEFIT_ICONS[key]}</svg>`;
    return raw;
  };

  /** Ícono de la red social: por el campo "Red" o, si no, por la etiqueta. */
  const socialSvg = (label: string, network?: string): string => {
    const n = String(network || label || "").toLowerCase();
    const svg = (d: string) => `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
    if (n.includes("instagram")) return `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd" /></svg>`;
    if (n.includes("twitter") || n === "x" || n.includes("x ")) return `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>`;
    if (n.includes("facebook")) return svg("M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z");
    if (n.includes("tiktok")) return svg("M16.6 5.82A4.28 4.28 0 0115.54 3h-3.09v12.4a2.59 2.59 0 11-2.59-2.59c.27 0 .53.04.77.12V9.77a5.7 5.7 0 00-.77-.05A5.68 5.68 0 1015.54 15.4V9.01a7.34 7.34 0 004.29 1.37V7.29a4.28 4.28 0 01-3.23-1.47z");
    if (n.includes("youtube")) return svg("M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z");
    if (n.includes("whatsapp")) return svg("M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37A9.86 9.86 0 012.16 12C2.16 6.54 6.6 2.1 12.06 2.1c2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 012.9 6.99c-.01 5.45-4.44 9.88-9.89 9.88z");
    if (n.includes("linkedin")) return svg("M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 013.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z");
    if (n.includes("pinterest")) return svg("M12 0a12 12 0 00-4.37 23.17c-.1-.94-.2-2.4.04-3.43l1.4-5.95s-.36-.72-.36-1.78c0-1.67.97-2.91 2.17-2.91 1.02 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-1 4-.28 1.19.6 2.17 1.78 2.17 2.13 0 3.77-2.25 3.77-5.5 0-2.87-2.06-4.88-5.01-4.88-3.41 0-5.42 2.56-5.42 5.21 0 1.03.4 2.14.89 2.74a.36.36 0 01.08.35l-.33 1.36c-.05.22-.18.27-.41.16-1.5-.7-2.43-2.89-2.43-4.65 0-3.78 2.75-7.26 7.92-7.26 4.16 0 7.4 2.97 7.4 6.93 0 4.13-2.6 7.46-6.22 7.46-1.21 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1012 0z");
    return `<span class="text-sm font-bold">${String(label || "").charAt(0).toUpperCase()}</span>`;
  };

  switch (type) {
    case "checkout": {
      const baseHome = c.checkoutBase || (site?.domain ? `https://${site.domain}` : (apiBaseUrl ? `${apiBaseUrl}/p/${site?.subdomain || ""}` : "#"));
      const pmPaypal = (c.payment && c.payment.paypal) || {};
      const hasPaypal = pmPaypal.enabled === true && !!pmPaypal.clientId;
      const pmPayphone = (c.payment && c.payment.payphone) || {};
      const hasPayphone = pmPayphone.enabled === true && !!pmPayphone.token && !!pmPayphone.storeId;
      const defaultMethod =
        c.payment?.defaultMethod === "paypal" && hasPaypal
          ? "paypal"
          : c.payment?.defaultMethod === "payphone" && hasPayphone
            ? "payphone"
            : "cod";
      const currency = c.payment?.currency || "USD";
      const paypalSdkUrl = `${pmPaypal.mode === "live" ? "https://www.paypal.com" : "https://www.sandbox.paypal.com"}/sdk/js?client-id=${encodeURIComponent(pmPaypal.clientId)}&intent=capture&currency=${encodeURIComponent(currency)}&components=buttons`;
      const payphoneAssets = hasPayphone ? `
      <link rel="stylesheet" href="https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css">
      <script type="module" src="https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js"></script>` : "";
      return `
      <div class="bg-white min-h-[60vh] pt-28">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <a href="${baseHome}" class="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-bold text-black hover:text-gray-500 transition mb-10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Volver a la tienda
          </a>
          <h1 class="font-display font-bold text-4xl mb-2 uppercase tracking-tight" data-ed="coTitle">${c.coTitle || "Checkout"}</h1>
          <p class="text-gray-500 mb-10" data-ed="coSubtitle">${c.coSubtitle || "Revisa tu pedido, completa tus datos y elige cómo pagar."}</p>
          <div id="un-co-empty" class="hidden text-center py-16 border border-black bg-gray-50">
            <p class="uppercase tracking-widest text-sm font-bold mb-4" data-ed="coEmptyText">${c.coEmptyText || "Tu carrito está vacío"}</p>
            <a href="${baseHome}" class="inline-block bg-black text-white px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-gray-800 transition-colors" data-ed="coBackText">${c.coBackText || "Volver a la tienda"}</a>
          </div>
          <div id="un-co-wrap">
            <div id="un-co-items" class="border border-black divide-y divide-gray-100 mb-6"></div>
            <div class="flex justify-between items-baseline border-t-2 border-black pt-4 mb-8">
              <span class="uppercase tracking-widest font-bold" data-ed="coTotalLabel">${c.coTotalLabel || "Total a pagar"}</span>
              <span id="un-co-total" class="font-display font-bold text-3xl">$0.00</span>
            </div>
            <form id="un-checkout-form" class="space-y-4">
              <h2 class="font-display font-bold uppercase tracking-widest text-lg pt-4 pb-2" data-ed="coDeliveryTitle">${c.coDeliveryTitle || "Datos de entrega"}</h2>
              <input name="customerName" required maxlength="120" placeholder="Nombre completo" class="w-full border border-black px-4 py-3 text-sm uppercase tracking-wider outline-none focus:bg-gray-50">
              <input name="customerPhone" required maxlength="40" placeholder="Teléfono / WhatsApp" class="w-full border border-black px-4 py-3 text-sm uppercase tracking-wider outline-none focus:bg-gray-50">
              <input name="customerEmail" type="email" maxlength="120" placeholder="Correo electrónico (opcional)" class="w-full border border-black px-4 py-3 text-sm uppercase tracking-wider outline-none focus:bg-gray-50">
              <textarea name="address" required maxlength="300" rows="2" placeholder="Dirección de entrega" class="w-full border border-black px-4 py-3 text-sm uppercase tracking-wider outline-none focus:bg-gray-50 resize-none"></textarea>
              <textarea name="notes" maxlength="300" rows="2" placeholder="Notas (opcional)" class="w-full border border-black px-4 py-3 text-sm uppercase tracking-wider outline-none focus:bg-gray-50 resize-none"></textarea>
              <h2 class="font-display font-bold uppercase tracking-widest text-lg pt-4 pb-2" data-ed="coPaymentTitle">${c.coPaymentTitle || "Método de pago"}</h2>
              <div id="un-payment-box" class="space-y-3" data-paypal-enabled="${hasPaypal ? "1" : "0"}" data-paypal-client-id="${hasPaypal ? esc(pmPaypal.clientId) : ""}" data-paypal-mode="${pmPaypal.mode || "sandbox"}" data-paypal-currency="${esc(currency)}" data-payphone-enabled="${hasPayphone ? "1" : "0"}">
                <label class="flex items-start gap-3 border border-black p-4 cursor-pointer">
                  <input type="radio" name="payment" value="cod" ${defaultMethod === "cod" ? "checked" : ""} class="mt-1">
                  <span>
                    <span class="block font-bold uppercase tracking-widest text-sm" data-ed="coCodTitle">${c.coCodTitle || "Pago contra entrega"}</span>
                    <span class="block text-xs text-gray-500" data-ed="coCodDesc">${c.coCodDesc || "Abona en efectivo cuando recibas tu pedido en la dirección indicada."}</span>
                  </span>
                </label>
                ${hasPaypal ? `<label class="flex items-start gap-3 border border-black p-4 cursor-pointer">
                  <input type="radio" name="payment" value="paypal" ${defaultMethod === "paypal" ? "checked" : ""} class="mt-1">
                  <span>
                    <span class="block font-bold uppercase tracking-widest text-sm">PayPal</span>
                    <span class="block text-xs text-gray-500" data-ed="coPaypalDesc">${c.coPaypalDesc || "Pago seguro con tu cuenta de PayPal."}</span>
                  </span>
                </label>` : ""}
                ${hasPayphone ? `<label class="flex items-start gap-3 border border-black p-4 cursor-pointer">
                  <input type="radio" name="payment" value="payphone" ${defaultMethod === "payphone" ? "checked" : ""} class="mt-1">
                  <span>
                    <span class="block font-bold uppercase tracking-widest text-sm">Tarjeta / Payphone</span>
                    <span class="block text-xs text-gray-500" data-ed="coPayphoneDesc">${c.coPayphoneDesc || "Paga con tarjeta (Visa, Mastercard, Diners, Discover) o Saldo Payphone sin salir de la página."}</span>
                  </span>
                </label>` : ""}
              </div>
              <div id="un-cod-pay" class="space-y-4">
                <div class="bg-gray-50 border border-black p-4 flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0l3-3m-3 3l-3-3m3 9a9 9 0 110-18 9 9 0 010 18z" /></svg>
                  <div>
                    <p class="font-bold uppercase tracking-widest text-sm" data-ed="coCodTitle">${c.coCodTitle || "Pago contra entrega"}</p>
                    <p class="text-xs text-gray-500" data-ed="coCodDesc">${c.coCodDesc || "Abona en efectivo cuando recibas tu pedido en la dirección indicada."}</p>
                  </div>
                </div>
                <button type="submit" class="w-full bg-black text-white font-bold py-4 uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors"><span data-ed="coConfirmText">${c.coConfirmText || "Confirmar pedido"}</span> · $<span id="un-co-btn-amount">0.00</span></button>
              </div>
              ${hasPaypal ? `<div id="un-paypal-box" class="hidden space-y-3">
                <div class="bg-gray-50 border border-black p-4 flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 11c0 3.5-1.5 6-3 6s-3-2.5-3-6M12 11c3.5 0 5-1.5 5-3s-2-2-5-2m0 8c3.5 0 5 1.5 5 3s-2 2-5 2m0-8V5m0 6V3" /></svg>
                  <div>
                    <p class="font-bold uppercase tracking-widest text-sm" data-ed="coPaypalTitle">${c.coPaypalTitle || "Pago con PayPal"}</p>
                    <p class="text-xs text-gray-500" data-ed="coPaypalNote">${c.coPaypalNote || "Se abrirá PayPal para completar el pago de forma segura."}</p>
                  </div>
                </div>
                <div id="paypal-button-container" class="mt-1"></div>
                <p id="un-paypal-note" class="hidden text-xs text-gray-500"></p>
              </div>` : ""}
              ${hasPayphone ? `<div id="un-payphone-box" class="hidden space-y-3">
                <div class="bg-gray-50 border border-black p-4 flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  <div>
                    <p class="font-bold uppercase tracking-widest text-sm" data-ed="coPayphoneTitle">${c.coPayphoneTitle || "Pago con Payphone"}</p>
                    <p class="text-xs text-gray-500" data-ed="coPayphoneNote">${c.coPayphoneNote || "Paga con tarjeta de crédito, débito o Saldo Payphone. No saldrás de la página."}</p>
                  </div>
                </div>
                <div id="pp-button" class="mt-1"></div>
                <p id="un-payphone-note" class="hidden text-xs text-gray-500"></p>
              </div>` : ""}
            </form>
          </div>
          <div id="un-co-done" class="hidden text-center py-16">
            <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-green-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 class="font-display font-bold uppercase text-2xl mb-2" data-ed="coSuccessTitle">${c.coSuccessTitle || "Pedido recibido"}</h3>
            <p class="text-gray-500 mb-1">Tu pedido <span id="un-order-id" class="font-bold text-black"></span> <span data-ed="coRegisteredText">${c.coRegisteredText || "fue registrado con éxito."}</span></p>
            <p id="un-co-done-msg" class="text-gray-500 mb-8" data-ed="coCodSuccess">${c.coCodSuccess || "Pagarás en efectivo al recibirlo. Te contactaremos en breve para coordinar la entrega."}</p>
            <a href="${baseHome}" class="inline-block bg-black text-white font-bold py-3 px-8 uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors" data-ed="coContinueText">${c.coContinueText || "Seguir comprando"}</a>
          </div>
        </div>
      </div>
      ${payphoneAssets}
      ${hasPaypal ? `<script src="${paypalSdkUrl}" async></script>` : ""}`;
    }

    case "header": {
      /*
       * Encabezado de tienda con 4 diseños (solo en plantillas de e-commerce):
       *   ""         Clásico: logo a la izquierda, menú al centro, iconos a la derecha
       *   "centered" Logo centrado arriba y menú debajo
       *   "split"    Menú a la izquierda, logo al centro, iconos a la derecha
       *   "minimal"  Logo e iconos; el menú se abre en un panel (también en escritorio)
       */
      const links = c.links && c.links.length ? c.links : [
        { label: "Inicio", url: "/" },
        { label: "Catálogo", url: "#catalogo" },
        { label: "Promos", url: "#promociones" },
        { label: "Nosotros", url: "#beneficios" },
      ];
      const layout = String(c.layout || "");
      const tone = String(c.headerStyle || ""); // "" claro · "dark" oscuro · "overlay" sobre la imagen
      const isDark = tone === "dark" || tone === "overlay";
      // Fijo al bajar: "sticky" no tapa el contenido de las páginas. Sobre la imagen va "fixed".
      const stick = c.sticky === "static" ? "relative" : tone === "overlay" ? "fixed" : "sticky top-0";
      const bar = tone === "dark" ? "bg-black text-white border-b border-white/20"
        : tone === "overlay" ? "bg-black/30 backdrop-blur-md text-white border-b border-white/20"
        : "bg-white/95 backdrop-blur-md text-black border-b border-black";
      const muted = isDark ? "hover:text-gray-300" : "hover:text-gray-500";
      const panel = isDark ? "bg-black text-white border border-white/20" : "bg-white text-black border border-black";
      const logoH = c.logoSize === "sm" ? "h-8" : c.logoSize === "lg" ? "h-14" : "h-10";
      const logoText = c.logoSize === "sm" ? "text-xl" : c.logoSize === "lg" ? "text-3xl" : "text-2xl";
      const showCart = c.showCart !== "hide";
      const searchHref = c.showSearch === "show" ? (c.searchUrl || "#catalogo") : c.searchUrl;
      const closeMobile = "var m=this.closest('[data-un-header]').querySelector('[data-un-mobile]');if(m)m.classList.add('hidden')";

      const logo = `<a data-analytics-click data-analytics-type="click" data-analytics-label="logo" href="${homeUrl}" class="flex items-center gap-3 font-display font-bold ${logoText} tracking-tighter">${c.logoImage ? `<img src="${c.logoImage}" alt="${c.logoText || "URBAN NOIR"}" class="${logoH} w-auto object-contain">` : ""}${c.logoImage && c.hideLogoText ? "" : `<span>${c.logoText || "URBAN NOIR"}</span>`}</a>`;

      // Enlace del menú, con submenú desplegable si tiene "children".
      const desktopLink = (l: any) => {
        const kids = Array.isArray(l.children) ? l.children.filter((k: any) => k && k.label) : [];
        const cls = `${l.highlight ? "text-red-600 hover:text-red-700" : muted} transition font-medium`;
        if (!kids.length) return `<a href="${siteHref(l.url)}" class="${cls}">${l.label}</a>`;
        return `<div class="relative group">
          <a href="${siteHref(l.url)}" class="${cls} inline-flex items-center gap-1">${l.label}<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg></a>
          <div class="absolute left-0 top-full z-50 hidden pt-3 group-hover:block">
            <div class="${panel} min-w-[200px] py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              ${kids.map((k: any) => `<a href="${siteHref(k.url)}" class="block px-4 py-2 text-sm ${muted} transition">${k.label}</a>`).join("")}
            </div>
          </div>
        </div>`;
      };
      const mobileLink = (l: any) => {
        const kids = Array.isArray(l.children) ? l.children.filter((k: any) => k && k.label) : [];
        return `<a href="${siteHref(l.url)}" onclick="${closeMobile}" class="py-3 border-b ${isDark ? "border-white/10" : "border-gray-100"} font-bold uppercase tracking-widest text-sm ${l.highlight ? "text-red-600" : ""}">${l.label}</a>${kids.map((k: any) => `<a href="${siteHref(k.url)}" onclick="${closeMobile}" class="py-2 pl-4 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}">${k.label}</a>`).join("")}`;
      };
      const menu = (cls: string) => `<div class="${cls}">${links.map(desktopLink).join("")}</div>`;

      const icons = `<div class="flex items-center gap-4">
        ${searchHref ? `<a href="${siteHref(searchHref)}" aria-label="Buscar" class="${muted} transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </a>` : ""}
        ${showCart ? `<button type="button" id="un-cart-btn" aria-label="Carrito" class="${muted} transition relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          <span data-count class="absolute -top-1 -right-2 ${isDark ? "bg-white text-black" : "bg-black text-white"} text-[10px] font-bold px-1.5 py-0.5 rounded-full" style="display:none">0</span>
        </button>` : ""}
        <button type="button" aria-label="Menú" onclick="this.closest('[data-un-header]').querySelector('[data-un-mobile]').classList.toggle('hidden')" class="${layout === "minimal" ? "" : "md:hidden"} ${muted} transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>`;

      const row = layout === "centered"
        ? `<div class="grid grid-cols-3 items-center h-20">
            <div></div>
            <div class="flex justify-center">${logo}</div>
            <div class="flex justify-end">${icons}</div>
          </div>
          ${menu(`hidden md:flex justify-center gap-8 border-t ${isDark ? "border-white/10" : "border-gray-200"} py-3`)}`
        : layout === "split"
        ? `<div class="grid grid-cols-3 items-center h-20">
            ${menu("hidden md:flex items-center gap-6")}
            <div class="flex justify-center col-start-2">${logo}</div>
            <div class="flex justify-end col-start-3">${icons}</div>
          </div>`
        : layout === "minimal"
        ? `<div class="flex justify-between items-center h-20">${logo}${icons}</div>`
        : `<div class="flex justify-between items-center h-20">
            <div class="flex-shrink-0 flex items-center">${logo}</div>
            ${menu("hidden md:flex items-center gap-8")}
            ${icons}
          </div>`;

      const announcement = c.announcement
        ? `<div class="${c.announcementStyle === "light" ? "bg-white text-black border-b border-black" : "bg-black text-white"} text-center text-xs font-bold uppercase tracking-widest py-2 px-4">${c.announcementUrl ? `<a href="${siteHref(c.announcementUrl)}" class="hover:underline">${c.announcement}</a>` : c.announcement}</div>`
        : "";

      return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Inter:wght@400;500;700&display=swap');
        body{font-family:'Inter',sans-serif;background-color:#fcfcfc;color:#000}
        h1,h2,h3,.font-display{font-family:'Syncopate',sans-serif;text-transform:uppercase}
        ::-webkit-scrollbar{width:8px}
        ::-webkit-scrollbar-track{background:#f1f1f1}
        ::-webkit-scrollbar-thumb{background:#000}
      </style>
      <header data-un-header class="${stick} w-full z-50">
        ${announcement}
        <nav class="${bar}">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            ${row}
          </div>
          <div data-un-mobile class="hidden ${layout === "minimal" ? "" : "md:hidden"} border-t ${isDark ? "border-white/20 bg-black text-white" : "border-black bg-white text-black"} px-4 py-4 flex flex-col">
            ${links.map(mobileLink).join("")}
          </div>
        </nav>
      </header>`;
    }

    case "hero": {
      // Primera diapositiva: los campos de la sección. "slides": diapositivas adicionales.
      const first = {
        backgroundImage: c.backgroundImage || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2048&auto=format&fit=crop",
        kicker: c.kicker,
        title: c.title || "REDEFINE YOUR STREETS",
        subtitle: c.subtitle,
        buttonText: c.buttonText,
        buttonUrl: c.buttonUrl || "#catalogo",
      };
      const extra = (Array.isArray(c.slides) ? c.slides : []).map((sl: any) => ({
        backgroundImage: sl.backgroundImage || first.backgroundImage,
        kicker: sl.kicker,
        title: sl.title || "",
        subtitle: sl.subtitle,
        buttonText: sl.buttonText,
        buttonUrl: sl.buttonUrl || "#catalogo",
      }));
      const slides = [first, ...extra];
      const seconds = Number(c.autoplaySeconds ?? 6);
      // La imagen en blanco y negro es el estilo de la marca; se puede desactivar.
      const imageFilter = c.imageColor === "color" ? "none" : "grayscale(100%)";
      const imageOpacity = Math.min(100, Math.max(10, Number(c.imageOpacity ?? 60))) / 100;
      const heroId = `un-hero-${Math.random().toString(36).slice(2, 8)}`;
      // Cambia de diapositiva (también funciona en el editor: es un atributo onclick).
      const go = "var r=this.closest('[data-un-hero]'),i=+this.dataset.i;r.querySelectorAll('[data-un-slide]').forEach(function(s,j){s.style.opacity=j===i?1:0;s.style.pointerEvents=j===i?'auto':'none'});r.querySelectorAll('[data-un-dot]').forEach(function(d,j){d.style.background=j===i?'#fff':'#4b5563'});r.dataset.cur=i";
      return `
      <header id="${c.anchor || 'inicio'}" data-un-hero data-hero-id="${heroId}" class="relative h-screen overflow-hidden bg-black text-white">
        ${slides.map((sl, i) => `<div data-un-slide class="absolute inset-0 flex items-center justify-center transition-opacity duration-700" style="opacity:${i === 0 ? 1 : 0};pointer-events:${i === 0 ? "auto" : "none"}">
          <div class="absolute inset-0 z-0 bg-cover bg-center" style="background-image: url('${sl.backgroundImage}'); filter: ${imageFilter}; opacity: ${imageOpacity};"></div>
          <div class="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
            ${sl.kicker ? `<span class="tracking-[0.3em] text-sm md:text-base mb-4 block uppercase border-b border-white pb-2">${sl.kicker}</span>` : ""}
            ${sl.title ? `<h1 class="text-5xl md:text-8xl font-bold mb-6 leading-none">${nl(sl.title)}</h1>` : ""}
            ${sl.subtitle ? `<p class="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">${sl.subtitle}</p>` : ""}
            ${sl.buttonText ? `<a data-analytics-click data-analytics-type="click" data-analytics-label="hero_cta" href="${siteHref(sl.buttonUrl)}" class="bg-white text-black font-bold py-4 px-10 hover:bg-gray-300 transition-colors uppercase tracking-widest text-sm">${sl.buttonText}</a>` : ""}
          </div>
        </div>`).join("")}
        ${slides.length > 1 ? `<div class="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          ${slides.map((_, i) => `<button type="button" data-un-dot data-i="${i}" onclick="${go}" aria-label="Diapositiva ${i + 1}" class="w-3 h-3 rounded-full" style="background:${i === 0 ? "#fff" : "#4b5563"}"></button>`).join("")}
        </div>
        ${seconds > 0 ? `<script>(function(){var r=document.querySelector('[data-hero-id="${heroId}"]');if(!r)return;setInterval(function(){var n=r.querySelectorAll('[data-un-dot]');var i=((+r.dataset.cur||0)+1)%n.length;n[i].click()},${Math.max(2, seconds) * 1000});})();</script>` : ""}` : ""}
      </header>`;
    }

    case "features": {
      // "catalog": categorías con foto; "cards": tarjetas de texto; sin elegir: según haya fotos.
      const isCatalog = c.layout ? c.layout === "catalog" : (c.items || []).some((it: any) => it && it.image);
      if (isCatalog) {
        const items = c.items || [];
        return `
        <section id="${c.anchor || 'catalogo'}" class="py-24 bg-white">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <h2 class="text-4xl md:text-5xl font-bold">${nl(c.title || 'Catálogo')}</h2>
              ${c.linkText ? `<a href="${siteHref(c.linkUrl || '#')}" class="text-black font-bold uppercase tracking-wider text-sm border-b-2 border-black hover:text-gray-500 hover:border-gray-500 transition pb-1">${c.linkText}</a>` : ""}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              ${items.map((item: any) => `<a href="${siteHref(item.link || '#')}" class="group relative h-96 overflow-hidden bg-gray-100 flex items-center justify-center">
                <img src="${item.image}" alt="${item.title}" loading="lazy" class="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition duration-700">
                <div class="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-40 transition duration-700"></div>
                <div class="relative z-10 bg-white px-6 py-3 border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 class="text-xl font-bold text-black tracking-widest">${nl(item.title)}</h3>
                </div>
              </a>`).join("")}
            </div>
          </div>
        </section>`;
      }
      const items = c.items || [];
      return `
      <section id="${c.anchor || 'caracteristicas'}" class="py-24 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          ${c.title ? `<h2 class="text-center text-4xl md:text-5xl font-bold mb-4">${nl(c.title)}</h2>` : ""}
          ${c.subtitle ? `<p class="text-center text-gray-500 max-w-2xl mx-auto mb-12">${c.subtitle}</p>` : ""}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${items.map((item: any) => `<div class="bg-gray-50 border border-black p-6 text-center">
              <h3 class="text-xl font-bold text-black tracking-widest mb-2">${nl(item.title)}</h3>
              ${item.desc ? `<p class="text-gray-600">${item.desc}</p>` : ""}
            </div>`).join("")}
          </div>
        </div>
      </section>`;
    }

    case "cta": {
      if (c.newsletter) {
        return `
        <section class="py-24 bg-white text-center">
          <div class="max-w-3xl mx-auto px-4">
            <h2 class="text-4xl md:text-6xl font-bold mb-6">${nl(c.title || 'ÚNETE AL CLUB')}</h2>
            ${c.subtitle ? `<p class="text-gray-600 mb-10 text-lg">${c.subtitle}</p>` : ""}
            <form data-pub-form method="POST" action="${actionUrl}" class="flex flex-col sm:flex-row max-w-xl mx-auto gap-0 border-2 border-black p-1">
              <input type="email" name="email" required placeholder="${c.placeholder || "TU CORREO ELECTRÓNICO"}" class="flex-1 py-4 px-4 bg-transparent outline-none uppercase tracking-widest text-sm font-medium">
              <button type="submit" class="bg-black text-white font-bold py-4 px-8 hover:bg-gray-800 transition-colors uppercase tracking-widest text-sm whitespace-nowrap">${c.buttonText || 'Suscribirse'}</button>
            </form>
          </div>
        </section>`;
      }
      return `
      <section id="${c.anchor || 'promociones'}" class="py-24 bg-black text-white relative overflow-hidden">
        <div class="absolute inset-0 opacity-5 font-display font-bold text-[25vw] leading-none whitespace-nowrap overflow-hidden flex items-center pointer-events-none">${c.watermark || 'SALE SALE SALE'}</div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div class="md:w-1/2">
            ${c.kicker ? `<span class="border border-white px-3 py-1 text-xs uppercase tracking-widest mb-6 inline-block">${c.kicker}</span>` : ""}
            <h2 class="text-5xl md:text-7xl font-bold mb-6">${nl(c.title || 'HASTA 50% DE DESCUENTO')}</h2>
            ${c.subtitle ? `<p class="text-gray-400 mb-8 max-w-md text-lg">${c.subtitle}</p>` : ""}
            ${c.buttonText ? `<a data-analytics-click data-analytics-type="click" data-analytics-label="cta_block" href="${siteHref(c.buttonUrl || '#')}" class="bg-white text-black font-bold py-4 px-10 hover:bg-gray-300 transition-colors uppercase tracking-widest text-sm inline-block">${c.buttonText}</a>` : ""}
          </div>
          ${c.backgroundImage ? `<div class="md:w-1/2 flex justify-center">
            <div class="relative">
              <img src="${c.backgroundImage}" alt="${c.imageAlt || c.title || "Promociones"}" loading="lazy" class="w-full max-w-md h-auto object-cover grayscale border-4 border-white transform translate-x-4 -translate-y-4 shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] relative z-10">
              <div class="absolute inset-0 bg-white bg-opacity-20 transform translate-x-12 translate-y-4"></div>
            </div>
          </div>` : ""}
        </div>
      </section>`;
    }

    case "portfolio": {
      const items = c.items || [];
      const currency = c.currency || "$";
      return `
      <section id="${c.anchor || 'productos'}" class="py-24 bg-white border-b border-black">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-bold mb-4">${nl(c.title || 'MÁS BUSCADOS')}</h2>
            ${c.subtitle ? `<p class="text-gray-500 max-w-2xl mx-auto">${c.subtitle}</p>` : ""}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            ${items.map((item: any) => {
              const badgeDark = !String(item.tag || "").match(/[-%]|off/i);
              return `<div class="group cursor-pointer">
                <div class="relative bg-gray-100 aspect-[3/4] overflow-hidden mb-4 border border-transparent group-hover:border-black transition-colors">
                  ${item.tag ? `<span class="absolute top-4 left-4 z-10 ${badgeDark ? 'bg-black text-white' : 'bg-white text-black border border-black'} text-xs font-bold px-2 py-1 uppercase">${item.tag}</span>` : ""}
                  <img src="${item.image}" alt="${item.title}" loading="lazy" class="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500">
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button type="button" data-add-cart data-id="${esc(item.id)}" data-title="${esc(item.title)}" data-price="${esc(item.price)}" data-image="${esc(item.image)}" class="bg-black text-white px-6 py-3 uppercase tracking-widest text-xs font-bold hover:bg-white hover:text-black transition">${c.addToCartText || "Añadir al carrito"}</button>
                  </div>
                </div>
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-bold text-lg">${item.link ? `<a href="${siteHref(item.link)}" class="hover:underline">${nl(item.title)}</a>` : nl(item.title)}</h3>
                    ${item.desc ? `<p class="text-gray-500 text-sm">${item.desc}</p>` : ""}
                  </div>
                  ${item.compareAt ? `<div class="text-right">
                    <span class="font-bold text-red-600 block">${currency}${item.price}</span>
                    <span class="text-sm text-gray-400 line-through">${currency}${item.compareAt}</span>
                  </div>` : `<span class="font-bold">${currency}${item.price}</span>`}
                </div>
              </div>`;
            }).join("")}
          </div>
          ${c.buttonText ? `<div class="text-center mt-12">
            <a data-analytics-click data-analytics-type="click" data-analytics-label="portfolio_cta" href="${siteHref(c.buttonUrl || '#')}" class="inline-block border-2 border-black bg-white text-black font-bold py-3 px-8 hover:bg-black hover:text-white transition-colors uppercase tracking-widest text-sm">${c.buttonText}</a>
          </div>` : ""}
        </div>
      </section>`;
    }

    case "benefits": {
      const items = c.items || [
        { icon: "🚚", title: "Envío Gratis", desc: "En todas las órdenes superiores a $100. Entregas express disponibles globalmente." },
        { icon: "🛡️", title: "Calidad Premium", desc: "Materiales seleccionados meticulosamente para garantizar durabilidad y confort." },
        { icon: "💳", title: "Pagos Seguros", desc: "Procesamiento cifrado y múltiples opciones de pago internacional para tu tranquilidad." },
      ];
      return `
      <section id="${c.anchor || 'beneficios'}" class="py-20 bg-gray-50 border-b border-black">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-10 text-center divide-y md:divide-y-0 md:divide-x divide-gray-300">
            ${items.map((item: any) => `<div class="flex flex-col items-center pt-8 md:pt-0 px-4 group">
              <div class="w-16 h-16 bg-black text-white flex items-center justify-center rounded-full mb-6 group-hover:scale-110 transition-transform">${benefitSvg(item.icon)}</div>
              <h3 class="font-bold text-xl uppercase tracking-widest mb-2">${nl(item.title)}</h3>
              <p class="text-gray-600">${item.desc}</p>
            </div>`).join("")}
          </div>
        </div>
      </section>`;
    }

    case "footer": {
      const companyName = c.companyName || "URBAN NOIR";
      const columns = c.columns && c.columns.length ? c.columns : [
        { title: "Tienda", links: [
          { label: "Hombres", url: "#" }, { label: "Mujeres", url: "#" }, { label: "Accesorios", url: "#" }, { label: "Novedades", url: "#" }, { label: "Ofertas", url: "#" },
        ] },
        { title: "Ayuda", links: [
          { label: "FAQ", url: "#" }, { label: "Envíos y Devoluciones", url: "#" }, { label: "Rastreo de Pedido", url: "#" }, { label: "Guía de Tallas", url: "#" }, { label: "Contacto", url: "#" },
        ] },
      ];
      const social = c.social && c.social.length ? c.social : [
        { label: "Instagram", url: "#" },
        { label: "Twitter", url: "#" },
      ];
      const copyright = c.copyright || `© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.`;
      return `
      <footer class="bg-black text-white pt-20 pb-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <a href="${homeUrl}" class="font-display font-bold text-3xl tracking-tighter mb-6 block">${c.logoImage ? `<img src="${c.logoImage}" alt="${companyName}" class="h-12 w-auto object-contain">` : companyName}</a>
              <p class="text-gray-400 text-sm leading-relaxed mb-6">${c.description || "Definiendo la estética de la calle contemporánea. Menos ruido, más actitud. Diseñado para el individuo moderno."}</p>
            </div>
            ${columns.map((col: any) => `<div>
              <h4 class="font-bold uppercase tracking-widest mb-6 border-b border-gray-800 pb-2">${nl(col.title)}</h4>
              <ul class="space-y-4 text-gray-400">
                ${(col.links || []).map((l: any) => `<li><a href="${siteHref(l.url)}" class="hover:text-white transition flex items-center before:content-[''] before:w-0 before:h-0.5 before:bg-white before:transition-all hover:before:w-2 before:mr-0 hover:before:mr-2">${l.label}</a></li>`).join("")}
              </ul>
            </div>`).join("")}
            <div>
              <h4 class="font-bold uppercase tracking-widest mb-6 border-b border-gray-800 pb-2" data-ed="socialTitle">${c.socialTitle || "Síguenos"}</h4>
              <div class="flex space-x-4">
                ${social.map((s: any) => `<a data-analytics-click data-analytics-type="click" data-analytics-label="social_${s.label || 'link'}" href="${siteHref(s.url)}" aria-label="${s.label}" class="w-10 h-10 border border-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-white hover:text-black transition">${socialSvg(s.label, s.network)}</a>`).join("")}
              </div>
            </div>
          </div>
          <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>${copyright}</p>
            <div class="mt-4 md:mt-0 space-x-4 flex items-center">
              ${(c.legalLinks && c.legalLinks.length ? c.legalLinks : [
                { label: "Privacidad", url: "#" }, { label: "Términos", url: "#" },
              ]).map((l: any) => `<a href="${siteHref(l.url)}" class="hover:text-white transition">${l.label}</a>`).join("")}
            </div>
          </div>
        </div>
      </footer>`;
    }

    default:
      return null;
  }
}