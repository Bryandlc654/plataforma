require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const IMG = {
  heroBg: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop",
  cardAgency: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop",
  cardEcom: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=600&auto=format&fit=crop",
  cardCreative: "https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=600&auto=format&fit=crop",
  aboutMain: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  aboutSecondary: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  avatar1: "https://i.pravatar.cc/150?img=32",
  avatar2: "https://i.pravatar.cc/150?img=11",
  avatar3: "https://i.pravatar.cc/150?img=47",
};

const tpl = {
  name: "Academia Graduate",
  description: "Agencia y academia de marketing digital con hero cinematografico, grilla bento de servicios, cursos, muro de testimonios y tarjeta de WhatsApp.",
  category: "Agencias y Marketing",
  pages: [
    {
      name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0,
      blocks: [
        { type: "header", content: {
          variant: "graduate",
          brand: "Graduate.",
          brandInitial: "g",
          brandUrl: "#inicio",
          links: [
            { label: "Inicio", url: "#inicio" },
            { label: "Nosotros", url: "/nosotros" },
            { label: "Servicios", url: "#servicios" },
            { label: "Academia", url: "#academia" },
          ],
          ctaText: "Hablemos",
          ctaUrl: "#contacto",
        }, sortOrder: 0 },

        { type: "hero", content: {
          variant: "graduate",
          backgroundImage: IMG.heroBg,
          tag: "Agencia & Academia Digital",
          titleLine1: "Revoluciona el",
          titleHighlight: "Crecimiento",
          titleLine2: "de tu negocio.",
          subtitle: "Construimos ecosistemas digitales que venden. Si no estás aprovechando la publicidad digital y las redes sociales, tu competencia sí lo está haciendo.",
          primaryButtonText: "Escalar mi negocio",
          primaryButtonUrl: "#servicios",
          secondaryButtonText: "Asesoría Gratuita",
          secondaryButtonUrl: "#contacto",
          cards: [
            { badge: "Emprendedor", color: "#fa7202", image: IMG.cardAgency, title: "Agencia Digital", alt: "Graduado Emprendedor" },
            { badge: "Ventas Online", color: "#21b1fe", image: IMG.cardEcom, title: "E-commerce Manager", alt: "Graduada E-commerce" },
            { badge: "Caso de Éxito", color: "#7dd958", image: IMG.cardCreative, title: "Agencia Creativa", alt: "Equipo Creativo" },
          ],
          badgeIcon: "fa-solid fa-graduation-cap",
          badgeLabel: "Comunidad",
          badgeValue: "+500 Alumnos",
        }, sortOrder: 1 },

        { type: "about", content: {
          variant: "graduate",
          eyebrow: "Nuestra Esencia",
          aboutTitleLine1: "Transformamos",
          aboutTitleHighlight1: "seguidores en",
          aboutTitleHighlight2: "clientes reales.",
          description: 'En <strong>Academia Graduate</strong> no somos una agencia tradicional. Somos tu equipo de crecimiento estratégico. Olvídate de los "likes" vacíos; nos enfocamos en el <strong>ROI (Retorno de Inversión)</strong> y en enseñar metodologías 100% prácticas.',
          features: [
            { icon: "fa-solid fa-bullseye", color: "#7dd958", title: "Estrategia Local", desc: "Conocemos el mercado ecuatoriano y cómo conectar con tu audiencia." },
            { icon: "fa-solid fa-handshake", color: "#21b1fe", title: "Acompañamiento", desc: "No te dejamos solo. Te educamos mientras crecemos juntos." },
          ],
          mainImage: IMG.aboutMain,
          mainImageAlt: "Equipo",
          secondaryImage: IMG.aboutSecondary,
          secondaryImageAlt: "Trabajo en equipo",
          badgeValue: "+5",
          badgeLabel: "Años de<br/>Experiencia",
        }, sortOrder: 2 },

        { type: "services", content: {
          variant: "graduate",
          servicesEyebrow: "Lo que hacemos por ti",
          servicesEyebrowIcon: "fa-solid fa-fire",
          servicesTitleLine1: "Soluciones Integrales",
          servicesTitleLine2: "de",
          servicesHighlight: "Marketing",
          servicesSubtitle: "No ofrecemos paquetes genéricos. Diseñamos ecosistemas digitales a medida para escalar las ventas de tu negocio.",
          cards: [
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
              checks: ["Segmentación avanzada", "Optimización de presupuesto", "Retargeting estratégico", "Reportes de rendimiento"],
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
        }, sortOrder: 3 },

        { type: "features", content: {
          variant: "graduate",
          academiaEyebrow: "Nuestra Academia",
          academiaEyebrowIcon: "fa-solid fa-graduation-cap",
          academiaTitleLine1: "Aprende con los",
          academiaHighlight: "mejores.",
          academiaRightText: "Capacítate tú mismo para dominar el ecosistema digital de tu negocio. Metodología 100% práctica y aplicable.",
          academiaLinkText: "Explorar todos los programas",
          academiaLinkUrl: "#contacto",
          courses: [
            {
              number: "01",
              numberColor: "group-hover:text-[#2d2e81]",
              title: "Master en Meta Ads",
              titleColor: "group-hover:text-[#21b1fe]",
              desc: "Domina campañas rentables en Facebook e Instagram. Segmentación y Pixel.",
              badges: [
                { text: "12 Horas", icon: "fa-regular fa-clock" },
                { text: "Online", icon: "fa-solid fa-globe", dot: "bg-[#7dd958]" },
                { text: "Meta Blueprint", icon: "fa-solid fa-certificate", highlight: true, bg: "bg-[#f4d0b3]", textColor: "text-[#8b3d1d]" },
              ],
            },
            {
              number: "02",
              numberColor: "group-hover:text-[#21b1fe]",
              title: "Marketing Digital Ecuador",
              titleColor: "group-hover:text-[#2d2e81]",
              desc: "Aprende a vender con Redis, WhatsApp Business y la mejor estrategia para el mercado local.",
              badges: [
                { text: "16 Horas", icon: "fa-regular fa-clock" },
                { text: "Presencial", icon: "fa-solid fa-location-dot" },
              ],
            },
            {
              number: "03",
              numberColor: "group-hover:text-[#21b1fe]",
              title: "Estrategia de Contenido",
              titleColor: "group-hover:text-[#fa7202]",
              desc: "Crea un plan de contenido infalible para vender con Reels, TikToks y posts de alto impacto.",
              badges: [
                { text: "Diploma", icon: "fa-solid fa-award", highlight: true, bg: "bg-[#02136f]", textColor: "text-white" },
                { text: "Flexible", icon: "fa-regular fa-calendar-check" },
              ],
            },
          ],
        }, sortOrder: 4 },

        { type: "testimonials", content: {
          variant: "graduate",
          testiEyebrow: "Casos de Éxito",
          testiTitleLine1: "Resultados que hablan por",
          testiHighlight: "sí solos.",
          testiSubtitle: "Únete a las decenas de emprendedores y empresas en Ecuador que ya escalaron sus ventas con nosotros.",
          testimonials: [
            {
              large: true,
              gradient: "from-[#2d2e81] to-[#0a0b2e]",
              starColor: "text-[#fa7202]",
              quote: '"Antes sentía que gastaba dinero en redes sociales sin ver retorno. Desde que aplicaron su estrategia y tomé su taller de ventas, nuestra facturación en la tienda física creció un 40% en apenas dos meses."',
              name: "María Fernanda L.",
              role: "Dueña de Boutique (Quito)",
              roleColor: "text-blue-200",
              avatar: IMG.avatar1,
              online: true,
            },
            {
              starColor: "text-[#21b1fe]",
              borderHover: "hover:border-[#21b1fe]/30",
              quote: '"El curso de Meta Ads fue un antes y un después. Por fin entiendo cómo funciona el Pixel y mis campañas ahora sí son rentables."',
              name: "Carlos M.",
              role: "Emprendedor E-commerce",
              avatar: IMG.avatar2,
            },
            {
              starColor: "text-[#fa7202]",
              borderHover: "hover:border-[#fa7202]/30",
              quote: '"La paciencia y el conocimiento del equipo Graduate es increíble. Nuestra clínica dental duplicó sus pacientes en 3 meses."',
              name: "Dra. Andrea V.",
              role: "Centro Odontológico",
              avatar: IMG.avatar3,
            },
          ],
          brands: [
            { classes: "text-xl md:text-2xl font-black font-serif", title: "BRAND", accent: "ONE", color: "#2d2e81" },
            { classes: "text-xl md:text-2xl font-black tracking-tighter", title: "STUDIO", accent: ".", color: "#fa7202" },
            { classes: "text-xl md:text-2xl font-bold italic text-gray-600", title: "NaturaEcuador", accent: "", color: "#2d2e81" },
            { classes: "text-xl md:text-2xl font-black font-mono", title: "Tech", accent: "Corp", color: "#7dd958" },
          ],
        }, sortOrder: 5 },

        { type: "cta", content: {
          variant: "graduate",
          ctaBadge: "Disponibilidad Inmediata",
          ctaTitleLine1: "¿Listo para dar el",
          ctaHighlight: "siguiente paso?",
          ctaTitleGradient: "from-[#21b1fe] to-[#7dd958]",
          ctaSubtitle: "Digitaliza y promociona tu negocio hoy mismo. No dejes que tu competencia se quede con los clientes que te buscan.",
          cardTitle: "Hablemos ahora",
          cardSubtitle: "Te asesoramos sin compromiso sobre la mejor estrategia para ti.",
          whatsappButtonText: "Iniciar chat",
          whatsappNumber: "593000000000",
        }, sortOrder: 6 },

        { type: "footer", content: {
          variant: "graduate",
          brand: "Graduate.",
          brandInitial: "g",
          brandDesc: "Agencia y academia de marketing digital. Transformamos la manera en que los negocios crecen y se comunican en Ecuador.",
          socials: [
            { icon: "fa-brands fa-facebook-f", url: "#", hover: "hover:bg-[#2d2e81] hover:border-[#2d2e81]" },
            { icon: "fa-brands fa-instagram", url: "#", hover: "hover:bg-gradient-to-tr hover:from-orange-500 hover:to-pink-500 hover:border-transparent" },
            { icon: "fa-brands fa-whatsapp text-lg", url: "#", hover: "hover:bg-[#7dd958] hover:border-[#7dd958]" },
            { icon: "fa-brands fa-tiktok", url: "#", hover: "hover:bg-black hover:border-black" },
          ],
          navTitle: "Navegación",
          navLinks: [
            { label: "Inicio", url: "#inicio" },
            { label: "Nosotros", url: "/nosotros" },
            { label: "Servicios", url: "#servicios" },
            { label: "Academia", url: "#academia" },
          ],
          contactTitle: "Contacto",
          locationTitle: "Quito, Ecuador",
          locationSub: "Servicio remoto a nivel nacional.",
          phone: "+593 99 999 9999",
          phoneTel: "+593000000000",
          email: "hola@graduate.com.ec",
          copyright: "© 2026 Academia Graduate. Todos los derechos reservados.",
          legalLinks: [
            { label: "Términos de Servicio", url: "#" },
            { label: "Privacidad", url: "#" },
          ],
          giantText: "GRADUATE",
        }, sortOrder: 7 },
      ]
    },
    {
      name: "Nosotros", slug: "nosotros", path: "/nosotros", isDefault: false, sortOrder: 1,
      blocks: [
        { type: "header", content: {
          variant: "graduate",
          brand: "Graduate.",
          brandInitial: "g",
          brandUrl: "/",
          links: [
            { label: "Inicio", url: "/" },
            { label: "Nosotros", url: "/nosotros" },
            { label: "Servicios", url: "/#servicios" },
            { label: "Academia", url: "/#academia" },
          ],
          ctaText: "Hablemos",
          ctaUrl: "/#contacto",
        }, sortOrder: 0 },

        { type: "hero", content: {
          variant: "graduate",
          heroStyle: "intro",
          backgroundImage: IMG.heroBg,
          tag: "Quiénes Somos",
          titleLine1: "Más que una",
          titleHighlight: "Agencia",
          titleLine2: "somos tu equipo.",
          subtitle: "Somos una comunidad de estrategas, creativos y docentes obsesionados con resultados. Acompañamos a emprendedores y empresas ecuatorianas a crecer con marketing digital y educación práctica.",
          primaryButtonText: "Conoce al equipo",
          primaryButtonUrl: "#equipo",
          secondaryButtonText: "Hablemos",
          secondaryButtonUrl: "#contacto",
          badgeIcon: "fa-solid fa-user-group",
          badgeLabel: "Comunidad",
          badgeValue: "+500 Marcas",
        }, sortOrder: 1 },

        { type: "stats", content: {
          variant: "graduate",
          items: [
            { icon: "fa-solid fa-medal", value: "+5", label: "Años de experiencia", color: "text-[#fa7202]" },
            { icon: "fa-solid fa-rocket", value: "+500", label: "Marcas impulsadas", color: "text-[#21b1fe]" },
            { icon: "fa-solid fa-arrow-trend-up", value: "40%", label: "Crecimiento promedio", color: "text-[#7dd958]" },
            { icon: "fa-solid fa-headset", value: "24/7", label: "Acompañamiento", color: "text-[#2d2e81]" },
          ],
        }, sortOrder: 2 },

        { type: "timeline", content: {
          variant: "graduate",
          timelineEyebrow: "Nuestra Historia",
          timelineEyebrowIcon: "fa-solid fa-route",
          timelineTitleLine1: "El camino que nos ha",
          timelineHighlight: "traído aquí.",
          items: [
            { year: "2019", icon: "fa-solid fa-lightbulb", color: "text-[#fa7202]", borderColor: "border-[#fa7202]", title: "El inicio", desc: "Nacemos como un pequeño estudio de redes sociales para negocios locales de Quito." },
            { year: "2021", icon: "fa-solid fa-users", color: "text-[#21b1fe]", borderColor: "border-[#21b1fe]", title: "Primer gran equipo", desc: "Sumamos estrategas, creativos y community managers. Superamos los 100 clientes activos." },
            { year: "2023", icon: "fa-solid fa-graduation-cap", color: "text-[#7dd958]", borderColor: "border-[#7dd958]", title: "Nace la Academia", desc: "Lanzamos los primeros cursos de Meta Ads y marketing digital con metodología 100% práctica." },
            { year: "2026", icon: "fa-solid fa-rocket", color: "text-[#2d2e81]", borderColor: "border-[#2d2e81]", title: "Hoy, hacia el futuro", desc: "Una comunidad de +500 marcas y miles de alumnos creciendo junto a nosotros." },
          ],
        }, sortOrder: 3 },

        { type: "team", content: {
          variant: "graduate",
          teamEyebrow: "Conócenos",
          teamTitleLine1: "El talento detrás de",
          teamTitleHighlight: "Graduate.",
          members: [
            { name: "Alejandro Flores", role: "Fundador & CEO", image: "https://i.pravatar.cc/200?img=68", roleColor: "text-[#fa7202]", socials: [{ icon: "fa-brands fa-linkedin-in", url: "#" }, { icon: "fa-brands fa-instagram", url: "#" }] },
            { name: "Valentina Paz", role: "Directora Creativa", image: "https://i.pravatar.cc/200?img=47", roleColor: "text-[#21b1fe]", socials: [{ icon: "fa-brands fa-linkedin-in", url: "#" }, { icon: "fa-brands fa-x-twitter", url: "#" }] },
            { name: "Mateo Andrade", role: "Estratega Meta Ads", image: "https://i.pravatar.cc/200?img=59", roleColor: "text-[#7dd958]", socials: [{ icon: "fa-brands fa-linkedin-in", url: "#" }, { icon: "fa-brands fa-tiktok", url: "#" }] },
            { name: "Camila Ruiz", role: "Head de Academia", image: "https://i.pravatar.cc/200?img=45", roleColor: "text-[#2d2e81]", socials: [{ icon: "fa-brands fa-linkedin-in", url: "#" }, { icon: "fa-brands fa-instagram", url: "#" }] },
          ],
        }, sortOrder: 4 },

        { type: "services", content: {
          variant: "graduate",
          servicesEyebrow: "Lo que nos define",
          servicesEyebrowIcon: "fa-solid fa-gem",
          servicesTitleLine1: "Principios que nos",
          servicesTitleLine2: "guían",
          servicesHighlight: "cada día",
          servicesSubtitle: "Más que una agencia, somos socios estratégicos de tu crecimiento. Estos son los valores que practicamos con cada cliente y estudiante.",
          cards: [
            {
              colSpan: "lg:col-span-2",
              dark: false,
              icon: "fa-solid fa-scale-balanced",
              iconBg: "from-[#2d2e81] to-blue-600",
              iconShadow: "shadow-blue-500/30",
              title: "Transparencia Total",
              titleSize: "text-3xl",
              desc: "Reportes claros, sin tecnicismos y sin letra pequeña. Siempre sabrás qué hacemos, por qué lo hacemos y qué resultados obtiene tu inversión.",
              blob: "from-blue-100",
              checks: ["Reportes mensuales", "Costos claros", "Comunicación directa"],
            },
            {
              icon: "fa-solid fa-lightbulb",
              iconBg: "from-[#fa7202] to-[#ffb347]",
              iconShadow: "shadow-orange-500/30",
              title: "Innovación Constante",
              titleSize: "text-2xl",
              desc: "Nos mantenemos al día con cada cambio de algoritmo y nueva tendencia para que tu marca siempre esté un paso adelante.",
              blob: "from-orange-100",
              linkColor: "text-[#fa7202]",
              linkText: "Nuestros valores",
              linkUrl: "#servicios",
            },
            {
              icon: "fa-solid fa-chart-line",
              iconBg: "from-[#21b1fe] to-sky-400",
              iconShadow: "shadow-sky-500/30",
              title: "Resultados Medibles",
              titleSize: "text-2xl",
              desc: "No trabajamos con \"likes\". Nos importan las ventas, los leads y el ROI. Cada estrategia se mide y se optimiza con datos reales.",
              blob: "from-sky-100",
              linkColor: "text-[#21b1fe]",
              linkText: "Conoce al equipo",
              linkUrl: "#equipo",
            },
            {
              colSpan: "lg:col-span-2",
              dark: true,
              badge: "Compromiso Graduate",
              icon: "fa-solid fa-graduation-cap",
              title: "Educación Continua",
              desc: "Creemos en tu autonomía: te enseñamos las estrategias que aplicamos para que tu equipo y tu marca crezcan incluso después de terminar la relación de servicio.",
              buttonText: "Conocer la Academia",
              buttonUrl: "/#academia",
            },
          ],
        }, sortOrder: 5 },

        { type: "testimonials", content: {
          variant: "graduate",
          testiEyebrow: "Casos de Éxito",
          testiTitleLine1: "Resultados que hablan por",
          testiHighlight: "sí solos.",
          testiSubtitle: "Empresas y emprendedores que ya confían en nosotros y escalaron sus ventas en Ecuador.",
          testimonials: [
            {
              large: true,
              gradient: "from-[#2d2e81] to-[#0a0b2e]",
              starColor: "text-[#fa7202]",
              quote: '"Desde que aplicaron su estrategia y tomé su taller de ventas, nuestra facturación en la tienda física creció un 40% en apenas dos meses."',
              name: "María Fernanda L.",
              role: "Dueña de Boutique (Quito)",
              roleColor: "text-blue-200",
              avatar: IMG.avatar1,
              online: true,
            },
            {
              starColor: "text-[#21b1fe]",
              borderHover: "hover:border-[#21b1fe]/30",
              quote: '"El curso de Meta Ads fue un antes y un después. Por fin entiendo cómo funciona el Pixel y mis campañas ahora sí son rentables."',
              name: "Carlos M.",
              role: "Emprendedor E-commerce",
              avatar: IMG.avatar2,
            },
            {
              starColor: "text-[#fa7202]",
              borderHover: "hover:border-[#fa7202]/30",
              quote: '"La paciencia y el conocimiento del equipo Graduate es increíble. Nuestra clínica dental duplicó sus pacientes en 3 meses."',
              name: "Dra. Andrea V.",
              role: "Centro Odontológico",
              avatar: IMG.avatar3,
            },
          ],
          brands: [
            { classes: "text-xl md:text-2xl font-black font-serif", title: "BRAND", accent: "ONE", color: "#2d2e81" },
            { classes: "text-xl md:text-2xl font-black tracking-tighter", title: "STUDIO", accent: ".", color: "#fa7202" },
            { classes: "text-xl md:text-2xl font-bold italic text-gray-600", title: "NaturaEcuador", accent: "", color: "#2d2e81" },
            { classes: "text-xl md:text-2xl font-black font-mono", title: "Tech", accent: "Corp", color: "#7dd958" },
          ],
        }, sortOrder: 6 },

        { type: "cta", content: {
          variant: "graduate",
          ctaBadge: "Comunidad Abierta",
          ctaTitleLine1: "Sé parte de la",
          ctaHighlight: "comunidad Graduate.",
          ctaSubtitle: "Digitaliza y promociona tu negocio hoy mismo. No dejes que tu competencia se quede con los clientes que te buscan.",
          cardTitle: "Hablemos ahora",
          cardSubtitle: "Te asesoramos sin compromiso sobre la mejor estrategia para ti.",
          whatsappButtonText: "Iniciar chat",
          whatsappNumber: "593000000000",
        }, sortOrder: 7 },

        { type: "footer", content: {
          variant: "graduate",
          brand: "Graduate.",
          brandInitial: "g",
          brandDesc: "Agencia y academia de marketing digital. Transformamos la manera en que los negocios crecen y se comunican en Ecuador.",
          socials: [
            { icon: "fa-brands fa-facebook-f", url: "#", hover: "hover:bg-[#2d2e81] hover:border-[#2d2e81]" },
            { icon: "fa-brands fa-instagram", url: "#", hover: "hover:bg-gradient-to-tr hover:from-orange-500 hover:to-pink-500 hover:border-transparent" },
            { icon: "fa-brands fa-whatsapp text-lg", url: "#", hover: "hover:bg-[#7dd958] hover:border-[#7dd958]" },
            { icon: "fa-brands fa-tiktok", url: "#", hover: "hover:bg-black hover:border-black" },
          ],
          navTitle: "Navegación",
          navLinks: [
            { label: "Inicio", url: "/" },
            { label: "Nosotros", url: "/nosotros" },
            { label: "Servicios", url: "/#servicios" },
            { label: "Academia", url: "/#academia" },
          ],
          contactTitle: "Contacto",
          locationTitle: "Quito, Ecuador",
          locationSub: "Servicio remoto a nivel nacional.",
          phone: "+593 99 999 9999",
          phoneTel: "+593000000000",
          email: "hola@graduate.com.ec",
          copyright: "© 2026 Academia Graduate. Todos los derechos reservados.",
          legalLinks: [
            { label: "Términos de Servicio", url: "#" },
            { label: "Privacidad", url: "#" },
          ],
          giantText: "GRADUATE",
        }, sortOrder: 8 },
      ]
    }
  ]
};

async function main() {
  console.log("Inyectando plantilla Academia Graduate con variante...");

  const existing = await p.template.findFirst({ where: { name: tpl.name } });
  if (existing) {
    console.log("Actualizando plantilla existente (se conserva el id para no romper vinculación de sitios)...");
  }

  let cat = await p.templateCategory.findUnique({ where: { slug: tpl.category.toLowerCase().replace(/\s+/g, "-") } });
  if (!cat) {
    cat = await p.templateCategory.create({
      data: {
        name: tpl.category,
        slug: tpl.category.toLowerCase().replace(/\s+/g, "-"),
        sortOrder: 0,
      },
    });
  }

  let template;
  if (existing) {
    await p.templatePage.deleteMany({ where: { templateId: existing.id } });
    template = await p.template.update({
      where: { id: existing.id },
      data: {
        name: tpl.name,
        description: tpl.description,
        categoryId: cat.id,
        isActive: true,
        tags: JSON.stringify([tpl.category.toLowerCase()]),
      },
    });
  } else {
    template = await p.template.create({
      data: {
        name: tpl.name,
        description: tpl.description,
        categoryId: cat.id,
        isActive: true,
        tags: JSON.stringify([tpl.category.toLowerCase()]),
      },
    });
  }

  for (const page of tpl.pages) {
    const tp = await p.templatePage.create({
      data: {
        templateId: template.id,
        name: page.name,
        slug: page.slug,
        path: page.path,
        isDefault: page.isDefault,
        sortOrder: page.sortOrder,
      },
    });

    if (page.blocks.length > 0) {
      await p.templateBlock.createMany({
        data: page.blocks.map((b) => ({
          templatePageId: tp.id,
          type: b.type,
          content: b.content,
          sortOrder: b.sortOrder,
        })),
      });
    }
  }

  console.log("Plantilla Academia Graduate variante a\u00f1adida exitosamente!");
  await p.$disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});