"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useConfirm } from "@/components/providers/confirm-provider";
import { ImageField } from "@/components/blocks/editors/image-field";

interface SiteOption { id: string; name: string; subdomain?: string; domain?: string; }
interface BlogSettings { enabled: boolean; title: string; slug: string; }
interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string;
  coverImage?: string | null;
  authorName?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  seoImage?: string | null;
  createdAt?: string;
}

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  authorName: "",
  isPublished: false,
  seoTitle: "",
  seoDesc: "",
  seoImage: "",
};

export default function BlogPage() {
  const { confirm } = useConfirm();
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [siteId, setSiteId] = useState<string>("");
  const [settings, setSettings] = useState<BlogSettings>({ enabled: false, title: "Blog", slug: "blog" });
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const selectedSite = useMemo(() => sites.find((s) => s.id === siteId) || null, [sites, siteId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchSites = useCallback(async () => {
    try {
      const res: any = await api.get("/sites");
      const data = res?.data || res;
      const items: SiteOption[] = data?.items || [];
      setSites(items);
      if (items.length > 0) setSiteId((prev) => prev || items[0].id);
    } catch {
      setSites([]);
    }
  }, []);

  const fetchBlog = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const [sRes, aRes]: any[] = await Promise.all([
        api.get(`/blog/sites/${id}/settings`),
        api.get(`/blog/sites/${id}/articles?limit=100`),
      ]);
      const s = sRes?.data || sRes;
      setSettings({
        enabled: s?.enabled === true,
        title: s?.title || "Blog",
        slug: s?.slug || "blog",
      });
      const a = aRes?.data || aRes;
      setArticles(a?.items || []);
    } catch {
      setToast({ kind: "error", message: "No se pudo cargar el blog" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSites(); }, [fetchSites]);
  useEffect(() => { if (siteId) fetchBlog(siteId); }, [siteId, fetchBlog]);

  const saveSettings = async (patch?: Partial<BlogSettings>) => {
    if (!siteId) return;
    setSavingSettings(true);
    const next = { ...settings, ...patch };
    try {
      const res: any = await api.put(`/blog/sites/${siteId}/settings`, next);
      const saved = res?.data || res;
      setSettings({
        enabled: saved?.enabled === true,
        title: saved?.title || "Blog",
        slug: saved?.slug || "blog",
      });
      setToast({ kind: "success", message: saved?.enabled ? "Blog habilitado" : "Blog deshabilitado" });
    } catch (err: any) {
      setToast({ kind: "error", message: err?.response?.data?.message || "Error al guardar" });
    } finally {
      setSavingSettings(false);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (a: Article) => {
    setEditId(a.id);
    setForm({
      title: a.title || "",
      slug: a.slug || "",
      excerpt: a.excerpt || "",
      content: a.content || "",
      coverImage: a.coverImage || "",
      authorName: a.authorName || "",
      isPublished: a.isPublished === true,
      seoTitle: a.seoTitle || "",
      seoDesc: a.seoDesc || "",
      seoImage: a.seoImage || "",
    });
    setShowForm(true);
  };

  const saveArticle = async () => {
    if (!siteId) return;
    if (!form.title.trim()) { setToast({ kind: "error", message: "El título es obligatorio" }); return; }
    setSaving(true);
    try {
      if (editId) await api.put(`/blog/sites/${siteId}/articles/${editId}`, form);
      else await api.post(`/blog/sites/${siteId}/articles`, form);
      setShowForm(false);
      await fetchBlog(siteId);
      setToast({ kind: "success", message: editId ? "Artículo actualizado" : "Artículo creado" });
    } catch (err: any) {
      setToast({ kind: "error", message: err?.response?.data?.message || "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const removeArticle = async (a: Article) => {
    if (!(await confirm({ title: "Eliminar artículo", message: `¿Eliminar "${a.title}"?` }))) return;
    try {
      await api.delete(`/blog/sites/${siteId}/articles/${a.id}`);
      await fetchBlog(siteId);
      setToast({ kind: "success", message: "Artículo eliminado" });
    } catch (err: any) {
      setToast({ kind: "error", message: err?.response?.data?.message || "Error al eliminar" });
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg ${toast.kind === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Blog</h1>
          <p className="text-sm text-slate-500">Gestiona artículos y su SEO. Al habilitarlo, el enlace aparece en el menú de tu web.</p>
        </div>
        <div className="flex items-center gap-2">
          {sites.length > 1 && (
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="input-field text-sm">
              {sites.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          )}
          <button onClick={openCreate} disabled={!siteId} className="btn-primary text-sm disabled:opacity-50">+ Nuevo artículo</button>
        </div>
      </div>

      {sites.length === 0 ? (
        <div className="card p-8 text-center text-slate-500 text-sm">No tienes sitios todavía. Crea un sitio para usar el blog.</div>
      ) : (
        <>
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => saveSettings({ enabled: !settings.enabled })}
                  disabled={savingSettings}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enabled ? "bg-primary-600" : "bg-slate-300"}`}
                  aria-pressed={settings.enabled}
                  title={settings.enabled ? "Deshabilitar blog" : "Habilitar blog"}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Blog {settings.enabled ? "habilitado" : "deshabilitado"}</p>
                  <p className="text-xs text-slate-500">
                    {settings.enabled
                      ? `Visible en ${selectedSite?.domain ? `https://${selectedSite.domain}` : `/${selectedSite?.subdomain || ""}`}/${settings.slug}`
                      : "Actívalo para publicar artículos y mostrarlos en el menú."}
                  </p>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Título del menú</label>
                  <input className="input-field text-sm" value={settings.title} onChange={(e) => setSettings({ ...settings, title: e.target.value })} onBlur={() => saveSettings()} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ruta</label>
                  <input className="input-field text-sm" value={settings.slug} onChange={(e) => setSettings({ ...settings, slug: e.target.value })} onBlur={() => saveSettings()} />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-slate-500 text-sm py-12">Cargando...</div>
          ) : articles.length === 0 ? (
            <div className="card p-8 text-center text-slate-500 text-sm">Aún no hay artículos. Crea el primero.</div>
          ) : (
            <div className="space-y-2">
              {articles.map((a) => (
                <div key={a.id} className="card p-4 flex items-center gap-4">
                  {a.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.coverImage} alt="" className="h-14 w-20 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-14 w-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 flex-shrink-0">—</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 truncate">{a.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${a.isPublished ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {a.isPublished ? "Publicado" : "Borrador"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">/{settings.slug}/{a.slug}</p>
                  </div>
                  <button onClick={() => openEdit(a)} className="text-xs font-medium text-primary-600 hover:text-primary-700 px-3 py-1.5">Editar</button>
                  <button onClick={() => removeArticle(a)} className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5">Eliminar</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
              <h3 className="font-semibold text-sm text-slate-900">{editId ? "Editar artículo" : "Nuevo artículo"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
                  <input className="input-field text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Slug</label>
                  <input className="input-field text-sm" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="se-genera-del-titulo" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Autor</label>
                  <input className="input-field text-sm" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Resumen</label>
                <textarea className="input-field text-sm" rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contenido (HTML permitido)</label>
                <textarea className="input-field text-sm font-mono" rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="<p>Escribe aquí el artículo…</p>" />
              </div>

              <ImageField label="Imagen de portada" value={form.coverImage} onChange={(v) => setForm({ ...form, coverImage: v })} />

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-700">SEO del artículo</p>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Título SEO</label>
                  <input className="input-field text-sm" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} placeholder="Por defecto: el título del artículo" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Descripción SEO</label>
                  <textarea className="input-field text-sm" rows={2} value={form.seoDesc} onChange={(e) => setForm({ ...form, seoDesc: e.target.value })} placeholder="Por defecto: el resumen" />
                </div>
                <ImageField label="Imagen SEO (OpenGraph)" value={form.seoImage} onChange={(v) => setForm({ ...form, seoImage: v })} />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                Publicar artículo
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancelar</button>
                <button onClick={saveArticle} disabled={saving} className="btn-primary text-sm disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
