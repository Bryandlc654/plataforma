"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { HiOutlineCheck, HiOutlineX, HiOutlineDesktopComputer, HiOutlineSparkles, HiOutlineTemplate } from "react-icons/hi";
import Link from "next/link";

interface Category { id: string; name: string; slug: string; }
interface Template { id: string; name: string; description?: string | null; thumbnail?: string | null; category: Category | null; _count: { pages: number }; }

export default function NewSitePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Form State
  const [siteName, setSiteName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreationProgress, setShowCreationProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchData();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const fetchData = async () => {
    try {
      const [tplRes, catRes]: any = await Promise.all([
        api.get("/templates"),
        api.get("/templates/categories").catch(() => ({ data: [] }))
      ]);
      setTemplates(tplRes.data || tplRes);
      setCategories(catRes.data || catRes);
    } catch {}
  };

  const handleCreate = async () => {
    if (!siteName.trim()) { setError("Ingresa un nombre para tu sitio"); return; }
    setLoading(true); setError("");
    try {
      const body: any = { name: siteName, templateId: selectedTemplate ? selectedTemplate.id : undefined };
      if (subdomain.trim()) body.subdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").substring(0, 63);
      
      const res: any = await api.post("/sites", body);
      const site = res.data || res;
      
      setShowCreationProgress(true);
      setProgress(0);

      const duration = 4500;
      const interval = 50;
      const steps = duration / interval;
      let step = 0;
      timerRef.current = setInterval(() => {
        step++;
        setProgress(Math.min(100, Math.round((step / steps) * 100)));
        if (step >= steps) {
          if (timerRef.current) clearInterval(timerRef.current);
          router.push(`/dashboard/sites/${site.id}`);
        }
      }, interval);
    } catch (err: any) { 
      setError(err.response?.data?.message || "Error al crear el sitio"); 
      setLoading(false); 
    }
  };

  const filteredTemplates = activeCategory === "all" ? templates : templates.filter(t => t.category?.id === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8 text-center sticky top-0 z-30 shadow-sm">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
          Elige el diseño ideal para tu proyecto
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
          Comienza con una plantilla premium optimizada para conversión.
        </p>
        
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
          <button onClick={() => setActiveCategory("all")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === "all" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"}`}>
            Todas
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === cat.id ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Premium Templates */}
          {filteredTemplates.map(t => (
            <div key={t.id} className="group relative rounded-3xl bg-white border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 hover:border-primary-200 transition-all duration-300 cursor-pointer flex flex-col" onClick={() => setSelectedTemplate(t)}>
              <div className="aspect-[4/3] bg-slate-100 relative border-b border-slate-100 overflow-hidden">
                {t.thumbnail ? (
                  <div className="absolute inset-0 bg-cover bg-top transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${t.thumbnail})` }} />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                    <HiOutlineTemplate className="h-12 w-12 text-primary-300" />
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                   <span className="bg-white text-slate-900 font-bold px-6 py-2.5 rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                     Usar esta plantilla
                   </span>
                </div>
                {/* Category Badge */}
                {t.category && (
                  <div className="absolute top-4 left-4 z-20">
                    <span className="bg-white/90 backdrop-blur-md text-slate-700 font-semibold px-3 py-1 rounded-full text-xs shadow-sm border border-white/50">
                      {t.category.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t.name}</h3>
                <p className="text-sm text-slate-500 flex-1 line-clamp-2">{t.description || "Diseño profesional listo para usar."}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1"><HiOutlineDesktopComputer className="h-3.5 w-3.5"/> {t._count?.pages || 0} PÁGINAS</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(`/templates/${t.id}`, '_blank'); }}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                  >
                    Ver plantilla &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SETUP MODAL */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 sm:p-8 text-center relative border-b border-slate-100 bg-slate-50/50">
              {!showCreationProgress && (
                <button onClick={() => { setSelectedTemplate(null); setError(""); }} className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <HiOutlineX className="h-5 w-5" />
                </button>
              )}
              <h2 className="text-2xl font-extrabold text-slate-900">
                {showCreationProgress ? "Construyendo tu sitio" : "Configura tu sitio"}
              </h2>
              <p className="text-slate-500 mt-2 text-sm">
                {showCreationProgress ? "Generando bloques y aplicando diseño..." : `Plantilla seleccionada: ${selectedTemplate?.name}`}
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {showCreationProgress ? (
                 <div className="text-center py-6">
                 {/* Animated icon */}
                 <div className="relative mx-auto mb-8 h-32 w-32">
                   <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                   <svg className="absolute inset-0 h-32 w-32 -rotate-90" viewBox="0 0 128 128">
                     <circle cx="64" cy="64" r="60" fill="none" stroke="#0ea5e9" strokeWidth="6" strokeLinecap="round"
                       strokeDasharray={`${(progress / 100) * 377} 377`}
                       className="transition-all duration-200 ease-linear" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-2xl font-bold text-sky-600">{progress}%</span>
                   </div>
                 </div>
                 
                 {/* Steps */}
                 <div className="space-y-3 text-left max-w-xs mx-auto">
                   {[
                     { label: "Configurando servidor", pct: 20 },
                     { label: "Generando páginas y bloques", pct: 50 },
                     { label: "Aplicando estética", pct: 75 },
                     { label: "Finalizando", pct: 100 },
                   ].map((step, i) => (
                     <div key={i} className="flex items-center gap-3">
                       <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${progress >= step.pct ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-300"}`}>
                         {progress >= step.pct ? (
                           <HiOutlineCheck className="h-3.5 w-3.5" />
                         ) : (
                           <span className="text-[10px] font-bold">{i + 1}</span>
                         )}
                       </div>
                       <span className={`text-sm transition-colors ${progress >= step.pct ? "text-slate-800 font-semibold" : "text-slate-400"}`}>{step.label}</span>
                     </div>
                   ))}
                 </div>
               </div>
              ) : (
                <div className="space-y-6">
                  {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 border border-red-200 flex items-start gap-2"><HiOutlineX className="h-5 w-5 flex-shrink-0"/>{error}</div>}
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del proyecto <span className="text-red-400">*</span></label>
                    <input 
                      className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium placeholder:font-normal placeholder:text-slate-400" 
                      placeholder="Ej: Mi Empresa Inc." 
                      value={siteName} 
                      onChange={e => setSiteName(e.target.value)} 
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Subdominio (Opcional)</label>
                    <div className="flex items-center">
                      <input 
                        className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-l-xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all border-r-0 font-medium placeholder:font-normal placeholder:text-slate-400" 
                        placeholder="mi-empresa" 
                        value={subdomain} 
                        onChange={e => setSubdomain(e.target.value)} 
                      />
                      <div className="bg-slate-50 border border-slate-300 border-l-0 rounded-r-xl px-4 py-3 text-sm text-slate-500 font-medium whitespace-nowrap">
                        .plataforma.com
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Déjalo vacío para generar uno automáticamente.</p>
                  </div>
  
                  <div className="pt-6 border-t border-slate-100 flex gap-3">
                    <button onClick={() => setSelectedTemplate(null)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                      Volver
                    </button>
                    <button onClick={handleCreate} disabled={loading} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all">
                      {loading ? "Preparando..." : "Crear Sitio Web"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
