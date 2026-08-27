/* eslint-disable */

const PLACEHOLDER_LOGO = "https://placehold.co/200x60/050505/fdcb0c?text=INDIGO";

function siteHref(url?: string) {
  if (!url || url === "#") return "#";
  return url.startsWith("/") || url.startsWith("http") ? url : `#${url}`;
}

function actionUrl(site?: any, apiBaseUrl?: string) {
  const host = apiBaseUrl || "https://plataforma-api-71743315793.us-central1.run.app";
  return `${host}/api/v1/leads`;
}

function heroScript() {
  return `<script>
    (function(){
      if(window._indigoNav) return;
      window._indigoNav = true;
      var hamburger = document.getElementById('indigoHamburger');
      var nav = document.getElementById('indigoMobileNav');
      var overlay = document.getElementById('indigoNavOverlay');
      var close = document.getElementById('indigoNavClose');
      if(!hamburger||!nav) return;
      hamburger.addEventListener('click',function(){ nav.classList.remove('max-h-0','opacity-0','pointer-events-none'); nav.classList.add('max-h-[500px]','opacity-100'); overlay.classList.remove('opacity-0','pointer-events-none'); overlay.classList.add('opacity-100'); });
      if(close) close.addEventListener('click',function(){ nav.classList.add('max-h-0','opacity-0','pointer-events-none'); nav.classList.remove('max-h-[500px]','opacity-100'); overlay.classList.add('opacity-0','pointer-events-none'); overlay.classList.remove('opacity-100'); });
      if(overlay) overlay.addEventListener('click',function(){ nav.classList.add('max-h-0','opacity-0','pointer-events-none'); nav.classList.remove('max-h-[500px]','opacity-100'); overlay.classList.add('opacity-0','pointer-events-none'); overlay.classList.remove('opacity-100'); });
    })();
  </script>`;
}

function marqueeScript() {
  return `<script>
    (function(){
      if(window._indigoMarquee) return;
      window._indigoMarquee = true;
      var track = document.getElementById('indigoMarqueeTrack');
      if(!track) return;
      var clone = track.innerHTML;
      track.innerHTML = clone + clone;
      var pos = 0;
      function scroll(){ pos -= 1; if(Math.abs(pos) >= track.scrollWidth/2) pos = 0; track.style.transform = 'translateX('+pos+'px)'; requestAnimationFrame(scroll); }
      requestAnimationFrame(scroll);
    })();
  </script>`;
}

function footerScript() {
  return `<script>
    (function(){
      if(window._indigoFooter) return;
      window._indigoFooter = true;
      var btn = document.getElementById('footerToggle');
      var col = document.getElementById('footerCol1');
      if(!btn||!col) return;
      btn.addEventListener('click',function(){ col.classList.toggle('max-h-0'); col.classList.toggle('max-h-96'); });
    })();
  </script>`;
}

export function getIndigoHtml(type: string, c: any, apiBaseUrl?: string, site?: any): string | null {
  const B = "#fdcb0c";
  const D = "#050505";
  const L = "#fcfcfc";

  const offsetImg = (img: string, alt: string, borderColor?: string, direction?: string) => {
    const bc = borderColor || B;
    const tx = direction === "right" ? "translate-x-4 -translate-y-4" : "translate-x-4 translate-y-4";
    const hoverTx = direction === "right" ? "group-hover:translate-x-6 group-hover:-translate-y-6" : "group-hover:translate-x-6 group-hover:translate-y-6";
    return `<div class="relative group">
      <div class="absolute inset-0 ${tx} ${hoverTx} transition-transform duration-500 z-0" style="background:${bc}"></div>
      <img src="${img}" alt="${alt}" class="relative z-10 w-full h-[500px] md:h-[600px] object-cover border-2 border-${D === '#050505' ? 'dark' : '[#050505]'}" style="filter:contrast(1.25) saturate(1.5)">
    </div>`;
  };

  const dotList = (items: string[]) =>
    items.map((item: string) => `<li class="flex items-center gap-3">
      <div class="w-2 h-2 rounded-full" style="background:${B}"></div> ${item}
    </li>`).join("");

  const offsetBtn = (text: string, href: string) =>
    `<a href="${siteHref(href)}" class="inline-block relative group w-max z-10">
      <span class="absolute inset-0 translate-x-2 translate-y-2 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform" style="background:${B}"></span>
      <span class="relative block border-2 font-bold uppercase tracking-widest py-4 px-10 group-hover:text-white transition-colors" style="border-color:${B};background:white;color:${B}" onmouseover="this.style.background='${D}';this.style.color='${B}'" onmouseout="this.style.background='white';this.style.color='${B}'">${text}</span>
    </a>`;

  switch (type) {
    case "header": {
      const links = c.links || c.navLinks || [
        { label: "Agencia", url: "#agencia" },
        { label: "Letras 3D", url: "#letras3d" },
        { label: "Branding", url: "#branding" },
        { label: "Portafolio", url: "#portafolio" },
        { label: "Contacto", url: "#contacto" },
      ];
      const logo = c.logoImage || site?.logoUrl || PLACEHOLDER_LOGO;
      const isWhite = c.navbarStyle === "white";
      return `<nav class="fixed w-full z-50 top-0 left-0 p-6 flex justify-between items-center" ${isWhite ? `style="background:white;border-bottom:1px solid rgba(0,0,0,0.1);color:${D}"` : `style="mix-blend-mode:difference;color:${L}"`}>
        <a href="${siteHref(c.logoUrl || '#')}" class="inline-block">
          <img src="${logo}" alt="${c.companyName || site?.name || 'Indigo Publicidad'}" class="h-10 md:h-12 w-auto object-contain" ${isWhite ? 'style="filter:brightness(0) invert(1)"' : 'style="filter:brightness(0) invert(1)"'}>
        </a>
        <div class="hidden md:flex gap-8 font-semibold text-sm tracking-widest uppercase" style="font-family:Poppins,sans-serif">
          ${links.map((l: any) => `<a href="${siteHref(l.url)}" class="transition-colors" style="color:${isWhite ? (l.active ? B : D) : B}" ${!isWhite ? '' : `onmouseover="this.style.color='${B}'" onmouseout="this.style.color='${l.active ? B : D}'"`}>${l.label}</a>`).join("")}
        </div>
        <button id="indigoHamburger" class="md:hidden" style="color:${B}" aria-label="Menú">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
        </button>
        <div id="indigoNavOverlay" class="fixed inset-0 z-40 opacity-0 pointer-events-none transition-opacity duration-300 md:hidden" style="background:rgba(0,0,0,0.6)"></div>
        <div id="indigoMobileNav" class="md:hidden absolute top-full left-0 w-full max-h-0 opacity-0 pointer-events-none overflow-hidden transition-all duration-300 z-50" style="background:${D}">
          <div class="px-6 py-8 flex flex-col gap-6">
            <button id="indigoNavClose" class="absolute top-4 right-6 text-2xl" style="color:${L}" aria-label="Cerrar">&times;</button>
            ${links.map((l: any) => `<a href="${siteHref(l.url)}" class="text-sm font-semibold uppercase tracking-widest" style="color:${L};font-family:Poppins,sans-serif">${l.label}</a>`).join("")}
          </div>
        </div>
        ${heroScript()}
      </nav>`;
    }

    case "page-hero": {
      const title = c.title || "NUESTRA <span style='color:" + B + "'>AGENCIA</span>";
      const desc = c.description || "Llevamos más de una década transformando ideas locas en marcas sólidas. Indigo no es una agencia, es tu brazo creativo.";
      const isBrand = c.background === "brand";
      const strokeStyle = isBrand ? `-webkit-text-stroke:1px ${D};color:transparent` : '';
      return `<section id="${c.anchor || ''}" class="pt-32 pb-24 relative overflow-hidden" style="background:${isBrand ? B : L}">
        <div class="container mx-auto px-6 relative z-10 text-center">
          <h1 class="font-black text-6xl md:text-8xl mb-8 uppercase tracking-tighter" style="color:${isBrand ? D : D};font-family:Poppins,sans-serif;${strokeStyle}">${title}</h1>
          ${desc ? `<p class="text-xl md:text-2xl font-light max-w-4xl mx-auto opacity-90" style="color:${isBrand ? D : D}">${desc}</p>` : ''}
        </div>
      </section>`;
    }

    case "hero": {
      const title = c.title || "Publicidad";
      const subtitle = c.subtitle || "Creativa.";
      const desc = c.description || "Rompemos las reglas del diseño. Transformamos marcas convencionales en experiencias visuales inolvidables con letras 3D y estrategias de branding disruptivas.";
      const bgImg = c.backgroundImage || "";
      return `<section id="${c.anchor || 'hero'}" class="relative min-h-screen flex items-center pt-20" style="background:${D};color:${L}">
        ${bgImg ? `<div class="absolute inset-0 z-0 opacity-40">
          <img src="${bgImg}" alt="Creative Hero" class="w-full h-full object-cover" style="filter:grayscale(1);mix-blend-mode:luminosity">
        </div>` : ''}
        <div class="container mx-auto px-6 relative z-10 flex flex-col justify-center min-h-[80vh]">
          <h1 class="font-extrabold uppercase mb-6 relative" style="font-size:clamp(4rem,12vw,9rem);line-height:0.85;letter-spacing:-0.05em;font-family:Poppins,sans-serif">
            <span class="block">${title}</span>
            <span class="block" style="color:${B}">${subtitle}</span>
          </h1>
          <p class="max-w-xl text-lg md:text-xl font-light mt-8 opacity-90" style="border-left:4px solid ${B};padding-left:1.5rem">
            ${desc}
          </p>
        </div>
        <div class="absolute bottom-10 right-10 flex-col items-end gap-2 z-10 hidden md:flex">
          <div class="w-24 h-[2px]" style="background:${B}"></div>
          <span class="uppercase tracking-widest text-xs font-bold" style="color:${B};font-family:Poppins,sans-serif">Scroll para descubrir</span>
        </div>
      </section>`;
    }

    case "marquee": {
      const words = c.words || c.marqueeWords || ["INDIGO PUBLICIDAD", "LETRAS 3D", "BRANDING", "DISEÑO DISRUPTIVO"];
      return `<div class="overflow-hidden py-4 relative z-20" style="background:${B};color:${D};border-top:1px solid ${D};border-bottom:1px solid ${D}">
        <div class="whitespace-nowrap flex font-bold uppercase items-center" style="font-size:clamp(2rem,5vw,4rem);font-family:Poppins,sans-serif" id="indigoMarqueeTrack">
          ${words.map((w: string, i: number) => `<span class="mx-8" ${i % 2 === 1 ? `style="color:transparent;-webkit-text-stroke:1px ${D}"` : ''}>• ${w}</span>`).join("")}
        </div>
      </div>
      ${marqueeScript()}`;
    }

    case "about":
    case "agency": {
      const title = c.title || "NUESTRA <span style='color:" + B + "'>VISIÓN</span>";
      const desc = c.description || "No somos una agencia tradicional. Somos un laboratorio de ideas donde el diseño se encuentra con la rebeldía. Creemos que lo normal es aburrido y nos especializamos en hacer que las marcas resalten en la jungla de asfalto y en el entorno digital.";
      const img = c.imageUrl || "https://placehold.co/800x500/fdcb0c/050505?text=AGENCIA";
      const stats = c.stats || c.items || [
        { value: "10+", label: "Años de exp." },
        { value: "500", label: "Proyectos" },
      ];
      const isShadow = c.imageStyle === "shadow";
      return `<section id="${c.anchor || 'agencia'}" class="py-24 md:py-32 relative" style="background:${isShadow ? '#f9fafb' : 'white'};${isShadow ? 'border-top:1px solid rgba(0,0,0,0.1);border-bottom:1px solid rgba(0,0,0,0.1)' : 'border-bottom:1px solid rgba(0,0,0,0.1)'}">
        <div class="container mx-auto px-6">
          <div class="flex flex-col md:flex-row items-center gap-16">
            <div class="w-full ${c.reverse ? 'md:order-2' : 'md:w-5/12'} flex flex-col justify-center">
              <h2 class="font-extrabold text-5xl md:text-7xl mb-6 relative z-10" style="color:${D};font-family:Poppins,sans-serif">${title}</h2>
              <p class="text-xl font-light mb-8 opacity-80 relative z-10 leading-relaxed" style="color:${D}">${desc}</p>
              <div class="flex items-center gap-8 font-bold" style="color:${B};font-family:Poppins,sans-serif">
                ${stats.map((s: any) => `<div>
                  <span class="block text-6xl">${s.value || s.title}</span>
                  <span class="text-sm uppercase tracking-widest opacity-60" style="color:${D}">${s.label || s.desc}</span>
                </div>`).join("")}
              </div>
            </div>
            <div class="w-full ${c.reverse ? 'md:order-1 md:w-7/12' : 'md:w-7/12'}">
              ${isShadow ? `<div class="relative">
                <img src="${img}" alt="Agencia" class="w-full h-auto border-4" style="border-color:${D};box-shadow:8px 8px 0 ${D}">
              </div>` : offsetImg(img, "Agencia Indigo", B, "right")}
            </div>
          </div>
        </div>
      </section>`;
    }

    case "features":
    case "services": {
      const isPhilosophy = c.layout === "philosophy";
      if (isPhilosophy) {
        const title = c.title || "NUESTRA <span style='color:" + B + "'>FILOSOFÍA</span>";
        const subtitle = c.subtitle || "El diseño no solo debe verse bien, debe funcionar, impactar y quedarse en la memoria.";
        const items = c.items || [
          { number: "01", title: "Disrupción", desc: "No seguimos tendencias, las creamos. Buscamos siempre el ángulo inesperado para que tu marca se desmarque de la competencia." },
          { number: "02", title: "Calidad", desc: "Materiales premium y acabados meticulosos. Desde un logotipo vectorial hasta un letrero monumental en acero, la excelencia no es negociable." },
          { number: "03", title: "Compromiso", desc: "Tu éxito es nuestro éxito. Nos involucramos en cada proyecto como si fuera nuestra propia marca, de principio a fin." },
        ];
        return `<section id="${c.anchor || 'filosofia'}" class="py-24" style="background:white">
          <div class="container mx-auto px-6">
            <div class="text-center mb-16">
              <h2 class="font-extrabold text-5xl md:text-6xl mb-4" style="color:${D};font-family:Poppins,sans-serif">${title}</h2>
              <p class="text-xl font-light max-w-2xl mx-auto opacity-80" style="color:${D}">${subtitle}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
              ${items.map((item: any, i: number) => {
                const isMiddle = i === 1;
                return `<div class="p-8 transition-transform duration-300 hover:-translate-y-2" style="border:4px solid ${D};${isMiddle ? `background:${B};color:${D}` : ''}">
                  <div class="font-black text-6xl mb-6" style="font-family:Poppins,sans-serif;color:${isMiddle ? D : B}">${item.number || String(i + 1).padStart(2, "0")}</div>
                  <h3 class="font-bold text-2xl mb-4 uppercase tracking-widest" style="font-family:Poppins,sans-serif">${item.title || item.name}</h3>
                  <p class="leading-relaxed" style="opacity:${isMiddle ? 0.9 : 0.8}">${item.desc || item.description || ''}</p>
                </div>`;
              }).join("")}
            </div>
          </div>
        </section>`;
      }

      const kicker = c.kicker || "01";
      const title = c.title || "LETRAS <span style='color:" + B + "'>3D</span>";
      const desc = c.description || "Dale volumen a tu identidad. Fabricamos letreros en 3D que capturan miradas y dominan el espacio. Materiales de primera, acabados surrealistas e iluminación impactante para que tu marca nunca pase desapercibida.";
      const img = c.imageUrl || "https://placehold.co/800x600/fdcb0c/050505?text=LETRAS+3D";
      const bullets = c.features || c.bullets || [
        "Acero inoxidable y acrílico.",
        "Iluminación LED Neon de alto brillo.",
        "Instalación profesional interior y exterior.",
      ];
      const btnText = c.buttonText || "Cotizar Letras 3D";
      const btnUrl = c.buttonUrl || "#contacto";
      return `<section id="${c.anchor || 'letras3d'}" class="py-24 md:py-32 relative" style="background:#f9fafb">
        <div class="container mx-auto px-6">
          <div class="flex flex-col md:flex-row items-center gap-16">
            <div class="w-full md:w-1/2">
              ${offsetImg(img, "Letras 3D Neon", B)}
            </div>
            <div class="w-full md:w-1/2 flex flex-col justify-center">
              <div class="font-bold text-8xl md:text-9xl opacity-20 absolute top-10 right-10 z-0 pointer-events-none" style="color:${B};font-family:Poppins,sans-serif">${kicker}</div>
              <h2 class="font-extrabold text-5xl md:text-7xl mb-6 relative z-10" style="color:${D};font-family:Poppins,sans-serif">${title}</h2>
              <p class="text-xl font-light mb-8 opacity-80 relative z-10 leading-relaxed" style="color:${D}">${desc}</p>
              <ul class="space-y-4 font-semibold text-lg relative z-10" style="color:${D}">
                ${dotList(bullets)}
              </ul>
              <div class="mt-12 relative z-10">${offsetBtn(btnText, btnUrl)}</div>
            </div>
          </div>
        </div>
      </section>`;
    }

    case "portfolio": {
      const title = c.title || "NUESTRO <span style='-webkit-text-stroke:1px " + D + ";color:transparent'>TRABAJO</span>";
      const desc = c.description || "Una selección de nuestros proyectos más audaces. Casos de éxito donde la creatividad no tuvo límites.";
      const img = c.imageUrl || c.image || "https://placehold.co/1200x600/fdcb0c/050505?text=PORTAFOLIO";
      return `<section id="${c.anchor || 'portafolio'}" class="py-24 md:py-32 relative" style="background:white;border-top:1px solid rgba(0,0,0,0.1)">
        <div class="container mx-auto px-6">
          <div class="text-center mb-16">
            <h2 class="font-extrabold text-5xl md:text-7xl relative z-10 inline-block" style="color:${D};font-family:Poppins,sans-serif">${title}</h2>
            <p class="text-xl font-light opacity-80 mt-4 max-w-2xl mx-auto" style="color:${D}">${desc}</p>
          </div>
          <div class="relative group max-w-5xl mx-auto">
            <div class="absolute inset-0 ${c.variant === 'indigo' ? 'translate-x-4 translate-y-4 group-hover:translate-x-8 group-hover:translate-y-8' : ''} transition-transform duration-500 z-0" style="background:${B}"></div>
            <img src="${img}" alt="Portafolio Indigo" class="relative z-10 w-full h-auto object-cover border-4" style="border-color:${D};filter:contrast(1.25)">
            <div class="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none" style="background:rgba(5,5,5,0.8)">
              <span class="text-4xl uppercase font-bold tracking-widest border-2 p-6 text-center" style="color:${B};border-color:${B};font-family:Poppins,sans-serif">Explorar<br>Galería</span>
            </div>
          </div>
        </div>
      </section>`;
    }

    case "testimonials": {
      const title = c.title || "LO QUE <span style='color:" + B + "'>DICEN</span>";
      const items = c.items || [
        { quote: "Indigo transformó nuestra fachada por completo. Las letras 3D le dieron una presencia corporativa brutal que atrajo muchas más miradas.", name: "Carlos M.", role: "TechCorp" },
        { quote: "Rompieron los esquemas con nuestro branding. Entendieron que queríamos algo disruptivo y superaron las expectativas. ¡Increíble trabajo!", name: "Laura S.", role: "Urban Studio" },
        { quote: "Buscábamos salir de lo común y encontramos al socio ideal. El rediseño de identidad nos posicionó como líderes creativos en el sector.", name: "Diego R.", role: "Krypton Labs" },
      ];
      return `<section class="py-24 md:py-32" style="background:#f9fafb;border-top:1px solid rgba(0,0,0,0.1)">
        <div class="container mx-auto px-6">
          <h2 class="font-extrabold text-5xl md:text-7xl mb-16 text-center" style="color:${D};font-family:Poppins,sans-serif">${title}</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            ${items.map((item: any, i: number) => `<div class="bg-white p-8 transition-colors group ${i === 1 ? 'shadow-xl md:-translate-y-6' : ''}" style="border:1px solid rgba(0,0,0,0.1)" onmouseover="this.style.borderColor='${B}'" onmouseout="this.style.borderColor='rgba(0,0,0,0.1)'">
              <div class="text-4xl mb-6" style="color:${B}">"</div>
              <p class="font-light mb-6 italic opacity-80" style="color:${D}">"${item.quote || item.description || ''}"</p>
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full" style="background:rgba(0,0,0,0.1)"></div>
                <div>
                  <h4 class="font-bold" style="color:${D};font-family:Poppins,sans-serif">${item.name}</h4>
                  <span class="text-sm uppercase tracking-widest" style="color:${B}">${item.role}</span>
                </div>
              </div>
            </div>`).join("")}
          </div>
        </div>
      </section>`;
    }

    case "awareness": {
      const title = c.title || '¿Estás compitiendo solo por <span style="color:' + B + '">precio?</span>';
      const desc = c.description || "Cuando tu marca se ve igual a todas las demás en tu industria, el cliente no encuentra una razón para elegirte a ti, excepto si eres más barato. Un branding débil te hace invisible y reemplazable.";
      const highlight = c.highlight || "Es momento de subir el nivel.";
      return `<section id="${c.anchor || ''}" class="py-24" style="background:#f9fafb;border-top:1px solid rgba(0,0,0,0.1);border-bottom:1px solid rgba(0,0,0,0.1)">
        <div class="container mx-auto px-6 text-center">
          <h2 class="font-extrabold text-4xl md:text-6xl mb-8 max-w-4xl mx-auto" style="color:${D};font-family:Poppins,sans-serif">${title}</h2>
          <p class="text-xl md:text-2xl font-light max-w-3xl mx-auto opacity-80 mb-12" style="color:${D}">${desc}</p>
          <div class="inline-block font-bold text-2xl py-4 px-8 border-4 rotate-1" style="background:${B};color:${D};border-color:${D};box-shadow:8px 8px 0 ${D}">
            ${highlight}
          </div>
        </div>
      </section>`;
    }

    case "benefits": {
      const title = c.title || "EL PODER DEL <span style='color:" + B + "'>BRANDING</span>";
      const items = c.items || [
        { number: "01", title: "Autoridad Inmediata", desc: "Un diseño profesional y cohesivo proyecta experiencia y tamaño. Las personas confían instintivamente en lo que se ve bien estructurado." },
        { number: "02", title: "Valor Percibido", desc: "Una marca fuerte te permite salir de la guerra de precios. Cuando conectas a nivel visual y emocional, puedes cobrar lo que realmente vales." },
        { number: "03", title: "Lealtad del Cliente", desc: "Las personas no solo compran productos, compran identidades con las que se alinean. Te ayudamos a crear una tribu alrededor de tu marca." },
      ];
      return `<section id="${c.anchor || ''}" class="py-24 relative overflow-hidden" style="background:${D};color:white">
        <div class="absolute inset-0" style="opacity:0.1;background-image:radial-gradient(${L} 2px,transparent 2px);background-size:30px 30px"></div>
        <div class="container mx-auto px-6 relative z-10">
          <h2 class="font-extrabold text-5xl md:text-6xl mb-16 text-center" style="font-family:Poppins,sans-serif;color:white">${title}</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
            ${items.map((item: any) => `<div class="border-4 border-white p-8 transition-colors duration-300" style="background:${D}" onmouseover="this.style.background='white';this.style.color='${D}'" onmouseout="this.style.background='${D}';this.style.color='white'">
              <div class="font-black text-6xl mb-6 transition-colors" style="font-family:Poppins,sans-serif;color:white" onmouseover="this.style.color='${B}'" onmouseout="this.style.color='white'">${item.number}</div>
              <h3 class="font-bold text-2xl mb-4 uppercase" style="font-family:Poppins,sans-serif">${item.title || item.name}</h3>
              <p class="font-medium text-lg">${item.desc || item.description || ''}</p>
            </div>`).join("")}
          </div>
        </div>
      </section>`;
    }

    case "cta":
    case "contact": {
      if (c.style === "funnel") {
        const title = c.title || "DOMINA TU <span style='color:" + B + "'>MERCADO.</span>";
        const desc = c.description || "Deja de ser uno más del montón. Cuéntanos sobre tu negocio y diseñemos una identidad que nadie pueda ignorar.";
        const btnText = c.buttonText || "INICIAR REBRANDING";
        const btnUrl = c.buttonUrl || "#contacto";
        const dropShadow = `drop-shadow(6px 6px 0 ${D})`;
        return `<section id="${c.anchor || 'cta'}" class="py-32 relative overflow-hidden" style="background:${B};border-bottom:8px solid ${D}">
          <div class="container mx-auto px-6 text-center relative z-10">
            <h2 class="font-black text-6xl md:text-[7rem] leading-none mb-8 uppercase tracking-tighter" style="font-family:Poppins,sans-serif;color:${D};filter:${dropShadow}">${title}</h2>
            <p class="text-2xl font-bold mb-12 max-w-2xl mx-auto border-2 p-4" style="background:white;border-color:${D};box-shadow:4px 4px 0 ${D};color:${D}">
              ${desc}
            </p>
            <a href="${siteHref(btnUrl)}" class="inline-flex items-center gap-4 border-4 font-black uppercase tracking-widest py-6 px-8 md:px-16 text-xl md:text-2xl transition-all inline-block" style="border-color:${D};background:${D};color:${B};box-shadow:8px 8px 0 ${D}" onmouseover="this.style.background='white';this.style.color='${D}';this.style.boxShadow='none';this.style.transform='translate(2px,2px)'" onmouseout="this.style.background='${D}';this.style.color='${B}';this.style.boxShadow='8px 8px 0 ${D}';this.style.transform='none'" ${btnUrl.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
              ${btnText}
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </a>
          </div>
        </section>`;
      }
      const kicker = c.kicker || "¿Listo para";
      const title = c.title || "destacar?";
      const subtitle = c.description || "Hagamos que tu marca sea imposible de ignorar.";
      const btnText = c.buttonText || "Iniciar Proyecto";
      const btnUrl = c.buttonUrl || c.email ? `mailto:${c.email || 'hola@indigopublicidad.com'}` : "#";
      const phone = c.phone || "";
      const address = c.address || "";
      return `<section id="${c.anchor || 'contacto'}" class="py-32 md:py-48 relative overflow-hidden" style="background:${B}">
        <div class="absolute inset-0 opacity-20" style="background-image:radial-gradient(${D} 2px,transparent 2px);background-size:30px 30px"></div>
        <div class="absolute top-10 left-10 w-24 h-24 border-4 rounded-full animate-pulse" style="border-color:${D}"></div>
        <div class="absolute bottom-10 right-10 w-32 h-32 rotate-45 transform origin-center" style="background:${D}"></div>
        <div class="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <h2 class="font-black text-6xl md:text-[8rem] leading-none mb-6 uppercase tracking-tighter" style="color:${D};font-family:Poppins,sans-serif;text-shadow:8px 8px 0 ${D}">
            ${kicker}<br>${title}
          </h2>
          <p class="text-xl md:text-3xl mb-16 font-medium max-w-3xl mx-auto inline-block px-4 py-2 border-2" style="color:${D};background:${B};border-color:${D};box-shadow:4px 4px 0 ${D};font-family:Poppins,sans-serif">
            ${subtitle}
          </p>
          <a href="${btnUrl}" class="inline-flex items-center gap-4 relative group" ${btnUrl.startsWith('mailto') || btnUrl.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
            <span class="absolute inset-0 translate-x-3 translate-y-3 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-300 rounded-full" style="background:${D}"></span>
            <span class="relative flex items-center gap-4 border-4 font-black uppercase tracking-widest py-5 px-12 md:py-6 md:px-16 text-xl md:text-2xl rounded-full transition-colors" style="border-color:${D};background:white;color:${D};font-family:Poppins,sans-serif" onmouseover="this.style.background='${D}';this.style.color='${B}'" onmouseout="this.style.background='white';this.style.color='${D}'">
              ${btnText}
              <svg class="w-8 h-8 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </span>
          </a>
          <form id="contactForm" method="POST" action="${actionUrl(site, apiBaseUrl)}" data-pub-form class="mt-16 w-full max-w-lg text-left">
            <div class="space-y-4">
              ${(c.fields && c.fields.length ? c.fields : [
                { label: "Nombre", name: "nombre", type: "text", required: true },
                { label: "Email", name: "email", type: "email", required: true },
                { label: "Mensaje", name: "mensaje", type: "textarea", required: true },
              ]).filter((f: any) => f.type !== 'textarea').map((f: any) => `<div>
                <label class="block text-sm font-bold uppercase tracking-widest mb-2" style="color:${D}">${f.label}</label>
                <input type="${f.type || 'text'}" name="${f.name}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}" class="w-full px-4 py-3 text-sm border-2 outline-none" style="border-color:${D};background:white;color:${D}">
              </div>`).join("")}
              ${(c.fields && c.fields.length ? c.fields : []).filter((f: any) => f.type === 'textarea').map((f: any) => `<div>
                <label class="block text-sm font-bold uppercase tracking-widest mb-2" style="color:${D}">${f.label}</label>
                <textarea name="${f.name}" rows="4" ${f.required ? 'required' : ''} class="w-full px-4 py-3 text-sm border-2 outline-none resize-none" style="border-color:${D};background:white;color:${D}" placeholder="${f.placeholder || ''}">${f.value || ''}</textarea>
              </div>`).join("") || `<div>
                <label class="block text-sm font-bold uppercase tracking-widest mb-2" style="color:${D}">Mensaje</label>
                <textarea name="mensaje" rows="4" required class="w-full px-4 py-3 text-sm border-2 outline-none resize-none" style="border-color:${D};background:white;color:${D}" placeholder="Cuéntanos tu proyecto..."></textarea>
              </div>`}
              <div data-pub-form-status style="display:none;padding:12px 16px;font-size:14px;border:2px solid ${D};color:${D};background:white"></div>
              <button data-analytics-click data-analytics-type="click" data-analytics-label="indigo_cta_submit" type="submit" class="w-full py-4 text-sm font-bold uppercase tracking-widest border-2 transition-all" style="border-color:${D};background:${D};color:${B}" onmouseover="this.style.boxShadow='4px 4px 0 white'" onmouseout="this.style.boxShadow='none'">
                ENVIAR <i class="bi bi-send ml-2"></i>
              </button>
            </div>
          </form>
        </div>
      </section>`;
    }

    case "process": {
      const title = c.title || "NUESTRO <br><span style='-webkit-text-stroke:1px " + B + ";color:transparent'>PROCESO</span>";
      const img = c.imageUrl || "https://placehold.co/800x600/fdcb0c/050505?text=PROCESO";
      const items = c.items || [
        { number: "01", title: "Descubrimiento", desc: "Sumergirnos en el ADN de tu marca. Entender el mercado, la competencia y el objetivo final para trazar un plan de ataque." },
        { number: "02", title: "Concepto", desc: "Lluvia de ideas sin filtros. Creamos propuestas abstractas que luego moldeamos hasta conseguir un diseño sólido y disruptivo." },
        { number: "03", title: "Ejecución", desc: "Manos a la obra. Ya sea la fabricación de letras 3D o el desarrollo de una identidad, pulimos cada detalle a la perfección." },
      ];
      return `<section id="${c.anchor || 'proceso'}" class="py-24 md:py-32 relative" style="background:#f9fafb;border-top:1px solid rgba(0,0,0,0.1)">
        <div class="container mx-auto px-6">
          <div class="flex flex-col md:flex-row items-center gap-16">
            <div class="w-full md:w-1/2">
              ${offsetImg(img, "Proceso Creativo Indigo", B)}
            </div>
            <div class="w-full md:w-1/2 flex flex-col justify-center">
              <h2 class="font-extrabold text-5xl md:text-7xl mb-12 relative z-10" style="color:${D};font-family:Poppins,sans-serif">${title}</h2>
              <div class="space-y-8 relative z-10" style="color:${D}">
                ${items.map((item: any, i: number) => `<div class="flex gap-6 items-start">
                  <span class="font-bold text-4xl" style="color:${B};font-family:Poppins,sans-serif">${item.number || String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 class="font-bold text-2xl mb-2 uppercase tracking-widest" style="font-family:Poppins,sans-serif">${item.title || item.name}</h3>
                    <p class="font-light opacity-70">${item.desc || item.description || ''}</p>
                  </div>
                </div>`).join("")}
              </div>
            </div>
          </div>
        </div>
      </section>`;
    }

    case "stats": {
      const items = c.items || [
        { value: "10+", label: "Años de exp." },
        { value: "500", label: "Proyectos" },
        { value: "50+", label: "Clientes" },
        { value: "99%", label: "Satisfacción" },
      ];
      const isDropShadow = c.style === "drop-shadow";
      return `<section class="py-24" style="background:${D};border-top:1px solid ${B};border-bottom:1px solid ${B};position:relative;overflow:hidden">
        ${isDropShadow ? `<div class="absolute pointer-events-none" style="top:-50%;left:-10%;width:24rem;height:24rem;background:${B};border-radius:50%;mix-blend-mode:multiply;opacity:0.2;filter:blur(3rem)"></div>` : ''}
        <div class="container mx-auto px-6 relative z-10">
          <div class="grid grid-cols-1 md:grid-cols-${items.length > 3 ? '3' : '4'} gap-12 text-center">
            ${items.map((item: any) => `<div>
              <div class="font-black text-6xl md:text-8xl" style="color:${B};font-family:Poppins,sans-serif;${isDropShadow ? 'text-shadow:4px 4px 0 white' : ''}">${item.value || item.title}</div>
              <div class="uppercase tracking-widest text-sm font-bold mt-4 opacity-80" style="color:${L}">${item.label || item.desc}</div>
            </div>`).join("")}
          </div>
        </div>
      </section>`;
    }

    case "gallery": {
      const title = c.title || "GALERÍA";
      const images = c.images || [
        { url: "https://placehold.co/600x400/fdcb0c/050505?text=1" },
        { url: "https://placehold.co/600x400/050505/fdcb0c?text=2" },
        { url: "https://placehold.co/600x400/fdcb0c/050505?text=3" },
      ];
      return `<section id="${c.anchor || 'galeria'}" class="py-24 md:py-32" style="background:#f9fafb">
        <div class="container mx-auto px-6">
          <h2 class="font-extrabold text-5xl md:text-7xl mb-16 text-center" style="color:${D};font-family:Poppins,sans-serif">${title}</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            ${images.map((img: any, i: number) => `<div class="relative aspect-[4/3] overflow-hidden group">
              <img src="${img.url || img.src || ''}" alt="${img.alt || 'Galería'}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style="filter:contrast(1.25)">
            </div>`).join("")}
          </div>
        </div>
      </section>`;
    }

    case "footer": {
      const companyName = c.companyName || site?.name || "Indigo Publicidad";
      const logo = c.logoImage || site?.logoUrl || PLACEHOLDER_LOGO;
      const links = c.links || c.navLinks || [
        { label: "Nosotros", url: "#agencia" },
        { label: "Letras 3D & Neón", url: "#letras3d" },
        { label: "Branding Estratégico", url: "#branding" },
        { label: "Portafolio", url: "#portafolio" },
      ];
      const social = c.social || [
        { label: "Instagram", url: "#" },
        { label: "Behance", url: "#" },
        { label: "LinkedIn", url: "#" },
      ];
      const copyright = c.copyright || `© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.`;
      const email = c.email || "hola@indigopublicidad.com";
      const phone = c.phone || "+1 (555) 123-4567";
      const address = c.address || "Ciudad Creativa, Distrito de Diseño 0987";
      return `<footer class="pt-24 pb-8 relative overflow-hidden" style="background:white;border-top:4px solid ${D}">
        <div class="container mx-auto px-6 relative z-10">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
            <div class="md:col-span-1">
              <a href="#" class="block mb-6">
                <img src="${logo}" alt="${companyName}" class="h-16 w-auto object-contain" style="filter:brightness(0) invert(1)">
              </a>
              <p class="font-light opacity-70 mb-6 max-w-xs" style="color:${D}">Laboratorio de ideas creativas. Rompemos moldes con Letras 3D y Branding disruptivo.</p>
            </div>
            <div>
              <h4 class="font-bold text-xl mb-6 uppercase tracking-widest" style="color:${D};font-family:Poppins,sans-serif">Agencia</h4>
              <ul class="space-y-4 font-light opacity-80" style="color:${D}">
                ${links.map((l: any) => `<li><a href="${siteHref(l.url)}" class="hover:font-semibold transition-all" style="color:${D}" onmouseover="this.style.color='${B}'" onmouseout="this.style.color='${D}'">${l.label}</a></li>`).join("")}
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-xl mb-6 uppercase tracking-widest" style="color:${D};font-family:Poppins,sans-serif">Estudio</h4>
              <ul class="space-y-4 font-light opacity-80" style="color:${D}">
                <li><a href="mailto:${email}" class="hover:font-semibold transition-all" onmouseover="this.style.color='${B}'" onmouseout="this.style.color='${D}'">${email}</a></li>
                <li><a href="tel:${phone.replace(/[^0-9+]/g, '')}" class="hover:font-semibold transition-all" onmouseover="this.style.color='${B}'" onmouseout="this.style.color='${D}'">${phone}</a></li>
                <li class="pt-4">${address}</li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-xl mb-6 uppercase tracking-widest" style="color:${D};font-family:Poppins,sans-serif">Redes</h4>
              <ul class="space-y-4 font-light opacity-80" style="color:${D}">
                ${social.map((s: any) => `<li><a href="${s.url || '#'}" class="hover:font-semibold transition-all flex items-center gap-2" onmouseover="this.style.color='${B}'" onmouseout="this.style.color='${D}'" ${s.url && s.url !== '#' ? 'target="_blank" rel="noopener"' : ''}>↗ ${s.label}</a></li>`).join("")}
              </ul>
            </div>
          </div>
          <div class="pt-8 flex flex-col md:flex-row justify-between items-center gap-6" style="border-top:2px solid rgba(0,0,0,0.1)">
            <div class="text-sm font-semibold opacity-60" style="color:${D}">${copyright}</div>
            <div class="flex gap-6 text-sm font-semibold opacity-60" style="color:${D}">
              <a href="#" onmouseover="this.style.color='${B}'" onmouseout="this.style.color='${D}'" class="transition-colors">Privacidad</a>
              <a href="#" onmouseover="this.style.color='${B}'" onmouseout="this.style.color='${D}'" class="transition-colors">Términos</a>
            </div>
          </div>
        </div>
        <div class="absolute bottom-[-5%] left-0 w-full overflow-hidden flex justify-center pointer-events-none select-none z-0" style="opacity:0.05">
          <span class="font-black text-dark whitespace-nowrap" style="font-size:15vw;line-height:1;font-family:Poppins,sans-serif">INDIGO AGENCY</span>
        </div>
        ${footerScript()}
      </footer>`;
    }

    case "video": {
      return `<section id="${c.anchor || 'video'}" class="py-24 md:py-32" style="background:${D}">
        <div class="max-w-5xl mx-auto px-6">
          <div class="relative aspect-video overflow-hidden border-4" style="border-color:${D}">
            ${c.videoUrl ? `<iframe src="${c.videoUrl}" class="w-full h-full" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe>` : `<img src="${c.thumbnail || c.imageUrl || 'https://placehold.co/1280x720/fdcb0c/050505?text=VIDEO'}" alt="${c.title || 'Video'}" class="w-full h-full object-cover">`}
          </div>
        </div>
      </section>`;
    }

    case "image": {
      return `<section id="${c.anchor || 'imagen'}" class="py-16" style="background:${c.background === 'dark' ? D : L}">
        <div class="max-w-5xl mx-auto px-6">
          <div class="border-4 overflow-hidden" style="border-color:${D}">
            <img src="${c.imageUrl || 'https://placehold.co/1200x600/fdcb0c/050505?text=IMAGEN'}" alt="${c.title || c.alt || 'Imagen'}" class="w-full h-auto object-cover" loading="lazy">
          </div>
        </div>
      </section>`;
    }

    case "form": {
      const kicker = c.kicker || "FORMULARIO";
      const title = c.title || "Contáctanos";
      return `<section id="${c.anchor || 'formulario'}" class="py-24 md:py-32" style="background:${c.background === 'dark' ? D : L}">
        <div class="max-w-2xl mx-auto px-6">
          <div class="text-center mb-10">
            <p class="text-sm font-bold uppercase tracking-widest mb-4" style="color:${B}">${kicker}</p>
            <h2 class="text-3xl lg:text-4xl font-black uppercase" style="color:${D};font-family:Poppins,sans-serif">${title}</h2>
          </div>
          <form method="POST" action="${actionUrl(site, apiBaseUrl)}" data-pub-form class="p-8 border-2" style="border-color:${D};background:white">
            <div class="space-y-5">
              ${(c.fields && c.fields.length ? c.fields : [
                { label: "Nombre", name: "nombre", type: "text", required: true },
                { label: "Email", name: "email", type: "email", required: true },
                { label: "Mensaje", name: "mensaje", type: "textarea", required: true },
              ]).filter((f: any) => f.type !== 'textarea').map((f: any) => `<div>
                <label class="block text-sm font-bold uppercase tracking-widest mb-2" style="color:${D}">${f.label}</label>
                <input type="${f.type || 'text'}" name="${f.name}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}" class="w-full px-4 py-3 text-sm border-2 outline-none" style="border-color:${D};background:white;color:${D}">
              </div>`).join("")}
              ${(c.fields && c.fields.length ? c.fields : []).filter((f: any) => f.type === 'textarea').map((f: any) => `<div>
                <label class="block text-sm font-bold uppercase tracking-widest mb-2" style="color:${D}">${f.label}</label>
                <textarea name="${f.name}" rows="4" ${f.required ? 'required' : ''} class="w-full px-4 py-3 text-sm border-2 outline-none resize-none" style="border-color:${D};background:white;color:${D}" placeholder="${f.placeholder || ''}">${f.value || ''}</textarea>
              </div>`).join("")}
              <div data-pub-form-status style="display:none;padding:12px 16px;font-size:14px;border:2px solid ${D};color:${D}"></div>
              <button data-analytics-click data-analytics-type="click" data-analytics-label="indigo_form_submit" type="submit" class="w-full py-4 text-sm font-bold uppercase tracking-widest border-2 transition-all" style="border-color:${D};background:${D};color:${B}" onmouseover="this.style.boxShadow='4px 4px 0 white'" onmouseout="this.style.boxShadow='none'">
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
      return `<a href="https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encoded}" target="_blank" rel="noopener" class="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110" style="background:#25D366;box-shadow:4px 4px 0 ${D}" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>`;
    }

    case "sorteo-form": {
      return `<section id="${c.anchor || 'sorteo'}" class="py-24 md:py-32" style="background:${D}">
        <div class="max-w-2xl mx-auto px-6 text-center">
          <p class="text-sm font-bold uppercase tracking-widest mb-4" style="color:${B}">${c.kicker || "SORTEO"}</p>
          <h2 class="text-3xl lg:text-5xl font-black uppercase" style="color:${L};font-family:Poppins,sans-serif">${c.title || "Participa y gana"}</h2>
          ${c.description ? `<p class="mt-4 text-sm opacity-70" style="color:${L}">${c.description}</p>` : ''}
        </div>
      </section>`;
    }

    default:
      return null;
  }
}
