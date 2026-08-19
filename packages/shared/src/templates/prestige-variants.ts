export function getPrestigeHtml(type: string, c: any, apiBaseUrl?: string, site?: any): string | null {
  if (c.variant !== "prestige") return null;

  switch (type) {
    case "header": {
      const logoType = c.logoType || "text";
      const hasImage = logoType === "image" || logoType === "both";
      const hasText = logoType === "text" || logoType === "both";
      const logoImg = hasImage && c.logoImage
        ? `<img src="${c.logoImage}" alt="${c.logoText || "PRESTIGE CORP"}" class="h-10 w-auto object-contain"/>`
        : "";
      const logoText = hasText
        ? `<span class="font-headline-md text-headline-md font-bold tracking-tighter text-primary dark:text-primary-fixed">${c.logoText || "PRESTIGE CORP"}</span>`
        : "";
      const logoEl = `<a class="flex items-center gap-3" href="#">${logoImg}${logoText}</a>`;
      return `
<header class="bg-surface/95 dark:bg-on-background/95 backdrop-blur-md sticky top-0 w-full z-50 border-b border-outline-variant/30 dark:border-outline/20 transition-all duration-300 ease-in-out">
  <nav class="flex justify-between items-center max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-20">
    ${logoEl}
    <div class="hidden md:flex space-x-gutter items-center">
      ${(c.links || []).map((l: any) => `<a class="text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors hover:bg-surface-container-low dark:hover:bg-on-surface-variant/10 px-3 py-2 rounded-DEFAULT font-body-md text-body-md" href="${l.url}">${l.label}</a>`).join("")}
    </div>
    <button data-analytics-click data-analytics-type="click" data-analytics-label="header_cta" class="hidden md:inline-flex items-center justify-center bg-primary text-on-primary hover:bg-primary/90 transition-colors px-6 py-3 rounded-lg font-label-sm text-label-sm uppercase tracking-wider">
      Consultoría
    </button>
    <button class="md:hidden text-primary">
      <span class="material-symbols-outlined">menu</span>
    </button>
  </nav>
</header>`;
    }

    case "hero":
      return `
<section class="relative min-h-[819px] flex items-center bg-surface-container-lowest pt-20">
  <div class="absolute inset-0 z-0 overflow-hidden">
    <div class="w-full h-full bg-cover bg-center opacity-40" style="background-image: url('${c.backgroundImage || ""}')"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent"></div>
  </div>
  <div class="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-padding">
    <div class="max-w-2xl">
      <span class="inline-block mb-4 px-3 py-1 bg-primary/10 text-primary rounded-[2px] font-label-sm text-label-sm uppercase tracking-wider">Consultoría Estratégica</span>
      <h1 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-background mb-6">
        ${c.title || ""}
      </h1>
      <p class="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl">
        ${c.subtitle || ""}
      </p>
      <div class="flex flex-col sm:flex-row gap-4">
        ${c.buttonText ? `<button data-analytics-click data-analytics-type="click" data-analytics-label="hero_cta" class="bg-primary text-on-primary hover:bg-primary/90 transition-colors px-8 py-4 rounded-lg font-label-sm text-label-sm uppercase tracking-wider flex items-center justify-center gap-2">
          ${c.buttonText}
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>` : ""}
        <button data-analytics-click data-analytics-type="click" data-analytics-label="hero_secondary_cta" class="border border-outline-variant text-on-background hover:bg-surface-container-low transition-colors px-8 py-4 rounded-lg font-label-sm text-label-sm uppercase tracking-wider">
          Nuestros Casos de Éxito
        </button>
      </div>
    </div>
  </div>
</section>`;

    case "services":
      return `
<section class="py-section-padding bg-surface-container-low" id="servicios">
  <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
    <div class="mb-16 md:w-1/2">
      <h2 class="font-headline-md text-headline-md text-on-background mb-4">${c.title || ""}</h2>
      <p class="font-body-md text-body-md text-on-surface-variant">${c.subtitle || ""}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
      ${(c.items || []).map((item: any) => `
      <div class="bg-surface border border-outline-variant/30 rounded-xl p-8 hover:shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition-all duration-300 flex flex-col h-full group">
        <div class="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
          <span class="material-symbols-outlined text-primary text-[28px]" data-icon="${item.icon || "insights"}" data-weight="fill" style="font-variation-settings: 'FILL' 1;">${item.icon || "insights"}</span>
        </div>
        <h3 class="font-headline-md text-[20px] leading-[28px] font-semibold text-on-background mb-3">${item.title || ""}</h3>
        <p class="font-body-md text-body-md text-on-surface-variant flex-grow mb-6">${item.desc || item.description || ""}</p>
        <a data-analytics-click data-analytics-type="click" data-analytics-label="about_cta" class="inline-flex items-center font-label-sm text-label-sm text-primary uppercase tracking-wider group-hover:underline underline-offset-4" href="#">Conocer más <span class="material-symbols-outlined text-[16px] ml-1">arrow_right_alt</span></a>
      </div>`).join("")}
    </div>
  </div>
</section>`;

    case "about":
      return `
<section class="py-section-padding bg-surface" id="nosotros">
  <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
      <div>
        <span class="inline-block mb-4 px-3 py-1 bg-primary/10 text-primary rounded-[2px] font-label-sm text-label-sm uppercase tracking-wider">Nuestra Misión</span>
        <h2 class="font-headline-md text-headline-md text-on-background mb-6">${c.title || ""}</h2>
        <p class="font-body-lg text-body-lg text-on-surface-variant mb-6">
          ${c.description || ""}
        </p>
      </div>
      <div class="relative h-[400px] rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/30">
        <div class="absolute inset-0 flex items-center justify-center text-on-surface-variant/40">
          <span class="material-symbols-outlined text-[64px]">groups</span>
        </div>
        <div class="w-full h-full bg-cover bg-center opacity-80" style="background-image: url('${c.imageUrl || ""}')"></div>
      </div>
    </div>
  </div>
</section>`;

    case "contact": {
      const actionUrl = site?.tenantId ? `${apiBaseUrl || ""}/api/v1/leads/submit/${site.tenantId}` : "#";
      return `
<section class="py-section-padding bg-surface-container-low" id="contacto">
  <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
    <div class="max-w-2xl mx-auto text-center mb-12">
      <h2 class="font-headline-md text-headline-md text-on-background mb-4">${c.title || ""}</h2>
      <p class="font-body-md text-body-md text-on-surface-variant">${c.subtitle || ""}</p>
    </div>
    <div class="max-w-xl mx-auto bg-surface p-8 rounded-xl border border-outline-variant/30 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
      <form method="POST" action="${actionUrl}" data-pub-form class="space-y-6">
        <input type="hidden" name="siteId" value="${site?.id || ""}">
        <div data-pub-form-status style="display:none;padding:12px 16px;border-radius:10px;font-size:clamp(.85rem,1.3vw,.9rem);text-align:center;font-weight:600;margin-bottom:1rem"></div>
        ${(c.fields || []).map((f: any) => `
        <div>
          <label class="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">${f.label}</label>
          ${f.type === "textarea" ? `<textarea name="${f.name}" required="${f.required ? 'required' : ''}" class="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:outline-none focus:border-primary transition-colors" placeholder="" rows="4"></textarea>` : `<input name="${f.name}" required="${f.required ? 'required' : ''}" class="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:outline-none focus:border-primary transition-colors" type="${f.type || "text"}"/>`}
        </div>`).join("")}
        <button class="w-full bg-primary text-on-primary hover:bg-primary/90 transition-colors px-8 py-4 rounded-lg font-label-sm text-label-sm uppercase tracking-wider flex items-center justify-center gap-2" type="submit">
          ${c.buttonText || "Enviar"}
          <span class="material-symbols-outlined text-[18px]">send</span>
        </button>
      </form>
    </div>
  </div>
</section>`;
    }

    case "footer":
      return `
<footer class="bg-surface-container-lowest dark:bg-on-background text-on-surface dark:text-surface-variant font-body-md text-body-md w-full py-section-padding border-t border-outline-variant dark:border-outline/20 opacity-100 hover:opacity-80 transition-opacity">
  <div class="grid grid-cols-1 md:grid-cols-4 gap-gutter max-w-container-max mx-auto px-margin-desktop">
    <div class="col-span-1 md:col-span-1">
      <div class="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed mb-4">
        ${c.companyName || "PRESTIGE CORP"}
      </div>
      <p class="text-on-surface-variant dark:text-outline-variant text-sm mb-6">
        ${c.copyright || ""}
      </p>
    </div>
    <div class="col-span-1 md:col-span-3 flex flex-wrap gap-x-8 gap-y-4 md:justify-end">
      ${c.columns?.[0]?.links?.map((l: any) => `<a class="text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed underline decoration-2 underline-offset-4 font-body-md text-body-md" href="${l.url}">${l.label}</a>`).join("") || ""}
    </div>
  </div>
</footer>`;

    default:
      return null;
  }
}
