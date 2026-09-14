import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/landing/reveal";

export const metadata = {
  title: "Build Iceberg Agency - Crea tu sitio premium",
  description: "Plataforma líder para agencias y negocios. Lanza sitios increíbles en minutos.",
};

const PAIN_CHECKS = [
  {
    title: "Tu web tarda en cargar y la gente se va antes de verla",
    sub: "El 53% de los visitantes abandona si una página tarda más de 3 segundos.",
  },
  {
    title: "Dependes de un desarrollador para cualquier cambio",
    sub: "Un simple cambio de texto cuesta días de espera y una factura nueva.",
  },
  {
    title: "Tu diseño se ve viejo y no transmite confianza",
    sub: "Si no te ves premium, no te cobran como premium. Y tampoco te compran.",
  },
  {
    title: "Tus formularios no te traen clientes",
    sub: "Pierdes leads y ventas todos los días sin siquiera enterarte.",
  },
  {
    title: "Vives peleando con plugins, actualizaciones y servidores caídos",
    sub: "Tu trabajo es vender, no ser administrador de sistemas frustrado.",
  },
];

const PAIN_CARDS = [
  {
    icon: "hourglass_empty",
    title: "Lento y frustrante",
    desc: "Cada segundo extra de carga te cuesta un 20% de conversión. Tus clientes cierran la pestaña antes de ver tu oferta.",
    chip: "+20% de ventas perdidas por segundo",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: "code_off",
    title: "Dependencia técnica",
    desc: "Rogar (y pagar) a un desarrollador por un texto o una imagen retrasa toda tu estrategia de marketing.",
    chip: "Agencias pierden semanas por cambio",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: "sentiment_dissatisfied",
    title: "Diseño anticuado",
    desc: "Una web con aspecto de hace 10 años destruye tu credibilidad al instante. El 75% de tu audiencia te juzga solo por el diseño.",
    chip: "El 75% juzga tu marca por tu diseño",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
  },
];

const STEPS = [
  {
    step: "01",
    icon: "dashboard_customize",
    title: "Elige una base ganadora",
    desc: "Plantillas premium, probadas y optimizadas para conversión. Estructura lista, tú solo aportas tu contenido.",
    points: ["Estructuras de venta probadas", "Diseño responsivo incluido"],
  },
  {
    step: "02",
    icon: "draw",
    title: "Personaliza haciendo clic",
    desc: "Cambia textos, colores, imágenes y secciones sin tocar una línea de código. El editor más intuitivo que existe.",
    points: ["Sin código, sin plugins", "Cambios en vivo al instante"],
  },
  {
    step: "03",
    icon: "rocket_launch",
    title: "Conecta tu dominio y lanza",
    desc: "Vincula tu dominio, SSL gratis incluido, y publica en el hosting de borde más rápido. En vivo en segundos.",
    points: ["SSL gratis e ilimitado", "Hosting ultrarrápido incluido"],
  },
];

const FUNNEL_STAGES = [
  { label: "Visitas", value: "100%", width: "100%", color: "rgba(32,27,81,0.95)" },
  { label: "Interés", value: "62%", width: "78%", color: "rgba(87,67,130,0.9)" },
  { label: "Llenan el formulario", value: "38%", width: "56%", color: "rgba(145,129,186,0.9)" },
  { label: "Te contactan", value: "19%", width: "36%", color: "rgba(242,146,0,0.9)" },
  { label: "Venta cerrada", value: "11%", width: "22%", color: "rgba(242,146,0,1)" },
];

const BENTO = {
  speed: {
    icon: "bolt",
    title: "Carga en menos de 1 segundo",
    desc: "Hosting de borde global. Cada segundo no cargado es una venta no cerrada y un puesto menos en Google.",
  },
  editor: {
    icon: "drag_click",
    title: "Edita como si fuera Word",
    desc: "Clic, escribe, publica. Cambios en vivo que hoy te toman días con un desarrollador.",
  },
  seo: {
    icon: "analytics",
    title: "SEO en piloto automático",
    desc: "Metadatos, sitemap y OpenGraph generados solos. Posiciona sin depender de nadie.",
  },
  domain: {
    icon: "language",
    title: "Tu dominio, tu marca",
    desc: "SSL gratis e ilimitado. El candado verde que dice «confiable», no el «Sitio no seguro» que espanta clientes.",
  },
};

const TESTIMONIALS = [
  { text: "Migramos todos los clientes de nuestra agencia a esta plataforma. El tiempo de desarrollo pasó de semanas a días. El ROI ha sido increíble.", name: "Carlos M.", role: "CEO, Nexus Agency", rating: 5 },
  { text: "Usé la plantilla L'Art Culinaire para mi restaurante. Mis clientes piensan que pagué miles de dólares por el sitio web.", name: "Sofia T.", role: "Fundadora, Bistro 22", rating: 5 },
  { text: "El hecho de no tener que lidiar con plugins, actualizaciones ni servidores caídos me ha devuelto años de vida. Totalmente recomendado.", name: "Diego R.", role: "Consultor Independiente", rating: 5 },
];

const PREMIUM_TEMPLATES = [
  { name: "Prestige Corp", desc: "Corporativo premium", gradient: "from-[#201b51] via-[#574382] to-[#9181ba]", initial: "P" },
  { name: "L'Art Culinaire", desc: "Restaurante de autor", gradient: "from-[#7f1d1d] via-[#c2410c] to-[#f59e0b]", initial: "A" },
  { name: "Indigo", desc: "Agencia de diseño", gradient: "from-[#1e3a8a] via-[#312e81] to-[#6d28d9]", initial: "I" },
  { name: "Dishora", desc: "Gastronomía & talleres", gradient: "from-[#1e1814] via-[#7c3f12] to-[#d0451b]", initial: "D" },
  { name: "Graduate", desc: "Academia & cursos", gradient: "from-[#030312] via-[#2d2e81] to-[#fa7202]", initial: "G" },
  { name: "Rodriplast", desc: "Industria & fabricación", gradient: "from-[#052e16] via-[#15803d] to-[#4ade80]", initial: "R" },
];

const FAQS = [
  { q: "¿Necesito saber programar para usar la plataforma?", a: "No, para nada. Nuestro editor visual te permite modificar textos, imágenes y colores haciendo clic. No verás ni una línea de código." },
  { q: "¿Cuánto tardo en publicar mi primer sitio?", a: "La mayoría de nuestros usuarios publican su primer sitio el mismo día. Elige una plantilla, personaliza con clics, conecta tu dominio y listo: no tienes que esperar a nadie." },
  { q: "¿Puedo usar mi propio dominio (.com, .es, etc)?", a: "Sí. Conecta tu dominio y nosotros generamos y renovamos automáticamente los certificados SSL. Tu sitio siempre lucirá profesional y seguro." },
  { q: "¿Qué pasa con mi sitio actual, puedo migrarlo?", a: "Sí. Recrea tu contenido en minutos con nuestras plantillas y apunta tu dominio a Build Iceberg. Muchas agencias migran carteras enteras de clientes en una semana." },
  { q: "¿Puedo cancelar cuando quiera?", a: "Claro. Tienes 14 días de prueba sin tarjeta y, en cualquier plan, cancelas con un clic. Sin permanencia forzosa y sin letra pequeña." },
  { q: "¿Dónde se alojan los sitios?", a: "En nuestros servidores de borde global. Esto garantiza que tu web cargue a la velocidad del rayo sin importar desde qué país te visiten." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface selection:bg-primary selection:text-white overflow-x-hidden scroll-smooth">

      {/* NAVBAR */}
      <header className="absolute top-0 w-full z-50 pt-6 pb-4">
        <div className="container-max mx-auto px-6">
          <div className="flex items-center justify-between bg-white/50 backdrop-blur-lg rounded-full border border-outline-variant/30 py-3 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <Link href="/" className="flex items-center gap-3 group cursor-pointer pl-4">
              <Image src="/logo.png" alt="Build Iceberg Agency" width={220} height={70} className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform" />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 pr-2">
              <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-secondary">stars</span> 4.9/5 — +1.200 negocios
              </span>
              <Link href="/login" className="hidden md:inline-block px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                Iniciar Sesión
              </Link>
              <Link href="/register" className="anim-shine inline-flex items-center justify-center px-6 sm:px-8 py-2.5 rounded-full bg-secondary text-white text-sm font-bold shadow-lg shadow-secondary/30 hover:bg-orange-500 hover:shadow-secondary/50 hover:-translate-y-0.5 transition-all duration-300">
                Empezar Gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center text-center">
        <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-center opacity-40">
          <div className="absolute w-[800px] h-[800px] bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-full blur-[120px] anim-glow"></div>
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-tertiary/20 rounded-full blur-[100px] anim-glow" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <Reveal className="relative z-10 w-full">
          <div className="container-max mx-auto px-6 max-w-5xl mt-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/10 border border-secondary/30 mb-8 shadow-sm">
              <span className="flex w-3 h-3 rounded-full bg-secondary animate-pulse"></span>
              <span className="text-xs font-bold text-secondary uppercase tracking-widest">La web que no cargó, no vendió</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-on-surface mb-8 leading-[1.05]">
              Tu web actual te está{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-600 to-secondary anim-gradient-text">
                robando ventas
              </span>
              <br className="hidden sm:block" /> y no te has dado cuenta
            </h1>

            <p className="text-lg lg:text-2xl text-on-surface-variant max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
              El 53% abandona tu página si tarda más de 3 segundos. Nosotros ponemos el sitio web{" "}
              <span className="font-black text-on-surface">rápido, premium y que convierte</span>, tú pones tu servicio.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 mb-14">
              <Link href="/register" className="anim-shine inline-flex items-center justify-center w-full sm:w-auto px-12 py-5 rounded-full bg-secondary text-white text-xl font-black shadow-[0_0_40px_rgba(242,146,0,0.4)] hover:bg-orange-500 hover:shadow-[0_0_60px_rgba(242,146,0,0.6)] hover:-translate-y-1 transition-all duration-300">
                SÍ, QUIERO RECUPERAR VENTAS HOY
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-on-surface-variant/80 font-medium">
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span> 14 días de prueba gratis</span>
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span> Sin tarjeta de crédito</span>
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span> Publica en minutos</span>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { value: "+1.200", label: "sitios creados" },
                { value: "<1s", label: "de carga promedio" },
                { value: "14 días", label: "de garantía total" },
                { value: "4.9/5", label: "valoración media" },
              ].map((s, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-xl border border-outline-variant/20 rounded-2xl px-4 py-4 shadow-sm">
                  <p className="text-2xl font-black text-on-surface">{s.value}</p>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Dashboard Mockup */}
        <Reveal delay={150} className="relative z-10 w-full">
          <div className="container-max mx-auto px-6 max-w-6xl w-full perspective-[2000px] mt-16">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-secondary/30 blur-3xl opacity-50 transform scale-95"></div>

            <div className="relative rounded-[2rem] border-[8px] border-surface-container-highest/50 bg-surface-container-lowest/90 backdrop-blur-3xl shadow-[0_30px_100px_-20px_rgba(32,27,81,0.4)] overflow-hidden transition-all duration-700 transform-gpu hover:rotate-x-0 hover:scale-[1.03] rotate-x-[5deg] scale-100">
              <div className="w-full h-14 flex items-center gap-2 px-6 border-b border-outline-variant/20 bg-surface-container-lowest">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm"></div>
                <div className="w-4 h-4 rounded-full bg-amber-500 shadow-sm"></div>
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
                <div className="ml-4 flex-1 flex justify-center">
                  <div className="bg-surface-container-low px-6 py-2 rounded-lg text-sm text-on-surface-variant font-medium font-mono border border-outline-variant/30 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    app.buildiceberg.com/funnel/sales
                  </div>
                </div>
              </div>

              <div className="w-full relative aspect-[16/10] bg-[#0f111a] flex font-sans">
                <div className="w-48 border-r border-slate-800 bg-[#131620] p-4 flex-col gap-4 hidden md:flex">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">COMPONENTES</span>
                    <span className="material-symbols-outlined text-[14px] text-slate-500">add</span>
                  </div>
                  {['Header', 'Hero Section', 'Funnel', 'Testimonials', 'Pricing', 'Footer'].map((item, i) => (
                    <div key={i} className={`text-xs p-2 rounded-md border flex items-center cursor-default ${i === 2 ? 'border-primary/50 bg-primary/10 text-primary' : 'border-slate-800 bg-[#1a1d27] text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[14px] mr-2">
                        {i === 2 ? 'filter_funnel' : 'view_agenda'}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>

                <div className="flex-1 p-4 md:p-8 bg-[#0a0c10] relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)', backgroundSize: '24px 24px', opacity: 0.3 }}></div>

                  <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col z-10 transform transition-transform hover:scale-[1.02] duration-500">
                    <div className="h-12 border-b border-slate-100 flex items-center justify-between px-6 bg-white">
                       <div className="w-24 h-4 bg-slate-900 rounded-sm"></div>
                       <div className="flex gap-4">
                         <div className="w-10 h-1.5 bg-slate-200 rounded-full"></div>
                         <div className="w-10 h-1.5 bg-slate-200 rounded-full"></div>
                         <div className="w-16 h-6 bg-primary rounded-full ml-2"></div>
                       </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden bg-slate-50">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>

                      <div className="w-max px-3 py-1 bg-white text-slate-600 rounded-full text-[9px] font-bold mb-5 border border-slate-200 shadow-sm relative z-10">
                        🚀 MARKETING LISTO PARA CONVERTIR
                      </div>

                      <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 leading-tight relative z-10">
                        Más visitas, <br /><span className="text-primary">más clientes</span>
                      </h1>

                      <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto mb-8 relative z-10">
                        Embudo, formulario de contacto, WhatsApp y reseñas listos para recibir pedidos en minutos.
                      </p>

                      <div className="px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-full shadow-lg shadow-slate-900/20 relative z-10">
                        Lanzar mi embudo
                      </div>

                      <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-primary border-dashed rounded-lg pointer-events-none z-20">
                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full"></div>
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full"></div>
                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full"></div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full"></div>
                        <div className="absolute -top-3 left-4 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-sm">
                          Embudo de ventas
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-56 border-l border-slate-800 bg-[#131620] p-4 hidden lg:flex flex-col gap-6 relative z-40">
                   <div>
                     <span className="text-[10px] font-bold text-slate-500 block mb-3 tracking-wider">EMBUDO (VENTAS)</span>
                     <div className="flex flex-col gap-2">
                       {[["Visitas", "1.240", "text-primary"], ["Leads", "348", "text-secondary"], ["Ventas", "97", "text-green-400"]].map(([k, v, c]) => (
                         <div key={k} className="bg-[#1a1d27] p-2 rounded border border-slate-800 flex justify-between items-center">
                           <span className="text-[10px] text-slate-400">{k}</span>
                           <span className={`font-mono text-xs font-bold ${c}`}>{v}</span>
                         </div>
                       ))}
                     </div>
                   </div>

                   <div>
                     <span className="text-[10px] font-bold text-slate-500 block mb-3 tracking-wider">ESCENARIO</span>
                     <div className="bg-[#1a1d27] p-2 rounded border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                       <span>CTA principal</span>
                       <span className="text-white font-mono text-xs">WhatsApp</span>
                     </div>
                   </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-transparent to-transparent opacity-80 pointer-events-none z-30"></div>

                <div className="absolute -left-8 md:left-8 top-1/4 bg-white p-4 rounded-2xl shadow-2xl border border-outline-variant/30 flex items-center gap-4 anim-float z-40">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant font-bold uppercase">Conversión</p>
                    <p className="text-xl font-black text-on-surface">+ 24.5%</p>
                  </div>
                </div>

                <div className="absolute -right-8 md:right-8 bottom-1/4 bg-white p-4 rounded-2xl shadow-2xl border border-outline-variant/30 flex items-center gap-4 anim-float-slow z-40" style={{ animationDelay: '1s' }}>
                  <div className="w-12 h-12 bg-secondary/20 text-secondary rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined">notifications_active</span>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant font-bold uppercase">Nuevo Lead</p>
                    <p className="text-xl font-black text-on-surface">Hace 2 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* MARQUEE TICKER */}
      <div className="relative border-y border-outline-variant/20 bg-inverse-surface text-inverse-on-surface overflow-hidden py-4">
        <div className="flex w-max anim-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-10 pr-10 whitespace-nowrap">
              {["Editor visual", "Dominio propio", "SSL gratis", "SEO automático", "Formularios y leads", "Botón WhatsApp", "Velocidad extrema", "Plantillas premium", "Reseñas de clientes"].map((item, i) => (
                <span key={i} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-secondary">verified</span>
                  {item}
                </span>
              ))}
              {["Editor visual", "Dominio propio", "SSL gratis", "SEO automático", "Formularios y leads", "Botón WhatsApp", "Velocidad extrema", "Plantillas premium", "Reseñas de clientes"].map((item, i) => (
                <span key={i} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-secondary">verified</span>
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* PROBLEM AGITATION */}
      <section className="py-24 bg-surface relative overflow-hidden">
        <div className="container-max mx-auto px-6 relative z-10">
          <Reveal className="mx-auto text-center max-w-4xl mb-16">
            <h2 className="text-sm font-bold text-error uppercase tracking-widest mb-3">La cruda verdad</h2>
            <h3 className="text-3xl md:text-5xl font-extrabold text-on-surface mb-6 leading-tight">
              Si te pasas viendo por aquí, tu web te está <span className="text-error">costando dinero</span>
            </h3>
            <p className="text-xl text-on-surface-variant font-medium">
              Marca las que suenan como tu situación. Cada una es una fuga de clientes que hoy puedes tapar.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto mb-20">
            <Reveal>
              <div className="space-y-4">
                {PAIN_CHECKS.map((pain, i) => (
                  <div key={i} className="flex items-start gap-4 bg-surface-container border border-outline-variant/30 p-5 rounded-2xl hover:border-error/40 hover:shadow-lg transition-all duration-300">
                    <span className="material-symbols-outlined text-[26px] text-error shrink-0 mt-0.5">cancel</span>
                    <div>
                      <p className="font-bold text-on-surface mb-1">{pain.title}</p>
                      <p className="text-sm text-on-surface-variant">{pain.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120} className="flex flex-col justify-center">
              <div className="bg-inverse-surface text-inverse-on-surface rounded-3xl p-8 md:p-10 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-secondary/20 rounded-full blur-[80px] anim-glow"></div>
                <p className="text-2xl md:text-3xl font-black leading-tight mb-6">
                  ¿Te duele? Perfecto. <span className="text-secondary">Eso significa que el dinero está donde no debes.</span>
                </p>
                <p className="text-surface-variant text-lg mb-8">
                  No necesitas 6 meses ni 5.000 €. Necesitas un sitio que cargue rápido, se vea premium y capture leads. Eso es lo que construimos por ti.
                </p>
                <Link href="/register" className="anim-shine inline-flex items-center gap-3 bg-secondary text-white px-8 py-4 rounded-full font-black text-lg hover:bg-orange-500 hover:-translate-y-1 transition-all duration-300">
                  TAPAR LA FUGA AHORA
                  <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PAIN_CARDS.map((pain, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="bg-surface-container border border-outline-variant/30 p-8 rounded-3xl relative overflow-hidden group h-full hover:-translate-y-2 hover:shadow-2xl transition-all duration-500">
                  <div className={`w-14 h-14 ${pain.bg} ${pain.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-[32px]">{pain.icon}</span>
                  </div>
                  <h4 className="text-2xl font-bold text-on-surface mb-4">{pain.title}</h4>
                  <p className="text-on-surface-variant leading-relaxed mb-6">{pain.desc}</p>
                  <div className={`inline-flex items-center gap-2 ${pain.color} ${pain.bg} px-4 py-2 rounded-full text-sm font-bold`}>
                    <span className="material-symbols-outlined text-[16px]">trending_down</span>
                    {pain.chip}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-inverse-surface text-inverse-on-surface relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none anim-glow"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none anim-glow"></div>

        <div className="container-max mx-auto px-6 relative z-10">
          <Reveal className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">La Solución Definitiva</h2>
            <h3 className="text-4xl lg:text-5xl font-extrabold mb-6">De «web que no vende» a máquina de clientes en 3 pasos</h3>
            <p className="text-lg text-surface-variant">Sin frustraciones, sin código, sin esperar a un desarrollador. Solo resultados.</p>
          </Reveal>

          <div className="flex flex-col md:flex-row gap-12 max-w-6xl mx-auto items-center md:items-start text-center md:text-left relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-outline-variant/20 to-transparent"></div>

            {STEPS.map((step, i) => (
              <Reveal key={i} delay={i * 150} className="flex-1 w-full">
                <div className="flex flex-col items-center md:items-start relative z-10">
                  <div className="w-24 h-24 rounded-full bg-surface-container/10 border border-outline-variant/20 backdrop-blur-md flex items-center justify-center mb-8 shadow-xl text-secondary anim-float-slow" style={{ animationDelay: `${i * 0.6}s` }}>
                    <span className="material-symbols-outlined text-[40px]">{step.icon}</span>
                  </div>
                  <div className="text-secondary font-black text-xl mb-2">{step.step}</div>
                  <h4 className="text-2xl font-bold mb-4">{step.title}</h4>
                  <p className="text-surface-variant">{step.desc}</p>
                  <ul className="mt-5 space-y-2 text-sm text-surface-variant">
                    {step.points.map((p, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-20 flex justify-center">
            <Link href="/register" className="anim-shine px-10 py-4 rounded-full bg-secondary text-white text-lg font-bold shadow-lg shadow-secondary/30 hover:bg-orange-500 hover:-translate-y-1 transition-all duration-300">
              Crear mi cuenta ahora
            </Link>
          </Reveal>
        </div>
      </section>

      {/* FUNNEL */}
      <section className="py-24 bg-surface-container-lowest relative overflow-hidden">
        <div className="container-max mx-auto px-6 max-w-6xl">
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Embudos que convierten</h2>
            <h3 className="text-4xl lg:text-5xl font-bold text-on-surface mb-6">Cada visitante tiene que llegar a pagar. Sin fugas.</h3>
            <p className="text-lg text-on-surface-variant">Toda sección está diseñada para no dejar escapar a quien te encontró. Del clic a la venta cerrada.</p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div className="flex flex-col gap-3">
                {FUNNEL_STAGES.map((stage, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-40 shrink-0 text-sm font-bold text-on-surface text-right">{stage.label}</span>
                    <div className="flex-1 h-12 bg-surface-container rounded-xl overflow-hidden flex items-center">
                      <div className="h-full rounded-xl flex items-center px-4"
                        style={{
                          width: stage.width,
                          background: `linear-gradient(90deg, ${stage.color}, ${stage.color}cc)`,
                          animation: `barGrow 0.9s cubic-bezier(0.22,1,0.36,1) ${0.2 + i * 0.12}s both`,
                          transformOrigin: 'left',
                        }}>
                      </div>
                    </div>
                    <span className="w-14 shrink-0 text-lg font-black text-on-surface">{stage.value}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="bg-surface border border-outline-variant/30 rounded-3xl p-8 md:p-10 shadow-sm">
                <h4 className="text-2xl font-bold text-on-surface mb-6">Todo lo que necesitas para capturar leads, ya incluido:</h4>
                <div className="space-y-4">
                  {[
                    { icon: "contact_page", text: "Formularios de contacto con captura de leads" },
                    { icon: "whatsapp", text: "Botón flotante de WhatsApp para cerrar ventas directas" },
                    { icon: "reviews", text: "Formulario de reseñas para multiplicar tu prueba social" },
                    { icon: "mark_email_read", text: "Recibe cada lead al instante, sin perder ni uno" },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-surface-container rounded-2xl border border-outline-variant/20 hover:border-primary/40 transition-colors">
                      <span className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">{f.icon}</span>
                      </span>
                      <p className="font-semibold text-on-surface">{f.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section id="features" className="py-24 lg:py-32 bg-surface">
        <div className="container-max mx-auto px-6">
          <Reveal className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Todo en Uno</h2>
            <h3 className="text-4xl lg:text-5xl font-bold text-on-surface mb-6">Reemplaza tus dolores por esto</h3>
            <p className="text-lg text-on-surface-variant">Aloja, diseña y posiciona en un solo lugar. Sin más herramientas, sin más facturas.</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto auto-rows-[300px]">
            <Reveal className="md:col-span-8">
              <div className="bg-inverse-surface text-inverse-on-surface p-10 rounded-3xl overflow-hidden relative group h-full">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/40 rounded-full blur-[80px] group-hover:scale-110 transition-transform anim-glow"></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <span className="material-symbols-outlined text-5xl text-primary-fixed">bolt</span>
                  <div>
                    <h4 className="text-3xl font-bold mb-3">{BENTO.speed.title}</h4>
                    <p className="text-surface-variant max-w-md text-lg">{BENTO.speed.desc}</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120} className="md:col-span-4">
              <div className="bg-surface-container-high border border-outline-variant/30 p-10 rounded-3xl relative group hover:shadow-xl transition-all h-full flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
                <span className="material-symbols-outlined text-5xl text-secondary">drag_click</span>
                <div className="relative z-10">
                  <h4 className="text-2xl font-bold text-on-surface mb-2">{BENTO.editor.title}</h4>
                  <p className="text-on-surface-variant">{BENTO.editor.desc}</p>
                </div>
              </div>
            </Reveal>

            <Reveal className="md:col-span-5">
              <div className="bg-surface-container-highest border border-outline-variant/30 p-10 rounded-3xl relative group hover:shadow-xl transition-all h-full flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-tertiary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="material-symbols-outlined text-5xl text-tertiary">analytics</span>
                <div className="relative z-10">
                  <h4 className="text-2xl font-bold text-on-surface mb-2">{BENTO.seo.title}</h4>
                  <p className="text-on-surface-variant">{BENTO.seo.desc}</p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120} className="md:col-span-7">
              <div className="bg-surface-container border border-outline-variant/30 p-10 rounded-3xl relative overflow-hidden group hover:shadow-xl transition-all h-full flex flex-col justify-between">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-full opacity-10 mix-blend-overlay anim-float-x"></div>
                <span className="material-symbols-outlined text-5xl text-primary">language</span>
                <div className="relative z-10">
                  <h4 className="text-3xl font-bold text-on-surface mb-3">{BENTO.domain.title}</h4>
                  <p className="text-on-surface-variant text-lg max-w-sm">{BENTO.domain.desc}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section id="showcase" className="py-24 bg-surface-container-lowest relative">
        <div className="container-max mx-auto px-6">
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Casos de Éxito</h2>
            <h3 className="text-4xl lg:text-5xl font-bold text-on-surface mb-6">Negocios reales, resultados reales.</h3>
            <p className="text-lg text-on-surface-variant">Sitios de producción alojados en nuestra plataforma, con su propio dominio y velocidad extrema.</p>
          </Reveal>

          <div className="max-w-4xl mx-auto mb-16">
            <Reveal>
              <div className="group rounded-3xl overflow-hidden bg-surface-container-low border border-outline-variant/30 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
                  <div className="w-[400%] h-[400%] transform scale-25 origin-top-left pointer-events-none transition-transform duration-700 group-hover:scale-[0.26]">
                    <iframe src="https://www.rodriplast.com/" className="w-full h-full border-0 bg-white" tabIndex={-1} scrolling="no" />
                  </div>
                  <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg border border-outline-variant/20 flex items-center gap-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-[-10px] group-hover:translate-y-0">
                    <span className="material-symbols-outlined text-[16px] text-green-600">lock</span>
                    <span className="text-sm font-mono text-slate-700">rodriplast.com</span>
                  </div>
                </div>
                <div className="p-8 md:p-10">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
                    <div>
                      <h4 className="text-3xl font-bold text-on-surface mb-2">Rodriplast</h4>
                      <a href="https://www.rodriplast.com" target="_blank" rel="noopener noreferrer" className="text-base font-medium text-primary hover:underline">www.rodriplast.com</a>
                    </div>
                    <span className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-bold rounded-full">Sitio en Producción</span>
                  </div>
                  <p className="text-lg text-on-surface-variant leading-relaxed">Fabricante ecuatoriano con su sitio corporativo en producción: dominios personalizados, velocidad extrema y diseño premium sin depender de nadie.</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="text-center max-w-3xl mx-auto mb-12">
            <h4 className="text-2xl md:text-3xl font-bold text-on-surface">Y estas son solo algunas de las <span className="text-primary">plantillas premium</span> incluidas</h4>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PREMIUM_TEMPLATES.map((t, i) => (
              <Reveal key={i} delay={i * 90}>
                <div className={`group rounded-3xl overflow-hidden bg-gradient-to-br ${t.gradient} relative p-8 min-h-[220px] flex flex-col justify-end shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-500`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500 pointer-events-none"></div>
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-black text-white mb-4 group-hover:scale-110 transition-transform">
                    {t.initial}
                  </div>
                  <h5 className="text-xl font-bold text-white">{t.name}</h5>
                  <p className="text-white/80 text-sm">{t.desc}</p>
                  <span className="absolute top-6 right-6 material-symbols-outlined text-white/70 group-hover:rotate-45 transition-transform duration-500">north_east</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 bg-surface border-t border-outline-variant/20 overflow-hidden relative">
        <div className="container-max mx-auto px-6">
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">Prueba social</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">Agencias y fundadores que ya dejaron de perder vendas</h3>
            <p className="text-on-surface-variant text-lg">Resultados que respaldan nuestra promesa.</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 130}>
                <div className="bg-surface-container border border-outline-variant/30 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex gap-1 mb-6 text-amber-400">
                      {[...Array(t.rating)].map((_, j) => <span key={j} className="material-symbols-outlined fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                    </div>
                    <p className="text-lg text-on-surface font-medium italic mb-8">&quot;{t.text}&quot;</p>
                  </div>
                  <div className="flex items-center gap-4 border-t border-outline-variant/20 pt-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-lg">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">{t.name}</h4>
                      <p className="text-sm text-on-surface-variant">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GUARANTEE / RISK REVERSAL */}
      <section className="py-20 bg-inverse-surface text-inverse-on-surface relative overflow-hidden border-y border-outline-variant/10">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none anim-glow"></div>
        <div className="container-max mx-auto px-6 max-w-5xl relative z-10">
          <Reveal className="flex flex-col lg:flex-row items-center gap-10">
            <div className="w-32 h-32 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0 anim-float">
              <span className="material-symbols-outlined text-6xl text-secondary">verified_user</span>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-3xl lg:text-4xl font-black mb-4">Tu riesgo: cero. El nuestro: todo.</h3>
              <p className="text-lg text-surface-variant mb-8">
                Pruébalo 14 días completos, sin tarjeta de crédito. Si no estás obsesionado con tu nuevo sitio web, cancela con un clic y nos despedimos sin cargos y sin preguntas.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-3">
                {["14 días de prueba completa", "Sin tarjeta de crédito", "Cancela con un clic"].map((g, i) => (
                  <span key={i} className="flex items-center gap-2 font-bold text-white">
                    <span className="material-symbols-outlined text-[20px] text-secondary">check_circle</span>
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-surface-container-lowest">
        <div className="container-max mx-auto px-6 max-w-4xl">
          <Reveal className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-on-surface mb-4">¿Qué nos preguntan antes de lanzarse?</h2>
            <p className="text-on-surface-variant">Respuestas directas, sin letra pequeña.</p>
          </Reveal>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <Reveal key={i} delay={i * 60}>
                <details className="group bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-lg text-on-surface hover:text-primary transition-colors">
                    {faq.q}
                    <span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">expand_more</span>
                  </summary>
                  <div className="px-6 pb-6 text-on-surface-variant leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA + FOOTER */}
      <footer className="bg-inverse-surface text-inverse-on-surface relative overflow-hidden border-t border-outline-variant/10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none anim-glow"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/30 rounded-full blur-[150px] pointer-events-none anim-glow"></div>

        <div className="container-max mx-auto px-6 pt-32 pb-20 relative z-10 flex flex-col items-center text-center border-b border-outline-variant/10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="text-xs font-bold text-white uppercase tracking-widest">La última vez que tu web te va a salir cara</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-8 leading-tight">
            Es hora de que tu web <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-secondary-600 anim-gradient-text">te venda</span> por ti.
          </h2>
          <p className="text-xl text-surface-variant max-w-2xl mx-auto mb-12">
            Paga una vez, recupera cada cliente que tu web lenta te robó. Empieza hoy con 14 días gratis y sin tarjeta.
          </p>

          <Reveal className="flex flex-col items-center">
            <Link href="/register" className="anim-shine inline-flex items-center justify-center px-12 py-5 rounded-full bg-secondary text-white text-xl font-black hover:bg-orange-500 hover:scale-105 transition-all duration-300 shadow-[0_0_50px_rgba(242,146,0,0.4)] hover:shadow-[0_0_80px_rgba(242,146,0,0.7)] mb-6">
              INICIAR MI PRUEBA GRATIS AHORA
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-surface-variant font-medium mb-8">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">verified_user</span>14 días de garantía</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">credit_card_off</span>Sin tarjeta</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">schedule</span>Publica en minutos</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 text-left text-sm bg-white/5 border border-white/10 rounded-2xl p-5">
              {["Editor visual premiado", "Hosting de borde incluido", "SSL gratis e ilimitado", "Plantillas premium de regalo"].map((f, i) => (
                <span key={i} className="flex items-center gap-2 font-semibold text-white">
                  <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">check_circle</span>
                  {f}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="container-max mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg">
              <Image src="/logo.png" alt="Build Iceberg Agency" width={180} height={60} className="h-12 w-auto object-contain" />
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-surface-variant font-medium">
              <a href="#features" className="hover:text-white transition-colors">Funciones</a>
              <a href="#showcase" className="hover:text-white transition-colors">Casos de éxito</a>
              <a href="#faq" className="hover:text-white transition-colors">Preguntas</a>
              <a href="#footer" className="hover:text-white transition-colors">Términos</a>
              <a href="#footer" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#footer" className="hover:text-white transition-colors">Soporte</a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-surface-variant">
            <p>© {new Date().getFullYear()} Build Iceberg Agency. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-secondary hover:text-white transition-all"><span className="font-bold">X</span></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-secondary hover:text-white transition-all"><span className="font-bold">in</span></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-secondary hover:text-white transition-all"><span className="font-bold">ig</span></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}