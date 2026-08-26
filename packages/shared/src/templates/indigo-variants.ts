/* eslint-disable @typescript-eslint/no-explicit-any */

const PLACEHOLDER_LOGO = "https://placehold.co/200x60/050505/fdcb0c?text=INDIGO";

function siteHref(url?: string) {
  if (!url || url === "#") return "#";
  return url.startsWith("/") || url.startsWith("http") ? url : `#${url}`;
}

function fieldIcon(name: string) {
  const map: Record<string, string> = {
    nombre: "bi-person", name: "bi-person", email: "bi-envelope",
    telefono: "bi-telephone", phone: "bi-telephone", mensaje: "bi-chat-dots",
    message: "bi-chat-dots", empresa: "bi-building", company: "bi-building",
    asunto: "bi-tag", subject: "bi-tag",
  };
  return map[name] || "bi-pencil";
}

function actionUrl(site?: any, apiBaseUrl?: string) {
  const host = apiBaseUrl || "https://plataforma-api-71743315793.us-central1.run.app";
  return `${host}/api/v1/leads`;
}

function footerScript() {
  return `<script>
    (function(){
      if(window._indigoFooterNav) return;
      window._indigoFooterNav = true;
      const btn = document.getElementById('footerToggle');
      const col = document.getElementById('footerCol1');
      if(!btn||!col) return;
      btn.addEventListener('click',()=>{ col.classList.toggle('max-h-0'); col.classList.toggle('max-h-96'); });
    })();
  </script>`;
}

function heroScript() {
  return `<script>
    (function(){
      if(window._indigoHeroNav) return;
      window._indigoHeroNav = true;
      const hamburger = document.getElementById('indigoHamburger');
      const nav = document.getElementById('indigoMobileNav');
      const overlay = document.getElementById('indigoNavOverlay');
      const close = document.getElementById('indigoNavClose');
      if(!hamburger||!nav) return;
      hamburger.addEventListener('click',()=>{ nav.classList.remove('max-h-0','opacity-0','pointer-events-none'); nav.classList.add('max-h-[500px]','opacity-100'); overlay.classList.remove('opacity-0','pointer-events-none'); overlay.classList.add('opacity-100'); });
      if(close) close.addEventListener('click',()=>{ nav.classList.add('max-h-0','opacity-0','pointer-events-none'); nav.classList.remove('max-h-[500px]','opacity-100'); overlay.classList.add('opacity-0','pointer-events-none'); overlay.classList.remove('opacity-100'); });
      if(overlay) overlay.addEventListener('click',()=>{ nav.classList.add('max-h-0','opacity-0','pointer-events-none'); nav.classList.remove('max-h-[500px]','opacity-100'); overlay.classList.add('opacity-0','pointer-events-none'); overlay.classList.remove('opacity-100'); });
      const links = nav.querySelectorAll('a');
      links.forEach(a => a.addEventListener('click',()=>{ nav.classList.add('max-h-0','opacity-0','pointer-events-none'); nav.classList.remove('max-h-[500px]','opacity-100'); overlay.classList.add('opacity-0','pointer-events-none'); overlay.classList.remove('opacity-100'); }));
    })();
  </script>`;
}

function marqueeScript() {
  return `<script>
    (function(){
      if(window._indigoMarquee) return;
      window._indigoMarquee = true;
      const track = document.getElementById('indigoMarqueeTrack');
      if(!track) return;
      const clone = track.innerHTML;
      track.innerHTML = clone + clone;
      let pos = 0;
      function scroll(){ pos -= 0.5; if(Math.abs(pos) >= track.scrollWidth/2) pos = 0; track.style.transform = 'translateX('+pos+'px)'; requestAnimationFrame(scroll); }
      requestAnimationFrame(scroll);
    })();
  </script>`;
}

function splitTextScript() {
  return `<script>
    (function(){
      if(window._indigoSplit) return;
      window._indigoSplit = true;
      document.querySelectorAll('[data-indigo-split]').forEach(el => {
        const text = el.textContent || '';
        el.innerHTML = '';
        [...text].forEach((ch,i) => {
          const span = document.createElement('span');
          span.textContent = ch === ' ' ? '\\u00A0' : ch;
          span.style.display = 'inline-block';
          span.style.transition = 'transform 0.3s ease '+(i*40)+'ms';
          span.addEventListener('mouseenter',()=>{ span.style.transform = 'translateY(-8px)'; });
          span.addEventListener('mouseleave',()=>{ span.style.transform = 'translateY(0)'; });
          el.appendChild(span);
        });
      });
    })();
  </script>`;
}

function downloadBtnScript() {
  return `<script>
    (function(){
      if(window._indigoDl) return;
      window._indigoDl = true;
      document.querySelectorAll('[data-indigo-dl]').forEach(btn => {
        btn.addEventListener('click', e => { e.preventDefault(); const el = btn.querySelector('[data-indigo-dl-inner]'); if(el) el.style.transform = 'translate(3px,3px)'; setTimeout(()=>{ if(el) el.style.transform = ''; },150); });
      });
    })();
  </script>`;
}

export function getIndigoHtml(type: string, c: any, apiBaseUrl?: string, site?: any): string | null {
  const INDIGO = "#fdcb0c";
  const DARK = "#050505";
  const LIGHT = "#fcfcfc";
  const GRAY = "#999999";

  const iReveal = (i: number) => `style="animation-delay:${i * 80}ms"`;

  const indigoAnchor = (anchor?: string, fallback?: string) => anchor || fallback || "";

  const indigoImgBorder = (img?: string, alt?: string) =>
    `<div class="relative w-full max-w-[480px] mx-auto lg:mx-0" style="padding:16px 0 16px 16px">
      <div class="absolute top-0 left-0 w-full h-full" style="border:2px solid ${INDIGO};transform:translate(12px,-12px);z-index:0"></div>
      <div class="relative z-10 bg-white overflow-hidden" style="box-shadow:8px 8px 0 ${INDIGO}">
        <img src="${img || 'https://placehold.co/600x800/050505/fdcb0c?text=AGENCIA'}" alt="${alt || 'Agencia'}" class="w-full h-auto object-cover aspect-[3/4]">
      </div>
    </div>`;

  const indigoKeywordOutline = (word: string) =>
    `<span class="inline-block font-black uppercase" style="font-size:clamp(3rem,8vw,7rem);-webkit-text-stroke:2px ${INDIGO};color:transparent;line-height:1;font-family:Poppins,sans-serif">${word}</span>`;

  const indigoBrutalistBtn = (text: string, href: string, primary?: boolean) =>
    `<a href="${siteHref(href)}" data-indigo-dl data-analytics-click data-analytics-type="click" data-analytics-label="indigo_${text.toLowerCase().replace(/\s/g,'_')}" class="relative inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all" style="background:${primary ? INDIGO : DARK};color:${primary ? DARK : LIGHT};border:2px solid ${INDIGO};box-shadow:4px 4px 0 ${primary ? DARK : INDIGO}" onmouseover="this.style.boxShadow='6px 6px 0 ${primary ? DARK : INDIGO}';this.style.transform='translate(-1px,-1px)'" onmouseout="this.style.boxShadow='4px 4px 0 ${primary ? DARK : INDIGO}';this.style.transform=''">${text}<span data-indigo-dl-inner class="inline-block transition-transform"><i class="bi bi-arrow-down"></i></span></a>`;

  const indigoNumber = (n: number) =>
    `<span class="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 text-sm font-bold" style="border-color:${INDIGO};color:${INDIGO}">${String(n).padStart(2, "0")}</span>`;

  switch (type) {
    case "header": {
      const links = c.links || c.navLinks || [
        { label: "Inicio", url: "#hero" },
        { label: "Agencia", url: "#agencia" },
        { label: "Servicios", url: "#servicios" },
        { label: "Portafolio", url: "#portafolio" },
        { label: "Contacto", url: "#contacto" },
      ];
      const logo = c.logoImage || site?.logoUrl || PLACEHOLDER_LOGO;
      const companyName = c.companyName || site?.name || "INDIGO";
      return `<nav class="fixed top-0 left-0 w-full z-50 transition-all duration-300" style="background:transparent" id="indigoNav">
        <div class="flex items-center justify-between px-6 py-4 lg:px-12" style="mix-blend-mode:difference">
          <a href="${siteHref(c.logoUrl || '#')}" class="flex items-center gap-3 z-10">
            <img src="${logo}" alt="${companyName}" class="h-8 w-auto" style="filter:brightness(0) invert(1)">
          </a>
          <div class="hidden lg:flex items-center gap-8">
            ${links.map((l: any) => `<a href="${siteHref(l.url)}" class="text-xs font-bold uppercase tracking-[0.25em] transition-colors" style="color:${LIGHT};font-family:Poppins,sans-serif" onmouseover="this.style.color='${INDIGO}'" onmouseout="this.style.color='${LIGHT}'">${l.label}</a>`).join("")}
            ${c.ctaUrl ? `<a href="${siteHref(c.ctaUrl)}" class="px-6 py-3 text-xs font-bold uppercase tracking-widest border-2 transition-all" style="border-color:${INDIGO};color:${INDIGO}" onmouseover="this.style.background='${INDIGO}';this.style.color='${DARK}'" onmouseout="this.style.background='transparent';this.style.color='${INDIGO}'">${c.ctaText || "Contactar"}</a>` : ''}
          </div>
          <button id="indigoHamburger" class="lg:hidden z-10 flex flex-col gap-1.5 p-2" aria-label="Menú">
            <span class="block w-6 h-0.5" style="background:${LIGHT}"></span>
            <span class="block w-4 h-0.5" style="background:${LIGHT}"></span>
          </button>
        </div>
        <div id="indigoNavOverlay" class="fixed inset-0 bg-black/60 z-40 opacity-0 pointer-events-none transition-opacity duration-300 lg:hidden"></div>
        <div id="indigoMobileNav" class="lg:hidden absolute top-full left-0 w-full max-h-0 opacity-0 pointer-events-none overflow-hidden transition-all duration-300 z-50" style="background:${DARK}">
          <div class="px-6 py-8 flex flex-col gap-6">
            <button id="indigoNavClose" class="absolute top-4 right-6 text-white text-2xl" aria-label="Cerrar">&times;</button>
            ${links.map((l: any) => `<a href="${siteHref(l.url)}" class="text-sm font-bold uppercase tracking-widest" style="color:${LIGHT};font-family:Poppins,sans-serif">${l.label}</a>`).join("")}
            ${c.ctaUrl ? `<a href="${siteHref(c.ctaUrl)}" class="mt-4 inline-block px-6 py-3 text-xs font-bold uppercase tracking-widest border-2 text-center" style="border-color:${INDIGO};color:${INDIGO}">${c.ctaText || "Contactar"}</a>` : ''}
          </div>
        </div>
        ${heroScript()}
      </nav>`;
    }

    case "hero": {
      const title = c.title || "DESARROLLAMOS";
      const subtitle = c.subtitle || "EXPERIENCIAS DIGITALES";
      const desc = c.description || "Creamos marcas, plataformas y productos que conectan con personas reales. Estrategia, diseño y tecnología bajo un mismo techo.";
      const btnText = c.buttonText || "VER PROYECTOS";
      const btnUrl = c.buttonUrl || "#portafolio";
      const secondaryText = c.secondaryButtonText || "CONTACTAR";
      const secondaryUrl = c.secondaryButtonUrl || "#contacto";
      const marqueeWords = c.marqueeWords || ["BRANDING", "DESARROLLO", "UI/UX", "CREATIVIDAD", "ESTRATEGIA", "DISEÑO"];
      return `<section id="${indigoAnchor(c.anchor, 'hero')}" class="relative min-h-screen flex items-center justify-center overflow-hidden" style="background:${DARK}">
        <div class="absolute inset-0 opacity-5" style="background-image:repeating-linear-gradient(0deg,transparent,transparent 50px,${INDIGO}22 50px,${INDIGO}22 51px),repeating-linear-gradient(90deg,transparent,transparent 50px,${INDIGO}22 50px,${INDIGO}22 51px)"></div>
        <div class="relative z-10 w-full px-6 lg:px-12 pt-32 pb-16">
          <div class="max-w-7xl mx-auto">
            <p class="text-xs font-bold uppercase tracking-[0.4em] mb-6" style="color:${INDIGO};font-family:Poppins,sans-serif" ${iReveal(0)}>${c.kicker || "AGENCIA CREATIVA"}</p>
            <h1 class="font-black uppercase leading-[0.85] tracking-tight" style="font-size:clamp(3.5rem,12vw,10rem);color:${LIGHT};font-family:Poppins,sans-serif" ${iReveal(1)}>
              <span class="block" style="mix-blend-mode:difference">${title}</span>
              <span class="block" style="mix-blend-mode:difference;color:${INDIGO}">${subtitle}</span>
            </h1>
            <div class="mt-8 max-w-md" ${iReveal(2)}>
              <p class="text-sm leading-relaxed" style="color:${GRAY}">${desc}</p>
            </div>
            <div class="mt-10 flex flex-wrap gap-4" ${iReveal(3)}>
              ${indigoBrutalistBtn(btnText, btnUrl, true)}
              ${secondaryText ? indigoBrutalistBtn(secondaryText, secondaryUrl) : ''}
            </div>
          </div>
        </div>
        <div class="relative w-full overflow-hidden py-6 border-y" style="border-color:${INDIGO}33">
          <div class="flex whitespace-nowrap" id="indigoMarqueeTrack">
            ${marqueeWords.map((w: string) => `<span class="inline-block mx-8 text-2xl lg:text-4xl font-black uppercase" style="-webkit-text-stroke:1px ${INDIGO};color:transparent;font-family:Poppins,sans-serif">${w}</span>`).join("")}
          </div>
        </div>
        ${marqueeScript()}
      </section>`;
    }

    case "about":
    case "agency": {
      const kicker = c.kicker || "AGENCIA";
      const title = c.title || "Somos un equipo que transforma ideas en realidades digitales";
      const desc = c.description || "Trabajamos con marcas ambiciosas que buscan destacar. Nuestro enfoque combina estrategia, diseño y tecnología para crear experiencias que generan resultados.";
      const img = c.imageUrl || "https://placehold.co/600x800/050505/fdcb0c?text=AGENCIA";
      const stats = c.stats || c.items || [
        { value: "120+", label: "Proyectos" },
        { value: "50+", label: "Clientes" },
        { value: "8", label: "Premios" },
        { value: "99%", label: "Satisfacción" },
      ];
      const btnText = c.buttonText || "CONOCER MÁS";
      const btnUrl = c.buttonUrl || "#servicios";
      return `<section id="${indigoAnchor(c.anchor, 'agencia')}" class="relative py-24 lg:py-32" style="background:${LIGHT}">
        <div class="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
          <div class="order-2 lg:order-1">
            <p class="text-xs font-bold uppercase tracking-[0.3em] mb-4" style="color:${INDIGO};font-family:Poppins,sans-serif">${kicker}</p>
            <h2 class="text-3xl lg:text-5xl font-black uppercase leading-tight" style="color:${DARK};font-family:Poppins,sans-serif">${title}</h2>
            <p class="mt-6 text-sm leading-relaxed" style="color:${GRAY}">${desc}</p>
            <div class="mt-10 grid grid-cols-2 gap-6">
              ${stats.map((s: any, i: number) => `<div ${iReveal(i)}>
                <div class="text-3xl lg:text-4xl font-black" style="color:${DARK};font-family:Poppins,sans-serif">${s.value || s.title}</div>
                <div class="mt-1 text-xs uppercase tracking-widest" style="color:${GRAY}">${s.label || s.desc}</div>
              </div>`).join("")}
            </div>
            ${btnText ? `<div class="mt-10">${indigoBrutalistBtn(btnText, btnUrl, true)}</div>` : ''}
          </div>
          <div class="order-1 lg:order-2">
            ${indigoImgBorder(img, title)}
          </div>
        </div>
      </section>`;
    }

    case "features":
    case "services": {
      const kicker = c.kicker || "SERVICIOS";
      const title = c.title || "Lo que hacemos";
      const desc = c.description || "";
      const items = c.items || [
        { number: "01", title: "Branding", desc: "Identidad visual, naming y estrategia de marca que conecta con tu audiencia.", icon: "bi-palette" },
        { number: "02", title: "Desarrollo", desc: "Plataformas web y apps escalables con tecnología de vanguardia.", icon: "bi-code-slash" },
        { number: "03", title: "UI/UX Design", desc: "Interfaces intuitivas y experiencias de usuario que generan resultados.", icon: "bi-phone" },
        { number: "04", title: "Estrategia", desc: "Planificación digital, SEO, content marketing y growth hacking.", icon: "bi-graph-up" },
      ];
      return `<section id="${indigoAnchor(c.anchor, 'servicios')}" class="relative py-24 lg:py-32" style="background:${DARK}">
        <div class="max-w-7xl mx-auto px-6 lg:px-12">
          <div class="max-w-2xl mb-16">
            <p class="text-xs font-bold uppercase tracking-[0.3em] mb-4" style="color:${INDIGO};font-family:Poppins,sans-serif">${kicker}</p>
            <h2 class="text-3xl lg:text-5xl font-black uppercase leading-tight" style="color:${LIGHT};font-family:Poppins,sans-serif">${title}</h2>
            ${desc ? `<p class="mt-4 text-sm leading-relaxed" style="color:${GRAY}">${desc}</p>` : ''}
          </div>
          <div class="grid md:grid-cols-2 gap-6">
            ${items.map((item: any, i: number) => `<div class="group relative p-8 lg:p-10 border transition-all duration-300" style="border-color:${INDIGO}33;animation-delay:${i * 100}ms" onmouseover="this.style.borderColor='${INDIGO}';this.style.background='${INDIGO}08'" onmouseout="this.style.borderColor='${INDIGO}33';this.style.background='transparent'">
              <div class="flex items-start justify-between mb-6">
                ${indigoNumber(i + 1)}
                <i class="bi ${item.icon || 'bi-stars'} text-2xl" style="color:${INDIGO}"></i>
              </div>
              <h3 class="text-xl lg:text-2xl font-black uppercase" style="color:${LIGHT};font-family:Poppins,sans-serif">${item.title || item.name}</h3>
              <p class="mt-3 text-sm leading-relaxed" style="color:${GRAY}">${item.desc || item.description || ''}</p>
            </div>`).join("")}
          </div>
        </div>
      </section>`;
    }

    case "process": {
      const kicker = c.kicker || "PROCESO";
      const title = c.title || "Cómo trabajamos";
      const items = c.items || [
        { number: "01", title: "Briefing", desc: "Entendemos tu marca, objetivos y público para definir la hoja de ruta." },
        { number: "02", title: "Concepto", desc: "Exploramos ideas, moodboards y direcciones creativas hasta encontrar la correcta." },
        { number: "03", title: "Desarrollo", desc: "Diseñamos y construimos tu proyecto con metodologías ágiles y entrega continua." },
        { number: "04", title: "Lanzamiento", desc: "Publicamos, medimos y optimizamos para asegurar el mejor resultado." },
      ];
      return `<section id="${indigoAnchor(c.anchor, 'proceso')}" class="relative py-24 lg:py-32" style="background:${LIGHT}">
        <div class="max-w-7xl mx-auto px-6 lg:px-12">
          <div class="max-w-2xl mb-16">
            <p class="text-xs font-bold uppercase tracking-[0.3em] mb-4" style="color:${INDIGO};font-family:Poppins,sans-serif">${kicker}</p>
            <h2 class="text-3xl lg:text-5xl font-black uppercase leading-tight" style="color:${DARK};font-family:Poppins,sans-serif">${title}</h2>
          </div>
          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            ${items.map((item: any, i: number) => `<div class="relative" ${iReveal(i)}>
              <div class="mb-4">${indigoNumber(i + 1)}</div>
              <h3 class="text-lg font-black uppercase" style="color:${DARK};font-family:Poppins,sans-serif">${item.title || item.name}</h3>
              <p class="mt-2 text-sm leading-relaxed" style="color:${GRAY}">${item.desc || item.description || ''}</p>
              ${i < items.length - 1 ? `<div class="hidden lg:block absolute top-6 left-[calc(100%+8px)] w-8 h-px" style="background:${INDIGO}44"></div>` : ''}
            </div>`).join("")}
          </div>
        </div>
      </section>`;
    }

    case "stats": {
      const items = c.items || [
        { value: "120+", label: "Proyectos entregados", icon: "bi-folder" },
        { value: "50+", label: "Clientes satisfechos", icon: "bi-people" },
        { value: "8", label: "Premios ganados", icon: "bi-award" },
        { value: "99%", label: "Tasa de satisfacción", icon: "bi-heart" },
      ];
      return `<section class="relative py-16 lg:py-20 border-y" style="border-color:${INDIGO}22;background:${DARK}">
        <div class="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
          ${items.map((item: any, i: number) => `<div class="text-center" ${iReveal(i)}>
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full border mb-4" style="border-color:${INDIGO}44">
              <i class="bi ${item.icon || 'bi-star'}" style="color:${INDIGO}"></i>
            </div>
            <div class="text-3xl lg:text-4xl font-black" style="color:${LIGHT};font-family:Poppins,sans-serif">${item.value || item.title}</div>
            <div class="mt-1 text-xs uppercase tracking-widest" style="color:${GRAY}">${item.label || item.desc}</div>
          </div>`).join("")}
        </div>
      </section>`;
    }

    case "portfolio": {
      const kicker = c.kicker || "PORTAFOLIO";
      const title = c.title || "Proyectos destacados";
      const items = c.items || c.images || [
        { image: "https://placehold.co/800x600/050505/fdcb0c?text=PROYECTO+1", title: "E-Commerce", tag: "Branding + Web", link: "#" },
        { image: "https://placehold.co/800x600/fdcb0c/050505?text=PROYECTO+2", title: "App Móvil", tag: "UI/UX + Dev", link: "#" },
        { image: "https://placehold.co/800x600/1a1a1a/fdcb0c?text=PROYECTO+3", title: "Dashboard", tag: "Producto", link: "#" },
        { image: "https://placehold.co/800x600/050505/fdcb0c?text=PROYECTO+4", title: "Landing Page", tag: "Web", link: "#" },
      ];
      const btnText = c.buttonText || "VER TODOS";
      const btnUrl = c.buttonUrl || "#contacto";
      return `<section id="${indigoAnchor(c.anchor, 'portafolio')}" class="relative py-24 lg:py-32" style="background:${DARK}">
        <div class="max-w-7xl mx-auto px-6 lg:px-12">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.3em] mb-4" style="color:${INDIGO};font-family:Poppins,sans-serif">${kicker}</p>
              <h2 class="text-3xl lg:text-5xl font-black uppercase leading-tight" style="color:${LIGHT};font-family:Poppins,sans-serif">${title}</h2>
            </div>
            ${btnText ? `<div>${indigoBrutalistBtn(btnText, btnUrl)}</div>` : ''}
          </div>
          <div class="grid md:grid-cols-2 gap-6">
            ${items.map((item: any, i: number) => `<a href="${siteHref(item.link || '#')}" class="group relative aspect-[4/3] overflow-hidden border transition-all duration-300" style="border-color:${INDIGO}22;animation-delay:${i * 100}ms" onmouseover="this.style.borderColor='${INDIGO}'" onmouseout="this.style.borderColor='${INDIGO}22'">
              <img src="${item.image || item.url || item.src || ''}" alt="${item.title || item.alt || 'Proyecto'}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
              <div class="absolute inset-0 flex flex-col justify-end p-6 transition-opacity duration-300" style="background:linear-gradient(transparent,${DARK}ee)">
                ${item.tag ? `<span class="text-[10px] font-bold uppercase tracking-widest mb-2" style="color:${INDIGO}">${item.tag}</span>` : ''}
                <h3 class="text-lg font-black uppercase" style="color:${LIGHT};font-family:Poppins,sans-serif">${item.title || item.name}</h3>
              </div>
              <div class="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style="background:${INDIGO}">
                <i class="bi bi-arrow-up-right" style="color:${DARK}"></i>
              </div>
            </a>`).join("")}
          </div>
        </div>
      </section>`;
    }

    case "testimonials": {
      const kicker = c.kicker || "TESTIMONIOS";
      const title = c.title || "Lo que dicen nuestros clientes";
      const items = c.items || [
        { name: "María González", role: "CEO, TechStart", quote: "Transformaron completamente nuestra presencia digital. El resultado superó todas nuestras expectativas.", rating: 5 },
        { name: "Carlos Ruiz", role: "Director, InnovaLab", quote: "Un equipo profesional, creativo y comprometido. Entregaron antes de plazo y con calidad excepcional.", rating: 5 },
        { name: "Ana Torres", role: "CMO, GrowthCo", quote: "La mejor inversión que hicimos. Nuestras métricas mejoraron un 300% después del rediseño.", rating: 5 },
      ];
      return `<section id="${indigoAnchor(c.anchor, 'testimonios')}" class="relative py-24 lg:py-32" style="background:${LIGHT}">
        <div class="max-w-7xl mx-auto px-6 lg:px-12">
          <div class="text-center max-w-2xl mx-auto mb-14">
            <p class="text-xs font-bold uppercase tracking-[0.3em] mb-4" style="color:${INDIGO};font-family:Poppins,sans-serif">${kicker}</p>
            <h2 class="text-3xl lg:text-5xl font-black uppercase leading-tight" style="color:${DARK};font-family:Poppins,sans-serif">${title}</h2>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            ${items.map((item: any, i: number) => `<div class="relative p-8 border transition-all duration-300" style="border-color:${INDIGO}22;animation-delay:${i * 100}ms" onmouseover="this.style.borderColor='${INDIGO}'" onmouseout="this.style.borderColor='${INDIGO}22'">
              <div class="flex gap-1 mb-4">
                ${Array.from({length: item.rating || 5}).map(() => `<i class="bi bi-star-fill text-sm" style="color:${INDIGO}"></i>`).join("")}
              </div>
              <blockquote class="text-sm leading-relaxed" style="color:${DARK}">"${item.quote || item.description || ''}"</blockquote>
              <div class="mt-6 pt-6 border-t" style="border-color:${INDIGO}22">
                <div class="font-bold text-sm" style="color:${DARK};font-family:Poppins,sans-serif">${item.name}</div>
                <div class="text-xs mt-0.5" style="color:${GRAY}">${item.role}</div>
              </div>
            </div>`).join("")}
          </div>
        </div>
      </section>`;
    }

    case "cta":
    case "contact": {
      const kicker = c.kicker || "CONTACTO";
      const title = c.title || "Trabajemos juntos";
      const desc = c.description || "Cuéntanos tu proyecto y te responderemos en menos de 24 horas.";
      return `<section id="${indigoAnchor(c.anchor, 'contacto')}" class="relative py-24 lg:py-32" style="background:${DARK}">
        <div class="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.3em] mb-4" style="color:${INDIGO};font-family:Poppins,sans-serif">${kicker}</p>
            <h2 class="text-3xl lg:text-5xl font-black uppercase leading-tight" style="color:${LIGHT};font-family:Poppins,sans-serif">${title}</h2>
            <p class="mt-4 text-sm leading-relaxed" style="color:${GRAY}">${desc}</p>
            <div class="mt-10 space-y-4">
              ${c.phone ? `<div class="flex items-center gap-4 text-sm" style="color:${LIGHT}"><i class="bi bi-telephone" style="color:${INDIGO}"></i>${c.phone}</div>` : ''}
              ${c.email ? `<div class="flex items-center gap-4 text-sm" style="color:${LIGHT}"><i class="bi bi-envelope" style="color:${INDIGO}"></i>${c.email}</div>` : ''}
              ${c.address ? `<div class="flex items-center gap-4 text-sm" style="color:${LIGHT}"><i class="bi bi-geo-alt" style="color:${INDIGO}"></i>${c.address}</div>` : ''}
            </div>
          </div>
          <form id="contactForm" method="POST" action="${actionUrl(site, apiBaseUrl)}" data-pub-form class="p-8 lg:p-10 border" style="border-color:${INDIGO}33">
            <div class="space-y-5">
              ${(c.fields && c.fields.length ? c.fields : [
                { label: "Nombre", name: "nombre", type: "text", required: true },
                { label: "Email", name: "email", type: "email", required: true },
                { label: "Teléfono", name: "telefono", type: "tel", required: false },
              ]).filter((f: any) => f.type !== 'textarea').map((f: any) => `<div>
                <label class="block text-[10px] font-bold uppercase tracking-widest mb-2" style="color:${GRAY}">${f.label}</label>
                <input type="${f.type || 'text'}" name="${f.name}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}" class="w-full px-4 py-3 text-sm border outline-none transition-colors" style="border-color:${INDIGO}33;background:transparent;color:${LIGHT}" onfocus="this.style.borderColor='${INDIGO}'" onblur="this.style.borderColor='${INDIGO}33'">
              </div>`).join("")}
              ${(c.fields && c.fields.length ? c.fields : []).filter((f: any) => f.type === 'textarea').map((f: any) => `<div>
                <label class="block text-[10px] font-bold uppercase tracking-widest mb-2" style="color:${GRAY}">${f.label}</label>
                <textarea name="${f.name}" rows="4" ${f.required ? 'required' : ''} class="w-full px-4 py-3 text-sm border outline-none transition-colors resize-none" style="border-color:${INDIGO}33;background:transparent;color:${LIGHT}" onfocus="this.style.borderColor='${INDIGO}'" onblur="this.style.borderColor='${INDIGO}33'" placeholder="${f.placeholder || ''}">${f.value || ''}</textarea>
              </div>`).join("") || `<div>
                <label class="block text-[10px] font-bold uppercase tracking-widest mb-2" style="color:${GRAY}">Mensaje</label>
                <textarea name="mensaje" rows="4" required class="w-full px-4 py-3 text-sm border outline-none transition-colors resize-none" style="border-color:${INDIGO}33;background:transparent;color:${LIGHT}" onfocus="this.style.borderColor='${INDIGO}'" onblur="this.style.borderColor='${INDIGO}33'" placeholder="Cuéntanos tu proyecto..."></textarea>
              </div>`}
              <div data-pub-form-status style="display:none;padding:12px 16px;font-size:14px;border:1px solid ${INDIGO}33;color:${LIGHT}"></div>
              <button data-analytics-click data-analytics-type="click" data-analytics-label="indigo_contact_submit" type="submit" class="w-full py-4 text-xs font-bold uppercase tracking-widest border-2 transition-all" style="border-color:${INDIGO};color:${DARK};background:${INDIGO}" onmouseover="this.style.boxShadow='4px 4px 0 ${LIGHT}'" onmouseout="this.style.boxShadow='none'">
                ENVIAR <i class="bi bi-send ml-2"></i>
              </button>
            </div>
          </form>
        </div>
      </section>`;
    }

    case "footer": {
      const companyName = c.companyName || site?.name || "INDIGO";
      const logo = c.logoImage || site?.logoUrl || PLACEHOLDER_LOGO;
      const links = c.links || c.navLinks || [
        { label: "Inicio", url: "#hero" },
        { label: "Agencia", url: "#agencia" },
        { label: "Servicios", url: "#servicios" },
        { label: "Portafolio", url: "#portafolio" },
        { label: "Contacto", url: "#contacto" },
      ];
      const social = c.social || [
        { icon: "bi-instagram", url: "#", label: "Instagram" },
        { icon: "bi-linkedin", url: "#", label: "LinkedIn" },
        { icon: "bi-dribbble", url: "#", label: "Dribbble" },
        { icon: "bi-behance", url: "#", label: "Behance" },
      ];
      const copyright = c.copyright || `© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.`;
      return `<footer class="relative py-16 lg:py-20 border-t" style="border-color:${INDIGO}22;background:${DARK}">
        <div class="max-w-7xl mx-auto px-6 lg:px-12">
          <div class="grid md:grid-cols-3 gap-12 pb-12 border-b" style="border-color:${INDIGO}11">
            <div>
              <img src="${logo}" alt="${companyName}" class="h-8 w-auto mb-4" style="filter:brightness(0) invert(1)">
              <p class="text-xs leading-relaxed max-w-xs" style="color:${GRAY}">${c.description || 'Agencia creativa especializada en diseño, desarrollo y estrategia digital.'}</p>
            </div>
            <div>
              <button id="footerToggle" class="md:hidden flex items-center justify-between w-full text-xs font-bold uppercase tracking-widest pb-4 border-b md:cursor-default" style="color:${LIGHT};border-color:${INDIGO}33">
                Navegación <i class="bi bi-chevron-down md:hidden" style="color:${INDIGO}"></i>
              </button>
              <div id="footerCol1" class="max-h-0 md:max-h-none overflow-hidden transition-all duration-300">
                <ul class="mt-4 md:mt-0 space-y-3">
                  ${links.map((l: any) => `<li><a href="${siteHref(l.url)}" class="text-xs uppercase tracking-widest transition-colors" style="color:${GRAY}" onmouseover="this.style.color='${INDIGO}'" onmouseout="this.style.color='${GRAY}'">${l.label}</a></li>`).join("")}
                </ul>
              </div>
            </div>
            <div>
              <div class="text-xs font-bold uppercase tracking-widest mb-4" style="color:${LIGHT}">Social</div>
              <div class="flex gap-3">
                ${social.map((s: any) => `<a href="${s.url || '#'}" class="w-10 h-10 flex items-center justify-center border transition-all" style="border-color:${INDIGO}33;color:${GRAY}" onmouseover="this.style.borderColor='${INDIGO}';this.style.color='${INDIGO}'" onmouseout="this.style.borderColor='${INDIGO}33';this.style.color='${GRAY}'" aria-label="${s.label || s.icon}"${s.url && s.url !== '#' ? ' target="_blank" rel="noopener"' : ''}><i class="bi ${s.icon || 'bi-link'}"></i></a>`).join("")}
              </div>
            </div>
          </div>
          <div class="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p class="text-[10px] uppercase tracking-widest" style="color:${GRAY}">${copyright}</p>
            <p class="text-[10px] uppercase tracking-widest" style="color:${GRAY}">Hecho por <a href="https://icebergup.com" target="_blank" rel="noopener" style="color:${INDIGO}">Iceberg Agency</a></p>
          </div>
        </div>
        ${footerScript()}
      </footer>`;
    }

    case "gallery": {
      const kicker = c.kicker || "GALERÍA";
      const title = c.title || "Nuestro trabajo";
      const images = c.images || [
        { url: "https://placehold.co/600x400/050505/fdcb0c?text=1" },
        { url: "https://placehold.co/600x400/fdcb0c/050505?text=2" },
        { url: "https://placehold.co/600x400/1a1a1a/fdcb0c?text=3" },
        { url: "https://placehold.co/600x400/050505/fdcb0c?text=4" },
        { url: "https://placehold.co/600x400/fdcb0c/050505?text=5" },
        { url: "https://placehold.co/600x400/1a1a1a/fdcb0c?text=6" },
      ];
      return `<section id="${indigoAnchor(c.anchor, 'galeria')}" class="relative py-24 lg:py-32" style="background:${LIGHT}">
        <div class="max-w-7xl mx-auto px-6 lg:px-12">
          <div class="text-center max-w-2xl mx-auto mb-14">
            <p class="text-xs font-bold uppercase tracking-[0.3em] mb-4" style="color:${INDIGO};font-family:Poppins,sans-serif">${kicker}</p>
            <h2 class="text-3xl lg:text-5xl font-black uppercase leading-tight" style="color:${DARK};font-family:Poppins,sans-serif">${title}</h2>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            ${images.map((img: any, i: number) => `<div class="relative aspect-[4/3] overflow-hidden border transition-all duration-300" style="border-color:${INDIGO}11;animation-delay:${i * 60}ms" onmouseover="this.style.borderColor='${INDIGO}'" onmouseout="this.style.borderColor='${INDIGO}11'">
              <img src="${img.url || img.src || ''}" alt="${img.alt || 'Galería'}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105">
            </div>`).join("")}
          </div>
        </div>
      </section>`;
    }

    case "video": {
      return `<section id="${indigoAnchor(c.anchor, 'video')}" class="relative py-24 lg:py-32" style="background:${DARK}">
        <div class="max-w-5xl mx-auto px-6 lg:px-12">
          <div class="relative aspect-video border overflow-hidden" style="border-color:${INDIGO}33">
            ${c.videoUrl ? `<iframe src="${c.videoUrl}" class="w-full h-full" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe>` : `<img src="${c.thumbnail || c.imageUrl || 'https://placehold.co/1280x720/050505/fdcb0c?text=VIDEO'}" alt="${c.title || 'Video'}" class="w-full h-full object-cover">`}
            ${!c.videoUrl ? `<div class="absolute inset-0 flex items-center justify-center"><div class="w-20 h-20 rounded-full flex items-center justify-center" style="background:${INDIGO};box-shadow:0 0 40px ${INDIGO}66"><i class="bi bi-play-fill text-3xl" style="color:${DARK}"></i></div></div>` : ''}
          </div>
        </div>
      </section>`;
    }

    case "image": {
      return `<section id="${indigoAnchor(c.anchor, 'imagen')}" class="relative py-16" style="background:${c.background === 'dark' ? DARK : LIGHT}">
        <div class="max-w-5xl mx-auto px-6 lg:px-12">
          <div class="border overflow-hidden" style="border-color:${INDIGO}22;box-shadow:8px 8px 0 ${INDIGO}22">
            <img src="${c.imageUrl || 'https://placehold.co/1200x600/050505/fdcb0c?text=IMAGEN'}" alt="${c.title || c.alt || 'Imagen'}" class="w-full h-auto object-cover" loading="lazy">
          </div>
          ${c.caption ? `<p class="mt-4 text-xs text-center uppercase tracking-widest" style="color:${GRAY}">${c.caption}</p>` : ''}
        </div>
      </section>`;
    }

    case "form": {
      const kicker = c.kicker || "FORMULARIO";
      const title = c.title || "Contáctanos";
      return `<section id="${indigoAnchor(c.anchor, 'formulario')}" class="relative py-24 lg:py-32" style="background:${c.background === 'dark' ? DARK : LIGHT}">
        <div class="max-w-2xl mx-auto px-6 lg:px-12">
          <div class="text-center mb-10">
            <p class="text-xs font-bold uppercase tracking-[0.3em] mb-4" style="color:${INDIGO};font-family:Poppins,sans-serif">${kicker}</p>
            <h2 class="text-3xl lg:text-4xl font-black uppercase" style="color:${c.background === 'dark' ? LIGHT : DARK};font-family:Poppins,sans-serif">${title}</h2>
          </div>
          <form method="POST" action="${actionUrl(site, apiBaseUrl)}" data-pub-form class="p-8 lg:p-10 border" style="border-color:${INDIGO}33;background:${c.background === 'dark' ? DARK : LIGHT}">
            <div class="space-y-5">
              ${(c.fields && c.fields.length ? c.fields : [
                { label: "Nombre", name: "nombre", type: "text", required: true },
                { label: "Email", name: "email", type: "email", required: true },
                { label: "Mensaje", name: "mensaje", type: "textarea", required: true },
              ]).filter((f: any) => f.type !== 'textarea').map((f: any) => `<div>
                <label class="block text-[10px] font-bold uppercase tracking-widest mb-2" style="color:${GRAY}">${f.label}</label>
                <input type="${f.type || 'text'}" name="${f.name}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}" class="w-full px-4 py-3 text-sm border outline-none transition-colors" style="border-color:${INDIGO}33;background:transparent;color:${c.background === 'dark' ? LIGHT : DARK}" onfocus="this.style.borderColor='${INDIGO}'" onblur="this.style.borderColor='${INDIGO}33'">
              </div>`).join("")}
              ${(c.fields && c.fields.length ? c.fields : []).filter((f: any) => f.type === 'textarea').map((f: any) => `<div>
                <label class="block text-[10px] font-bold uppercase tracking-widest mb-2" style="color:${GRAY}">${f.label}</label>
                <textarea name="${f.name}" rows="4" ${f.required ? 'required' : ''} class="w-full px-4 py-3 text-sm border outline-none transition-colors resize-none" style="border-color:${INDIGO}33;background:transparent;color:${c.background === 'dark' ? LIGHT : DARK}" onfocus="this.style.borderColor='${INDIGO}'" onblur="this.style.borderColor='${INDIGO}33'" placeholder="${f.placeholder || ''}">${f.value || ''}</textarea>
              </div>`).join("")}
              <div data-pub-form-status style="display:none;padding:12px 16px;font-size:14px;border:1px solid ${INDIGO}33;color:${c.background === 'dark' ? LIGHT : DARK}"></div>
              <button data-analytics-click data-analytics-type="click" data-analytics-label="indigo_form_submit" type="submit" class="w-full py-4 text-xs font-bold uppercase tracking-widest border-2 transition-all" style="border-color:${INDIGO};color:${DARK};background:${INDIGO}" onmouseover="this.style.boxShadow='4px 4px 0 ${c.background === 'dark' ? LIGHT : DARK}'" onmouseout="this.style.boxShadow='none'">
                ENVIAR <i class="bi bi-send ml-2"></i>
              </button>
            </div>
          </form>
        </div>
      </section>`;
    }

    case "whatsapp": {
      const phone = c.phone || c.phoneNumber || "";
      const msg = c.message || "Hola, me interesa su servicio";
      if (!phone) return null;
      const encoded = encodeURIComponent(msg);
      return `<a href="https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encoded}" target="_blank" rel="noopener" class="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110" style="background:${INDIGO};box-shadow:4px 4px 0 ${DARK}" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="${DARK}" width="24" height="24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>`;
    }

    case "sorteo-form": {
      return `<section id="${indigoAnchor(c.anchor, 'sorteo')}" class="relative py-24 lg:py-32" style="background:${DARK}">
        <div class="max-w-2xl mx-auto px-6 lg:px-12 text-center">
          <p class="text-xs font-bold uppercase tracking-[0.3em] mb-4" style="color:${INDIGO};font-family:Poppins,sans-serif">${c.kicker || "SORTEO"}</p>
          <h2 class="text-3xl lg:text-5xl font-black uppercase" style="color:${LIGHT};font-family:Poppins,sans-serif">${c.title || "Participa y gana"}</h2>
          ${c.description ? `<p class="mt-4 text-sm" style="color:${GRAY}">${c.description}</p>` : ''}
        </div>
      </section>`;
    }

    default:
      return null;
  }
}
