const PLACEHOLDER_LOGO = "https://placehold.co/200x80/ffffff/0f172a?text=Logo";

function toGoogleMapsEmbed(url: string): string {
  if (!url) return "";
  if (url.includes("maps.google.com/maps/embed") || url.includes("www.google.com/maps/embed")) return url;
  if (url.includes("output=embed") && url.includes("maps.google.com")) return url.replace("www.google.com", "maps.google.com");
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return `https://maps.google.com/maps?q=${atMatch[1]},${atMatch[2]}&z=15&output=embed`;
  const placeMatch = url.match(/place\/([^/@]+)/);
  if (placeMatch) return `https://maps.google.com/maps?q=${encodeURIComponent(placeMatch[1].replace(/\+/g, " "))}&z=15&output=embed`;
  const queryMatch = url.match(/[?&]q=([^&]+)/);
  if (queryMatch) return `https://maps.google.com/maps?q=${decodeURIComponent(queryMatch[1])}&z=15&output=embed`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&z=15&output=embed`;
}

export function getRodriplastHtml(type: string, c: any, apiBaseUrl?: string, site?: any): string | null {
  if (c.variant !== "rodriplast") return null;

  const fieldIcon = (name: string) => {
    const n = (name || "").toLowerCase();
    if (/nombre|name/.test(n)) return "bi-person";
    if (/empresa|company/.test(n)) return "bi-building";
    if (/correo|email/.test(n)) return "bi-envelope";
    if (/telefono|phone|tel/.test(n)) return "bi-telephone";
    if (/producto|product/.test(n)) return "bi-box-arrow-up-right";
    return "bi-pencil";
  };

  const renderReveal = (i: number) => (i % 4 === 0 ? "reveal" : `reveal-${i}`);

  const actionUrl = site?.tenantId ? `${apiBaseUrl || ""}/api/v1/leads/submit/${site.tenantId}` : "#";

  const siteBase = !site?.domain && site?.subdomain ? `/${String(site.subdomain).replace(/^\/+/, "")}` : "";
  const siteHref = (url: string): string => {
    if (!url || url === "#") return url || "#";
    if (/^(https?:)?\/\//.test(url) || /^(mailto|tel|javascript):/i.test(url)) return url;
    if (url.startsWith("#")) return url;
    if (url.startsWith("/")) return `${siteBase}${url}`;
    return url;
  };

  switch (type) {
    case "header": {
      const links = c.links && c.links.length ? c.links : [
        { label: "Inicio", url: "#inicio" },
        { label: "Nosotros", url: "#nosotros" },
        { label: "Productos", url: "#productos" },
        { label: "Testimonios", url: "#clientes" },
        { label: "Contacto", url: "#contacto" },
      ];
      const ctaText = c.ctaText || "Solicitar cotización";
      const ctaUrl = c.ctaUrl || "#contacto";
      const logo = c.logoImage || site?.logoUrl || PLACEHOLDER_LOGO;
      const logoScrolled = c.logoScrolled || "";
      return `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
      <style>
        .logo-top { display: block; }
        .logo-scrolled { display: none; }
        .scrolled .logo-top { display: none; }
        .scrolled .logo-scrolled { display: block; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; scroll-behavior: smooth; }
        html, body { max-width: 100vw; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 6px }
        ::-webkit-scrollbar-track { background: #f1f5f9 }
        ::-webkit-scrollbar-thumb { background: #4fad33; border-radius: 3px }
        .container-x { max-width: 1280px; margin: 0 auto; padding-left: 1.5rem; padding-right: 1.5rem; }
        .glass { background: rgba(255,255,255,.1); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,.15); }
        .text-gradient { background: linear-gradient(135deg, #4fad33, #84cc16); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .bg-gradient-rodri-primary { background: linear-gradient(135deg, #4fad33, #3d8f29); }
        .shadow-elegant { box-shadow: 0 4px 24px rgba(79,173,51,.15); }
        .shadow-soft { box-shadow: 0 2px 12px rgba(0,0,0,.06); }
        .bg-hero-overlay { background: linear-gradient(135deg, rgba(15,23,42,.7), rgba(15,23,42,.3)); }
        .reveal { opacity: 0; transform: translateY(40px); transition: opacity .8s ease, transform .8s ease; }
        .reveal.in-view { opacity: 1; transform: translateY(0); }
        .reveal-1 { opacity: 0; transform: translateY(40px); transition: opacity .8s ease .1s, transform .8s ease .1s; }
        .reveal-1.in-view { opacity: 1; transform: translateY(0); }
        .reveal-2 { opacity: 0; transform: translateY(40px); transition: opacity .8s ease .2s, transform .8s ease .2s; }
        .reveal-2.in-view { opacity: 1; transform: translateY(0); }
        .reveal-3 { opacity: 0; transform: translateY(40px); transition: opacity .8s ease .3s, transform .8s ease .3s; }
        .reveal-3.in-view { opacity: 1; transform: translateY(0); }
        .reveal-left { opacity: 0; transform: translateX(-40px); transition: opacity .8s ease, transform .8s ease; }
        .reveal-left.in-view { opacity: 1; transform: translateX(0); }
        .reveal-right { opacity: 0; transform: translateX(40px); transition: opacity .8s ease, transform .8s ease; }
        .reveal-right.in-view { opacity: 1; transform: translateX(0); }
        .animate-fade-up { animation: fadeUp .8s ease forwards; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        .counter-value { display: inline-block; }
        .marquee-track { animation: marquee 45s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .clients-marquee { animation: clientsMarquee 40s linear infinite; }
        .clients-marquee:hover { animation-play-state: paused; }
        @keyframes clientsMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .reveal, .reveal-1, .reveal-2, .reveal-3, .reveal-left, .reveal-right { opacity: 1; transform: none; } }
      </style>
      <header id="navHeader" class="fixed top-0 inset-x-0 z-50 transition-all duration-500 bg-transparent border-b border-white/10">
        <div class="container-x flex items-center justify-between h-18 py-3">
            <a href="#inicio" class="flex items-center gap-2 group">
                <img id="navLogoTop" src="${logo}" alt="${c.logoText || 'Rodriplast'}" class="logo-top h-14 w-auto object-contain transition-all duration-500">
                ${logoScrolled ? `<img id="navLogoScrolled" src="${logoScrolled}" alt="${c.logoText || 'Rodriplast'}" class="logo-scrolled h-12 w-auto object-contain transition-all duration-500">` : `<img id="navLogoScrolled" src="${logo}" alt="${c.logoText || 'Rodriplast'}" class="logo-scrolled h-12 w-auto object-contain transition-all duration-500">`}
            </a>
            <nav class="hidden lg:flex items-center gap-7">
                ${links.map((l: any) => `<a href="${siteHref(l.url)}" class="nav-link text-sm font-medium text-white/85 hover:text-white transition-colors">${l.label}</a>`).join("")}
            </nav>
            <a href="${siteHref(ctaUrl)}" class="hidden lg:inline-flex items-center gap-2 rounded-full bg-rodri-primary text-rodri-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-lg shadow-rodri-primary/20 hover:bg-rodri-primary-dark transition-all hover:scale-[1.03]">${ctaText}</a>
            <button id="menuBtn" class="lg:hidden p-2 rounded-lg text-white" aria-label="Menú">
                <i class="bi bi-list fs-3"></i>
            </button>
        </div>
        <div id="mobileMenu" class="lg:hidden hidden bg-rodri-background border-t border-rodri-border animate-fade-up">
            <div class="container-x py-4 flex flex-col gap-1">
                ${links.map((l: any) => `<a href="${siteHref(l.url)}" class="mobile-link py-3 px-3 rounded-lg text-rodri-foreground/80 hover:bg-rodri-secondary/40 hover:text-rodri-primary font-medium">${l.label}</a>`).join("")}
                <a href="${siteHref(ctaUrl)}" class="mt-2 text-center rounded-full bg-rodri-primary text-rodri-primary-foreground px-5 py-3 font-semibold">${ctaText}</a>
            </div>
        </div>
      </header>
      <script>
        if (!window._navScrollBound) {
          window._navScrollBound = true;
          const navHeader = document.getElementById('navHeader');
          const navLinks = document.querySelectorAll('.nav-link');
          window.addEventListener('scroll', () => {
              const s = window.scrollY > 30;
              if(navHeader) {
                navHeader.className = s ? 'fixed top-0 inset-x-0 z-50 transition-all duration-500 bg-rodri-background/85 backdrop-blur-xl border-b border-rodri-border shadow-sm scrolled' : 'fixed top-0 inset-x-0 z-50 transition-all duration-500 bg-transparent border-b border-white/10';
              }
              navLinks.forEach(l => { l.className = s ? 'text-sm font-medium text-rodri-foreground/80 hover:text-rodri-primary transition-colors' : 'text-sm font-medium text-white/85 hover:text-white transition-colors'; });
          });
        }
        (function() {
          if (window._mobileMenuBound) return;
          window._mobileMenuBound = true;
          const menuBtn = document.getElementById('menuBtn');
          const mobileMenu = document.getElementById('mobileMenu');
          if (!menuBtn || !mobileMenu) return;
          menuBtn.addEventListener('click', () => {
            const hidden = mobileMenu.classList.contains('hidden');
            if (hidden) { mobileMenu.classList.remove('hidden'); menuBtn.innerHTML = '<i class="bi bi-x-lg fs-3"></i>'; }
            else { mobileMenu.classList.add('hidden'); menuBtn.innerHTML = '<i class="bi bi-list fs-3"></i>'; }
          });
          mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { mobileMenu.classList.add('hidden'); menuBtn.innerHTML = '<i class="bi bi-list fs-3"></i>'; }));
        })();
        (function() {
          if (window._revealBound) return;
          window._revealBound = true;
          const run = function() {
            const observer = new IntersectionObserver(function(entries) {
              entries.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('in-view'); observer.unobserve(e.target); } });
            }, { threshold: .15 });
            document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-1, .reveal-2, .reveal-3').forEach(function(el) { observer.observe(el); });
          };
          if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
          else run();
        })();
      </script>`;
    }

    case "hero":
      return `
      <section id="${c.anchor || 'inicio'}" class="relative min-h-screen overflow-hidden text-white">
        <div id="heroSlider" class="absolute inset-0 -z-10 scale-110">
            ${(c.slides && c.slides.length > 0 ? c.slides : [{ backgroundImage: c.backgroundImage || 'https://placehold.co/1920x1080/0f172a/ffffff' }]).map((slide: any, i: number) => `<div class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${i === 0 ? 'opacity-100' : 'opacity-0'}" style="background-image:url(${slide.backgroundImage || slide.url || c.backgroundImage})"></div>`).join("")}
        </div>
        <div class="absolute inset-0 -z-10 bg-hero-overlay"></div>
        <div class="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-transparent to-black/70"></div>
        <div class="container-x relative pt-56 pb-24 md:pt-64 md:pb-32 min-h-screen flex flex-col justify-center">
            <div class="max-w-3xl animate-fade-up">
                <span class="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white">
                    <span class="h-2 w-2 rounded-full bg-rodri-primary-glow animate-pulse"></span>
                    ${c.kicker || 'Fabricado en Ecuador · 100% reciclado'}
                </span>
                <h1 class="mt-6 text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
                    ${c.title || 'Mangueras del futuro, <span class="bg-gradient-to-r from-rodri-primary-glow to-rodri-accent bg-clip-text text-transparent">hechas del plástico de ayer.</span>'}
                </h1>
                <p class="mt-6 max-w-xl text-lg md:text-xl text-white/85 leading-relaxed">${c.subtitle || 'Fabricamos y distribuimos mangueras industriales, agrícolas y domésticas a partir de materiales 100% reciclados. Calidad certificada, compromiso real.'}</p>
                <div class="mt-10 flex flex-wrap gap-4">
                    <a href="${siteHref(c.buttonUrl || '#contacto')}" class="group inline-flex items-center gap-2 rounded-full bg-rodri-primary hover:bg-rodri-primary-dark text-rodri-primary-foreground px-7 py-4 text-base font-semibold shadow-elegant transition-all hover:scale-[1.03]">
                        ${c.buttonText || 'Solicitar cotización'}
                        <i class="bi bi-arrow-right h-5 w-5 group-hover:translate-x-1 transition-transform"></i>
                    </a>
                    ${c.secondaryButtonText ? `<a href="${siteHref(c.secondaryButtonUrl || '#contacto')}" class="inline-flex items-center gap-2 rounded-full glass text-white px-7 py-4 text-base font-semibold hover:bg-white/25 transition-all">
                        <i class="bi bi-play-circle h-5 w-5"></i>
                        ${c.secondaryButtonText}
                    </a>` : ''}
                </div>
                <div class="mt-16 flex items-center justify-center gap-3" id="heroDots"></div>
            </div>
        </div>
        <div class="absolute left-1/2 -translate-x-1/2 bottom-8 text-white/70 text-xs uppercase tracking-[0.3em] flex flex-col items-center gap-2 animate-float">
            Descubre más
            <span class="h-10 w-px bg-white/50"></span>
        </div>
      </section>
      <script>
        (function() {
            if(window._heroSliderBound) return;
            window._heroSliderBound = true;
            const slider = document.getElementById('heroSlider');
            if(!slider) return;
            const slides = slider.querySelectorAll('div');
            const dotsContainer = document.getElementById('heroDots'); 
            if(!dotsContainer || slides.length <= 1) return;
            let idx = 0;
            slides.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'w-2.5 h-2.5 rounded-full bg-white/30 transition-all duration-300 hover:bg-white/60';
                if (i === 0) { dot.classList.remove('bg-white/30'); dot.classList.add('bg-white', 'scale-125'); }
                dot.addEventListener('click', () => { slides[idx].classList.remove('opacity-100'); idx = i; slides[idx].classList.add('opacity-100'); updateDots(); });
                dotsContainer.appendChild(dot);
            });
            function updateDots() { dotsContainer.querySelectorAll('button').forEach((dot, i) => { dot.classList.remove('bg-white', 'scale-125'); dot.classList.add('bg-white/30'); if (i === idx) { dot.classList.remove('bg-white/30'); dot.classList.add('bg-white', 'scale-125'); } }); }
            setInterval(() => { slides[idx].classList.remove('opacity-100'); idx = (idx + 1) % slides.length; slides[idx].classList.add('opacity-100'); updateDots(); }, 5000);
        })();
      </script>`;

    case "about":
      return `<section id="${c.anchor || 'nosotros'}" class="relative overflow-hidden py-24 md:py-32 bg-white">
        <div class="absolute inset-0">
            <div class="absolute left-[-100px] top-20 h-[400px] w-[400px] rounded-full bg-rodri-primary/5 blur-[150px]"></div>
            <div class="absolute right-[-100px] bottom-[-100px] h-[350px] w-[350px] rounded-full bg-rodri-accent/5 blur-[150px]"></div>
        </div>
        <div class="container-x relative grid lg:grid-cols-2 gap-14 items-center">
            <div class="relative reveal-left">
                <div class="absolute -inset-4 bg-gradient-rodri-primary rounded-3xl opacity-20 blur-2xl"></div>
                <div class="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-elegant">
                    <img src="${c.imageUrl || 'https://placehold.co/800x1000/4fad33/ffffff'}" alt="${c.badgeTitle || 'Compromiso ambiental'}" class="h-full w-full object-cover" loading="lazy">
                    <div class="absolute inset-0 bg-gradient-to-t from-rodri-charcoal/20 to-transparent"></div>
                </div>
                ${c.badgeTitle ? `<div class="absolute -bottom-8 -right-4 md:-right-8 bg-white text-rodri-foreground p-6 rounded-2xl shadow-[0_10px_40px_rgba(79,173,51,.2)] max-w-[220px] border border-rodri-primary/10">
                    <div class="text-3xl font-display font-bold text-rodri-primary">${c.badgeTitle}</div>
                    <div class="text-xs mt-1 uppercase tracking-wider text-rodri-muted-foreground font-medium">${c.badgeSubtitle || ''}</div>
                </div>` : ''}
                <div class="absolute top-6 left-6 w-16 h-16 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 grid place-items-center shadow-lg">
                    <i class="bi bi-shield-check h-7 w-7 text-rodri-primary"></i>
                </div>
            </div>
            <div class="reveal-right">
                <span class="inline-flex items-center gap-2 rounded-full border border-rodri-primary/20 bg-rodri-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-rodri-primary">
                    <span class="h-1.5 w-1.5 rounded-full bg-rodri-primary"></span>
                    ${c.kicker || 'Nosotros'}
                </span>
                <h2 class="mt-6 text-4xl md:text-5xl font-bold leading-tight">${c.title || 'Una industria ecuatoriana que <span class="text-gradient">transforma residuos en soluciones</span>.'}</h2>
                <p class="mt-6 text-lg text-rodri-muted-foreground leading-relaxed">${c.description || 'En Rodriplast creemos que la industria puede ser motor de cambio ambiental. Recolectamos, procesamos y transformamos plástico reciclado en mangueras de alto rendimiento para los sectores agrícola, doméstico e industrial del país.'}</p>
                <ul class="mt-8 space-y-3">
                ${(c.features && c.features.length ? c.features : [
                    'Planta industrial certificada en Ecuador',
                    'Materias primas 100% de origen reciclado',
                    'Distribución nacional e internacional',
                    'Equipo técnico con más de 15 años de experiencia'
                ]).map((f: any) => `<li class="flex items-center gap-4 rounded-xl bg-rodri-primary/5 border border-rodri-primary/10 px-5 py-4 transition hover:bg-rodri-primary/10 hover:border-rodri-primary/20"><div class="flex h-8 w-8 items-center justify-center rounded-lg bg-rodri-primary text-white shrink-0"><i class="bi bi-check-lg h-4 w-4"></i></div><span class="text-rodri-foreground/85 font-medium">${typeof f === 'string' ? f : f.text || f.title || ''}</span></li>`).join("")}
                </ul>
                ${c.linkText || c.buttonText ? `<div class="mt-8"><a href="${siteHref(c.buttonUrl || c.linkUrl || '#contacto')}" class="inline-flex items-center gap-2 rounded-full bg-rodri-primary hover:bg-rodri-primary-dark text-rodri-primary-foreground px-7 py-3.5 text-sm font-semibold shadow-elegant transition-all hover:scale-[1.03]">${c.buttonText || c.linkText}<i class="bi bi-arrow-right h-4 w-4"></i></a></div>` : ''}
            </div>
        </div>
    </section>`;

    case "stats":
      return `
      <section class="relative -mt-16 z-10 pb-16 md:pb-20">
        <div class="container-x">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                ${(c.items || [
                  { value: '15', label: 'Años de experiencia', suffix: '+' },
                  { value: '2500', label: 'Plástico reciclado al año', suffix: ' Tn' },
                  { value: '480', label: 'Clientes activos', suffix: '+' },
                  { value: '98', label: 'Índice de satisfacción', suffix: '%' }
                ]).map((item: any, i: number) => `<div class="${renderReveal(i)} group relative rounded-2xl bg-white border border-gray-100 p-6 md:p-8 text-center shadow-[0_2px_20px_rgba(0,0,0,.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(79,173,51,.12)] hover:border-rodri-primary/20">
                    <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-rodri-primary shadow-elegant group-hover:scale-110 transition-transform duration-500">
                        <i class="bi ${item.icon || 'bi-star'} h-7 w-7 text-white"></i>
                    </div>
                    <div class="mt-5 font-display text-4xl md:text-5xl font-bold text-gradient"><span class="counter-value" data-target="${item.value}" data-suffix="${item.suffix || ''}">0</span></div>
                    <div class="mt-2 text-sm md:text-base text-rodri-muted-foreground font-medium">${item.label || item.desc}</div>
                </div>`).join("")}
            </div>
        </div>
        <script>
            (function() {
                if(window._counterBound) return;
                window._counterBound = true;
                const counterObserver = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { const el = e.target; const target = parseInt(el.dataset.target); const suffix = el.dataset.suffix || ''; let c = 0; const step = Math.ceil(target / 60); const i = setInterval(() => { c += step; if (c >= target) { c = target; clearInterval(i); } el.textContent = c.toLocaleString('es-ES') + suffix; }, 25); counterObserver.unobserve(el); } }); }, { threshold: .5 });
                const ready = () => document.querySelectorAll('.counter-value').forEach(el => counterObserver.observe(el));
                if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
                else ready();
            })();
        </script>
      </section>`;

    case "services":
    case "portfolio":
      return `<section id="${c.anchor || 'productos'}" class="relative overflow-hidden py-24 md:py-32 bg-white">
        <div class="absolute inset-0">
            <div class="absolute right-[-150px] top-40 h-[500px] w-[500px] rounded-full bg-rodri-primary/5 blur-[180px]"></div>
            <div class="absolute left-[-150px] bottom-0 h-[400px] w-[400px] rounded-full bg-rodri-accent/5 blur-[180px]"></div>
        </div>
        <div class="container-x relative">
            <div class="reveal flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
                <div class="max-w-2xl">
                    <span class="inline-flex items-center gap-2 rounded-full border border-rodri-primary/20 bg-rodri-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-rodri-primary">
                        <span class="h-1.5 w-1.5 rounded-full bg-rodri-primary"></span>
                        ${c.kicker || 'Productos'}
                    </span>
                    <h2 class="mt-6 text-4xl md:text-5xl font-bold leading-tight">${c.title || 'Soluciones que se adaptan a <span class="text-gradient">cada industria</span>'}</h2>
                </div>
                ${c.subtitle ? `<p class="text-rodri-muted-foreground max-w-md leading-relaxed">${c.subtitle}</p>` : ''}
            </div>
            <div class="grid md:grid-cols-2 gap-6">
                ${(c.items || [
                  { image: 'https://placehold.co/800x600/4fad33/ffffff', tag: 'Agrícola', title: 'Mangueras agrícolas', icon: 'bi-crosshair', desc: 'Para riego eficiente y sistemas de goteo en cultivos de todo tamaño.' },
                  { image: 'https://placehold.co/800x600/3d8f29/ffffff', tag: 'Industrial', title: 'Mangueras industriales', icon: 'bi-sun', desc: 'Alta resistencia para aplicaciones exigentes en fábricas y plantas.' }
                ]).map((item: any, i: number) => `<a href="${siteHref(item.link || '#contacto')}" class="${renderReveal(i)} group relative min-h-[420px] block overflow-hidden rounded-[28px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(79,173,51,.15)]">
                    <img src="${item.image || 'https://placehold.co/800x600/4fad33/ffffff'}" alt="${item.title}" loading="lazy" class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    ${item.tag ? `<span class="absolute left-6 top-6 rounded-full bg-white/15 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white border border-white/20">${item.tag}</span>` : ''}
                    <div class="relative flex h-full flex-col justify-end p-7 md:p-8">
                        <div class="flex items-center gap-4">
                            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-rodri-primary shadow-elegant group-hover:scale-110 transition-transform duration-500">
                                <i class="bi ${item.icon || 'bi-crosshair'} h-6 w-6 text-white"></i>
                            </div>
                            <h3 class="text-xl md:text-2xl font-bold text-white">${item.title}</h3>
                            <i class="bi bi-arrow-up-right ml-auto h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"></i>
                        </div>
                        <p class="mt-3 text-white/70 leading-relaxed">${item.desc}</p>
                    </div>
                </a>`).join("")}
            </div>
        </div>
    </section>`;

    case "process":
    case "features":
      return `<section id="${c.anchor || 'proceso'}" class="relative py-24 md:py-32 bg-rodri-charcoal text-rodri-charcoal-foreground">
        ${c.backgroundImage ? `<div class="absolute inset-0 opacity-80" style="background-image:url(${c.backgroundImage});background-size:cover;background-position:center;background-attachment:fixed"></div>` : ''}
        <div class="absolute inset-0 bg-gradient-to-b from-rodri-charcoal/95 via-rodri-charcoal/60 to-rodri-charcoal/95"></div>
        <div class="absolute top-[-200px] left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-rodri-primary/10 blur-[200px]"></div>
        <div class="container-x relative">
            <div class="reveal max-w-2xl">
                <span class="inline-flex items-center gap-2 rounded-full border border-rodri-primary/25 bg-rodri-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-rodri-primary-glow">
                    <span class="h-1.5 w-1.5 rounded-full bg-rodri-primary-glow"></span>
                    ${c.kicker || 'Proceso'}
                </span>
                <h2 class="mt-6 text-4xl md:text-5xl font-bold leading-tight">${c.title || 'De residuo a manguera: <span class="bg-gradient-to-r from-rodri-primary-glow to-rodri-accent bg-clip-text text-transparent">cuatro pasos con propósito</span>'}</h2>
            </div>
            <div class="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
                ${(c.items || [
                  { icon: 'bi-arrow-repeat', title: 'Recolección', desc: 'Recuperamos plásticos reciclables de industrias y centros de acopio del país.' },
                  { icon: 'bi-gear', title: 'Procesamiento', desc: 'Lavado, triturado y peletizado bajo estrictos controles de calidad.' },
                  { icon: 'bi-shield-check', title: 'Fabricación', desc: 'Extrusión de precisión con maquinaria de última generación.' },
                  { icon: 'bi-people', title: 'Distribución', desc: 'Logística nacional e internacional con trazabilidad completa.' }
                ]).map((item: any, i: number) => `<div class="${renderReveal(i)} group relative p-8 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.08] hover:-translate-y-2 hover:border-rodri-primary/30 transition-all duration-500">
                    <div class="absolute top-5 right-5 font-display text-7xl font-bold text-white/[0.04] group-hover:text-rodri-primary-glow/[0.08] transition-colors duration-500 select-none">${String(i + 1).padStart(2, "0")}</div>
                    <div class="relative">
                        <div class="h-14 w-14 rounded-2xl bg-gradient-rodri-primary grid place-items-center shadow-elegant group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <i class="bi ${item.icon || 'bi-arrow-repeat'} h-7 w-7 text-white"></i>
                        </div>
                        <h3 class="mt-6 text-xl font-bold text-white">${item.title}</h3>
                        <p class="mt-3 text-white/50 leading-relaxed text-sm">${item.desc}</p>
                    </div>
                </div>`).join("")}
                ${(c.items && c.items.length ? c.items : [{}, {}, {}, {}]).slice(0, 3).map((_: any, i: number) => `<div class="hidden lg:block absolute top-1/2 left-[calc(${25 + i * 25}%-8px)] w-[calc(25%-16px)] h-px bg-gradient-to-r from-transparent via-rodri-primary/30 to-transparent -translate-y-1/2"></div>`).join("")}
            </div>
        </div>
    </section>`;

    case "benefits":
      return `<section id="${c.anchor || 'beneficios'}" class="relative overflow-hidden py-24 md:py-32 bg-white">
        <div class="absolute inset-0">
            <div class="absolute left-[-100px] top-[-100px] h-[400px] w-[400px] rounded-full bg-rodri-primary/[0.04] blur-[150px]"></div>
            <div class="absolute right-[-100px] bottom-[-100px] h-[400px] w-[400px] rounded-full bg-rodri-accent/[0.04] blur-[150px]"></div>
        </div>
        <div class="container-x relative">
            <div class="reveal text-center max-w-2xl mx-auto">
                <span class="inline-flex items-center gap-2 rounded-full border border-rodri-primary/20 bg-rodri-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-rodri-primary">
                    <span class="h-1.5 w-1.5 rounded-full bg-rodri-primary"></span>
                    ${c.kicker || 'Beneficios'}
                </span>
                <h2 class="mt-6 text-4xl md:text-5xl font-bold leading-tight">${c.title || 'Ventajas que marcan la <span class="text-gradient">diferencia</span>'}</h2>
            </div>
        </div>
        <div class="mt-16 overflow-hidden relative before:absolute before:inset-y-0 before:left-0 before:w-24 before:z-10 before:bg-gradient-to-r before:from-white before:to-transparent after:absolute after:inset-y-0 after:right-0 after:w-24 after:z-10 after:bg-gradient-to-l after:from-white after:to-transparent">
            <div class="marquee-track flex gap-8 w-max">
                ${[false, true].map((hidden) => `
                <div class="flex gap-8 marquee-content"${hidden ? ' aria-hidden="true"' : ''}>
                    ${(c.items || [
                      { icon: 'bi-shield-check', title: 'Máxima durabilidad', desc: 'Resistencia a rayos UV, presión y temperaturas extremas.' },
                      { icon: 'bi-flower1', title: '100% ecológicas', desc: 'Fabricadas exclusivamente con material reciclado certificado.' },
                      { icon: 'bi-gear', title: 'Alto rendimiento', desc: 'Diseñadas para exigencias industriales y agrícolas modernas.' },
                      { icon: 'bi-crosshair', title: 'Precio competitivo', desc: 'Mayor eficiencia productiva se traduce en mejor precio para ti.' },
                      { icon: 'bi-clock', title: 'Calidad certificada', desc: 'Cumplimos normas internacionales ISO y controles nacionales.' },
                      { icon: 'bi-geo-alt', title: 'Entrega oportuna', desc: 'Logística confiable a nivel nacional e internacional.' }
                    ]).map((item: any) => `<div class="group relative w-[300px] shrink-0 p-7 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,.05)] hover:shadow-[0_16px_48px_rgba(79,173,51,.12)] hover:-translate-y-1.5 hover:border-rodri-primary/20 transition-all duration-500">
                        <div class="absolute top-0 right-0 h-20 w-20 rounded-bl-[32px] bg-rodri-primary/[0.03] group-hover:bg-rodri-primary/[0.07] transition-colors"></div>
                        <div class="relative flex flex-col items-center text-center">
                            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-rodri-primary shadow-elegant group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500"><i class="bi ${item.icon || 'bi-shield-check'} h-7 w-7 text-white"></i></div>
                            <h3 class="mt-5 text-lg font-bold">${item.title}</h3>
                            <p class="mt-2 text-sm text-rodri-muted-foreground leading-relaxed">${item.desc}</p>
                        </div>
                    </div>`).join("")}
                </div>`).join("")}
            </div>
        </div>
    </section>`;

    case "testimonials":
      return `<section id="${c.anchor || 'clientes'}" class="relative overflow-hidden py-14 md:py-16 bg-rodri-secondary/40">
        <div class="absolute inset-0">
            <div class="absolute left-[-100px] top-[-100px] h-[400px] w-[400px] rounded-full bg-rodri-primary/[0.04] blur-[150px]"></div>
            <div class="absolute right-[-100px] bottom-[-100px] h-[400px] w-[400px] rounded-full bg-rodri-accent/[0.04] blur-[150px]"></div>
        </div>
        <div class="container-x relative">
            <div class="reveal text-center max-w-2xl mx-auto mb-14">
                <span class="inline-flex items-center gap-2 rounded-full border border-rodri-primary/20 bg-rodri-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-rodri-primary">
                    <span class="h-1.5 w-1.5 rounded-full bg-rodri-primary"></span>
                    ${c.kicker || 'Testimonios'}
                </span>
                <h2 class="mt-6 text-4xl md:text-5xl font-bold leading-tight">${c.title || 'Lo que dicen nuestros <span class="text-gradient">clientes</span>'}</h2>
            </div>
        </div>
        <div class="overflow-hidden relative before:absolute before:inset-y-0 before:left-0 before:w-24 before:z-10 before:bg-gradient-to-r before:from-[#f1f5f9] before:to-transparent after:absolute after:inset-y-0 after:right-0 after:w-24 after:z-10 after:bg-gradient-to-l after:from-[#f1f5f9] after:to-transparent">
            <div class="clients-marquee flex gap-6 w-max">
                ${[false, true].map((hidden) => `
                <div class="flex gap-6 marquee-content"${hidden ? ' aria-hidden="true"' : ''}>
                    ${(c.items || [
                      { name: 'María Fernanda C.', role: 'Gerente de Operaciones', quote: 'El cambio a mangueras Rodriplast nos permitió reducir costos operativos y reforzar nuestra política ambiental. Producto confiable y equipo atento.' },
                      { name: 'Luis Ramírez', role: 'Jefe Técnico', quote: 'Excelente durabilidad en condiciones exigentes de campo. Llevamos tres años trabajando con ellos y la calidad es constante.' },
                      { name: 'Carla Mendoza', role: 'Compras', quote: 'Cumplen los plazos, la documentación técnica es impecable y el soporte postventa marca la diferencia. Muy recomendados.' }
                    ]).map((item: any) => `<figure class="relative w-[420px] shrink-0 p-8 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,.04)] hover:shadow-[0_12px_40px_rgba(79,173,51,.08)] hover:-translate-y-1 transition-all duration-500">
                        <i class="bi bi-quote h-8 w-8 text-rodri-primary/20"></i>
                        <div class="mt-3 flex gap-1 text-rodri-primary"><i class="bi bi-star-fill h-4 w-4 text-rodri-primary"></i><i class="bi bi-star-fill h-4 w-4 text-rodri-primary"></i><i class="bi bi-star-fill h-4 w-4 text-rodri-primary"></i><i class="bi bi-star-fill h-4 w-4 text-rodri-primary"></i><i class="bi bi-star-fill h-4 w-4 text-rodri-primary"></i></div>
                        <blockquote class="mt-4 text-rodri-foreground/85 leading-relaxed">"${item.quote || item.description || ''}"</blockquote>
                        <figcaption class="mt-6 pt-6 border-t border-gray-100"><div class="font-semibold">${item.name}</div><div class="text-sm text-rodri-muted-foreground">${item.role}</div></figcaption>
                    </figure>`).join("")}
                </div>`).join("")}
            </div>
        </div>
    </section>`;

    case "contact":
      return `<section id="${c.anchor || 'contacto'}" class="relative overflow-hidden py-24 md:py-32 bg-white">
        <div class="absolute inset-0">
            <div class="absolute right-[-100px] top-[-100px] h-[400px] w-[400px] rounded-full bg-rodri-primary/[0.04] blur-[150px]"></div>
            <div class="absolute left-[-100px] bottom-[-100px] h-[400px] w-[400px] rounded-full bg-rodri-accent/[0.04] blur-[150px]"></div>
        </div>
        <div class="container-x relative">
            <div class="reveal text-center max-w-2xl mx-auto mb-14">
                <span class="inline-flex items-center gap-2 rounded-full border border-rodri-primary/20 bg-rodri-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-rodri-primary">
                    <span class="h-1.5 w-1.5 rounded-full bg-rodri-primary"></span>
                    ${c.kicker || 'Contacto'}
                </span>
                <h2 class="mt-6 text-4xl md:text-5xl font-bold leading-tight">${c.title || 'Solicita tu <span class="text-gradient">cotización</span>'}</h2>
                ${c.subtitle ? `<p class="mt-5 text-rodri-muted-foreground">${c.subtitle}</p>` : ''}
            </div>
            <div class="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
                <form id="contactForm" method="POST" action="${actionUrl}" data-pub-form class="reveal bg-white p-8 md:p-10 rounded-[28px] border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,.05)] space-y-6">
                    <div class="grid md:grid-cols-2 gap-5">
                        ${(c.fields && c.fields.length ? c.fields : [
                          { label: 'Nombre completo', name: 'nombre', type: 'text', required: true },
                          { label: 'Empresa', name: 'empresa', type: 'text', required: false },
                          { label: 'Correo electrónico', name: 'email', type: 'email', required: true },
                          { label: 'Teléfono', name: 'telefono', type: 'tel', required: false }
                        ]).filter((f: any) => f.type !== 'textarea').map((f: any) => `<div>
                            <label class="text-sm font-semibold text-rodri-foreground/85">${f.label}</label>
                            <div class="relative mt-2"><div class="absolute left-4 top-1/2 -translate-y-1/2 text-rodri-muted-foreground"><i class="bi ${fieldIcon(f.name)} h-4 w-4"></i></div><input type="${f.type || 'text'}" name="${f.name}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}" class="w-full rounded-xl border border-gray-200 bg-white/50 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rodri-primary/30 focus:border-rodri-primary transition"></div>
                        </div>`).join("")}
                    </div>
                    ${(c.fields && c.fields.length ? c.fields : []).filter((f: any) => f.type === 'textarea').map((f: any) => `<div>
                        <label class="text-sm font-semibold text-rodri-foreground/85">${f.label}</label>
                        <textarea name="${f.name}" rows="5" ${f.required ? 'required' : ''} class="mt-2 w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rodri-primary/30 focus:border-rodri-primary transition" placeholder="${f.placeholder || ''}">${f.value || ''}</textarea>
                    </div>`).join("") || `<div>
                        <label class="text-sm font-semibold text-rodri-foreground/85">Tipo de producto</label>
                        <div class="relative mt-2"><div class="absolute left-4 top-1/2 -translate-y-1/2 text-rodri-muted-foreground"><i class="bi bi-box-arrow-up-right h-4 w-4"></i></div><input type="text" name="producto" placeholder="Manguera agrícola, industrial..." class="w-full rounded-xl border border-gray-200 bg-white/50 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rodri-primary/30 focus:border-rodri-primary transition"></div>
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-rodri-foreground/85">Mensaje</label>
                        <textarea name="mensaje" rows="5" required class="mt-2 w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rodri-primary/30 focus:border-rodri-primary transition" placeholder="Descríbenos tu proyecto, volúmenes estimados y especificaciones..."></textarea>
                    </div>`}
                    <div data-pub-form-status style="display:none;padding:12px 16px;border-radius:12px;font-size:14px;"></div>
                    <button type="submit" class="inline-flex items-center gap-2 rounded-full bg-gradient-rodri-primary text-white px-8 py-4 font-semibold shadow-elegant hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(79,173,51,.25)] transition-all duration-300">${c.buttonText || 'Enviar solicitud'}<i class="bi bi-send h-4 w-4"></i></button>
                </form>
                <div class="space-y-5">
                    <div class="reveal group flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,.04)] hover:shadow-[0_8px_32px_rgba(79,173,51,.08)] hover:-translate-y-0.5 hover:border-rodri-primary/20 transition-all duration-500">
                        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-rodri-primary text-white shadow-elegant group-hover:scale-110 transition-transform duration-500"><i class="bi bi-geo-alt-fill h-5 w-5"></i></div>
                        <div class="min-w-0"><div class="font-semibold">Dirección</div><div class="mt-1 text-sm text-rodri-muted-foreground">${c.address || 'Parque Industrial · Guayaquil, Ecuador'}</div></div>
                    </div>
                    <div class="reveal-1 group flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,.04)] hover:shadow-[0_8px_32px_rgba(79,173,51,.08)] hover:-translate-y-0.5 hover:border-rodri-primary/20 transition-all duration-500">
                        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-rodri-primary text-white shadow-elegant group-hover:scale-110 transition-transform duration-500"><i class="bi bi-telephone h-5 w-5"></i></div>
                        <div class="min-w-0"><div class="font-semibold">Teléfono</div><div class="mt-1 text-sm text-rodri-muted-foreground">${c.phone || '+593 4 000 0000'}</div></div>
                    </div>
                    <div class="reveal-2 group flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,.04)] hover:shadow-[0_8px_32px_rgba(79,173,51,.08)] hover:-translate-y-0.5 hover:border-rodri-primary/20 transition-all duration-500">
                        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-rodri-primary text-white shadow-elegant group-hover:scale-110 transition-transform duration-500"><i class="bi bi-envelope h-5 w-5"></i></div>
                        <div class="min-w-0"><div class="font-semibold">Correo</div><div class="mt-1 text-sm text-rodri-muted-foreground">${c.email || 'ventas@rodriplast.com'}</div></div>
                    </div>
                    ${c.mapUrl ? (() => {
                      const isGoogle = /google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl/.test(c.mapUrl);
                      if (isGoogle) {
                        return `<a href="${c.mapUrl}" target="_blank" rel="noopener" class="reveal flex items-center justify-center gap-3 aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 bg-rodri-primary/5 hover:bg-rodri-primary/10 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(79,173,51,.1)] transition-all duration-500 group">
                          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-rodri-primary text-white shadow-elegant group-hover:scale-110 transition-transform duration-500"><i class="bi bi-geo-alt-fill h-6 w-6"></i></div>
                          <div class="text-left"><div class="font-semibold text-rodri-foreground">Ver en Google Maps</div><div class="text-sm text-rodri-muted-foreground">Abrir ubicación</div></div>
                        </a>`;
                      }
                      return `<div class="reveal aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,.04)]"><iframe title="Ubicación ${c.kicker || 'Rodriplast'}" src="${c.mapUrl}" class="w-full h-full" loading="lazy" style="border:0" allowfullscreen></iframe></div>`;
                    })() : ''}
                </div>
            </div>
        </div>
    </section>`;

    case "gallery":
      return `<section id="${c.anchor || 'galeria'}" class="relative overflow-hidden py-24 md:py-32 bg-rodri-secondary/40">
        <div class="absolute inset-0">
            <div class="absolute left-[-100px] top-[-100px] h-[400px] w-[400px] rounded-full bg-rodri-primary/[0.04] blur-[150px]"></div>
            <div class="absolute right-[-100px] bottom-[-100px] h-[400px] w-[400px] rounded-full bg-rodri-accent/[0.04] blur-[150px]"></div>
        </div>
        <div class="container-x relative">
            <div class="reveal text-center max-w-2xl mx-auto mb-14">
                <span class="inline-flex items-center gap-2 rounded-full border border-rodri-primary/20 bg-rodri-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-rodri-primary">
                    <span class="h-1.5 w-1.5 rounded-full bg-rodri-primary"></span>
                    ${c.kicker || 'Detrás de escena'}
                </span>
                <h2 class="mt-6 text-4xl md:text-5xl font-bold leading-tight">${c.title || 'Así nace <span class="text-gradient">cada manguera</span>'}</h2>
                ${c.subtitle ? `<p class="mt-5 text-rodri-muted-foreground">${c.subtitle}</p>` : ''}
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                ${(c.images && c.images.length ? c.images : [
                  { url: 'https://placehold.co/800x600/4fad33/ffffff?text=Foto+1' },
                  { url: 'https://placehold.co/800x600/3d8f29/ffffff?text=Foto+2' },
                  { url: 'https://placehold.co/800x600/84cc16/ffffff?text=Foto+3' },
                  { url: 'https://placehold.co/800x600/0f172a/ffffff?text=Foto+4' },
                  { url: 'https://placehold.co/800x600/65a30d/ffffff?text=Foto+5' },
                  { url: 'https://placehold.co/800x600/16a34a/ffffff?text=Foto+6' }
                ]).map((img: any, i: number) => `<div class="${renderReveal(i)} group relative aspect-[4/3] overflow-hidden rounded-[24px] border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,.06)] hover:shadow-[0_16px_48px_rgba(79,173,51,.15)] hover:-translate-y-1 transition-all duration-500">
                    <img src="${img.url || img.src || ''}" alt="${img.alt || 'Galería'}" loading="lazy" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105">
                </div>`).join("")}
            </div>
        </div>
    </section>`;

    case "footer": {
      const companyName = c.companyName || 'Rodriplast';
      const logo = c.logoImage || site?.logoUrl || PLACEHOLDER_LOGO;
      const address = c.address || 'Parque Industrial · Guayaquil, Ecuador';
      const phone = c.phone || '+593 4 000 0000';
      const email = c.email || 'ventas@rodriplast.com';
      const columns = c.columns && c.columns.length ? c.columns : [
        { title: 'Navegación', links: [
          { label: 'Inicio', url: '#inicio' },
          { label: 'Nosotros', url: '#nosotros' },
          { label: 'Proceso', url: '#proceso' },
          { label: 'Productos', url: '#productos' }
        ] }
      ];
      const navColTitle = (columns[0] && columns[0].title) || 'Navegación';
      const navLinks = (c.navLinks && c.navLinks.length ? c.navLinks : (columns[0] && columns[0].links) || []);
      const social = c.social && c.social.length ? c.social : [
        { icon: 'bi-facebook', url: '#', label: 'Facebook' },
        { icon: 'bi-instagram', url: '#', label: 'Instagram' },
        { icon: 'bi-linkedin', url: '#', label: 'LinkedIn' },
        { icon: 'bi-youtube', url: '#', label: 'YouTube' }
      ];
      const copyright = c.copyright || `© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.`;
      const floatingImg = c.floatingImage ? `<div class="block absolute -top-40 right-0 sm:-top-40 lg:-top-48 w-48 h-48 sm:w-56 sm:h-56 lg:w-72 lg:h-72 z-10 pointer-events-none"><img src="${c.floatingImage}" alt="${c.floatingImageAlt || ''}" class="w-full h-full object-contain drop-shadow-2xl -scale-x-100"></div>` : '';
      return `<footer class="relative bg-rodri-charcoal text-rodri-charcoal-foreground pt-20 pb-8">
        ${floatingImg}
        <div class="absolute inset-0 bg-gradient-to-b from-rodri-primary/5 via-transparent to-transparent"></div>
        <div class="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/3 bg-gradient-to-r from-transparent via-rodri-primary/40 to-transparent"></div>
        <div class="container-x relative">
            <div class="grid md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.2fr] gap-10 pb-12 border-b border-white/5">
                <div>
                    <div class="flex items-center gap-3">
                        <img src="${logo}" alt="${companyName}" class="h-16 w-auto object-contain">
                    </div>
                    <p class="mt-5 text-sm text-white/50 leading-relaxed max-w-xs">${c.description || 'Fabricantes ecuatorianos de mangueras elaboradas 100% con materiales reciclados. Calidad, innovación y compromiso ambiental.'}</p>
                    <div class="mt-6 flex gap-2.5">
                        ${social.map((s: any) => `<a href="${s.url || '#'}" class="h-10 w-10 grid place-items-center rounded-xl bg-white/5 text-white/50 hover:bg-gradient-rodri-primary hover:text-white hover:scale-110 transition-all duration-300" aria-label="${s.label || s.icon}"${s.url && s.url !== '#' ? ' target="_blank" rel="noopener"' : ''}><i class="bi ${s.icon || 'bi-link'} h-4 w-4"></i></a>`).join("")}
                    </div>
                </div>
                <div>
                    <div class="font-semibold text-white text-sm uppercase tracking-wider">${navColTitle}</div>
                    <ul class="mt-5 space-y-3 text-sm">
                        ${navLinks.map((l: any) => `<li><a href="${siteHref(l.url || '#')}" class="text-white/50 hover:text-rodri-primary-glow flex items-center gap-2 transition-colors">${l.label}</a></li>`).join("")}
                    </ul>
                </div>
                <div>
                    <div class="font-semibold text-white text-sm uppercase tracking-wider">Contacto</div>
                    <ul class="mt-5 space-y-3 text-sm">
                        <li class="flex items-start gap-3 text-white/50"><i class="bi bi-geo-alt-fill h-4 w-4 mt-0.5 shrink-0 text-rodri-primary-glow/60"></i><span>${address}</span></li>
                        <li class="flex items-start gap-3 text-white/50"><i class="bi bi-telephone h-4 w-4 mt-0.5 shrink-0 text-rodri-primary-glow/60"></i><span>${phone}</span></li>
                        <li class="flex items-start gap-3 text-white/50"><i class="bi bi-envelope h-4 w-4 mt-0.5 shrink-0 text-rodri-primary-glow/60"></i><span>${email}</span></li>
                        <li class="flex items-start gap-3 text-white/50"><i class="bi bi-clock h-4 w-4 mt-0.5 shrink-0 text-rodri-primary-glow/60"></i><span>${c.schedule || 'Lun – Vie · 8:00 – 17:00'}</span></li>
                    </ul>
                </div>
            </div>
            <div class="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
                <div>${copyright}</div>
                <div class="flex gap-6"><a href="#" class="hover:text-white/70 transition-colors">Política de privacidad</a><a href="#" class="hover:text-white/70 transition-colors">Términos y condiciones</a></div>
            </div>
        </div>
    </footer>`;
    }

    default:
      return null;
  }
}
