/* eslint-disable */

// Shared head: Inter font + Font Awesome + custom CSS that the template relies on.
// Injected once via the header block so it also works in the editor build.
const GRADUATE_FONTS =
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />' +
  '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />';

const GRADUATE_STYLE = `<style>
  html { scroll-behavior: smooth; }
  .graduate-perspective { perspective: 1000px; }
  .graduate-3d { transform-style: preserve-3d; }
  .graduate-carousel-card { -webkit-backface-visibility: hidden; backface-visibility: hidden; will-change: transform, opacity; }
  .graduate-menu-open .graduate-mobile-nav { display: flex; }
</style>`;

const gradDotGrid =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC4xIi8+Cjwvc3ZnPg==";

const gradLineGrid =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0MCIgc3Ryb2tlPSJyZ2FzYSgyMjksMjQxLDIwMCwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==";

export function getGraduateHtml(type: string, c: any, apiBaseUrl?: string, site?: any): string | null {
  if (c.variant !== "graduate") return null;

  // Editable head/personalisation. We only emit fonts + style on the header
  // block so they appear once for the editor and published page.
  const head = type === "header" ? GRADUATE_FONTS + GRADUATE_STYLE : "";

  const C = {
    // Brand / header
    brandInitial: c.brandInitial || "G",
    brand: c.brand || c.companyName || "Graduate.",
    brandUrl: c.logoUrl || "#",
    links: c.links || [],
    ctaText: c.ctaText || "Hablemos",
    ctaUrl: c.ctaUrl || "#contacto",

    // Hero
    heroBg:
      c.backgroundImage ||
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop",
    tag: c.tag || "Agencia & Academia Digital",
    titleLine1: c.titleLine1 || "Revoluciona el",
    titleHighlight: c.titleHighlight || "Crecimiento",
    titleLine2: c.titleLine2 || "de tu negocio.",
    subtitle:
      c.subtitle ||
      "Construimos ecosistemas digitales que venden. Si no estás aprovechando la publicidad digital y las redes sociales, tu competencia sí lo está haciendo.",
    primaryButtonText: c.primaryButtonText || "Escalar mi negocio",
    primaryButtonUrl: c.primaryButtonUrl || "#servicios",
    secondaryButtonText: c.secondaryButtonText || "Asesoría Gratuita",
    secondaryButtonUrl: c.secondaryButtonUrl || "#contacto",
    heroCards: c.cards || [
      {
        badge: "Emprendedor",
        color: "#fa7202",
        image:
          "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop",
        title: "Agencia Digital",
        alt: "Graduado Emprendedor",
      },
      {
        badge: "Ventas Online",
        color: "#21b1fe",
        image:
          "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=600&auto=format&fit=crop",
        title: "E-commerce Manager",
        alt: "Graduada E-commerce",
      },
      {
        badge: "Caso de Éxito",
        color: "#7dd958",
        image:
          "https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=600&auto=format&fit=crop",
        title: "Agencia Creativa",
        alt: "Equipo Creativo",
      },
    ],
    badgeIcon: c.badgeIcon || "fa-solid fa-graduation-cap",
    badgeLabel: c.badgeLabel || "Comunidad",
    badgeValue: c.badgeValue || "+500 Alumnos",
    heroStyle: c.heroStyle || c.sub || "carousel",

    // About / Nosotros
    eyebrow: c.eyebrow || "Nuestra Esencia",
    aboutTitleLine1: c.aboutTitleLine1 || "Transformamos",
    aboutTitleHighlight1: c.aboutTitleHighlight1 || "seguidores en",
    aboutTitleHighlight2: c.aboutTitleHighlight2 || "clientes reales.",
    aboutDesc:
      c.description ||
      'En <strong>Academia Graduate</strong> no somos una agencia tradicional. Somos tu equipo de crecimiento estratégico. Olvídate de los "likes" vacíos; nos enfocamos en el <strong>ROI (Retorno de Inversión)</strong> y en enseñar metodologías 100% prácticas.',
    aboutFeatures: c.features || [
      {
        icon: "fa-solid fa-bullseye",
        color: "#7dd958",
        title: "Estrategia Local",
        desc: "Conocemos el mercado ecuatoriano y cómo conectar con tu audiencia.",
      },
      {
        icon: "fa-solid fa-handshake",
        color: "#21b1fe",
        title: "Acompañamiento",
        desc: "No te dejamos solo. Te educamos mientras crecemos juntos.",
      },
    ],
    mainImage:
      c.mainImage ||
      "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    mainImageAlt: c.mainImageAlt || "Equipo",
    secondaryImage:
      c.secondaryImage ||
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    secondaryImageAlt: c.secondaryImageAlt || "Trabajo en equipo",
    aboutBadgeValue: c.badgeValue || "+5",
    aboutBadgeLabel: c.badgeLabel || "Años de<br/>Experiencia",

    // Services / bento grid
    servicesEyebrow: c.servicesEyebrow || c.eyebrow || "Lo que hacemos por ti",
    servicesEyebrowIcon: c.servicesEyebrowIcon || c.eyebrowIcon || "fa-solid fa-fire",
    servicesTitleLine1: c.servicesTitleLine1 || "Soluciones Integrales",
    servicesTitleLine2: c.servicesTitleLine2 || "de",
    servicesHighlight: c.servicesHighlight || "Marketing",
    servicesSubtitle:
      c.servicesSubtitle ||
      c.subtitle ||
      "No ofrecemos paquetes genéricos. Diseñamos ecosistemas digitales a medida para escalar las ventas de tu negocio.",
    servicesId: c.servicesId || "servicios",
    servicesCards: c.cards || [
      {
        colSpan: "lg:col-span-2",
        dark: false,
        icon: "fa-solid fa-bullhorn",
        iconBg: "from-[#2d2e81] to-blue-600",
        iconShadow: "shadow-blue-500/30",
        title: "Tráfico y Captación (Ads)",
        titleSize: "text-3xl",
        desc: "Campañas de alta conversión en Meta (Facebook/Instagram) y Google Ads. Llevamos a tu cliente ideal directamente a tu WhatsApp o página web.",
        blob: "from-blue-100",
        checks: [
          "Segmentación avanzada",
          "Optimización de presupuesto",
          "Retargeting estratégico",
          "Reportes de rendimiento",
        ],
      },
      {
        icon: "fa-solid fa-pen-nib",
        iconBg: "from-[#fa7202] to-[#ffb347]",
        iconShadow: "shadow-orange-500/30",
        title: "Contenido que Vende",
        titleSize: "text-2xl",
        desc: "Estrategias orgánicas, guiones para Reels/TikToks y diseño de posts que construyen autoridad y educan a tu cliente.",
        blob: "from-orange-100",
        linkColor: "text-[#fa7202]",
        linkText: "Saber más",
        linkUrl: "#contacto",
      },
      {
        icon: "fa-solid fa-laptop-code",
        iconBg: "from-[#21b1fe] to-sky-400",
        iconShadow: "shadow-sky-500/30",
        title: "Digitalización Web",
        titleSize: "text-2xl",
        desc: "Diseño de landing pages, embudos de venta y tiendas virtuales optimizadas específicamente para maximizar conversiones.",
        blob: "from-sky-100",
        linkColor: "text-[#21b1fe]",
        linkText: "Saber más",
        linkUrl: "#contacto",
      },
      {
        colSpan: "lg:col-span-2",
        dark: true,
        badge: "Para Equipos y Empresas",
        icon: "fa-solid fa-users-gear",
        title: "Capacitación In-House",
        desc: "No solo te damos el pescado, te enseñamos a pescar. Entrenamos a tu equipo comercial o de marketing con tácticas modernas de cierre de ventas, atención por WhatsApp y gestión digital.",
        buttonText: "Agendar Entrenamiento",
        buttonUrl: "#contacto",
      },
    ],

    // Features / Academia
    academiaEyebrow: c.academiaEyebrow || "Nuestra Academia",
    academiaEyebrowIcon: c.academiaEyebrowIcon || "fa-solid fa-graduation-cap",
    academiaTitleLine1: c.academiaTitleLine1 || "Aprende con los",
    academiaHighlight: c.academiaHighlight || "mejores.",
    academiaRightText:
      c.academiaRightText ||
      "Capacítate tú mismo para dominar el ecosistema digital de tu negocio. Metodología 100% práctica y aplicable.",
    academiaLinkText: c.academiaLinkText || "Explorar todos los programas",
    academiaLinkUrl: c.academiaLinkUrl || "#contacto",
    courses: c.courses || c.items || [
      {
        number: "01",
        numberColor: "group-hover:text-[#2d2e81]",
        title: "Master en Meta Ads",
        titleColor: "group-hover:text-[#21b1fe]",
        desc: "Domina campañas rentables en Facebook e Instagram. Segmentación y Pixel.",
        badges: [
          { text: "Online / Presencial" },
          { icon: "fa-regular fa-clock", text: "12 Horas" },
        ],
        circleColor: "group-hover:bg-[#2d2e81] group-hover:border-[#2d2e81]",
      },
      {
        number: "02",
        numberColor: "group-hover:text-[#7dd958]",
        title: "Cierre por WhatsApp",
        titleColor: "group-hover:text-[#7dd958]",
        desc: "Convierte chats en ventas. WhatsApp Business, automatizaciones y scripts persuasivos.",
        badges: [
          { text: "Online" },
          { icon: "fa-regular fa-clock", text: "8 Horas" },
        ],
        circleColor: "group-hover:bg-[#7dd958] group-hover:border-[#7dd958]",
      },
      {
        number: "03",
        numberColor: "group-hover:text-pink-500",
        title: "Contenido Viral & TikTok",
        titleColor: "group-hover:text-pink-500",
        desc: "Fórmula para videos cortos que enganchen y generen visualizaciones orgánicas.",
        badges: [
          { text: "Próximamente", highlight: true },
          { icon: "fa-regular fa-clock", text: "10 Horas" },
        ],
        circleColor: "group-hover:bg-pink-500 group-hover:border-pink-500",
      },
    ],

    // Testimonials
    testiEyebrow: c.testiEyebrow || "Casos de Éxito",
    testiTitleLine1: c.testiTitleLine1 || "Resultados que hablan por",
    testiHighlight: c.testiHighlight || "sí solos.",
    testiSubtitle:
      c.testiSubtitle ||
      "Únete a las decenas de emprendedores y empresas en Ecuador que ya escalaron sus ventas con nosotros.",
    testimonials: c.testimonials || c.items || [
      {
        large: true,
        gradient: "from-[#2d2e81] to-[#0a0b2e]",
        starColor: "text-[#fa7202]",
        quote:
          '"Antes sentía que gastaba dinero en redes sociales sin ver retorno. Desde que aplicaron su estrategia y tomé su taller de ventas, nuestra facturación en la tienda física creció un 40% en apenas dos meses."',
        name: "María Fernanda L.",
        role: "Dueña de Boutique (Quito)",
        roleColor: "text-blue-200",
        avatar: "https://i.pravatar.cc/150?img=32",
        online: true,
      },
      {
        starColor: "text-[#21b1fe]",
        borderHover: "hover:border-[#21b1fe]/30",
        quote:
          '"El curso de Meta Ads fue un antes y un después. Por fin entiendo cómo funciona el Pixel y mis campañas ahora sí son rentables."',
        name: "Carlos M.",
        role: "Emprendedor E-commerce",
        avatar: "https://i.pravatar.cc/150?img=11",
      },
      {
        starColor: "text-[#fa7202]",
        borderHover: "hover:border-[#fa7202]/30",
        quote:
          '"La paciencia y el conocimiento del equipo Graduate es increíble. Nuestra clínica dental duplicó sus pacientes en 3 meses."',
        name: "Dra. Andrea V.",
        role: "Centro Odontológico",
        avatar: "https://i.pravatar.cc/150?img=47",
      },
    ],
    brands: c.brands || [
      { classes: "text-xl md:text-2xl font-black font-serif", title: "BRAND", accent: "ONE", color: "#2d2e81" },
      { classes: "text-xl md:text-2xl font-black tracking-tighter", title: "STUDIO", accent: ".", color: "#fa7202" },
      { classes: "text-xl md:text-2xl font-bold italic text-gray-600", title: "NaturaEcuador", accent: "", color: "#2d2e81" },
      { classes: "text-xl md:text-2xl font-black font-mono", title: "Tech", accent: "Corp", color: "#7dd958" },
    ],

    // CTA banner
    ctaBadge: c.ctaBadge || "Disponibilidad Inmediata",
    ctaTitleLine1: c.ctaTitleLine1 || "¿Listo para dar el",
    ctaHighlight: c.ctaHighlight || "siguiente paso?",
    ctaSubtitle:
      c.ctaSubtitle ||
      "Digitaliza y promociona tu negocio hoy mismo. No dejes que tu competencia se quede con los clientes que te buscan.",
    cardTitle: c.cardTitle || "Hablemos ahora",
    cardSubtitle:
      c.cardSubtitle ||
      "Te asesoramos sin compromiso sobre la mejor estrategia para ti.",
    whatsappButtonText: c.whatsappButtonText || "Iniciar chat",
    whatsappNumber: c.whatsappNumber || "593000000000",

    // Footer
    footerBrandInitial: c.brandInitial || "G",
    footerBrand: c.brand || "Graduate.",
    footerBrandUrl: c.logoUrl || "#",
    footerDesc:
      c.brandDesc ||
      "Agencia y academia de marketing digital. Transformamos la manera en que los negocios crecen y se comunican en Ecuador.",
    socials: c.socials || [
      { icon: "fa-brands fa-facebook-f", url: "#", hover: "hover:bg-[#2d2e81] hover:border-[#2d2e81]" },
      { icon: "fa-brands fa-instagram", url: "#", hover: "hover:bg-gradient-to-tr hover:from-orange-500 hover:to-pink-500 hover:border-transparent" },
      { icon: "fa-brands fa-whatsapp text-lg", url: "#", hover: "hover:bg-[#7dd958] hover:border-[#7dd958]" },
      { icon: "fa-brands fa-tiktok", url: "#", hover: "hover:bg-black hover:border-black" },
    ],
    navTitle: c.navTitle || "Navegación",
    navLinks: c.navLinks || [
      { label: "Inicio", url: "#inicio" },
      { label: "Nuestra Esencia", url: "#nosotros" },
      { label: "Servicios", url: "#servicios" },
      { label: "Academia", url: "#academia" },
    ],
    contactTitle: c.contactTitle || "Contacto",
    locationTitle: c.locationTitle || "Quito, Ecuador",
    locationSub: c.locationSub || "Servicio remoto a nivel nacional.",
    phone: c.phone || "+593 99 999 9999",
    phoneTel: c.phoneTel || "+593000000000",
    email: c.email || "hola@graduate.com.ec",
    copyright: c.copyright || "© 2026 Academia Graduate. Todos los derechos reservados.",
    legalLinks: c.legalLinks || [
      { label: "Términos de Servicio", url: "#" },
      { label: "Privacidad", url: "#" },
    ],
    giantText: c.giantText || "GRADUATE",

    // Stats band
    stats: c.stats || c.items || [
      { value: "+5", label: "Años de Experiencia", color: "text-[#fa7202]", icon: "fa-solid fa-medal" },
      { value: "+500", label: "Marcas Impulsadas", color: "text-[#21b1fe]", icon: "fa-solid fa-rocket" },
      { value: "40%", label: "Crecimiento Promedio", color: "text-[#7dd958]", icon: "fa-solid fa-arrow-trend-up" },
      { value: "24/7", label: "Acompañamiento", color: "text-[#fa7202]", icon: "fa-solid fa-headset" },
    ],

    // Timeline / Historia
    timelineEyebrow: c.timelineEyebrow || "Nuestra Historia",
    timelineEyebrowIcon: c.timelineEyebrowIcon || "fa-solid fa-route",
    timelineTitleLine1: c.timelineTitleLine1 || "El camino que nos ha",
    timelineHighlight: c.timelineHighlight || "traído aquí.",
    timeline: c.timeline || c.items || [
      { year: "2019", icon: "fa-solid fa-lightbulb", color: "text-[#fa7202]", borderColor: "border-[#fa7202]", title: "El inicio", desc: "Nacemos como un pequeño estudio de redes sociales para negocios locales de Quito." },
      { year: "2021", icon: "fa-solid fa-users", color: "text-[#21b1fe]", borderColor: "border-[#21b1fe]", title: "Primer gran equipo", desc: "Sumamos estrategas, creativos y community managers. Superamos los 100 clientes activos." },
      { year: "2023", icon: "fa-solid fa-graduation-cap", color: "text-[#7dd958]", borderColor: "border-[#7dd958]", title: "Nace la Academia", desc: "Lanzamos los primeros cursos de Meta Ads y marketing digital con metodología 100% práctica." },
      { year: "2026", icon: "fa-solid fa-rocket", color: "text-[#2d2e81]", borderColor: "border-[#2d2e81]", title: "Hoy, hacia el futuro", desc: "Una comunidad de +500 marcas y miles de alumnos creciendo junto a nosotros." },
    ],

    // Team
    teamEyebrow: c.teamEyebrow || "Conócenos",
    teamTitleLine1: c.teamTitleLine1 || "El talento detrás de",
    teamTitleHighlight: c.teamTitleHighlight || "Graduate.",
    members: c.members || c.items || [
      { name: "Alejandro Flores", role: "Fundador & CEO", image: "https://i.pravatar.cc/150?img=68", roleColor: "text-[#fa7202]", socials: [{ icon: "fa-brands fa-linkedin-in", url: "#" }, { icon: "fa-brands fa-instagram", url: "#" }] },
      { name: "Valentina Paz", role: "Directora Creativa", image: "https://i.pravatar.cc/150?img=47", roleColor: "text-[#21b1fe]", socials: [{ icon: "fa-brands fa-linkedin-in", url: "#" }, { icon: "fa-brands fa-x-twitter", url: "#" }] },
      { name: "Mateo Andrade", role: "Estratega Meta Ads", image: "https://i.pravatar.cc/150?img=59", roleColor: "text-[#7dd958]", socials: [{ icon: "fa-brands fa-linkedin-in", url: "#" }, { icon: "fa-brands fa-tiktok", url: "#" }] },
      { name: "Camila Ruiz", role: "Head de Academia", image: "https://i.pravatar.cc/150?img=45", roleColor: "text-[#2d2e81]", socials: [{ icon: "fa-brands fa-linkedin-in", url: "#" }, { icon: "fa-brands fa-instagram", url: "#" }] },
    ],
  };

  switch (type) {
    case "header": {
      const navLinks = C.links.length ? C.links : [
        { label: "Inicio", url: "#inicio" },
        { label: "Nosotros", url: "#nosotros" },
        { label: "Servicios", url: "#servicios" },
        { label: "Academia", url: "#academia" },
      ];
      return `${head}
<header class="absolute top-6 left-0 w-full z-50 flex justify-center">
  <div class="container max-w-5xl mx-auto px-4">
    <div class="graduate-pill bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex justify-between items-center shadow-2xl">
      <a href="${C.brandUrl}" class="flex items-center gap-2 group">
        <div class="w-8 h-8 bg-gradient-to-br from-[#fa7202] to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-105 transition-transform">${C.brandInitial}</div>
        <span class="text-xl font-black text-white tracking-tight">${C.brand}</span>
      </a>
      <nav class="hidden md:flex space-x-1 font-medium text-gray-300 text-sm">
        ${navLinks.map((l: any) => `<a href="${l.url}" class="px-4 py-2 rounded-full hover:bg-white/10 hover:text-white transition-colors">${l.label}</a>`).join("")}
      </nav>
      <div class="hidden sm:block">
        <a href="${C.ctaUrl}" class="bg-white text-gray-900 font-bold text-sm py-2.5 px-6 rounded-full hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">${C.ctaText}</a>
      </div>
      <button class="md:hidden text-white text-xl" aria-label="Menú" type="button" onclick="this.closest('.graduate-pill').classList.toggle('graduate-menu-open')"><i class="fa-solid fa-bars"></i></button>
    </div>
    <nav class="graduate-mobile-nav hidden md:hidden flex-col gap-1 mt-2 p-3 rounded-2xl bg-[#0a0b2e]/95 border border-white/10 backdrop-blur-xl">
      ${navLinks.map((l: any) => `<a href="${l.url}" class="px-4 py-2.5 rounded-xl hover:bg-white/10 text-white font-medium text-sm">${l.label}</a>`).join("")}
    </nav>
  </div>
</header>`;
    }

    case "hero": {
      if (C.heroStyle === "intro") {
        return `
<section id="inicio" class="relative text-white overflow-hidden pt-40 pb-28 flex items-center bg-cover bg-center bg-no-repeat" style="background-image: url('${C.heroBg}');">
  <div class="absolute inset-0 bg-black/85"></div>
  <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>
  <div class="container mx-auto px-6 relative z-10 text-center max-w-4xl">
    <div class="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase text-[#21b1fe] backdrop-blur-sm">
      <span class="w-1.5 h-1.5 rounded-full bg-[#7dd958] animate-pulse"></span>
      ${C.tag}
    </div>
    <h1 class="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tighter mt-8">
      ${C.titleLine1}<br/>
      <span class="text-[#fa7202]">${C.titleHighlight}</span><br/>
      ${C.titleLine2}
    </h1>
    <p class="text-lg md:text-xl text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto mt-8">${C.subtitle}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center mt-10">
      <a href="${C.primaryButtonUrl}" class="relative group flex items-center justify-center gap-3 bg-white text-gray-900 font-extrabold text-lg py-4 px-8 rounded-full overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
        <span class="relative z-10">${C.primaryButtonText}</span>
        <i class="fa-solid fa-arrow-right relative z-10 group-hover:translate-x-1 transition-transform"></i>
      </a>
      <a href="${C.secondaryButtonUrl}" class="flex items-center justify-center gap-3 bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/40 text-white font-bold text-lg py-4 px-8 rounded-full backdrop-blur-sm transition-all">
        <i class="fa-regular fa-circle-play"></i>
        ${C.secondaryButtonText}
      </a>
    </div>
    <div class="mt-12 inline-flex items-center gap-3 bg-white/10 backdrop-blur-md py-3 px-6 rounded-full border border-white/10">
      <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7dd958] to-[#68bd49] text-white flex items-center justify-center text-sm shadow-lg"><i class="${C.badgeIcon}"></i></div>
      <p class="font-extrabold text-white text-lg leading-none">${C.badgeValue}</p>
      <p class="text-xs text-blue-200 uppercase tracking-widest font-bold">${C.badgeLabel}</p>
    </div>
  </div>
</section>`;
      }
      const cardPos = [
        "transform:translate3d(0,0,0) scale(1.1);z-index:30;opacity:1",
        "transform:translate3d(40px,-20px,-50px) scale(0.9) rotate(8deg);z-index:20;opacity:0.6",
        "transform:translate3d(-40px,-20px,-50px) scale(0.9) rotate(-8deg);z-index:10;opacity:0.6",
      ];
      return `
<section id="inicio" class="relative text-white overflow-hidden pt-32 pb-20 lg:min-h-screen flex items-center bg-cover bg-center bg-no-repeat" style="background-image: url('${C.heroBg}');">
  <div class="absolute inset-0 bg-black/80"></div>
  <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
  <div class="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
    <div class="space-y-10 max-w-2xl pt-10 lg:pt-0">
      <div class="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase text-[#7dd958] backdrop-blur-sm">
        <span class="w-1.5 h-1.5 rounded-full bg-[#7dd958] animate-pulse"></span>
        ${C.tag}
      </div>
      <h1 class="text-5xl md:text-6xl lg:text-[4.5rem] font-black leading-[1.05] tracking-tighter">
        ${C.titleLine1}<br/>
        <span class="text-[#fa7202]">${C.titleHighlight}</span><br/>
        ${C.titleLine2}
      </h1>
      <p class="text-lg md:text-xl text-gray-400 font-medium leading-relaxed max-w-lg">${C.subtitle}</p>
      <div class="flex flex-col sm:flex-row gap-4">
        <a href="${C.primaryButtonUrl}" class="relative group flex items-center justify-center gap-3 bg-white text-gray-900 font-extrabold text-lg py-4 px-8 rounded-full overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
          <span class="relative z-10">${C.primaryButtonText}</span>
          <i class="fa-solid fa-arrow-right relative z-10 group-hover:translate-x-1 transition-transform"></i>
        </a>
        <a href="${C.secondaryButtonUrl}" class="flex items-center justify-center gap-3 bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/40 text-white font-bold text-lg py-4 px-8 rounded-full backdrop-blur-sm transition-all">
          <i class="fa-regular fa-circle-play"></i>
          ${C.secondaryButtonText}
        </a>
      </div>
    </div>
    <div class="relative hidden lg:flex justify-center items-center h-[500px] w-full graduate-perspective graduate-3d group">
      <div class="absolute inset-0 bg-gradient-to-tr from-[#fa7202]/20 to-[#21b1fe]/20 rounded-full blur-[100px]"></div>
      <div id="graduate-carousel" class="relative w-full h-full flex justify-center items-center cursor-pointer graduate-3d">
        ${(C.heroCards || []).map((card: any, i: number) => `
        <div class="carousel-card absolute w-[300px] aspect-[4/5] bg-gray-200 rounded-2xl border-[8px] border-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-1000 ease-in-out" style="${cardPos[i % 3]}">
          <img src="${card.image || ""}" class="w-full h-full object-cover" alt="${card.alt || card.title || ""}"/>
          <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pt-12">
            <span class="px-3 py-1 text-white text-[10px] uppercase tracking-wider font-extrabold rounded-full mb-2 inline-block" style="background:${card.color || "#fa7202"}">${card.badge || ""}</span>
            <p class="text-white font-bold text-xl leading-tight">${card.title || ""}</p>
          </div>
        </div>`).join("")}
      </div>
      <div class="absolute top-10 right-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl z-40 animate-[bounce_4s_infinite] pointer-events-none">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7dd958] to-[#68bd49] text-white flex items-center justify-center text-xl shadow-lg"><i class="${C.badgeIcon}"></i></div>
          <div>
            <p class="text-xs text-blue-200 uppercase tracking-widest font-bold">${C.badgeLabel}</p>
            <p class="font-extrabold text-white text-lg">${C.badgeValue}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
<script>
  (function(){
    function initGraduateCarousel(){
      var cards=document.querySelectorAll('#graduate-carousel .carousel-card');
      var container=document.getElementById('graduate-carousel');
      if(!cards.length||cards.length<2)return;
      var states=[
        { transform:'translate3d(0, 0, 0) scale(1.1) rotate(0deg)', zIndex:30, opacity:1 },
        { transform:'translate3d(40px, -20px, -50px) scale(0.9) rotate(8deg)', zIndex:20, opacity:0.6 },
        { transform:'translate3d(-40px, -20px, -50px) scale(0.9) rotate(-8deg)', zIndex:10, opacity:0.6 }
      ];
      var currentIndex=0;
      function rotateCarousel(){
        cards.forEach(function(card,index){
          var state=states[(index+currentIndex)%3];
          card.style.transform=state.transform;
          card.style.zIndex=state.zIndex;
          card.style.opacity=state.opacity;
        });
        currentIndex=(currentIndex+2)%3;
      }
      rotateCarousel();
      var intervalId=setInterval(rotateCarousel,3500);
      container.addEventListener('mouseenter',function(){clearInterval(intervalId)});
      container.addEventListener('mouseleave',function(){intervalId=setInterval(rotateCarousel,3500)});
      container.addEventListener('click',function(){clearInterval(intervalId);rotateCarousel();intervalId=setInterval(rotateCarousel,3500)});
    }
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initGraduateCarousel)}else{initGraduateCarousel()}
  })();
</script>`;
    }

    case "stats": {
      const stats = C.stats || [];
      return `
<section class="py-20 bg-[#0a0b2e] relative overflow-hidden">
  <div class="absolute top-0 right-0 w-96 h-96 bg-[#2d2e81]/25 rounded-full blur-[120px] pointer-events-none"></div>
  <div class="absolute bottom-0 left-0 w-72 h-72 bg-[#fa7202]/10 rounded-full blur-[120px] pointer-events-none"></div>
  <div class="container mx-auto px-6 relative z-10">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
      ${stats.map((s: any) => `
      <div class="text-center group">
        ${s.icon ? `<div class="w-12 h-12 mx-auto mb-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-lg ${s.color || "text-[#fa7202]"} group-hover:border-white/25 transition-colors"><i class="${s.icon}"></i></div>` : ""}
        <div class="text-4xl md:text-5xl font-black ${s.color || "text-[#fa7202]"}">${s.value || ""}</div>
        <div class="mt-2 text-gray-400 font-semibold uppercase tracking-wider text-sm">${s.label || ""}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    }

    case "timeline": {
      const items = C.timeline || [];
      return `
<section id="historia" class="py-24 bg-white relative overflow-hidden">
  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#21b1fe]/10 rounded-full blur-[120px] pointer-events-none"></div>
  <div class="container mx-auto px-6 relative z-10">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#21b1fe]/10 text-[#21b1fe] rounded-full font-bold uppercase tracking-widest text-sm mb-4"><i class="${C.timelineEyebrowIcon}"></i> ${C.timelineEyebrow}</div>
      <h2 class="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">${C.timelineTitleLine1}<br/><span class="text-[#fa7202]">${C.timelineHighlight}</span></h2>
    </div>
    <div class="relative">
      <div class="absolute left-5 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-[#2d2e81]/20 via-[#fa7202]/40 to-[#7dd958]/30"></div>
      <div class="space-y-8">
        ${items.map((it: any, i: number) => `
        <div class="relative md:grid md:grid-cols-2 md:gap-16 items-center">
          <div class="absolute left-5 md:left-1/2 top-6 -translate-x-1/2 w-10 h-10 rounded-2xl bg-[#0a0b2e] border-2 ${it.borderColor || "border-[#fa7202]"} shadow-xl flex items-center justify-center z-10">
            <i class="${it.icon || "fa-solid fa-bolt"} ${it.color || "text-[#fa7202]"} text-sm"></i>
          </div>
          <div class="pl-16 md:pl-0 ${i % 2 ? "md:col-start-2 md:pl-16" : "md:col-start-1 md:pr-16 md:text-right"}">
            <div class="bg-gray-50 border border-gray-100 rounded-3xl p-7 hover:shadow-xl transition-all group">
              <span class="inline-block text-sm font-black uppercase tracking-widest ${it.color || "text-[#2d2e81]"} mb-2">${it.year || ""}</span>
              <h4 class="text-xl font-bold text-gray-900 mb-2">${it.title || ""}</h4>
              <p class="text-sm text-gray-500 leading-relaxed">${it.desc || ""}</p>
            </div>
          </div>
        </div>`).join("")}
      </div>
    </div>
  </div>
</section>`;
    }

    case "team": {
      const members = C.members || [];
      return `
<section id="equipo" class="py-24 bg-[#f8fafc] relative overflow-hidden">
  <div class="container mx-auto px-6 relative z-10">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fa7202]/10 text-[#fa7202] rounded-full font-bold uppercase tracking-widest text-sm mb-4"><i class="fa-solid fa-users"></i> ${C.teamEyebrow}</div>
      <h2 class="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">${C.teamTitleLine1}<br/><span class="text-[#21b1fe]">${C.teamTitleHighlight}</span></h2>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      ${members.map((m: any) => `
      <div class="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
        <div class="relative w-24 h-24 mx-auto mb-5 rounded-2xl overflow-hidden border-4 border-white shadow-lg group-hover:scale-105 transition-transform">
          <img src="${m.image || ""}" alt="${m.name || ""}" class="w-full h-full object-cover"/>
          <div class="absolute inset-0 bg-gradient-to-t from-[#0a0b2e]/40 to-transparent"></div>
        </div>
        <h4 class="font-bold text-gray-900">${m.name || ""}</h4>
        <p class="text-sm font-bold mt-1 ${m.roleColor || "text-[#2d2e81]"}">${m.role || ""}</p>
        <div class="flex justify-center gap-2 mt-4">
          ${(m.socials || [{ icon: "fa-brands fa-twitter", url: "#" }, { icon: "fa-brands fa-linkedin-in", url: "#" }]).map((s: any) => `
          <a href="${s.url || "#"}" class="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-[#2d2e81] hover:border-[#2d2e81] hover:text-white transition-all text-xs"><i class="${s.icon || "fa-brands fa-linkedin-in"}"></i></a>`).join("")}
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    }

    case "about": {
      const feats = (C.aboutFeatures && C.aboutFeatures.length) ? C.aboutFeatures : [];
      return `
<section id="nosotros" class="py-24 bg-white relative overflow-hidden">
  <div class="absolute top-1/2 left-0 w-72 h-72 bg-[#21b1fe]/10 rounded-full blur-[100px] -translate-y-1/2"></div>
  <div class="absolute bottom-0 right-0 w-96 h-96 bg-[#fa7202]/5 rounded-full blur-[120px]"></div>
  <div class="container mx-auto px-6 relative z-10">
    <div class="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
      <div class="space-y-8 order-2 lg:order-1">
        <div class="inline-flex items-center gap-2">
          <span class="w-12 h-1 bg-[#fa7202] rounded-full"></span>
          <span class="text-[#2d2e81] font-bold tracking-widest uppercase text-sm">${C.eyebrow}</span>
        </div>
        <h2 class="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
          ${C.aboutTitleLine1}<br/>
          <span class="text-[#21b1fe]">${C.aboutTitleHighlight1}</span><br/>
          <span class="text-[#fa7202]">${C.aboutTitleHighlight2}</span>
        </h2>
        <p class="text-lg text-gray-600 leading-relaxed">${C.aboutDesc}</p>
        <div class="grid sm:grid-cols-2 gap-6 pt-6">
          ${(feats || []).map((f: any) => `
          <div class="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all" style="${f.color ? `border-color:${f.color}33;` : ""}">
            <div class="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl mb-4" style="${f.color ? `color:${f.color};` : "color:#7dd958;"}"><i class="${f.icon || "fa-solid fa-check"}"></i></div>
            <h4 class="font-bold text-gray-900 mb-2">${f.title || ""}</h4>
            <p class="text-sm text-gray-500">${f.desc || ""}</p>
          </div>`).join("")}
        </div>
      </div>
      <div class="relative order-1 lg:order-2 h-[500px] sm:h-[600px] w-full flex items-center justify-center lg:justify-end">
        <div class="absolute right-0 top-10 w-[80%] h-[80%] rounded-[2rem] overflow-hidden shadow-2xl z-10 border-8 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
          <div class="absolute inset-0 bg-gradient-to-t from-[#2d2e81]/60 to-transparent z-10"></div>
          <img src="${C.mainImage}" alt="${C.mainImageAlt}" class="w-full h-full object-cover"/>
        </div>
        <div class="absolute left-0 bottom-10 w-[55%] h-[55%] rounded-full overflow-hidden shadow-[0_20px_50px_rgba(45,46,129,0.3)] z-20 border-8 border-white transform -translate-y-4 hover:scale-105 transition-transform duration-500">
          <img src="${C.secondaryImage}" alt="${C.secondaryImageAlt}" class="w-full h-full object-cover"/>
        </div>
        <div class="absolute -left-4 top-1/4 z-30 bg-white px-6 py-4 rounded-2xl shadow-xl border border-gray-100 animate-[bounce_3s_infinite]">
          <div class="flex items-center gap-4">
            <div class="text-4xl font-black text-[#fa7202]">${C.aboutBadgeValue}</div>
            <div class="leading-tight text-sm font-bold text-gray-700">${C.aboutBadgeLabel}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;
    }

    case "services": {
      return `
<section id="${C.servicesId}" class="py-24 bg-[#f8fafc] relative">
  <div class="container mx-auto px-6">
    <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
      <div class="max-w-2xl">
        <span class="text-[#fa7202] font-bold tracking-widest uppercase text-sm mb-4 inline-flex items-center gap-2"><i class="${C.servicesEyebrowIcon}"></i> ${C.servicesEyebrow}</span>
        <h2 class="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">${C.servicesTitleLine1}<br/>${C.servicesTitleLine2} <span class="text-[#21b1fe]">${C.servicesHighlight}</span></h2>
      </div>
      <p class="text-gray-500 max-w-md md:text-right pb-2">${C.servicesSubtitle}</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${(C.servicesCards || []).map((card: any) => {
        if (card.dark) {
          return `
      <div class="${card.colSpan || ""} bg-gradient-to-br from-gray-900 to-[#0a0b2e] rounded-[2rem] p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden text-white flex flex-col justify-center">
        <div class="absolute right-0 top-0 w-full h-full bg-[url('data:image/svg+xml;base64,${gradDotGrid}')]"></div>
        <div class="absolute right-10 bottom-10 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110">
          <i class="${card.icon || "fa-solid fa-users-gear"} text-9xl"></i>
        </div>
        <div class="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div class="max-w-lg">
            <div class="inline-block px-3 py-1 bg-[#7dd958]/20 text-[#7dd958] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[#7dd958]/30">${card.badge || ""}</div>
            <h3 class="text-3xl font-bold mb-3">${card.title || ""}</h3>
            <p class="text-gray-400 leading-relaxed text-sm">${card.desc || ""}</p>
          </div>
          <a href="${card.buttonUrl || "#"}" class="flex-shrink-0 bg-white text-gray-900 font-bold py-4 px-8 rounded-full hover:bg-gray-100 transition-transform transform hover:scale-105 shadow-lg">${card.buttonText || "Agendar"}</a>
        </div>
      </div>`;
        }
        const cardChecks = typeof card.checks === "string"
          ? card.checks.split(",").map((s: string) => s.trim()).filter(Boolean)
          : (card.checks || []);
        if (cardChecks.length) {
          return `
      <div class="${card.colSpan || ""} bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br ${card.blob || "from-blue-100"} to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
        <div class="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div class="w-16 h-16 bg-gradient-to-br ${card.iconBg || "from-[#2d2e81] to-blue-600"} text-white rounded-2xl flex items-center justify-center text-2xl mb-8 shadow-lg ${card.iconShadow || "shadow-blue-500/30"}"><i class="${card.icon || "fa-solid fa-bullhorn"}"></i></div>
            <h3 class="${card.titleSize || "text-3xl"} font-bold mb-4 text-gray-900">${card.title || ""}</h3>
            <p class="text-gray-600 leading-relaxed max-w-lg mb-8">${card.desc || ""}</p>
          </div>
          <ul class="grid sm:grid-cols-2 gap-3 text-sm text-gray-700 font-medium">
            ${cardChecks.map((ch: string) => `<li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-[#7dd958]"></i> ${ch}</li>`).join("")}
          </ul>
        </div>
      </div>`;
        }
        return `
      <div class="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col">
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br ${card.blob || "from-orange-100"} to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
        <div class="relative z-10 flex-grow">
          <div class="w-14 h-14 bg-gradient-to-br ${card.iconBg || "from-[#fa7202] to-[#ffb347]"} text-white rounded-2xl flex items-center justify-center text-xl mb-6 shadow-lg ${card.iconShadow || "shadow-orange-500/30"}"><i class="${card.icon || "fa-solid fa-pen-nib"}"></i></div>
          <h3 class="${card.titleSize || "text-2xl"} font-bold mb-3 text-gray-900">${card.title || ""}</h3>
          <p class="text-gray-600 leading-relaxed text-sm mb-6">${card.desc || ""}</p>
        </div>
        <div class="relative z-10 mt-auto pt-4">
          <a href="${card.linkUrl || "#contacto"}" class="${card.linkColor || "text-[#fa7202]"} font-bold text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all">${card.linkText || "Saber más"} <i class="fa-solid fa-arrow-right text-xs"></i></a>
        </div>
      </div>`;
      }).join("")}
    </div>
  </div>
</section>`;
    }

    case "features": {
      const courses = (C.courses && C.courses.length ? C.courses : C.courses) || [];
      const courseBadges = (course: any) => Array.isArray(course.badges)
        ? course.badges
        : (course.badgesText || "").split("\n").map((l: string) => {
            const t = l.trim();
            if (!t) return null;
            if (t.startsWith("[HL]")) return { text: t.slice(4).trim(), highlight: true };
            if (t.startsWith("[I]")) return { icon: t.slice(3).trim(), text: "" };
            return { text: t };
          }).filter(Boolean);
      return `
<section id="academia" class="py-32 bg-[#05051e] text-white relative overflow-hidden">
  <div class="absolute top-0 right-1/4 w-96 h-96 bg-[#2d2e81]/20 rounded-full blur-[150px] pointer-events-none"></div>
  <div class="absolute bottom-0 left-10 w-72 h-72 bg-[#fa7202]/10 rounded-full blur-[120px] pointer-events-none"></div>
  <div class="container mx-auto px-6 relative z-10">
    <div class="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 text-[#21b1fe]"><i class="${C.academiaEyebrowIcon}"></i> ${C.academiaEyebrow}</div>
        <h2 class="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">${C.academiaTitleLine1}<br/><span class="text-[#fa7202]">${C.academiaHighlight}</span></h2>
      </div>
      <div class="max-w-sm text-gray-400">
        <p class="mb-6">${C.academiaRightText}</p>
        <a href="${C.academiaLinkUrl}" class="text-white border-b border-white hover:border-[#fa7202] hover:text-[#fa7202] transition-colors pb-1 font-bold">${C.academiaLinkText}</a>
      </div>
    </div>
    <div class="border-t border-white/10">
      ${(courses || []).map((course: any) => `
      <a href="${course.url || C.academiaLinkUrl}" class="group block border-b border-white/10 py-10 hover:bg-white/[0.02] transition-colors relative">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div class="md:col-span-1 text-4xl text-gray-700 font-black ${course.numberColor || "group-hover:text-[#2d2e81]"} transition-colors">${course.number || ""}</div>
          <div class="md:col-span-5">
            <h3 class="text-3xl md:text-4xl font-bold mb-2 ${course.titleColor || "group-hover:text-[#21b1fe]"} transition-colors">${course.title || ""}</h3>
            <p class="text-gray-400">${course.desc || ""}</p>
          </div>
          <div class="md:col-span-3 flex flex-wrap gap-2">
            ${(courseBadges(course) || []).map((b: any) => b.highlight
              ? `<span class="px-3 py-1 bg-[#fa7202] rounded-full text-xs text-white font-bold border border-transparent">${b.text || ""}</span>`
              : `<span class="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300 border border-white/10">${b.icon ? `<i class="${b.icon}"></i> ` : ""}${b.text || ""}</span>`).join("")}
          </div>
          <div class="md:col-span-3 flex justify-start md:justify-end">
            <div class="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-xl ${course.circleColor || "group-hover:bg-[#2d2e81] group-hover:border-[#2d2e81]"} transition-all duration-300">
              <i class="fa-solid fa-arrow-right -rotate-45 group-hover:rotate-0 transition-transform duration-300"></i>
            </div>
          </div>
        </div>
      </a>`).join("")}
    </div>
  </div>
</section>`;
    }

    case "testimonials": {
      const items = (C.testimonials && C.testimonials.length ? C.testimonials : C.testimonials) || [];
      return `
<section class="py-24 bg-white relative overflow-hidden">
  <div class="absolute top-0 right-0 w-1/3 h-full bg-gray-50 -skew-x-12 transform origin-top border-l border-gray-100 z-0"></div>
  <div class="container mx-auto px-6 relative z-10">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-[#7dd958]/10 text-[#7dd958] rounded-full font-bold uppercase tracking-widest text-sm mb-4"><i class="fa-solid fa-star"></i> ${C.testiEyebrow}</div>
      <h2 class="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">${C.testiTitleLine1} <span class="text-[#7dd958]">${C.testiHighlight}</span></h2>
      <p class="text-gray-500 text-lg">${C.testiSubtitle}</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      ${(items || []).map((t: any, i: number) => {
        const stars = `<div class="flex items-center gap-1 ${t.starColor || "text-[#fa7202]"} ${t.large ? "mb-6 text-lg" : "mb-4 text-sm"}"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>`;
        if (t.large) {
          return `
      <div class="md:col-span-2 bg-gradient-to-br ${t.gradient || "from-[#2d2e81] to-[#0a0b2e]"} rounded-3xl p-8 md:p-10 shadow-xl text-white relative overflow-hidden group hover:-translate-y-1 transition-transform">
        <div class="absolute right-0 top-0 opacity-10 text-9xl leading-none transform translate-x-4 -translate-y-4 font-serif">&quot;</div>
        <div class="relative z-10 h-full flex flex-col justify-between">
          ${stars}
          <p class="text-xl md:text-2xl font-medium leading-relaxed mb-8">${t.quote || ""}</p>
          <div class="flex items-center gap-4">
            <div class="relative">
              <img src="${t.avatar || ""}" alt="${t.name || ""}" class="w-14 h-14 rounded-full border-2 border-white/20 object-cover"/>
              ${t.online ? `<div class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#0a0b2e] rounded-full"></div>` : ""}
            </div>
            <div>
              <h4 class="font-bold text-lg">${t.name || ""}</h4>
              <p class="text-sm ${t.roleColor || "text-blue-200"}">${t.role || ""}</p>
            </div>
          </div>
        </div>
      </div>`;
        }
        return `
      <div class="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-xl ${t.borderHover || ""} transition-all group">
        ${stars}
        <p class="text-gray-600 mb-8 italic">${t.quote || ""}</p>
        <div class="flex items-center gap-3">
          <img src="${t.avatar || ""}" alt="${t.name || ""}" class="w-10 h-10 rounded-full bg-gray-100 object-cover"/>
          <div>
            <h4 class="font-bold text-gray-900 text-sm">${t.name || ""}</h4>
            <p class="text-xs text-gray-500">${t.role || ""}</p>
          </div>
        </div>
      </div>`;
      }).join("")}
      <div class="md:col-span-3 bg-gray-50 rounded-3xl p-8 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 mt-2">
        <div>
          <h4 class="font-bold text-gray-900 mb-1">Marcas que confían en nosotros</h4>
          <p class="text-sm text-gray-500">Agencia avalada por cientos de casos reales.</p>
        </div>
        <div class="flex flex-wrap items-center gap-6 md:gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          ${(C.brands || []).map((b: any) => `<div class="${b.classes || "text-xl md:text-2xl font-black"}">${b.title || ""}<span style="color:${b.color || "#2d2e81"}">${b.accent || ""}</span></div>`).join("")}
        </div>
      </div>
    </div>
  </div>
</section>`;
    }

    case "cta":
      return `
<section class="py-24 bg-white relative overflow-hidden">
  <div class="container mx-auto px-6 relative z-10">
    <div class="bg-[#0a0b2e] rounded-[3rem] p-10 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl">
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-[#21b1fe]/30 rounded-full blur-[100px]"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-[#7dd958]/30 rounded-full blur-[100px]"></div>
      <div class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,${gradLineGrid}')]"></div>
      <div class="relative z-10 md:w-1/2">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-[#7dd958] mb-6">
          <span class="w-2 h-2 rounded-full bg-[#7dd958] animate-pulse"></span>
          ${C.ctaBadge}
        </div>
        <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">${C.ctaTitleLine1}<br/><span class="text-[#21b1fe]">${C.ctaHighlight}</span></h2>
        <p class="text-lg text-gray-400 mb-8 max-w-md">${C.ctaSubtitle}</p>
      </div>
      <div class="relative z-10 md:w-1/2 flex flex-col items-center md:items-end">
        <div class="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl w-full max-w-sm text-center shadow-xl">
          <div class="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl mx-auto flex items-center justify-center text-white text-4xl mb-6 shadow-[0_10px_30px_rgba(34,197,94,0.3)] transform -translate-y-12"><i class="fa-brands fa-whatsapp"></i></div>
          <h3 class="text-2xl font-bold text-white mb-2 -mt-8">${C.cardTitle}</h3>
          <p class="text-gray-400 text-sm mb-6">${C.cardSubtitle}</p>
          <a href="https://wa.me/${C.whatsappNumber}" target="_blank" rel="noopener" class="block w-full bg-white text-gray-900 font-bold py-4 px-6 rounded-xl hover:bg-gray-100 transition-colors shadow-lg">${C.whatsappButtonText}</a>
        </div>
      </div>
    </div>
  </div>
</section>`;

    case "footer":
      return `
<footer id="contacto" class="bg-[#030312] text-white pt-20 pb-10 relative overflow-hidden">
  <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#fa7202]/50 to-transparent"></div>
  <div class="absolute -top-40 -right-40 w-96 h-96 bg-[#2d2e81]/10 rounded-full blur-[100px] pointer-events-none"></div>
  <div class="container mx-auto px-6 relative z-10">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
      <div class="lg:col-span-4 space-y-8">
        <a href="${C.footerBrandUrl}" class="flex items-center gap-3 group inline-flex">
          <div class="w-12 h-12 bg-gradient-to-br from-[#fa7202] to-[#ffb347] rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">${C.footerBrandInitial}</div>
          <span class="text-3xl font-black text-white tracking-tight">${C.footerBrand}</span>
        </a>
        <p class="text-gray-400 leading-relaxed text-sm max-w-sm">${C.footerDesc}</p>
        <div class="flex space-x-3">
          ${(C.socials || []).map((s: any) => `
          <a href="${s.url || "#"}" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all ${s.hover || "hover:bg-[#2d2e81] hover:border-[#2d2e81] hover:text-white"}" aria-label="${s.label || s.icon || "social"}"><i class="${s.icon || "fa-brands fa-facebook-f"}"></i></a>`).join("")}
        </div>
      </div>
      <div class="lg:col-span-2 lg:col-start-6">
        <h4 class="text-white font-bold mb-6 text-sm tracking-widest uppercase">${C.navTitle}</h4>
        <ul class="space-y-4 text-gray-400 text-sm font-medium">
          ${(C.navLinks || []).map((l: any) => `<li><a href="${l.url || "#"}" class="hover:text-[#fa7202] transition-colors relative inline-block group">${l.label}<span class="absolute left-0 -bottom-1 w-0 h-0.5 bg-[#fa7202] transition-all group-hover:w-full"></span></a></li>`).join("")}
        </ul>
      </div>
      <div class="lg:col-span-3">
        <h4 class="text-white font-bold mb-6 text-sm tracking-widest uppercase">${C.contactTitle}</h4>
        <ul class="space-y-5 text-gray-400 text-sm">
          <li class="flex items-start gap-4 group cursor-pointer">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-[#fa7202] group-hover:bg-[#fa7202] group-hover:text-white transition-colors"><i class="fa-solid fa-location-dot"></i></div>
            <div class="pt-1">
              <p class="text-white font-semibold">${C.locationTitle}</p>
              <p class="text-xs mt-1 opacity-70">${C.locationSub}</p>
            </div>
          </li>
          <li class="flex items-center gap-4 group cursor-pointer">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-[#7dd958] group-hover:bg-[#7dd958] group-hover:text-white transition-colors"><i class="fa-solid fa-phone"></i></div>
            <a href="tel:${C.phoneTel}" class="text-white font-medium hover:text-[#7dd958] transition-colors">${C.phone}</a>
          </li>
          <li class="flex items-center gap-4 group cursor-pointer">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-[#21b1fe] group-hover:bg-[#21b1fe] group-hover:text-white transition-colors"><i class="fa-solid fa-envelope"></i></div>
            <a href="mailto:${C.email}" class="text-white font-medium hover:text-[#21b1fe] transition-colors">${C.email}</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="text-gray-500 text-sm">${C.copyright}</div>
      <div class="flex gap-6 text-sm font-medium text-gray-500">
        ${(C.legalLinks || []).map((l: any) => `<a href="${l.url || "#"}" class="hover:text-white transition-colors">${l.label}</a>`).join("")}
      </div>
    </div>
  </div>
  <div class="w-full overflow-hidden flex justify-center mt-8 pointer-events-none opacity-[0.02] select-none">
    <h1 class="text-[15vw] font-black tracking-tighter leading-none text-white whitespace-nowrap">${C.giantText}</h1>
  </div>
</footer>`;

    default:
      return null;
  }
}