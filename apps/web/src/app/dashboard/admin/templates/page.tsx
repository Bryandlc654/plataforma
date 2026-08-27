"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { AppIcon } from "@/components/ui/app-icon";
import { BlockRenderer } from "@/components/blocks/renderers/block-renderer";

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail?: string | null;
  isActive: boolean;
  isPremium: boolean;
  tags: string[] | null;
  category: { id: string; name: string; slug: string } | null;
  _count: { pages: number; sites: number };
  createdAt: string;
}
interface Category { id: string; name: string; slug: string; }

const blockMeta: Record<string, { icon: string; color: string; label: string }> = {
  hero: { icon: "home", color: "bg-blue-500", label: "Hero" },
  services: { icon: "sites", color: "bg-emerald-500", label: "Servicios" },
  stats: { icon: "dashboard", color: "bg-indigo-500", label: "Stats" },
  portfolio: { icon: "media", color: "bg-fuchsia-500", label: "Portafolio" },
  faq: { icon: "support", color: "bg-amber-500", label: "FAQ" },
  cta: { icon: "automations", color: "bg-purple-500", label: "CTA" },
  testimonials: { icon: "leads", color: "bg-rose-500", label: "Testimonios" },
  gallery: { icon: "media", color: "bg-cyan-500", label: "Galería" },
  header: { icon: "admintenants", color: "bg-slate-600", label: "Header" },
  footer: { icon: "bookings", color: "bg-slate-800", label: "Footer" },
};

const catColors: Record<string, string> = {
  restaurantes: "bg-rose-500",
  "salud-y-belleza": "bg-pink-500",
  negocios: "bg-indigo-500",
  "landing-pages": "bg-slate-500",
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("");
  const [selected, setSelected] = useState<Template | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [previewTab, setPreviewTab] = useState<"web" | "structure">("web");
  const [previewPageId, setPreviewPageId] = useState("");
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [edit, setEdit] = useState({ id: "", name: "", description: "", categoryId: "", tags: "", thumbnail: "", isPremium: false, isActive: true });
  const [diversifyLoading, setDiversifyLoading] = useState(false);
  const [portfolioPresetLoading, setPortfolioPresetLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params: any = {}; if (selectedCat) params.categoryId = selectedCat;
      const [tRes, cRes]: any[] = await Promise.all([api.get("/templates/admin/all", { params }), api.get("/templates/categories")]);
      setTemplates(tRes.data || tRes); setCategories(cRes.data || cRes);
    } catch {} finally { setLoading(false); }
  }, [selectedCat]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (toast) setTimeout(() => setToast(null), 2500); }, [toast]);
  useEffect(() => {
    if (!preview?.pages?.length) return;
    const ids = new Set(preview.pages.map((p: any) => p.id));
    if (previewPageId && ids.has(previewPageId)) return;
    const defaultPage = preview.pages.find((p: any) => p.isDefault) || preview.pages[0];
    if (defaultPage?.id) setPreviewPageId(defaultPage.id);
  }, [preview, previewPageId]);

  const fetchPreview = async (id: string) => { try { const res = await api.get(`/templates/admin/${id}`); setPreview(res.data || res); } catch { setPreview(null); } };
  const createCategory = async () => { if (!newCatName.trim()) return; try { await api.post("/templates/categories", { name: newCatName }); setShowCategoryModal(false); setNewCatName(""); setToast("Categoría creada"); fetchData(); } catch (e: any) { alert(e.response?.data?.message || "Error"); } };
  const toggleTemplate = async (id: string, active: boolean) => {
    try {
      await api.put(`/templates/${id}`, { isActive: !active });
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || "Error");
    }
  };

  const openEdit = (t: Template) => {
    setEdit({
      id: t.id,
      name: t.name || "",
      description: t.description || "",
      categoryId: t.category?.id || "",
      tags: Array.isArray(t.tags) ? t.tags.join(", ") : "",
      thumbnail: t.thumbnail || "",
      isPremium: Boolean(t.isPremium),
      isActive: Boolean(t.isActive),
    });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!edit.name.trim()) return;
    const tags = edit.tags
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    try {
      await api.put(`/templates/${edit.id}`, {
        name: edit.name.trim(),
        description: edit.description.trim() || null,
        categoryId: edit.categoryId || null,
        tags,
        thumbnail: edit.thumbnail.trim() || null,
        isPremium: edit.isPremium,
        isActive: edit.isActive,
      });
      setShowEditModal(false);
      setToast("Plantilla actualizada");
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || "Error");
    }
  };

  const diversifyAll = async () => {
    setDiversifyLoading(true);
    try {
      const res: any = await api.post("/templates/admin/diversify");
      const r = res.data || res;
      setToast(`Plantillas actualizadas: ${r.updated || 0}/${r.total || 0}`);
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || "Error");
    } finally {
      setDiversifyLoading(false);
    }
  };

  const applyPortfolioPreset = async () => {
    if (!selected) return;
    setPortfolioPresetLoading(true);
    try {
      await api.post(`/templates/admin/${selected.id}/presets/portfolio-creativo`);
      setToast("Plantilla Portafolio Creativo actualizada");
      fetchData();
      fetchPreview(selected.id);
    } catch (e: any) {
      alert(e.response?.data?.message || "Error");
    } finally {
      setPortfolioPresetLoading(false);
    }
  };

  const filtered = search ? templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())) : templates;
  const stats = { total: templates.length, active: templates.filter(t => t.isActive).length, premium: templates.filter(t => t.isPremium).length, categories: categories.length };

  const previewPages: any[] = preview?.pages || [];
  const activePreviewPage =
    previewPages.find((p) => p.id === previewPageId) ||
    previewPages.find((p) => p.isDefault) ||
    previewPages[0] ||
    null;
  const previewScale = 0.62;

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><p className="text-sm text-slate-500">Cargando plantillas...</p></div></div>;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-slide-down">{toast}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Plantillas</h1><p className="text-sm text-slate-500 mt-1">{stats.total} plantillas en {stats.categories} categorías</p></div>
        <div className="flex gap-2">
          <div className="relative"><svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><input className="pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-48" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button onClick={diversifyAll} disabled={diversifyLoading} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition-colors shadow-sm">
            {diversifyLoading ? "Actualizando..." : "Hacer distintas"}
          </button>
          <button onClick={() => setShowCategoryModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Nueva categoría</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[{ label: "Total", value: stats.total, icon: "📋", color: "border-l-primary-500" }, { label: "Activas", value: stats.active, icon: "✅", color: "border-l-green-500" }, { label: "Premium", value: stats.premium, icon: "⭐", color: "border-l-amber-500" }, { label: "Categorías", value: stats.categories, icon: "📁", color: "border-l-purple-500" }].map(s => (
          <div key={s.label} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${s.color} p-4`}><p className="text-xs font-medium text-slate-500 uppercase">{s.label}</p><p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p></div>
        ))}
      </div>

      {showCategoryModal && <div className="fixed inset-0 z-50 flex items-center justify-center px-4"><div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)}/><div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"><h3 className="text-lg font-semibold text-slate-900 mb-4">Nueva categoría</h3><input className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ej: Restaurantes" value={newCatName} onChange={e => setNewCatName(e.target.value)} autoFocus/><div className="flex gap-3 mt-4"><button onClick={() => setShowCategoryModal(false)} className="flex-1 btn-secondary text-sm">Cancelar</button><button onClick={createCategory} className="flex-1 btn-primary text-sm">Crear</button></div></div></div>}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setSelectedCat("")} className={`rounded-full px-4 py-2 text-xs font-medium border whitespace-nowrap transition-all ${!selectedCat ? "bg-primary-50 text-primary-700 border-primary-200" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>Todas</button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`rounded-full px-4 py-2 text-xs font-medium border whitespace-nowrap transition-all ${selectedCat === c.id ? "bg-primary-50 text-primary-700 border-primary-200" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
          >
            <span className={`inline-block h-2 w-2 rounded-full mr-2 align-middle ${catColors[c.slug] || "bg-slate-400"}`} />
            {c.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6">
            <svg className="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">{search ? "Sin resultados" : "Sin plantillas"}</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">{search ? `No se encontraron plantillas para "${search}"` : "Crea sitios desde el editor y guárdalos como plantillas reutilizables"}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(t => (
            <div key={t.id} className="group bg-white rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              {/* Preview */}
              <div className="h-44 sm:h-48 relative overflow-hidden cursor-pointer" onClick={() => { setSelected(t); setPreviewTab("web"); setPreviewPageId(""); setFullPreviewOpen(false); fetchPreview(t.id); }}>
                {t.thumbnail ? (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${t.thumbnail})` }} />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
                    <div className="absolute inset-0 flex flex-col gap-1 p-3">
                      <div className="flex items-center gap-1.5 mb-2"><div className="h-2 w-2 rounded-full bg-red-400" /><div className="h-2 w-2 rounded-full bg-amber-400" /><div className="h-2 w-2 rounded-full bg-green-400" /></div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="h-6 w-3/4 rounded bg-primary-500/20" />
                        <div className="h-3 w-1/2 rounded bg-slate-300/40" />
                        <div className="h-3 w-1/3 rounded bg-slate-200/40" />
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {Array.from({ length: Math.min(4, t._count?.pages || 0) }).map((_, i) => (
                          <div key={i} className={`h-1.5 rounded-full ${i === 0 ? "w-8 bg-primary-400/60" : "w-4 bg-slate-200/60"}`} />
                        ))}
                      </div>
                      <div className="flex gap-1.5 mt-auto">
                        {[0, 1, 2].map(i => <div key={i} className="flex-1 h-10 rounded bg-slate-100/80" />)}
                      </div>
                    </div>
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" />
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {t.isPremium && <span className="rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide">PREMIUM</span>}
                  {!t.isActive && <span className="rounded-full bg-red-50 text-red-600 px-2.5 py-0.5 text-[10px] font-medium">Inactiva</span>}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm text-slate-900">{t.name}</h3>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3 min-h-[2rem]">{t.description || "Sin descripción"}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3">
                  <span className="flex items-center gap-1"><svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>{t._count?.pages || 0} págs</span>
                  {t._count?.sites > 0 && <span className="flex items-center gap-1"><svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>{t._count.sites} usos</span>}
                  {t.category && <span className="bg-slate-100 rounded-full px-2 py-0.5 text-[10px] font-medium">{t.category.name}</span>}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-auto">
                  <button onClick={() => { setSelected(t); fetchPreview(t.id); }} className="flex-1 text-xs font-semibold text-primary-600 hover:text-primary-700 py-2 rounded-lg hover:bg-primary-50 transition-all">Vista previa</button>
                  <button onClick={() => openEdit(t)} className="text-xs font-semibold text-slate-600 hover:text-slate-800 py-2 px-3 rounded-lg hover:bg-slate-100 transition-all">Editar</button>
                  <button onClick={() => toggleTemplate(t.id, t.isActive)} className={`text-xs font-semibold py-2 px-3 rounded-lg transition-all ${t.isActive ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}`}>{t.isActive ? "Desactivar" : "Activar"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selected && <>
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => { setSelected(null); setPreview(null); }} />
        <div className="fixed inset-0 z-50 flex lg:justify-end lg:items-stretch items-end justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm hidden lg:block" onClick={() => { setSelected(null); setPreview(null); }} />
          <div className="relative bg-white shadow-2xl overflow-y-auto rounded-t-2xl lg:rounded-none w-full lg:max-w-lg max-h-[85vh] lg:max-h-full animate-slide-up lg:animate-slide-left">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10"><h3 className="font-semibold text-slate-900 truncate">{selected.name}</h3><button onClick={() => { setSelected(null); setPreview(null); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button></div>
            <div className="p-6 space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${selected.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{selected.isActive ? "Activa" : "Inactiva"}</span>
                  {selected.isPremium && <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-semibold">Premium</span>}
                  {selected.category && <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-xs font-medium">{selected.category.name}</span>}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400"><span>📄 {selected._count?.pages || 0} páginas</span><span>🚀 {selected._count?.sites || 0} sitios creados</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(selected)} className="flex-1 btn-secondary text-sm">Editar</button>
                <button onClick={() => toggleTemplate(selected.id, selected.isActive)} className="flex-1 btn-primary text-sm">{selected.isActive ? "Desactivar" : "Activar"}</button>
              </div>
              {(selected.name || "").toLowerCase().includes("portafolio creativo") && (
                <button
                  onClick={applyPortfolioPreset}
                  disabled={portfolioPresetLoading}
                  className="w-full rounded-xl bg-slate-900 text-white text-sm font-semibold py-2.5 hover:bg-slate-800 disabled:opacity-60 transition-colors"
                >
                  {portfolioPresetLoading ? "Aplicando mejoras..." : "Mejorar Portafolio Creativo"}
                </button>
              )}
              <hr className="border-slate-100" />
              {preview?.pages && (
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1">
                      <button onClick={() => setPreviewTab("web")} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${previewTab === "web" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Vista web</button>
                      <button onClick={() => setPreviewTab("structure")} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${previewTab === "structure" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Estructura</button>
                    </div>
                    {previewTab === "web" && (
                      <button onClick={() => setFullPreviewOpen(true)} className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                        Abrir grande
                      </button>
                    )}
                  </div>

                  {previewTab === "web" ? (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
                        <div className="text-xs font-semibold text-slate-600">Página</div>
                        <select className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20" value={previewPageId} onChange={(e) => setPreviewPageId(e.target.value)}>
                          {previewPages.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.isDefault ? "Home" : p.name} · {p.path}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div
                        className="bg-slate-100 p-4"
                        onClickCapture={(e) => {
                          const el = e.target as HTMLElement | null;
                          if (el?.closest("a")) e.preventDefault();
                        }}
                      >
                        <div className="mx-auto rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
                          <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: `${100 / previewScale}%` }}>
                            {activePreviewPage?.blocks?.map((b: any) => (
                              <BlockRenderer key={b.id} type={b.type} content={b.content} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Páginas ({preview.pages.length})</p>
                      <div className="space-y-3">
                        {preview.pages.map((p: any, i: number) => (
                          <div key={i} className="rounded-xl border border-slate-200 p-4 hover:border-primary-200 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                              {p.isDefault && <span className="rounded-md bg-primary-100 text-primary-700 px-2 py-0.5 text-[10px] font-semibold uppercase">Home</span>}
                              <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                              <span className="text-xs text-slate-400 font-mono">{p.path}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {p.blocks?.map((b: any, j: number) => {
                                const meta = blockMeta[b.type] || { color: "bg-slate-400", label: b.type, icon: "home" };
                                return (
                                  <span key={j} className={`inline-flex items-center gap-1.5 ${meta.color} text-white rounded-lg px-2.5 py-1 text-[11px] font-medium shadow-sm`}>
                                    <AppIcon name={meta.icon as any} className="h-3 w-3" />
                                    {meta.label}
                                  </span>
                                );
                              })}
                            </div>
                            {!p.blocks?.length && <p className="text-xs text-slate-400 italic">Sin bloques</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </>}

      {fullPreviewOpen && preview?.pages && (
        <div className="fixed inset-0 z-[60] flex items-stretch justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFullPreviewOpen(false)} />
          <div className="relative w-full max-w-6xl m-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">Vista previa · {selected?.name}</div>
                <div className="text-xs text-slate-500 truncate">{activePreviewPage ? `${activePreviewPage.isDefault ? "Home" : activePreviewPage.name} · ${activePreviewPage.path}` : ""}</div>
              </div>
              <div className="flex items-center gap-2">
                <select className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20" value={previewPageId} onChange={(e) => setPreviewPageId(e.target.value)}>
                  {previewPages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.isDefault ? "Home" : p.name} · {p.path}
                    </option>
                  ))}
                </select>
                <button onClick={() => setFullPreviewOpen(false)} className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto bg-slate-100"
              onClickCapture={(e) => {
                const el = e.target as HTMLElement | null;
                if (el?.closest("a")) e.preventDefault();
              }}
            >
              <div className="max-w-5xl mx-auto bg-white">
                {activePreviewPage?.blocks?.map((b: any) => (
                  <BlockRenderer key={b.id} type={b.type} content={b.content} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">Editar plantilla</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre</label>
                <input className="input-field" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea className="input-field" rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Categoría</label>
                  <select className="input-field bg-white" value={edit.categoryId} onChange={(e) => setEdit({ ...edit, categoryId: e.target.value })}>
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tags</label>
                  <input className="input-field" placeholder="landing, pro, ecommerce" value={edit.tags} onChange={(e) => setEdit({ ...edit, tags: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Thumbnail (URL)</label>
                <input className="input-field" placeholder="https://..." value={edit.thumbnail} onChange={(e) => setEdit({ ...edit, thumbnail: e.target.value })} />
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={edit.isPremium} onChange={(e) => setEdit({ ...edit, isPremium: e.target.checked })} />
                  Premium
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={edit.isActive} onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })} />
                  Activa
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 btn-secondary text-sm">Cancelar</button>
              <button onClick={saveEdit} className="flex-1 btn-primary text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-left{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes slide-down{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
        .animate-slide-left{animation:slide-left .3s ease-out}
        .animate-slide-up{animation:slide-up .3s ease-out}
        .animate-slide-down{animation:slide-down .3s ease-out}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>
    </div>
  );
}
