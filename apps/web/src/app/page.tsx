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
            <Link href="#pricing" className="hidden sm:inline-block px-8 py-3 rounded-full bg-secondary text-white text-sm font-bold shadow-lg shadow-secondary/30 hover:bg-orange-500 hover:shadow-secondary/50 hover:-translate-y-0.5 transition-all duration-300">
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
            <Link href="#pricing" className="w-full sm:w-auto px-12 py-5 rounded-full bg-secondary text-white text-xl font-black shadow-[0_0_40px_rgba(242,146,0,0.4)] hover:bg-orange-500 hover:shadow-[0_0_60px_rgba(242,146,0,0.6)] hover:-translate-y-1 transition-all duration-300">
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

      {/* 3. SHOWCASE PLANTILLAS (NEW) */}
      <section id="templates" className="py-24 bg-surface-container-lowest relative">
        <div className="container-max mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Catálogo Premium</h2>
            <h3 className="text-4xl lg:text-5xl font-bold text-on-surface mb-6">No empieces de cero. Empieza desde la cima.</h3>
            <p className="text-lg text-on-surface-variant">Nuestras plantillas están diseñadas por expertos para dominar tu industria. 100% editables y optimizadas para máxima conversión.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
            
            {/* Template 1: Prestige Corp */}
            <div className="group rounded-3xl overflow-hidden bg-surface-container-low border border-outline-variant/30 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCU29CaMpcauBw66zIT8_U_NX3lcijaYGO0uHF4Y7L1bxjR3bB0dOuZ_dE3_tvNHxso_x3FNNGGl9s7-XXyaW7r25GO72k5lX0P4QNjfL6zz1FYJolmuh0_6jPhH8LHNtOmvOIY8-rtTtZaWJFI8CA5wqZ6EQyd1jjp2toWimTmroPGQLj5veYNPVzYn-ZAyaHlc8jKlY5w-HdWXg11E0QKAUlbwOBKTv83HwdPv3yphWI3uKLLrTXKhA" alt="Prestige Corp" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                  <Link href="/register" className="px-6 py-3 bg-white text-slate-900 font-bold rounded-full hover:scale-105 transition-transform">Usar Plantilla</Link>
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-2xl font-bold text-on-surface">Prestige Corp</h4>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">B2B / Agencias</span>
                </div>
                <p className="text-on-surface-variant">Diseño corporativo pulido para firmas de consultoría y servicios profesionales de alto nivel.</p>
              </div>
            </div>

            {/* Template 2: L'Art Culinaire */}
            <div className="group rounded-3xl overflow-hidden bg-surface-container-low border border-outline-variant/30 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKkbNAS1pmw-xX2Yc1tR1b4GxAm6GZEw-D9FN5eJJm_OXRWaNNOmPe_9tdV8rWXyP9eqLsba21xYMSkWVzICYNUkwoSfyPOxQCgZq0mgfnTcFZ0km3_U_KxaTaiysb-2JlCAONFc9m-O4UoooR5gXLD-0N5okvuCQOq62MwO2lLR7EhilhaDcPnpg2fMKaZV25P2OUv1MyvbvUf6MjsUtRpXWBMqr3wiCuKHFFngv0fYZ9030stExg" alt="L'Art Culinaire" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                  <Link href="/register" className="px-6 py-3 bg-white text-slate-900 font-bold rounded-full hover:scale-105 transition-transform">Usar Plantilla</Link>
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-2xl font-bold text-on-surface">L&apos;Art Culinaire</h4>
                  <span className="px-3 py-1 bg-tertiary/10 text-tertiary text-xs font-bold rounded-full">Gastronomía</span>
                </div>
                <p className="text-on-surface-variant">Estética elegante y oscura para restaurantes finos, chefs y marcas boutique.</p>
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

      {/* 6. PRICING */}
      <section id="pricing" className="py-24 lg:py-32 bg-surface">
        <div className="container-max mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Planes Claros</h2>
            <h3 className="text-4xl lg:text-5xl font-bold text-on-surface mb-6">Precios que escalan contigo</h3>
            <p className="text-lg text-on-surface-variant">Sin letras pequeñas. Actualiza o cancela cuando quieras.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {/* Plan Gratis */}
            <div className="bg-surface-container border border-outline-variant/30 rounded-3xl p-8 lg:p-10 shadow-sm">
              <h3 className="text-2xl font-bold text-on-surface mb-2">Starter</h3>
              <p className="text-on-surface-variant h-12">Para proyectos personales y pruebas.</p>
              <div className="my-8">
                <span className="text-5xl font-extrabold text-on-surface">$0</span>
                <span className="text-on-surface-variant font-medium">/mes</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary text-[20px]">check_circle</span> 1 Sitio Web</li>
                <li className="flex items-start gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary text-[20px]">check_circle</span> Subdominio gratuito</li>
                <li className="flex items-start gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary text-[20px]">check_circle</span> Acceso a plantillas básicas</li>
                <li className="flex items-start gap-3 text-on-surface-variant opacity-50"><span className="material-symbols-outlined text-[20px]">cancel</span> Dominio personalizado</li>
              </ul>
              <Link href="/register" className="block w-full py-4 text-center rounded-xl bg-surface text-on-surface font-bold border border-outline-variant hover:bg-surface-container-high transition-colors">
                Empezar Gratis
              </Link>
            </div>

            {/* Plan Pro (Destacado) */}
            <div className="bg-inverse-surface text-inverse-on-surface rounded-3xl p-8 lg:p-10 shadow-2xl relative transform md:-translate-y-4 border border-primary/30">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-secondary text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">Más Popular</div>
              <h3 className="text-2xl font-bold mb-2">Profesional</h3>
              <p className="text-surface-variant h-12">Para negocios y emprendedores serios.</p>
              <div className="my-8">
                <span className="text-5xl font-extrabold">$15</span>
                <span className="text-surface-variant font-medium">/mes</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary-fixed text-[20px]">check_circle</span> Hasta 3 Sitios Web</li>
                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary-fixed text-[20px]">check_circle</span> Dominios Personalizados (SSL)</li>
                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary-fixed text-[20px]">check_circle</span> Acceso a Plantillas Premium</li>
                <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary-fixed text-[20px]">check_circle</span> SEO Avanzado y Analíticas</li>
              </ul>
              <Link href="/register?plan=pro" className="block w-full py-4 text-center rounded-xl bg-primary-fixed text-on-primary-fixed font-bold hover:bg-white transition-colors shadow-lg shadow-primary-fixed/20">
                Comenzar con Pro
              </Link>
            </div>

            {/* Plan Agencia */}
            <div className="bg-surface-container border border-outline-variant/30 rounded-3xl p-8 lg:p-10 shadow-sm">
              <h3 className="text-2xl font-bold text-on-surface mb-2">Agencia</h3>
              <p className="text-on-surface-variant h-12">Para creadores escalando sus servicios.</p>
              <div className="my-8">
                <span className="text-5xl font-extrabold text-on-surface">$49</span>
                <span className="text-on-surface-variant font-medium">/mes</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary text-[20px]">check_circle</span> Sitios Web Ilimitados</li>
                <li className="flex items-start gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary text-[20px]">check_circle</span> Dominios Ilimitados</li>
                <li className="flex items-start gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary text-[20px]">check_circle</span> Marca blanca (Quitar logo)</li>
                <li className="flex items-start gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary text-[20px]">check_circle</span> Soporte Prioritario 24/7</li>
              </ul>
              <Link href="/register?plan=agency" className="block w-full py-4 text-center rounded-xl bg-surface text-on-surface font-bold border border-outline-variant hover:bg-surface-container-high transition-colors">
                Contactar Ventas
              </Link>
            </div>
          </div>
        </div>
      </section>

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
      <footer className="bg-inverse-surface text-inverse-on-surface py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="container-max mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <h2 className="text-4xl font-bold mb-8">¿Listo para transformar tu presencia web?</h2>
          <Link href="/register" className="px-10 py-5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-xl hover:bg-white hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(223,224,255,0.2)] mb-16">
            Crear cuenta gratuita
          </Link>
          
          <div className="w-full h-px bg-outline-variant/20 mb-12"></div>
          
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-2xl flex items-center justify-center">
                <Image src="/logo.png" alt="Build Iceberg Agency" width={180} height={60} className="h-12 w-auto object-contain" />
              </div>
            </div>
            <div className="text-sm text-surface-variant flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Contacto</a>
            </div>
            <p className="text-sm text-surface-variant">© 2026 Build Iceberg Agency. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
