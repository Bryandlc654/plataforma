export function getArtCulinaireHtml(type: string, c: any, apiBaseUrl?: string, site?: any): string | null {
  if (c.variant !== "art-culinaire") return null;

  switch (type) {
    case "header": {
      const logoType = c.logoType || "text";
      const hasImage = logoType === "image" || logoType === "both";
      const hasText = logoType === "text" || logoType === "both";
      const logoImg = hasImage && c.logoImage
        ? `<img src="${c.logoImage}" alt="${c.logoText || "L'ART CULINAIRE"}" class="h-10 w-auto object-contain"/>`
        : "";
      const logoText = hasText
        ? `<span class="font-headline-md text-headline-md font-bold text-primary dark:text-on-primary">${c.logoText || "L'ART CULINAIRE"}</span>`
        : "";
      const logoEl = `<a class="flex items-center gap-3" href="#">${logoImg}${logoText}</a>`;
      return `
<nav class="sticky top-0 w-full z-50 bg-surface/80 dark:bg-primary/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-outline/20">
<div class="flex justify-between items-center px-margin-desktop py-6 max-w-container-max mx-auto hidden md:flex">
    ${logoEl}
<ul class="flex gap-8 items-center">
    ${(c.links || []).map((l: any) => `<li>
        <a class="cursor-pointer transition-all active:scale-95 text-secondary dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-on-primary transition-colors font-label-sm text-label-sm uppercase tracking-widest" href="${l.url}">
            ${l.label}
        </a>
    </li>`).join("")}
</ul>
<button class="bg-primary text-on-primary px-8 py-4 font-label-sm text-label-sm uppercase tracking-widest hover:bg-on-surface-variant transition-colors rounded-none">
    ${c.buttonText || "Reservations"}
</button>
</div>
<!-- Mobile Nav Variant -->
<div class="flex md:hidden justify-between items-center px-margin-mobile py-4 w-full">
    ${logoEl}
<button class="text-primary p-2" onclick="this.closest('header, nav').querySelector('[data-mobile-menu]').classList.toggle('hidden')" aria-label="Abrir menú">
<span class="material-symbols-outlined" data-icon="menu">menu</span>
</button>
</div>
<div data-mobile-menu class="hidden md:hidden flex flex-col gap-4 bg-surface dark:bg-primary px-margin-mobile py-6">
    ${(c.links || []).map((l: any) => `<a class="text-secondary dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-on-primary transition-colors font-label-sm text-label-sm uppercase tracking-widest py-2" href="${l.url}">${l.label}</a>`).join("")}
    <button class="bg-primary text-on-primary px-8 py-4 font-label-sm text-label-sm uppercase tracking-widest hover:bg-on-surface-variant transition-colors rounded-none self-start mt-2">
        ${c.buttonText || "Reservations"}
    </button>
</div>
</nav>`;
    }

    case "hero":
      return `
<section class="relative h-screen w-full flex items-center justify-center overflow-hidden pt-20">
<div class="absolute inset-0 z-0">
<div class="w-full h-full bg-cover bg-center bg-no-repeat scale-105 hover:scale-100 transition-transform duration-[20s] ease-out" style="background-image: url('${c.backgroundImage || ""}')"></div>
<div class="absolute inset-0 bg-primary/40 backdrop-blur-[2px]"></div>
</div>
<div class="relative z-10 flex flex-col items-center text-center px-margin-mobile md:px-margin-desktop mt-20">
<h1 class="font-headline-display text-headline-display text-on-primary mb-8 max-w-4xl opacity-0 animate-fade-in-up" style="animation: fadeInUp 1s ease-out forwards; animation-delay: 0.2s;">
    ${c.title || "L'Art de Vivre"}
</h1>
<p class="font-body-lg text-body-lg text-surface-container-low mb-12 max-w-xl opacity-0 animate-fade-in-up" style="animation: fadeInUp 1s ease-out forwards; animation-delay: 0.4s;">
    ${c.subtitle || ""}
</p>
<button class="bg-surface text-primary px-10 py-5 font-label-sm text-label-sm uppercase tracking-widest hover:bg-tertiary-fixed transition-colors duration-300 rounded-none border-none opacity-0 animate-fade-in-up" style="animation: fadeInUp 1s ease-out forwards; animation-delay: 0.6s;">
    ${c.buttonText || "Book a Table"}
</button>
</div>
</section>`;

    case "about":
      return `
<section class="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto" id="experience">
<div class="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
<div class="md:col-span-5 md:col-start-1 flex flex-col gap-8 order-2 md:order-1">
<h2 class="font-headline-lg text-headline-lg md:text-headline-lg text-primary">${c.title || "Craftsmanship & Terroir"}</h2>
<div class="w-12 h-[1px] bg-tertiary-fixed-dim"></div>
<p class="font-body-lg text-body-lg text-on-surface-variant">
    ${c.description1 || ""}
</p>
<p class="font-body-md text-body-md text-secondary">
    ${c.description2 || ""}
</p>
<div class="mt-4">
<a class="inline-flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-widest text-primary hover:text-tertiary-fixed-dim transition-colors group" href="#">
    ${c.linkText || "Discover our story"}
    <span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
</a>
</div>
</div>
<div class="md:col-span-6 md:col-start-7 order-1 md:order-2">
<div class="relative aspect-[3/4] w-full group overflow-hidden">
<img class="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 ease-in-out" src="${c.imageUrl || ""}"/>
<div class="absolute inset-0 border border-outline-variant/30 m-4 pointer-events-none"></div>
</div>
</div>
</div>
</section>`;

    case "services":
      // Map to "Menu" for this template
      return `
<section class="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface-container-lowest max-w-container-max mx-auto" id="menu">
<div class="flex flex-col items-center text-center mb-16">
<h2 class="font-headline-lg text-headline-lg text-primary mb-6">${c.title || "La Carte"}</h2>
<div class="w-12 h-[1px] bg-tertiary-fixed-dim"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-x-gutter gap-y-16">
${(c.categories || []).map((cat: any) => `
<div>
<h3 class="font-headline-md text-headline-md text-primary mb-8 border-b border-outline-variant/30 pb-4">${cat.title}</h3>
<div class="flex flex-col gap-6">
  ${(cat.items || []).map((item: any) => `
  <div class="flex justify-between items-baseline group cursor-pointer relative">
  <div class="pr-4 bg-surface-container-lowest relative z-10">
  <h4 class="font-headline-md text-xl text-primary mb-1">${item.title}</h4>
  <p class="font-body-md text-body-md text-secondary">${item.description}</p>
  </div>
  <div class="font-headline-md text-xl text-primary bg-surface-container-lowest pl-4 relative z-10">${item.price}</div>
  <div class="absolute left-0 right-0 border-b border-dotted border-outline-variant/50 bottom-2 z-0 group-hover:border-primary transition-colors"></div>
  </div>`).join("")}
</div>
</div>`).join("")}
</div>
</section>`;

    case "location":
      return `
<section class="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface" id="location">
<div class="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
<div class="order-2 md:order-1 h-[400px] bg-surface-variant w-full relative flex items-center justify-center grayscale overflow-hidden group">
<span class="material-symbols-outlined text-outline text-4xl group-hover:scale-110 transition-transform">map</span>
<div class="absolute inset-0 bg-black/5"></div>
</div>
<div class="order-1 md:order-2 flex flex-col gap-8 md:pl-12">
<h2 class="font-headline-lg text-headline-lg text-primary">${c.title || "Ubicación"}</h2>
<div class="w-12 h-[1px] bg-tertiary-fixed-dim"></div>
<div class="flex flex-col gap-4">
<h3 class="font-headline-md text-xl text-primary">${c.name || "L'Art Culinaire"}</h3>
<p class="font-body-lg text-body-lg text-on-surface-variant">
    ${(c.address || "").replace(/\\n/g, '<br/>')}
</p>
</div>
<div class="flex flex-col gap-2">
<h4 class="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Hours</h4>
<p class="font-body-md text-body-md text-on-surface-variant">
    ${(c.hours || "").replace(/\\n/g, '<br/>')}
</p>
</div>
</div>
</div>
</section>`;

    case "form":
    case "contact": {
      const actionUrl = site?.tenantId ? `${apiBaseUrl || ""}/api/v1/leads/submit/${site.tenantId}` : "#";
      return `
<section class="py-section-gap px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto" id="contact">
<div class="flex flex-col items-center text-center mb-16">
<h2 class="font-headline-lg text-headline-lg text-primary mb-6">${c.title || "Formulario de Contacto"}</h2>
<div class="w-12 h-[1px] bg-tertiary-fixed-dim mb-8"></div>
<p class="font-body-lg text-body-lg text-secondary">${c.subtitle || ""}</p>
</div>
<form method="POST" action="${actionUrl}" data-pub-form class="flex flex-col gap-8">
<input type="hidden" name="siteId" value="${site?.id || ""}">
<div data-pub-form-status style="display:none;padding:12px 16px;border-radius:10px;font-size:clamp(.85rem,1.3vw,.9rem);text-align:center;font-weight:600"></div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
  ${(c.fields || []).slice(0, 2).map((f: any) => `
  <div class="flex flex-col">
  <label class="font-label-sm text-label-sm uppercase tracking-widest text-primary mb-2" for="${f.name}">${f.label}</label>
  <input name="${f.name}" required="${f.required ? 'required' : ''}" class="bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-0 py-3 font-body-md text-primary transition-colors" id="${f.name}" placeholder="${f.label}" type="${f.type || "text"}"/>
  </div>`).join("")}
</div>
${(c.fields || []).slice(2).map((f: any) => `
<div class="flex flex-col">
<label class="font-label-sm text-label-sm uppercase tracking-widest text-primary mb-2" for="${f.name}">${f.label}</label>
${f.type === "textarea" ? `
<textarea name="${f.name}" required="${f.required ? 'required' : ''}" class="bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-0 py-3 font-body-md text-primary transition-colors resize-none" id="${f.name}" placeholder="${f.label}" rows="4"></textarea>
` : `
<input name="${f.name}" required="${f.required ? 'required' : ''}" class="bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-0 py-3 font-body-md text-primary transition-colors" id="${f.name}" placeholder="${f.label}" type="${f.type || "text"}"/>
`}
</div>`).join("")}
<button class="self-center bg-primary text-on-primary px-12 py-4 font-label-sm text-label-sm uppercase tracking-widest hover:bg-on-surface-variant transition-colors rounded-none mt-4" type="submit">
    ${c.buttonText || "Send Inquiry"}
</button>
</form>
</section>`;
    }

    case "footer":
      return `
<footer class="w-full border-t border-outline-variant/10 bg-primary dark:bg-surface-container-lowest flex flex-col items-center gap-12 px-margin-desktop py-section-gap">
<div class="font-headline-md text-headline-md text-on-primary dark:text-on-background">
    ${c.companyName || "L'ART CULINAIRE"}
</div>
<div class="flex gap-8">
  ${c.columns?.[0]?.links?.map((l: any) => `<a class="font-label-sm text-label-sm uppercase tracking-widest text-on-primary/60 dark:text-on-background/60 hover:text-tertiary-fixed dark:hover:text-tertiary transition-colors duration-200" href="${l.url}">${l.label}</a>`).join("") || ""}
</div>
<div class="font-body-md text-body-md text-on-primary dark:text-on-background opacity-50">
    ${c.copyright || "© 2024 L'ART CULINAIRE. ALL RIGHTS RESERVED."}
</div>
</footer>
<style>
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>`;

    default:
      return null;
  }
}
