"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { HiOutlineCheck, HiOutlineX, HiOutlineDesktopComputer, HiOutlineTemplate } from "react-icons/hi";

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

  const chipClass = (active: boolean) =>
    `px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
      active
        ? "bg-[var(--color-secondary)] text-[var(--color-primary)] shadow-sm"
        : "bg-white text-[#616161] border border-[#e3e3e3] hover:border-[rgba(var(--color-primary-rgb),0.25)] hover:text-[var(--color-primary)]"
    }`;

  return (
    <div className="min-h-full bg-[#f6f6f8] pb-20">
      {/* Hero */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-[#e6e4ef] bg-white p-7 text-center shadow-sm sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[rgba(var(--color-secondary-rgb),0.1)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-[rgba(var(--color-primary-rgb),0.1)] blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(var(--color-primary-rgb),0.05)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-secondary)]" />
              Paso 1 de 3 · Elige tu plantilla
            </span>
            <h1 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight text-[#1f1f1f] sm:text-[36px]">
              Elige el diseño ideal para tu proyecto
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[#616161]">
              Comienza con una plantilla premium optimizada para conversión.
            </p>

            {/* Category Filters */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <button onClick={() => setActiveCategory("all")} className={chipClass(activeCategory === "all")}>
                Todas
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={chipClass(activeCategory === cat.id)}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Grid */}
      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(t => (
            <div
              key={t.id}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--color-primary-rgb),0.2)] hover:shadow-lg"
              onClick={() => setSelectedTemplate(t)}
            >
              <div className="relative aspect-[4/3] overflow-hidden border-b border-[#ececec] bg-[#f6f6f7]">
                {t.thumbnail ? (
                  <div className="absolute inset-0 bg-cover bg-top transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${t.thumbnail})` }} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-800)]">
                    <HiOutlineTemplate className="h-12 w-12 text-white/40" />
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-[rgba(var(--color-primary-rgb),0.45)] opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                  <span className="translate-y-4 transform rounded-full bg-[var(--color-secondary)] px-6 py-2.5 font-semibold text-[var(--color-primary)] shadow-lg transition-all duration-300 group-hover:translate-y-0">
                    Usar esta plantilla
                  </span>
                </div>
                {/* Category Badge */}
                {t.category && (
                  <div className="absolute left-4 top-4 z-20">
                    <span className="rounded-full border border-white/50 bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--color-primary)] shadow-sm backdrop-blur-md">
                      {t.category.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-[16px] font-semibold text-[#1f1f1f]">{t.name}</h3>
                <p className="mt-1.5 flex-1 line-clamp-2 text-[13px] leading-relaxed text-[#616161]">
                  {t.description || "Diseño profesional listo para usar."}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-[#efeff2] pt-4">
                  <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                    <HiOutlineDesktopComputer className="h-3.5 w-3.5" /> {t._count?.pages || 0} páginas
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); window.open(`/templates/${t.id}`, '_blank'); }}
                    className="text-[12px] font-semibold text-[var(--brand-secondary-text)] transition-colors hover:text-[var(--color-primary)]"
                  >
                    Ver plantilla →
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-[#d9d9e2] bg-white p-10 text-center">
              <p className="text-[15px] font-semibold text-[#303030]">No hay plantillas en esta categoría</p>
              <p className="mt-1 text-sm text-[#8a8a8a]">Prueba con otra categoría o mira todas las plantillas disponibles.</p>
              <button
                onClick={() => setActiveCategory("all")}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-5 py-2.5 text-[13px] font-semibold text-[var(--color-primary)] transition hover:bg-[var(--brand-secondary-hover)]"
              >
                Ver todas las plantillas
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SETUP MODAL */}
      {selectedTemplate && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[rgba(var(--color-primary-rgb),0.5)] p-4 backdrop-blur-sm"
          onClick={() => { if (!showCreationProgress) { setSelectedTemplate(null); setError(""); } }}
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="relative overflow-hidden bg-[var(--color-primary)] p-6 text-center text-white sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[rgba(var(--color-secondary-rgb),0.25)] blur-3xl" />
              <div className="relative">
                {!showCreationProgress && (
                  <button
                    onClick={() => { setSelectedTemplate(null); setError(""); }}
                    aria-label="Cerrar"
                    className="absolute -right-2 -top-2 p-2 text-white/60 transition-colors hover:text-white"
                  >
                    <HiOutlineX className="h-5 w-5" />
                  </button>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-secondary)]" />
                  {showCreationProgress ? "Creando tu sitio" : "Paso 2 de 3"}
                </span>
                <h2 className="mt-3 text-2xl font-semibold leading-tight">
                  {showCreationProgress ? "Construyendo tu sitio" : "Configura tu sitio"}
                </h2>
                <p className="mt-1.5 text-sm text-white/60">
                  {showCreationProgress ? "Generando bloques y aplicando diseño..." : `Plantilla seleccionada: ${selectedTemplate?.name}`}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {showCreationProgress ? (
                <div className="py-6 text-center">
                  {/* Animated icon */}
                  <div className="relative mx-auto mb-8 h-32 w-32">
                    <div className="absolute inset-0 rounded-full border-4 border-[#efeff3]" />
                    <svg className="absolute inset-0 h-32 w-32 -rotate-90" viewBox="0 0 128 128">
                      <circle cx="64" cy="64" r="60" fill="none" stroke="var(--color-secondary)" strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${(progress / 100) * 377} 377`}
                        className="transition-all duration-200 ease-linear" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-[var(--color-primary)]">{progress}%</span>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="mx-auto max-w-xs space-y-3 text-left">
                    {[
                      { label: "Configurando servidor", pct: 20 },
                      { label: "Generando páginas y bloques", pct: 50 },
                      { label: "Aplicando estética", pct: 75 },
                      { label: "Finalizando", pct: 100 },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors ${progress >= step.pct ? "bg-[var(--color-secondary)] text-[var(--color-primary)]" : "bg-[#f1f1f4] text-[#b9b9c3]"}`}>
                          {progress >= step.pct ? (
                            <HiOutlineCheck className="h-3.5 w-3.5" />
                          ) : (
                            <span className="text-[10px] font-bold">{i + 1}</span>
                          )}
                        </div>
                        <span className={`text-sm transition-colors ${progress >= step.pct ? "font-semibold text-[#303030]" : "text-[#9a9aa5]"}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {error && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><HiOutlineX className="h-5 w-5 flex-shrink-0" />{error}</div>}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#303030]">Nombre del proyecto <span className="text-[var(--color-secondary)]">*</span></label>
                    <input
                      className="w-full rounded-xl border border-[#d9d9e2] bg-white px-4 py-3 text-sm font-medium text-[#303030] transition-all placeholder:font-normal placeholder:text-[#9a9aa5] focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[rgba(var(--color-primary-rgb),0.1)]"
                      placeholder="Ej: Mi Empresa Inc."
                      value={siteName}
                      onChange={e => setSiteName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#303030]">Subdominio (Opcional)</label>
                    <div className="flex items-center">
                      <input
                        className="w-full rounded-l-xl border border-r-0 border-[#d9d9e2] bg-white px-4 py-3 text-sm font-medium text-[#303030] transition-all placeholder:font-normal placeholder:text-[#9a9aa5] focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[rgba(var(--color-primary-rgb),0.1)]"
                        placeholder="mi-empresa"
                        value={subdomain}
                        onChange={e => setSubdomain(e.target.value)}
                      />
                      <div className="whitespace-nowrap rounded-r-xl border border-l-0 border-[#d9d9e2] bg-[#f7f7f9] px-4 py-3 text-sm font-medium text-[#616161]">
                        .plataforma.com
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[#8a8a8a]">Déjalo vacío para generar uno automáticamente.</p>
                  </div>

                  <div className="flex gap-3 border-t border-[#efeff2] pt-6">
                    <button onClick={() => setSelectedTemplate(null)} className="flex-1 rounded-xl border border-[#e3e3e3] bg-white px-4 py-3 text-sm font-semibold text-[#616161] transition-colors hover:bg-[#f7f7f9]">
                      Volver
                    </button>
                    <button onClick={handleCreate} disabled={loading} className="flex-1 rounded-xl bg-[var(--color-secondary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] shadow-sm transition-all hover:bg-[var(--brand-secondary-hover)] disabled:cursor-not-allowed disabled:opacity-50">
                      {loading ? "Preparando..." : "Crear sitio web"}
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
