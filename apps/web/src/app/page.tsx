import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Build Iceberg Agency - Crea tu sitio premium",
  description: "Plataforma líder para agencias y negocios. Lanza sitios increíbles en minutos.",
};

export default function HomePage() {
  return (
    <div 
      className="min-h-screen bg-surface font-sans text-on-surface selection:bg-primary selection:text-white overflow-x-hidden scroll-smooth"
      style={{
        "--color-primary-default": "#201b51",
        "--color-primary-600": "#201c4eb3",
        "--color-primary-fixed": "#201b51",
        "--color-on-primary-fixed": "#ffffff",
        "--color-secondary": "#f29200",
        "--color-tertiary": "#f29200",
        "--color-surface": "#ffffff",
        "--color-surface-container-lowest": "#ffffff",
        "--color-surface-container-low": "#f8f9fa",
        "--color-surface-container": "#f1f3f5",
        "--color-surface-container-high": "#e9ecef",
        "--color-surface-container-highest": "#dee2e6",
        "--color-on-surface": "#201b51",
        "--color-on-surface-variant": "#495057",
        "--color-inverse-surface": "#201b51",
        "--color-inverse-on-surface": "#ffffff",
        "--color-outline": "#ced4da",
        "--color-outline-variant": "#e9ecef",
      } as React.CSSProperties}
    >
      
      {/* 1. NAVBAR (FUNNEL STYLE) */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-surface-container-lowest/80 border-b border-outline-variant/20 transition-all">
        <div className="container-max mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <Image src="/logo.png" alt="Build Iceberg Agency" width={240} height={80} className="h-16 w-auto object-contain group-hover:scale-105 transition-transform" />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/register" className="hidden sm:inline-block px-8 py-3 rounded-full bg-secondary text-white text-sm font-bold shadow-lg shadow-secondary/30 hover:bg-orange-500 hover:shadow-secondary/50 hover:-translate-y-0.5 transition-all duration-300">
              Quiero mi sitio web ahora
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center text-center">
        {/* Dynamic Glass Background */}
        <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-center opacity-40">
          <div className="absolute w-[800px] h-[800px] bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-tertiary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }}></div>
        </div>

        <div className="relative z-10 container-max mx-auto px-6 max-w-5xl mt-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/10 border border-secondary/30 mb-8 shadow-sm">
            <span className="flex w-3 h-3 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Atención Agencias y Negocios</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-on-surface mb-8 leading-[1.05]">
            Convierte visitantes en <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-600 to-secondary">clientes leales</span>
          </h1>
          
          <p className="text-lg lg:text-2xl text-on-surface-variant max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Deja de perder clientes por una web lenta y anticuada. Lanza embudos y sitios web de ultra conversión en minutos con Build Iceberg Agency.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 mb-16">
            <Link href="/register" className="w-full sm:w-auto px-12 py-5 rounded-full bg-secondary text-white text-xl font-black shadow-[0_0_40px_rgba(242,146,0,0.4)] hover:bg-orange-500 hover:shadow-[0_0_60px_rgba(242,146,0,0.6)] hover:-translate-y-1 transition-all duration-300">
              SÍ, QUIERO ESCALAR MI NEGOCIO
            </Link>
            <p className="text-sm text-on-surface-variant/70 font-medium">✨ Garantía de satisfacción de 14 días. Sin tarjeta de crédito.</p>
          </div>
        </div>

        {/* Dashboard Mockup Hover */}
        <div className="relative z-10 container-max mx-auto px-6 max-w-6xl w-full perspective-[2000px]">
          {/* Glowing backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-secondary/30 blur-3xl opacity-50 transform scale-95"></div>
          
          <div className="relative rounded-[2rem] border-[8px] border-surface-container-highest/50 bg-surface-container-lowest/90 backdrop-blur-3xl shadow-[0_30px_100px_-20px_rgba(32,27,81,0.4)] overflow-hidden transition-all duration-700 transform-gpu hover:rotate-x-0 hover:scale-[1.03] rotate-x-[5deg] scale-100">
            {/* Window controls */}
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
            {/* Editor Image Mockup */}
            <div className="w-full relative aspect-[16/10] bg-surface-container">
               <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCU29CaMpcauBw66zIT8_U_NX3lcijaYGO0uHF4Y7L1bxjR3bB0dOuZ_dE3_tvNHxso_x3FNNGGl9s7-XXyaW7r25GO72k5lX0P4QNjfL6zz1FYJolmuh0_6jPhH8LHNtOmvOIY8-rtTtZaWJFI8CA5wqZ6EQyd1jjp2toWimTmroPGQLj5veYNPVzYn-ZAyaHlc8jKlY5w-HdWXg11E0QKAUlbwOBKTv83HwdPv3yphWI3uKLLrTXKhA" alt="Editor Mockup" className="w-full h-full object-cover object-top opacity-95"/>
               
               {/* Floating elements to emphasize sales funnel */}
               <div className="absolute -left-8 md:left-8 top-1/4 bg-white p-4 rounded-2xl shadow-2xl border border-outline-variant/30 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant font-bold uppercase">Conversión</p>
                    <p className="text-xl font-black text-on-surface">+ 24.5%</p>
                  </div>
               </div>

               <div className="absolute -right-8 md:right-8 bottom-1/4 bg-white p-4 rounded-2xl shadow-2xl border border-outline-variant/30 flex items-center gap-4 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                  <div className="w-12 h-12 bg-secondary/20 text-secondary rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined">notifications_active</span>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant font-bold uppercase">Nuevo Lead</p>
                    <p className="text-xl font-black text-on-surface">Hace 2 min</p>
                  </div>
               </div>

               <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-80"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5. PROBLEM AGITATION */}
      <section className="py-24 bg-surface relative overflow-hidden border-t border-outline-variant/20">
        <div className="container-max mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-on-surface mb-6 leading-tight">
              La cruda realidad: Tu sitio web actual te está <span className="text-error">costando clientes</span>
            </h2>
            <p className="text-xl text-on-surface-variant font-medium">
              Tener una presencia digital mediocre es peor que no tener ninguna. Si estás lidiando con estos problemas, estás dejando dinero en la mesa:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: "hourglass_empty",
                title: "Lento y Frustrante",
                desc: "Cada segundo extra de carga reduce tus conversiones un 20%. Los usuarios simplemente cierran la pestaña antes de ver lo que ofreces.",
                color: "text-amber-500",
                bg: "bg-amber-500/10"
              },
              {
                icon: "code_off",
                title: "Dependencia Técnica",
                desc: "Tener que rogarle (y pagarle) a un desarrollador para cambiar un simple texto o imagen en tu web retrasa toda tu estrategia de marketing.",
                color: "text-red-500",
                bg: "bg-red-500/10"
              },
              {
                icon: "sentiment_dissatisfied",
                title: "Diseño Anticuado",
                desc: "Una web que parece construida hace 10 años destruye la confianza al instante. Si no te ves premium, no te pagarán como premium.",
                color: "text-slate-500",
                bg: "bg-slate-500/10"
              }
            ].map((pain, i) => (
              <div key={i} className="bg-surface-container border border-outline-variant/30 p-8 rounded-3xl relative overflow-hidden group">
                <div className={`w-14 h-14 ${pain.bg} ${pain.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <span className="material-symbols-outlined text-[32px]">{pain.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-on-surface mb-4">{pain.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{pain.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2.6. HOW IT WORKS */}
      <section className="py-24 bg-inverse-surface text-inverse-on-surface relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="container-max mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">La Solución Definitiva</h2>
            <h3 className="text-4xl lg:text-5xl font-extrabold mb-6">Lanza tu máquina de ventas en 3 simples pasos</h3>
            <p className="text-lg text-surface-variant">Sin frustraciones, sin código, y sin demoras. Diseñado para que te enfoques en lo que importa: vender.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-12 max-w-6xl mx-auto items-center md:items-start text-center md:text-left relative">
            
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-outline-variant/20 to-transparent"></div>

            {[
              {
                step: "01",
                title: "Elige una base ganadora",
                desc: "Selecciona una de nuestras estructuras premium pre-diseñadas y optimizadas para máxima conversión.",
                icon: "dashboard_customize"
              },
              {
                step: "02",
                title: "Personaliza visualmente",
                desc: "Edita textos, colores e imágenes haciendo clic. El editor más intuitivo que has usado en tu vida.",
                icon: "draw"
              },
              {
                step: "03",
                title: "Conecta tu dominio y lanza",
                desc: "Vincula tu propio dominio y presiona publicar. Tu sitio estará en vivo a velocidad extrema en segundos.",
                icon: "rocket_launch"
              }
            ].map((step, i) => (
              <div key={i} className="flex-1 flex flex-col items-center md:items-start relative z-10">
                <div className="w-24 h-24 rounded-full bg-surface-container/10 border border-outline-variant/20 backdrop-blur-md flex items-center justify-center mb-8 shadow-xl text-secondary">
                  <span className="material-symbols-outlined text-[40px]">{step.icon}</span>
                </div>
                <div className="text-secondary font-black text-xl mb-2">{step.step}</div>
                <h4 className="text-2xl font-bold mb-4">{step.title}</h4>
                <p className="text-surface-variant">{step.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-20 flex justify-center">
             <Link href="/register" className="px-10 py-4 rounded-full bg-secondary text-white text-lg font-bold shadow-lg shadow-secondary/30 hover:bg-orange-500 hover:-translate-y-1 transition-all duration-300">
                Crear mi cuenta ahora
             </Link>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE CASOS DE ÉXITO (REAL WEBSITES) */}
      <section id="showcase" className="py-24 bg-surface-container-lowest relative">
        <div className="container-max mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Casos de Éxito</h2>
            <h3 className="text-4xl lg:text-5xl font-bold text-on-surface mb-6">Negocios reales, resultados reales.</h3>
            <p className="text-lg text-on-surface-variant">Mira cómo agencias y creadores están utilizando nuestra plataforma para alojar sitios ultrarrápidos con sus propios dominios personalizados.</p>
          </div>

          <div className="max-w-4xl mx-auto">
            
            {/* Website 1: Rodriplast */}
            <div className="group rounded-3xl overflow-hidden bg-surface-container-low border border-outline-variant/30 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
                <div className="w-[400%] h-[400%] transform scale-25 origin-top-left pointer-events-none transition-transform duration-700 group-hover:scale-[0.26]">
                  <iframe src="https://www.rodriplast.com/" className="w-full h-full border-0 bg-white" tabIndex={-1} scrolling="no" />
                </div>
                
                {/* Simulated browser bar */}
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
                <p className="text-lg text-on-surface-variant leading-relaxed">Un caso de éxito real alojado en nuestra plataforma, con un rendimiento excepcional y diseño adaptado a su marca. Haz clic en el enlace para visitarlo.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FEATURES BENTO BOX */}
      <section id="features" className="py-24 lg:py-32 bg-surface">
        <div className="container-max mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Todo en Uno</h2>
            <h3 className="text-4xl lg:text-5xl font-bold text-on-surface mb-6">El motor de tu crecimiento</h3>
            <p className="text-lg text-on-surface-variant">Reemplaza múltiples herramientas. Aloja, diseña y posiciona en un solo lugar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto auto-rows-[300px]">
            {/* Bento 1: Velocidad */}
            <div className="md:col-span-8 bg-inverse-surface text-inverse-on-surface p-10 rounded-3xl overflow-hidden relative group">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/40 rounded-full blur-[80px] group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <span className="material-symbols-outlined text-5xl text-primary-fixed">bolt</span>
                <div>
                  <h3 className="text-3xl font-bold mb-3">Velocidad que rompe récords</h3>
                  <p className="text-surface-variant max-w-md text-lg">Aloja tus sitios en nuestra infraestructura de borde global (Edge). Carga instantánea que reduce tu tasa de rebote y dispara tus ventas.</p>
                </div>
              </div>
            </div>
            
            {/* Bento 2: Editor */}
            <div className="md:col-span-4 bg-surface-container-high border border-outline-variant/30 p-10 rounded-3xl relative group hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
              <span className="material-symbols-outlined text-5xl text-secondary">drag_click</span>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-on-surface mb-2">Editor Visual Ágil</h3>
                <p className="text-on-surface-variant">Clic, editar, publicar. Sin paneles confusos.</p>
              </div>
            </div>

            {/* Bento 3: SEO */}
            <div className="md:col-span-5 bg-surface-container-highest border border-outline-variant/30 p-10 rounded-3xl relative group hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-tertiary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <span className="material-symbols-outlined text-5xl text-tertiary">analytics</span>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-on-surface mb-2">SEO en Piloto Automático</h3>
                <p className="text-on-surface-variant">Metadatos, sitemaps y OpenGraph generados y optimizados sin tocar una línea.</p>
              </div>
            </div>

            {/* Bento 4: Dominios */}
            <div className="md:col-span-7 bg-surface-container border border-outline-variant/30 p-10 rounded-3xl relative overflow-hidden group hover:shadow-xl transition-all flex flex-col justify-between">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
               <span className="material-symbols-outlined text-5xl text-primary">language</span>
               <div className="relative z-10">
                 <h3 className="text-3xl font-bold text-on-surface mb-3">Conecta tu propio Dominio</h3>
                 <p className="text-on-surface-variant text-lg max-w-sm">Vincula tus sitios a dominios personalizados con certificados SSL gratuitos e ilimitados en cuestión de segundos.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SOCIAL PROOF / TESTIMONIALS */}
      <section id="testimonials" className="py-24 bg-surface-container-lowest border-y border-outline-variant/20 overflow-hidden relative">
        <div className="container-max mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-on-surface mb-16">Amado por agencias y fundadores</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { text: "Migramos todos los clientes de nuestra agencia a esta plataforma. El tiempo de desarrollo pasó de semanas a días. El ROI ha sido increíble.", name: "Carlos M.", role: "CEO, Nexus Agency", rating: 5 },
              { text: "Usé la plantilla L'Art Culinaire para mi restaurante. Mis clientes piensan que pagué miles de dólares por el sitio web.", name: "Sofia T.", role: "Fundadora, Bistro 22", rating: 5 },
              { text: "El hecho de no tener que lidiar con plugins, actualizaciones ni servidores caídos me ha devuelto años de vida. Totalmente recomendado.", name: "Diego R.", role: "Consultor Independiente", rating: 5 }
            ].map((t, i) => (
              <div key={i} className="bg-surface border border-outline-variant/30 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-shadow flex flex-col justify-between">
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
            ))}
          </div>
        </div>
      </section>

      {/* 6. [REMOVED PRICING SECTION] */}

      {/* 7. FAQ (NATIVE ACCORDION) */}
      <section id="faq" className="py-24 bg-surface-container-lowest border-t border-outline-variant/20">
        <div className="container-max mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-on-surface mb-4">Preguntas Frecuentes</h2>
            <p className="text-on-surface-variant">Todo lo que necesitas saber sobre la plataforma.</p>
          </div>
          
          <div className="space-y-4">
            {[
              { q: "¿Necesito saber programar para usar la plataforma?", a: "¡En absoluto! Nuestro editor visual te permite modificar textos, imágenes y colores simplemente haciendo clic. No verás ni una línea de código." },
              { q: "¿Puedo usar mi propio dominio (.com, .es, etc)?", a: "Sí, en los planes Profesionales y Agencia puedes conectar tu propio dominio de forma muy sencilla. Nosotros nos encargamos de generar y renovar los certificados SSL automáticamente." },
              { q: "¿Qué incluyen las plantillas premium?", a: "Incluyen diseños elaborados por expertos en UX/UI, optimizados para dispositivos móviles, y pre-configurados con animaciones, fuentes y paletas de colores exclusivas (ej: Prestige Corp, L'Art Culinaire)." },
              { q: "¿Dónde se alojan los sitios?", a: "Toda la infraestructura está desplegada en servidores de borde global. Esto garantiza que tu sitio web cargue a la velocidad del rayo sin importar desde qué país te visiten." }
            ].map((faq, i) => (
              <details key={i} className="group bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-lg text-on-surface hover:text-primary transition-colors">
                  {faq.q}
                  <span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="px-6 pb-6 text-on-surface-variant leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FOOTER / FINAL CTA */}
      <footer className="bg-inverse-surface text-inverse-on-surface relative overflow-hidden border-t border-outline-variant/10">
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/30 rounded-full blur-[150px] pointer-events-none"></div>
        
        {/* Final CTA Section */}
        <div className="container-max mx-auto px-6 pt-32 pb-20 relative z-10 flex flex-col items-center text-center border-b border-outline-variant/10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="text-xs font-bold text-white uppercase tracking-widest">¿Qué estás esperando?</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-8 leading-tight">
            Es hora de <span className="text-secondary">escalar</span> de verdad.
          </h2>
          <p className="text-xl text-surface-variant max-w-2xl mx-auto mb-12">
            Únete a las agencias y negocios que ya están dominando su industria con sitios web que convierten. Empieza hoy sin riesgo.
          </p>
          
          <Link href="/register" className="px-12 py-5 rounded-full bg-secondary text-white text-xl font-black hover:bg-orange-500 hover:scale-105 transition-all duration-300 shadow-[0_0_50px_rgba(242,146,0,0.4)] hover:shadow-[0_0_80px_rgba(242,146,0,0.7)] mb-6">
            INICIAR MI PRUEBA AHORA
          </Link>
          <div className="flex items-center gap-2 text-surface-variant text-sm font-medium">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            14 días de garantía. Cancela cuando quieras.
          </div>
        </div>
        
        {/* Actual Footer Links */}
        <div className="container-max mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg">
              <Image src="/logo.png" alt="Build Iceberg Agency" width={180} height={60} className="h-12 w-auto object-contain" />
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-surface-variant font-medium">
              <a href="#" className="hover:text-white transition-colors">Soluciones</a>
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Soporte</a>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-surface-variant">
            <p>© {new Date().getFullYear()} Build Iceberg Agency. Todos los derechos reservados.</p>
            <div className="flex gap-4">
               {/* Simulating social icons */}
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
