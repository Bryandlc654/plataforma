const fs = require('fs');
let raw = fs.readFileSync('temp_html_utf8.jsonl', 'utf-8');
raw = raw.replace(/^\uFEFF/, '');
const data = JSON.parse(raw.split('\n')[0]);
const html = data.content;

function replaceColors(str) {
    return str
        .replace(/primary-glow/g, 'rodri-primary-glow')
        .replace(/primary-dark/g, 'rodri-primary-dark')
        .replace(/primary-foreground/g, 'rodri-primary-foreground')
        .replace(/(?<!rodri-)primary/g, 'rodri-primary')
        .replace(/(?<!rodri-)accent/g, 'rodri-accent')
        .replace(/(?<!rodri-)charcoal-foreground/g, 'rodri-charcoal-foreground')
        .replace(/(?<!rodri-)charcoal/g, 'rodri-charcoal')
        .replace(/(?<!rodri-)muted-foreground/g, 'rodri-muted-foreground')
        .replace(/(?<!rodri-)muted/g, 'rodri-muted')
        .replace(/(?<!rodri-)foreground/g, 'rodri-foreground')
        .replace(/(?<!rodri-)background/g, 'rodri-background')
        .replace(/(?<!rodri-)card/g, 'rodri-card')
        .replace(/(?<!rodri-)border/g, 'rodri-border')
        .replace(/(?<!rodri-)input/g, 'rodri-input');
}

let styles = html.match(/<style>([\s\S]*?)<\/style>/)[1];
styles = replaceColors(styles);
const extraStyles = html.matchAll(/<style>([\s\S]*?)<\/style>/g);
let allStyles = "";
for (const match of extraStyles) {
    allStyles += match[1] + "\n";
}
allStyles = replaceColors(allStyles);

function extractSection(idRegex, isHeader=false, isFooter=false) {
    let match;
    if (isHeader) match = html.match(/<header[^>]*>([\s\S]*?)<\/header>/);
    else if (isFooter) match = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/);
    else match = html.match(new RegExp(`<section[^>]*id="${idRegex}"[^>]*>([\\s\\S]*?)<\\/section>`));
    
    if (!match) return "";
    let sectionHtml = match[0];
    
    if (isHeader) {
        sectionHtml = sectionHtml.replace('id="navHeader" class="fixed top-0', 'id="navHeader" class="sticky top-0');
        sectionHtml = sectionHtml.replace('src="img/logo-rodriplast.png"', 'src="${c.logoImage || \'https://placehold.co/200x80/ffffff/0f172a?text=Logo\'}"');
    }
    return replaceColors(sectionHtml);
}

const out = `export function getRodriplastHtml(type: string, c: any, apiBaseUrl?: string, site?: any): string | null {
  if (c.variant !== "rodriplast") return null;

  switch (type) {
    case "header":
      return \`
      <style>
      \${ \`${allStyles}\` }
      </style>
      \${ \`${extractSection('', true)}\`.replace('src="img/logo-rodriplast.png"', 'src="\${c.logoImage || \\'https://placehold.co/200x80/ffffff/0f172a?text=Logo\\'}"') }
      <script>
        if (!window._navScrollBound) {
          window._navScrollBound = true;
          const navHeader = document.getElementById('navHeader');
          const navLinks = document.querySelectorAll('.nav-link');
          const navLogoBox = document.getElementById('navLogoBox');
          window.addEventListener('scroll', () => {
              const s = window.scrollY > 30;
              if(navHeader) navHeader.className = s ? 'sticky top-0 inset-x-0 z-50 transition-all duration-500 bg-rodri-background/85 backdrop-blur-xl border-b border-rodri-border shadow-sm' : 'sticky top-0 inset-x-0 z-50 transition-all duration-500 bg-transparent border-b border-white/10';
              navLinks.forEach(l => { l.className = s ? 'text-sm font-medium text-rodri-foreground/80 hover:text-rodri-primary transition-colors' : 'text-sm font-medium text-white/85 hover:text-white transition-colors'; });
              if(navLogoBox) navLogoBox.className = s ? 'h-12 w-auto object-contain transition-all duration-500' : 'h-14 w-auto object-contain transition-all duration-500';
          });
        }
      </script>\`;

    case "hero":
      return \`
      <section id="\${c.anchor || 'inicio'}" class="relative min-h-screen overflow-hidden text-white">
        <div id="heroSlider" class="absolute inset-0 -z-10 scale-110">
            \${(c.slides && c.slides.length > 0 ? c.slides : [{ backgroundImage: c.backgroundImage || 'https://placehold.co/1920x1080/0f172a/ffffff' }]).map((slide, i) => \`<div class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 \${i === 0 ? 'opacity-100' : 'opacity-0'}" style="background-image:url(\${slide.backgroundImage || slide.url || c.backgroundImage})\"></div>\`).join("")}
        </div>
        <div class="absolute inset-0 -z-10 bg-hero-overlay"></div>
        <div class="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-transparent to-black/70"></div>
        <div class="container-x relative pt-40 pb-24 md:pt-48 md:pb-32 min-h-screen flex flex-col justify-center">
            <div class="max-w-3xl animate-fade-up">
                <span class="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white">
                    <span class="h-2 w-2 rounded-full bg-rodri-primary-glow animate-pulse"></span>
                    \${c.kicker || 'Fabricado en Ecuador · 100% reciclado'}
                </span>
                <h1 class="mt-6 text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
                    \${c.title || 'Mangueras del futuro, <span class="bg-gradient-to-r from-rodri-primary-glow to-rodri-accent bg-clip-text text-transparent">hechas del plástico de ayer.</span>'}
                </h1>
                <p class="mt-6 max-w-xl text-lg md:text-xl text-white/85 leading-relaxed">\${c.subtitle || 'Fabricamos y distribuimos mangueras industriales, agrícolas y domésticas a partir de materiales 100% reciclados.'}</p>
                <div class="mt-10 flex flex-wrap gap-4">
                    <a href="\${c.buttonUrl || '#contacto'}" class="group inline-flex items-center gap-2 rounded-full bg-rodri-primary hover:bg-rodri-primary-dark text-rodri-primary-foreground px-7 py-4 text-base font-semibold shadow-elegant transition-all hover:scale-[1.03]">
                        \${c.buttonText || 'Solicitar cotización'}
                        <i class="bi bi-arrow-right h-5 w-5 group-hover:translate-x-1 transition-transform"></i>
                    </a>
                    \${c.secondaryButtonText ? \`<a href="\${c.secondaryButtonUrl || '#'}" class="inline-flex items-center gap-2 rounded-full glass text-white px-7 py-4 text-base font-semibold hover:bg-white/25 transition-all">
                        \${c.secondaryButtonText}
                    </a>\` : ''}
                </div>
                <div class="mt-16 flex items-center justify-center gap-3" id="heroDots"></div>
            </div>
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
      </script>\`;

    case "about":
      return \`${extractSection('nosotros')}\`;

    case "stats":
      return \`
      <section class="relative -mt-16 z-10 pb-16 md:pb-20">
        <div class="container-x">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                \${(c.items || [
                  { value: '15', label: 'Años de experiencia', suffix: '+' },
                  { value: '2500', label: 'Plástico reciclado al año', suffix: ' Tn' },
                  { value: '480', label: 'Clientes activos', suffix: '+' },
                  { value: '98', label: 'Índice de satisfacción', suffix: '%' }
                ]).map((item, i) => \`<div class="reveal\${i > 0 ? \`-\${i}\` : ''} group relative rounded-2xl bg-white border border-gray-100 p-6 md:p-8 text-center shadow-[0_2px_20px_rgba(0,0,0,.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(79,173,51,.12)] hover:border-rodri-primary/20">
                    <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-rodri-primary shadow-elegant group-hover:scale-110 transition-transform duration-500">
                        <i class="bi \${item.icon || 'bi-star'} h-7 w-7 text-white"></i>
                    </div>
                    <div class="mt-5 font-display text-4xl md:text-5xl font-bold text-gradient"><span class="counter-value" data-target="\${item.value}" data-suffix="\${item.suffix || ''}">0</span></div>
                    <div class="mt-2 text-sm md:text-base text-rodri-muted-foreground font-medium">\${item.label || item.desc}</div>
                </div>\`).join("")}
            </div>
        </div>
        <script>
            (function() {
                if(window._counterBound) return;
                window._counterBound = true;
                const counterObserver = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { const el = e.target; const target = parseInt(el.dataset.target); const suffix = el.dataset.suffix || ''; let c = 0; const step = Math.ceil(target / 60); const i = setInterval(() => { c += step; if (c >= target) { c = target; clearInterval(i); } el.textContent = c.toLocaleString('es-ES') + suffix; }, 25); counterObserver.unobserve(el); } }); }, { threshold: .5 });
                setTimeout(() => document.querySelectorAll('.counter-value').forEach(el => counterObserver.observe(el)), 500);
            })();
        </script>
      </section>\`;

    case "services":
    case "portfolio":
      return \`${extractSection('productos')}\`;

    case "process":
    case "features":
      return \`${extractSection('proceso')}\`;

    case "benefits":
      return \`${extractSection('beneficios')}\`;

    case "testimonials":
      return \`${extractSection('clientes')}\`;

    case "contact":
      return \`${extractSection('contacto')}\`;

    case "footer":
      return \`${extractSection('', false, true)}\`;

    default:
      return null;
  }
}
`;

fs.writeFileSync('C:\\\\Users\\\\bdela\\\\Desktop\\\\plataforma\\\\apps\\\\web\\\\src\\\\lib\\\\rodriplast-variants.ts', out);
