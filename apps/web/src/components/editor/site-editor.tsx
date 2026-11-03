"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { BLOCK_TYPES, BLOCK_META, getBlockDefaultContent } from "@/components/blocks";
import { BlockRenderer } from "@/components/blocks/renderers/block-renderer";
import { TemplateGlobalStyles, templateWrapperClass } from "@/components/templates/template-global-styles";
import { DEFAULT_SITE_PALETTE, PALETTE_LABELS, PALETTE_PRESETS, hasExplicitPalette, resolveSitePalette, type PaletteRole, type SitePalette } from "@/lib/site-palette";
import { BlockEditor } from "@/components/blocks/editors/block-editor";
import { ImageField } from "@/components/blocks/editors/image-field";
import { HiOutlineEye, HiOutlinePlus, HiOutlineX, HiOutlineCog, HiOutlineArrowLeft, HiOutlineCheck, HiOutlineDocumentText, HiOutlineDuplicate, HiOutlineTrash, HiOutlineCursorClick } from "react-icons/hi";
import { EditorTopBar, type EditorDevice } from "@/components/editor/editor-top-bar";
import { SectionsSidebar } from "@/components/editor/sections-sidebar";
import { SectionPicker } from "@/components/editor/section-picker";
import { CanvasBlock } from "@/components/editor/canvas-block";
import { useConfirm } from "@/components/providers/confirm-provider";

interface Block { id: string; type: string; content: any; styles: any; sortOrder: number; }
interface SitePage { id: string; name: string; slug: string; path: string; isDefault: boolean; sortOrder: number; blocks: Block[]; }
interface Site { id: string; name: string; subdomain: string; domain?: string; isPublished: boolean; primaryColor: string; secondaryColor?: string; logoUrl?: string; faviconUrl?: string; seoTitle?: string; seoDesc?: string; settings?: any; pages: SitePage[]; }

export function SiteEditor({ siteId }: { siteId: string }) {
  const [site, setSite] = useState<Site | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<EditorDevice>("desktop");
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | null>(null);
  const [showAddPage, setShowAddPage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPagesModal, setShowPagesModal] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState({ name: "", primaryColor: "#2563EB", secondaryColor: "#1E40AF", logoUrl: "", faviconUrl: "", domain: "" });
  const [palette, setPalette] = useState<SitePalette>(DEFAULT_SITE_PALETTE);
  const [paletteDirty, setPaletteDirty] = useState(false);
  const [unpublishedBehavior, setUnpublishedBehavior] = useState<"404" | "maintenance">("404");
  const [history, setHistory] = useState<Site[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [dnsStatus, setDnsStatus] = useState<"idle"|"checking"|"ok"|"error">("idle");
  const [dnsResult, setDnsResult] = useState<any>(null);
  const [checkingDns, setCheckingDns] = useState(false);
  const pendingBlocksRef = useRef<Record<string, any>>({});
  const pendingSeoRef = useRef<{ seoTitle?: string; seoDesc?: string }>({});
  const isUndoRedo = useRef(false);
  const { confirm } = useConfirm();

  const fetchSite = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/sites/${siteId}`);
      const s = (res.data || res) as Site;
      setSite(s);
      setSiteSettings({ name: s.name, primaryColor: s.primaryColor || "#2563EB", secondaryColor: s.secondaryColor || "#1E40AF", logoUrl: s.logoUrl || "", faviconUrl: s.faviconUrl || "", domain: s.domain || "" });
      setPalette(resolveSitePalette(s.settings, s.primaryColor, s.secondaryColor));
      setPaletteDirty(false);
      setUnpublishedBehavior((s.settings as any)?.unpublishedBehavior === "maintenance" ? "maintenance" : "404");
      if (s.pages.length > 0) setActivePageId(s.pages.find(p => p.isDefault)?.id || s.pages[0].id);
    } catch { setSite(null); }
    finally { setLoading(false); }
  }, [siteId]);

  useEffect(() => { fetchSite(); }, [fetchSite]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const pushHistory = useCallback((s: Site) => {
    if (isUndoRedo.current) { isUndoRedo.current = false; return; }
    setHistory(prev => {
      const next = prev.slice(0, historyIdx + 1);
      next.push(JSON.parse(JSON.stringify(s)));
      if (next.length > 50) next.shift();
      return next;
    });
    setHistoryIdx(prev => Math.min(prev + 1, 49));
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx <= 0) return;
    isUndoRedo.current = true;
    const target = history[historyIdx - 1];
    if (target) { setSite(JSON.parse(JSON.stringify(target))); setHistoryIdx(prev => prev - 1); setDirty(true); }
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    isUndoRedo.current = true;
    const target = history[historyIdx + 1];
    if (target) { setSite(JSON.parse(JSON.stringify(target))); setHistoryIdx(prev => prev + 1); setDirty(true); }
  }, [history, historyIdx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  useEffect(() => { if (!dirty) return; const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; }; window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h); }, [dirty]);

  const activePage = site?.pages.find(p => p.id === activePageId);
  const sortedBlocks = activePage ? [...activePage.blocks].sort((a, b) => a.sortOrder - b.sortOrder) : [];
  const activeBlock = sortedBlocks.find(b => b.id === activeBlockId);

  const paletteActive = hasExplicitPalette(site?.settings) || paletteDirty;
  const variantPalette = paletteActive ? palette : undefined;

  const blogCfg = (site?.settings as any)?.blog;
  const injectBlogNav = (block: Block): Block => {
    if (!site || blogCfg?.enabled !== true || block.type !== "header") return block;
    const base = site.domain ? `https://${site.domain}` : `https://build.icebergup.com/${site.subdomain}`;
    const url = `${base}/${blogCfg.slug || "blog"}`;
    const content = { ...(block.content || {}) };
    const links = Array.isArray(content.links) ? content.links : [];
    if (!links.some((l: any) => l?.url === url)) {
      content.links = [...links, { label: blogCfg.title || "Blog", url }];
    }
    return { ...block, content };
  };

  const updatePaletteColor = (role: PaletteRole, value: string) => {
    setPalette(p => ({ ...p, [role]: value }));
    setPaletteDirty(true);
  };

  const savePending = useCallback(async () => {
    const pendingBlocks = Object.entries(pendingBlocksRef.current);
    const pendingSeo = pendingSeoRef.current;
    if (pendingBlocks.length === 0 && !pendingSeo.seoTitle && !pendingSeo.seoDesc) return;
    setSaving(true);
    try {
      for (const [id, content] of pendingBlocks) {
        await api.put(`/blocks/${id}`, { content });
      }
      if (pendingSeo.seoTitle || pendingSeo.seoDesc) {
        await api.put(`/seo/sites/${siteId}`, pendingSeo);
      }
      pendingBlocksRef.current = {};
      pendingSeoRef.current = {};
      setLastSaved(new Date());
      setDirty(false);
    } catch (err: any) {
      setToast(err.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }, [siteId]);

  const addPage = async () => {
    if (!newPageName.trim()) return;
    const slug = newPageName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    try {
      const res: any = await api.post(`/sites/${siteId}/pages`, { name: newPageName, slug });
      const page = res.data || res;
      setSite(p => p ? { ...p, pages: [...p.pages, { ...page, blocks: [] }] } : p);
      setActivePageId(page.id);
      setShowAddPage(false);
      setNewPageName("");
      setToast("Página creada");

      const defaultPage = site?.pages.find(p => p.isDefault);
      if (defaultPage) {
        const headerBlock = defaultPage.blocks.find(b => b.type === "header");
        if (headerBlock) {
          const links = headerBlock.content?.links || [];
          const updatedContent = { ...headerBlock.content, links: [...links, { label: newPageName, url: `/${slug}` }] };
          await api.put(`/blocks/${headerBlock.id}`, { content: updatedContent });
          await fetchSite();
        }
      }
    } catch (err: any) { setToast(err.response?.data?.message || "Error al crear página"); }
  };

  const deletePage = async (pageId: string) => {
    if (!(await confirm({ title: "Eliminar página", message: "¿Eliminar esta página y todos sus bloques?" }))) return;
    try {
      await api.delete(`/pages/${pageId}`);
      setSite(p => {
        if (!p) return p;
        const pages = p.pages.filter(x => x.id !== pageId);
        if (activePageId === pageId) setActivePageId(pages[0]?.id || null);
        return { ...p, pages };
      });
      setToast("Página eliminada");
    } catch (err: any) { setToast(err.response?.data?.message || "Error al eliminar"); }
  };

  const duplicatePage = async (pageId: string) => {
    const page = site?.pages.find(p => p.id === pageId);
    if (!page) return;
    try {
      const res: any = await api.post(`/sites/${siteId}/pages`, { name: `${page.name} (copia)`, slug: `${page.slug}-copy`, path: page.path });
      const newP = res.data || res;
      await Promise.all(page.blocks.map(b => api.post(`/pages/${newP.id}/blocks`, { type: b.type, content: JSON.parse(JSON.stringify(b.content)) })));
      await fetchSite();
      setToast("Página duplicada");
    } catch { setToast("Error al duplicar"); }
  };

  const updateBlock = (blockId: string, content: any) => {
    setSite(p => {
      if (!p) return p;
      const next = { ...p, pages: p.pages.map(pg => ({ ...pg, blocks: pg.blocks.map(b => b.id === blockId ? { ...b, content } : b) })) };
      pushHistory(next);
      return next;
    });
    pendingBlocksRef.current[blockId] = content;
    setDirty(true);
  };

  const openPicker = (afterIndex: number | null = null) => { setInsertAfterIndex(afterIndex); setShowAddBlock(true); };

  /** Inserta el bloque devuelto por la API en la posición indicada y renumera el orden local. */
  const insertLocal = (newBlock: Block, afterIndex: number | null) => {
    setSite(p => {
      if (!p) return p;
      const next = {
        ...p,
        pages: p.pages.map(pg => {
          if (pg.id !== activePageId) return pg;
          const sorted = [...pg.blocks].sort((a, b) => a.sortOrder - b.sortOrder);
          sorted.splice(afterIndex === null ? sorted.length : afterIndex + 1, 0, newBlock);
          return { ...pg, blocks: sorted.map((b, i) => ({ ...b, sortOrder: i })) };
        }),
      };
      pushHistory(next);
      return next;
    });
    setDirty(true);
  };

  const addBlock = async (type: string) => {
    if (!activePageId) return;
    const afterIndex = insertAfterIndex;
    try {
      let content = getBlockDefaultContent(type as any);
      const tmplVariant = activePage?.blocks?.[0]?.content?.variant;
      if (tmplVariant && !content.variant) content = { ...content, variant: tmplVariant };
      const res: any = await api.post(`/pages/${activePageId}/blocks`, { type, content, ...(afterIndex !== null ? { afterIndex } : {}) });
      const newBlock = (res.data || res) as Block;
      insertLocal(newBlock, afterIndex);
      setActiveBlockId(newBlock.id);
      setTimeout(() => document.getElementById(`block-${newBlock.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      setToast(`${BLOCK_META[type]?.label || type} agregado`);
    } catch (err: any) { setToast(err.response?.data?.message || "Error al agregar bloque"); }
  };

  const duplicateBlock = async (blockId: string) => {
    if (!activePageId) return;
    const idx = sortedBlocks.findIndex(b => b.id === blockId);
    const src = sortedBlocks[idx];
    if (!src) return;
    if (src.type === "header" || src.type === "footer") { setToast("El encabezado y el pie son compartidos; no se pueden duplicar"); return; }
    try {
      const res: any = await api.post(`/pages/${activePageId}/blocks`, { type: src.type, content: JSON.parse(JSON.stringify(src.content)), afterIndex: idx });
      const copy = (res.data || res) as Block;
      if (src.styles) {
        await api.put(`/blocks/${copy.id}`, { styles: src.styles });
        copy.styles = src.styles;
      }
      insertLocal(copy, idx);
      setActiveBlockId(copy.id);
      setToast("Sección duplicada");
    } catch (err: any) { setToast(err.response?.data?.message || "Error al duplicar"); }
  };

  const toggleHidden = async (blockId: string) => {
    const block = sortedBlocks.find(b => b.id === blockId);
    if (!block) return;
    const styles = { ...(block.styles || {}), hidden: !block.styles?.hidden };
    if (!styles.hidden) delete styles.hidden;
    try {
      await api.put(`/blocks/${blockId}`, { styles });
      setSite(p => {
        if (!p) return p;
        const next = { ...p, pages: p.pages.map(pg => ({ ...pg, blocks: pg.blocks.map(b => b.id === blockId ? { ...b, styles } : b) })) };
        pushHistory(next);
        return next;
      });
      setDirty(true);
      setToast(styles.hidden ? "Sección oculta (no se publicará)" : "Sección visible");
    } catch (err: any) { setToast(err.response?.data?.message || "Error al actualizar"); }
  };

  const deleteBlock = async (blockId: string) => {
    if (!(await confirm({ title: "Eliminar bloque", message: "¿Eliminar este bloque?" }))) return;
    try {
      await api.delete(`/blocks/${blockId}`);
      setSite(p => {
        if (!p) return p;
        const next = { ...p, pages: p.pages.map(pg => ({ ...pg, blocks: pg.blocks.filter(b => b.id !== blockId) })) };
        pushHistory(next);
        return next;
      });
      if (activeBlockId === blockId) setActiveBlockId(null);
      setDirty(true);
      setToast("Bloque eliminado");
    } catch (err: any) { setToast(err.response?.data?.message || "Error al eliminar bloque"); }
  };

  const reorderBlocks = async (blockIds: string[]) => {
    if (!activePageId || !activePage) return;
    const byId = new Map(activePage.blocks.map(b => [b.id, b]));
    const reorderedBlocks = blockIds.map((id, i) => ({ ...byId.get(id)!, sortOrder: i }));

    setSite(p => {
      if (!p) return p;
      const next = { ...p, pages: p.pages.map(pg => pg.id === activePageId ? { ...pg, blocks: reorderedBlocks } : pg) };
      pushHistory(next);
      return next;
    });
    setDirty(true);

    try {
      await api.put(`/pages/${activePageId}/blocks/reorder`, { blockIds });
    } catch (err: any) { setToast(err.response?.data?.message || "Error al reordenar"); fetchSite(); }
  };


  const publish = async () => {
    setPublishing(true);
    try {
      await savePending();
      await api.post(`/sites/${siteId}/publish`);
      setSite(p => p ? { ...p, isPublished: true } : p);
      setToast("¡Sitio publicado!");
    } catch (err: any) { setToast(err.response?.data?.message || "Error al publicar"); }
    finally { setPublishing(false); }
  };

  const unpublish = async () => {
    try {
      await api.post(`/sites/${siteId}/unpublish`);
      setSite(p => p ? { ...p, isPublished: false } : p);
      setToast("Sitio despublicado");
    } catch (err: any) { setToast(err.response?.data?.message || "Error al despublicar"); }
  };

  const saveSiteSettings = async () => {
    try {
      const body = {
        ...siteSettings,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        settings: { ...(site?.settings || {}), palette, unpublishedBehavior },
      };
      await api.put(`/sites/${siteId}`, body);
      setSite(p => p ? { ...p, ...body, settings: body.settings, domain: siteSettings.domain || undefined } : p);
      setSiteSettings(s => ({ ...s, primaryColor: palette.primary, secondaryColor: palette.secondary }));
      setPaletteDirty(false);
      setToast("Configuración guardada");
      setDnsStatus("idle");
    } catch (err: any) { setToast(err.response?.data?.message || "Error al guardar"); }
  };

  const checkDomainDns = async () => {
    if (!siteSettings.domain) return;
    setCheckingDns(true);
    setDnsStatus("checking");
    try {
      const res: any = await api.get(`/sites/${siteId}/check-domain?domain=${encodeURIComponent(siteSettings.domain)}`);
      const d = res.data || res;
      setDnsResult(d);
      setDnsStatus(d?.pointsToServer ? "ok" : "error");
      setToast(d?.pointsToServer ? "¡Dominio conectado!" : "DNS no apunta al servidor");
    } catch { setDnsStatus("error"); }
    finally { setCheckingDns(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="text-center"><svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><p className="text-sm text-slate-500">Cargando editor...</p></div></div>;
  if (!site) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="text-center"><h2 className="text-xl font-semibold text-slate-900 mb-2">Sitio no encontrado</h2><Link href="/dashboard/sites" className="btn-primary inline-flex items-center gap-1.5"><HiOutlineArrowLeft className="h-4 w-4" /> Volver</Link></div></div>;

  const openPreview = () => {
    const url = site.domain ? `https://${site.domain}` : `/${site.subdomain}`;
    window.open(url, "_blank");
  };
  const hasPages = site.pages.length > 0;
  const publicUrl = site.domain ? `https://${site.domain}` : `/${site.subdomain}`;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-white">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg animate-fade-in">{toast}</div>}

      <EditorTopBar
        siteName={site.name}
        isPublished={site.isPublished}
        pages={site.pages}
        activePageId={activePageId}
        onSelectPage={(id) => { setActivePageId(id); setActiveBlockId(null); }}
        onManagePages={() => setShowPagesModal(true)}
        device={device}
        onDeviceChange={setDevice}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIdx > 0}
        canRedo={historyIdx < history.length - 1}
        saving={saving}
        dirty={dirty}
        lastSaved={lastSaved}
        publishing={publishing}
        onSave={() => savePending()}
        onPublish={publish}
        onUnpublish={unpublish}
        onPreview={openPreview}
        onSettings={() => setShowSettings(true)}
      />

      <div className="flex min-h-0 flex-1">
        <SectionsSidebar
          pageName={activePage?.name}
          blocks={sortedBlocks.map(b => ({ id: b.id, type: b.type, hidden: !!b.styles?.hidden }))}
          activeBlockId={activeBlockId}
          onSelect={(id) => { setActiveBlockId(id); document.getElementById(`block-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
          onReorder={reorderBlocks}
          onDuplicate={duplicateBlock}
          onToggleHidden={toggleHidden}
          onDelete={deleteBlock}
          onAdd={() => openPicker()}
        />

        {/* CANVAS */}
        <main className={`flex-1 overflow-y-auto bg-slate-200/70 ${device === "mobile" ? "py-6" : ""}`} onClick={() => setActiveBlockId(null)}>
          <div
            className={`mx-auto bg-white transition-all duration-200 ${device === "mobile" ? "w-[390px] max-w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-300" : "min-h-full w-full"} ${templateWrapperClass(site?.settings?.globalStyles, activePage?.path)} ${activePage?.blocks?.[0]?.content?.variant === 'art-culinaire' ? 'theme-art-culinaire bg-background font-body-md text-body-md' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <TemplateGlobalStyles
              globalStyles={site?.settings?.globalStyles}
              pagePath={activePage?.path}
              palette={paletteActive ? palette : undefined}
              colors={paletteActive ? undefined : { primary: siteSettings.primaryColor, secondary: siteSettings.secondaryColor }}
            />
            {activePage && sortedBlocks.length > 0 ? (
              <>
                {sortedBlocks.map((block, idx) => (
                  <CanvasBlock key={block.id} block={injectBlogNav(block)} active={activeBlockId === block.id} hidden={!!block.styles?.hidden} onSelect={setActiveBlockId} onInsertAfter={() => openPicker(idx)} palette={variantPalette} />
                ))}
                <button onClick={() => openPicker()} className="flex w-full items-center justify-center gap-2 border-t-2 border-dashed border-slate-200 py-6 text-sm font-medium text-slate-400 transition-colors hover:bg-[#201b51]/5 hover:text-[#201b51]">
                  <HiOutlinePlus className="h-4 w-4" /> Agregar sección
                </button>
              </>
            ) : (
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="max-w-sm py-16 text-center">
                  <h3 className="mb-2 text-lg font-bold text-slate-700">{hasPages ? "Esta página está vacía" : "Crea tu primera página"}</h3>
                  <p className="mb-6 text-sm text-slate-500">{hasPages ? "Agrega una sección para empezar a diseñar." : "Necesitas al menos una página para editar tu sitio."}</p>
                  {hasPages
                    ? <button onClick={() => openPicker()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#201b51] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"><HiOutlinePlus className="h-4 w-4" /> Agregar sección</button>
                    : <button onClick={() => setShowPagesModal(true)} className="rounded-lg bg-[#201b51] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">+ Crear página</button>}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* PROPERTIES PANEL */}
        <aside className="flex w-80 flex-shrink-0 flex-col border-l border-slate-200 bg-white">
          {activeBlock ? (
            <>
              <div className="flex-shrink-0 border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">{BLOCK_META[activeBlock.type]?.label || activeBlock.type}</h3>
                  <button onClick={() => setActiveBlockId(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600"><HiOutlineX className="h-4 w-4" /></button>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{BLOCK_META[activeBlock.type]?.description}</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <BlockEditor type={activeBlock.type} content={activeBlock.content} onChange={c => updateBlock(activeBlock.id, c)} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#201b51]/10 text-[#201b51]"><HiOutlineCursorClick className="h-6 w-6" /></div>
              <p className="text-sm font-semibold text-slate-700">Elige una sección</p>
              <p className="mt-1 text-xs text-slate-400">Haz clic en cualquier parte de la página, o en la lista de la izquierda, para editar su contenido.</p>
            </div>
          )}
        </aside>
      </div>

      {/* BLOCK PALETTE MODAL */}
      {showAddBlock && <SectionPicker onAdd={addBlock} onClose={() => setShowAddBlock(false)} />}

      {/* PAGES MODAL */}
      {showPagesModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={()=>setShowPagesModal(false)}>
          <div className="absolute inset-0 bg-black/30"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col m-4 z-10" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200"><h3 className="font-semibold text-sm text-slate-900">Páginas ({site.pages.length})</h3><button onClick={()=>setShowPagesModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600"><HiOutlineX className="h-4 w-4"/></button></div>
            <div className="flex-1 overflow-y-auto p-3">
              {showAddPage?(
                <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200"><input className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 mb-2" placeholder="Ej: Servicios, Contacto..." value={newPageName} onChange={e=>setNewPageName(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&addPage()}/><div className="flex gap-1.5"><button onClick={addPage} className="flex-1 rounded-lg bg-primary-600 text-white text-xs py-1.5 font-medium">Crear</button><button onClick={()=>{setShowAddPage(false);setNewPageName("")}} className="rounded-lg border border-slate-200 text-xs py-1.5 px-3 text-slate-500">Cancelar</button></div></div>
              ):<button onClick={()=>setShowAddPage(true)} className="w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-xs font-medium text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/30 transition-all mb-3">+ Nueva página</button>}
              <div className="space-y-0.5">{[...site.pages].sort((a,b)=>a.sortOrder-b.sortOrder).map(page=>(<div key={page.id} className="group relative"><button onClick={()=>{setActivePageId(page.id);setActiveBlockId(null);setShowPagesModal(false)}} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${page.id===activePageId?"bg-primary-50 border border-primary-200 text-primary-700 font-medium":"text-slate-600 hover:bg-slate-50 border border-transparent"}`}><div className="flex items-center justify-between"><span className="truncate">{page.name}{page.isDefault&&<span className="text-[10px] bg-primary-100 text-primary-600 rounded px-1 ml-1 font-medium">Home</span>}</span><span className="text-xs text-slate-400">{page.blocks.length}</span></div></button><div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={e=>{e.stopPropagation();duplicatePage(page.id)}} className="h-6 w-6 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-blue-400 hover:text-blue-600"><HiOutlineDuplicate className="h-3 w-3"/></button>{!page.isDefault&&<button onClick={e=>{e.stopPropagation();deletePage(page.id)}} className="h-6 w-6 rounded-lg bg-white border border-red-200 flex items-center justify-center text-red-400 hover:text-red-600"><HiOutlineX className="h-3 w-3"/></button>}</div></div>))}</div>
            </div>
            <div className="border-t border-slate-200 p-3 flex gap-2">
              <button onClick={()=>{setShowSettings(true);setShowPagesModal(false)}} className="flex-1 rounded-lg border border-slate-200 text-xs font-medium py-2 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"><HiOutlineCog className="h-3.5 w-3.5"/>Configuración</button>
              {site.isPublished&&<a href={publicUrl} target="_blank" rel="noopener" className="flex-1 rounded-lg border border-slate-200 text-xs font-medium py-2 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"><HiOutlineEye className="h-3.5 w-3.5"/>Ver sitio</a>}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={()=>setShowSettings(false)}>
          <div className="absolute inset-0 bg-black/30"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[75vh] overflow-y-auto m-4 z-10" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white"><h3 className="font-semibold text-sm text-slate-900">Configuración</h3><button onClick={()=>{setShowSettings(false);saveSiteSettings()}} className="p-1 rounded-lg text-slate-400 hover:text-slate-600"><HiOutlineX className="h-4 w-4"/></button></div>
            <div className="p-4 space-y-3">
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label><input className="input-field text-xs" value={siteSettings.name} onChange={e=>setSiteSettings({...siteSettings,name:e.target.value})}/></div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Paleta de colores</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Se aplica de forma global a toda la web.</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PALETTE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => { setPalette({ ...preset.palette }); setPaletteDirty(true); }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-primary-300 hover:bg-primary-50"
                      title={`Aplicar paleta ${preset.name}`}
                    >
                      <span className="flex -space-x-1">
                        <span className="h-3 w-3 rounded-full border border-white" style={{ background: preset.palette.primary }} />
                        <span className="h-3 w-3 rounded-full border border-white" style={{ background: preset.palette.secondary }} />
                        <span className="h-3 w-3 rounded-full border border-white" style={{ background: preset.palette.accent }} />
                      </span>
                      {preset.name}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["primary", "secondary", "accent", "background", "surface", "text"] as PaletteRole[]).map((role) => (
                    <div key={role}>
                      <label className="block text-xs font-medium text-slate-600 mb-1">{PALETTE_LABELS[role]}</label>
                      <div className="flex gap-2">
                        <input type="color" className="h-8 w-8 rounded border-0 p-0 cursor-pointer" value={palette[role]} onChange={e=>updatePaletteColor(role, e.target.value)}/>
                        <input className="input-field text-xs flex-1" value={palette[role]} onChange={e=>updatePaletteColor(role, e.target.value)}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Al despublicar el sitio</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Qué verá el visitante mientras la web está despublicada.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "404", label: "Página 404" },
                    { value: "maintenance", label: "En mantenimiento" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setUnpublishedBehavior(opt.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${unpublishedBehavior === opt.value ? "border-primary-400 bg-primary-50 text-primary-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Logo URL</label><input className="input-field text-xs" value={siteSettings.logoUrl} onChange={e=>setSiteSettings({...siteSettings,logoUrl:e.target.value})} placeholder="https://..."/></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Favicon</label><ImageField label="Favicon" value={siteSettings.faviconUrl} onChange={v=>setSiteSettings({...siteSettings,faviconUrl:v})}/></div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div><label className="block text-xs font-semibold text-slate-700 mb-1">Dominio personalizado</label><div className="flex gap-2"><input className="input-field text-xs flex-1" value={siteSettings.domain} onChange={e=>setSiteSettings({...siteSettings,domain:e.target.value})} placeholder="www.midominio.com"/><button onClick={checkDomainDns} disabled={checkingDns||!siteSettings.domain} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 whitespace-nowrap">{checkingDns?"Verificando...":"Verificar"}</button></div></div>
                {dnsStatus==="checking"&&<div className="flex items-center gap-2 text-xs text-slate-500"><svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Verificando DNS...</div>}
                {dnsStatus==="ok"&&<div className="rounded-lg bg-green-50 border border-green-200 p-2.5"><p className="text-xs font-medium text-green-700">Dominio conectado</p><p className="text-xs text-green-600 mt-0.5">Tu sitio en <strong>https://{siteSettings.domain}</strong></p></div>}
                {dnsStatus==="error"&&<div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5"><p className="text-xs font-medium text-amber-700">DNS no configurado</p><p className="text-xs text-amber-600 mt-0.5">Apunta tu dominio al servidor y verifica de nuevo.</p></div>}
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3"><p className="text-xs font-medium text-slate-700 mb-0.5">SEO del sitio</p><p className="text-xs text-slate-500 mb-2">Los metadatos, títulos y OpenGraph se gestionan desde el módulo SEO.</p><Link href="/dashboard/seo" onClick={()=>{saveSiteSettings();setShowSettings(false)}} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"><HiOutlineCog className="h-3.5 w-3.5" />Ir al módulo SEO</Link></div>
              <button onClick={()=>{saveSiteSettings();setShowSettings(false)}} className="w-full btn-primary text-xs">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}


      <style jsx global>{`
        @keyframes fade-in{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}}.animate-fade-in{animation:fade-in .2s ease-out}
        @keyframes slide-in{from{transform:translateX(100%)}to{transform:translateX(0)}}.animate-slide-in{animation:slide-in .2s ease-out}
      `}</style>
    </div>
  );
}
