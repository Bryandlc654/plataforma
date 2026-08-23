"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

interface Site {
  id: string;
  name: string;
  subdomain: string | null;
  domain?: string | null;
}

interface PageSeo {
  id: string;
  name: string;
  path: string;
  isDefault?: boolean;
  title: string;
  description: string;
  seoTitle: string;
  seoDesc: string;
}

interface SeoMeta {
  url: string;
  subdomain: string | null;
  domain: string | null;
  published: boolean;
  global: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    favicon: string;
    siteName: string;
  };
  pages: PageSeo[];
}

const TITLE_MAX = 60;
const DESC_MAX = 155;

function charClass(len: number, max: number): string {
  if (len > max) return "text-red-500";
  if (len > max * 0.8) return "text-amber-500";
  return "text-slate-400";
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  return (
    <div className="flex items-center justify-end gap-1 mt-1">
      <span className="text-[11px] font-medium">
        <span className={charClass(len, max)}>
          {len} / {max}
        </span>
        {over && <span className="text-red-500 ml-1">excede el límite</span>}
      </span>
    </div>
  );
}

function SerpPreview({
  title,
  description,
  url,
  favicon,
  siteName,
}: {
  title: string;
  description: string;
  url: string;
  favicon: string;
  siteName: string;
}) {
  const t = truncate(title, TITLE_MAX);
  const d = truncate(description, DESC_MAX);
  const urlObj = (() => {
    try {
      return new URL(url);
    } catch {
      return null;
    }
  })();
  const breadcrumb = urlObj ? `${urlObj.hostname}${urlObj.pathname.replace(/\/$/, "") || ""}` : url;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs text-slate-600">
        {favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={favicon} alt="" className="h-4 w-4 rounded-full object-contain" />
        ) : (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[8px] font-bold text-slate-500">
            {(siteName || "S")[0].toUpperCase()}
          </span>
        )}
        <span className="truncate font-medium">{siteName}</span>
        <span className="truncate text-slate-400">› {breadcrumb}</span>
      </div>
      <div className="text-lg leading-snug text-[#1a0dab] hover:underline">{t || "Título pendiente"}</div>
      <div className="text-sm leading-snug text-[#4d5156]">{d || "Descripción pendiente"}</div>
    </div>
  );
}

function OgPreview({
  title,
  description,
  image,
  siteName,
}: {
  title: string;
  description: string;
  image: string;
  siteName: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="aspect-[1.91/1] w-full bg-slate-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Open Graph" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-300">
            <span className="material-symbols-outlined text-3xl">image</span>
            <span className="text-[11px]">Sin imagen</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-xs uppercase tracking-wide text-slate-400">{siteName}</div>
        <div className="mt-0.5 text-sm font-semibold text-slate-800">
          {truncate(title, TITLE_MAX) || "Título pendiente"}
        </div>
        <div className="mt-0.5 text-xs leading-snug text-slate-500">
          {truncate(description, DESC_MAX) || "Descripción pendiente"}
        </div>
      </div>
    </div>
  );
}

export default function SeoPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [meta, setMeta] = useState<SeoMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [globalTitle, setGlobalTitle] = useState("");
  const [globalDesc, setGlobalDesc] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [pages, setPages] = useState<PageSeo[]>([]);
  const [snapshot, setSnapshot] = useState("");

  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<string>("global");
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const currentSnapshot = useMemo(
    () => JSON.stringify({ globalTitle, globalDesc, ogImage, pages }),
    [globalTitle, globalDesc, ogImage, pages]
  );
  const dirty = snapshot !== currentSnapshot;

  const applyMeta = useCallback((d: SeoMeta) => {
    setMeta(d);
    setGlobalTitle(d.global.title || "");
    setGlobalDesc(d.global.description || "");
    setOgImage(d.global.ogImage || "");
    const pg = d.pages.map((p) => ({
      ...p,
      seoTitle: p.seoTitle || "",
      seoDesc: p.seoDesc || "",
    }));
    setPages(pg);
    setExpandedPage(pg[0]?.id ?? null);
    setPreviewTarget("global");
    setSnapshot(JSON.stringify({ globalTitle: d.global.title || "", globalDesc: d.global.description || "", ogImage: d.global.ogImage || "", pages: pg }));
  }, []);

  const fetchMeta = useCallback(
    async (siteId: string) => {
      try {
        const d = (await api.get(`/seo/sites/${siteId}/meta`)) as SeoMeta;
        applyMeta(d);
        setSaveError(null);
      } catch {
        setMeta(null);
      }
    },
    [applyMeta]
  );

  const fetchSites = useCallback(async () => {
    try {
      const res: any = await api.get("/sites");
      const list = (res.data?.items || res.items || []) as Site[];
      setSites(list);
      if (list.length > 0) {
        setSelectedId(list[0].id);
        fetchMeta(list[0].id);
      }
    } catch {
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [fetchMeta]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleSelectSite = (siteId: string) => {
    setSelectedId(siteId);
    fetchMeta(siteId);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.put(`/seo/sites/${selectedId}`, {
        seoTitle: globalTitle,
        seoDesc: globalDesc,
        ogImage,
      });
      for (const p of pages) {
        await api.put(`/seo/pages/${p.id}`, { seoTitle: p.seoTitle, seoDesc: p.seoDesc });
      }
      await fetchMeta(selectedId);
      setToast({ kind: "success", message: "Cambios guardados correctamente" });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al guardar SEO";
      setSaveError(msg);
      setToast({ kind: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const updatePage = (id: string, field: "seoTitle" | "seoDesc", value: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const resetPage = (id: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, seoTitle: "", seoDesc: "" } : p)));
  };

  const previewData = useMemo(() => {
    if (!meta) return null;
    if (previewTarget === "global") {
      return {
        title: globalTitle || meta.global.title,
        description: globalDesc || meta.global.description,
        url: meta.url,
        favicon: meta.global.favicon,
        siteName: meta.global.siteName,
        image: ogImage || meta.global.ogImage,
        path: "",
      };
    }
    const p = pages.find((x) => x.id === previewTarget);
    if (!p) return null;
    const base = meta.url;
    const path = p.path === "/" ? "" : p.path;
    return {
      title: p.seoTitle || p.title,
      description: p.seoDesc || p.description,
      url: `${base}${path}`,
      favicon: meta.global.favicon,
      siteName: meta.global.siteName,
      image: ogImage || meta.global.ogImage,
      path,
    };
  }, [meta, previewTarget, globalTitle, globalDesc, ogImage, pages]);

  if (loading) {
    return (
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-8 w-40 rounded-lg bg-slate-200" />
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 rounded-2xl bg-white border border-slate-200" />
              <div className="h-72 rounded-2xl bg-white border border-slate-200" />
            </div>
            <div className="h-96 rounded-2xl bg-white border border-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">SEO</h1>
            <p className="mt-1 text-sm text-slate-500">
              Controla cómo tu sitio aparece en Google y en redes sociales.
            </p>
          </div>
          {meta && (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  meta.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${meta.published ? "bg-emerald-500" : "bg-slate-400"}`}
                />
                {meta.published ? "Publicado" : "Borrador"}
              </span>
              <a
                href={meta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Ver sitio
              </a>
            </div>
          )}
        </div>

        {sites.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500">No tienes sitios. Crea uno primero.</p>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <label className="label">Sitio</label>
              <select
                value={selectedId}
                onChange={(e) => handleSelectSite(e.target.value)}
                className="input-field max-w-md"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.subdomain || s.id}
                  </option>
                ))}
              </select>
              {meta && (
                <p className="mt-1.5 text-xs text-slate-400">
                  URL pública: <span className="font-mono text-slate-500">{meta.url}</span>
                </p>
              )}
            </div>

            {saveError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="material-symbols-outlined text-base">error</span>
                {saveError}
              </div>
            )}

            {meta && (
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  {/* Global */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400">public</span>
                      <h2 className="font-semibold text-slate-900">Datos generales</h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Se usa cuando alguien busca tu marca y como base del Open Graph.
                    </p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="label">Título SEO</label>
                        <input
                          className="input-field"
                          value={globalTitle}
                          onChange={(e) => setGlobalTitle(e.target.value)}
                          placeholder={meta.global.siteName}
                        />
                        <CharCount value={globalTitle} max={TITLE_MAX} />
                      </div>
                      <div>
                        <label className="label">Descripción SEO</label>
                        <textarea
                          className="input-field resize-none"
                          rows={3}
                          value={globalDesc}
                          onChange={(e) => setGlobalDesc(e.target.value)}
                          placeholder="Describe en 1–2 frases de qué trata tu sitio."
                        />
                        <CharCount value={globalDesc} max={DESC_MAX} />
                      </div>
                      <div>
                        <label className="label">Imagen para compartir (Open Graph)</label>
                        <div className="flex gap-3">
                          <input
                            className="input-field"
                            value={ogImage}
                            onChange={(e) => setOgImage(e.target.value)}
                            placeholder="https://…/imagen-1200x630.jpg"
                          />
                          <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            {ogImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={ogImage} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <span className="material-symbols-outlined text-base">image</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Recomendado 1200×630 px. Si la dejas vacía se usa el logo del sitio.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Pages */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400">description</span>
                      <h2 className="font-semibold text-slate-900">SEO por página</h2>
                      <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {pages.length}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Personaliza el título y la descripción de cada página del sitio.
                    </p>
                    <div className="mt-4 space-y-3">
                      {pages.map((p) => {
                        const open = expandedPage === p.id;
                        return (
                          <div
                            key={p.id}
                            className="overflow-hidden rounded-xl border border-slate-200"
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedPage(open ? null : p.id)}
                              className="flex w-full items-center gap-3 bg-slate-50/60 px-4 py-3 text-left hover:bg-slate-50"
                            >
                              <span
                                className={`material-symbols-outlined text-base transition-transform ${open ? "rotate-90" : ""}`}
                              >
                                chevron_right
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-slate-800">{p.name}</div>
                                <div className="truncate text-[11px] text-slate-400 font-mono">{p.path}</div>
                              </div>
                              {p.isDefault && (
                                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-600">
                                  Página principal
                                </span>
                              )}
                              {p.seoTitle && (
                                <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 sm:inline">
                                  Personalizada
                                </span>
                              )}
                            </button>
                            {open && (
                              <div className="space-y-4 border-t border-slate-100 p-4">
                                <div>
                                  <label className="label">Título SEO</label>
                                  <input
                                    className="input-field"
                                    value={p.seoTitle}
                                    onChange={(e) => updatePage(p.id, "seoTitle", e.target.value)}
                                    placeholder={p.title}
                                  />
                                  <CharCount value={p.seoTitle} max={TITLE_MAX} />
                                </div>
                                <div>
                                  <label className="label">Descripción SEO</label>
                                  <textarea
                                    className="input-field resize-none"
                                    rows={2}
                                    value={p.seoDesc}
                                    onChange={(e) => updatePage(p.id, "seoDesc", e.target.value)}
                                    placeholder={p.description}
                                  />
                                  <CharCount value={p.seoDesc} max={DESC_MAX} />
                                </div>
                                {(p.seoTitle || p.seoDesc) && (
                                  <button
                                    type="button"
                                    onClick={() => resetPage(p.id)}
                                    className="text-xs font-medium text-slate-400 hover:text-red-600"
                                  >
                                    Restablecer a predeterminado
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* Preview panel */}
                <div className="lg:sticky lg:top-24 h-fit space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400">search</span>
                      <h3 className="font-semibold text-slate-900">Vista previa</h3>
                    </div>
                    <select
                      value={previewTarget}
                      onChange={(e) => setPreviewTarget(e.target.value)}
                      className="input-field mt-3 text-sm"
                    >
                      <option value="global">Sitio — página principal</option>
                      {pages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.path})
                        </option>
                      ))}
                    </select>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Resultado de Google
                      </div>
                      {previewData && (
                        <SerpPreview
                          title={previewData.title}
                          description={previewData.description}
                          url={previewData.url}
                          favicon={previewData.favicon}
                          siteName={previewData.siteName}
                        />
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        Al compartir en redes
                      </div>
                      {previewData && (
                        <OgPreview
                          title={previewData.title}
                          description={previewData.description}
                          image={previewData.image}
                          siteName={previewData.siteName}
                        />
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-relaxed text-slate-500 shadow-sm">
                    <span className="material-symbols-outlined align-middle text-base text-primary-600">info</span>{" "}
                    Los cambios se aplican al instante en el sitio publicado. Google puede tardar
                    unos días en indexarlos. Genera el sitemap en{" "}
                    <span className="font-mono text-slate-600">{meta.url}/sitemap.xml</span>.
                  </div>
                </div>
              </div>
            )}

            {/* Save bar */}
            {meta && (
              <div className="sticky bottom-4 mt-6">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={`h-2 w-2 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-500"}`}
                    />
                    {dirty ? (
                      <span className="text-slate-600">Hay cambios sin guardar</span>
                    ) : (
                      <span className="text-slate-400">Todo guardado</span>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving || !dirty}
                    className="btn-primary"
                  >
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Guardando…
                      </span>
                    ) : (
                      "Guardar cambios"
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            toast.kind === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {toast.kind === "success" ? "check_circle" : "error"}
          </span>
          {toast.message}
        </div>
      )}
    </main>
  );
}
