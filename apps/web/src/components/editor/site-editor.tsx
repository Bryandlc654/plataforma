"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { BLOCK_TYPES, BLOCK_META, getBlockDefaultContent } from "@/components/blocks";
import { BlockRenderer } from "@/components/blocks/renderers/block-renderer";
import { BlockEditor } from "@/components/blocks/editors/block-editor";
import { ImageField } from "@/components/blocks/editors/image-field";
import { HiOutlineEye, HiOutlinePlus, HiOutlineX, HiOutlineCog, HiOutlineArrowLeft, HiOutlineCheck, HiOutlineDocumentText, HiOutlineDuplicate, HiOutlineTrash, HiOutlineArrowUp, HiOutlineArrowDown } from "react-icons/hi";
import { useConfirm } from "@/components/providers/confirm-provider";

interface Block { id: string; type: string; content: any; styles: any; sortOrder: number; }
interface SitePage { id: string; name: string; slug: string; path: string; isDefault: boolean; sortOrder: number; blocks: Block[]; }
interface Site { id: string; name: string; subdomain: string; domain?: string; isPublished: boolean; primaryColor: string; secondaryColor?: string; logoUrl?: string; faviconUrl?: string; seoTitle?: string; seoDesc?: string; pages: SitePage[]; }

const blockCategories: Record<string, string[]> = {
  "Encabezado": ["hero", "header"],
  "Contenido": ["services", "features", "stats", "portfolio", "benefits", "process", "about", "faq", "testimonials", "gallery", "image", "video"],
  "Conversión": ["cta", "pricing", "contact", "form", "review-form"],
  "Social": ["whatsapp", "team"],
  "Estructura": ["footer"],
};

function BlockWrapper({ block, activeBlockId, onSelect, onMoveUp, onMoveDown, onDelete, isFirst, isLast }: {
  block: Block; activeBlockId: string | null;
  onSelect: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="group relative">
      <div className={`absolute -top-10 left-0 right-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20 ${activeBlockId === block.id ? "opacity-100" : ""}`}>
        <div className="flex items-center gap-0.5 bg-white rounded-xl border border-slate-200 shadow-lg px-2 py-1">
          <span className="text-xs text-slate-500 px-2 font-medium">{BLOCK_META[block.type]?.label || block.type}</span>
        </div>
        <div className="flex items-center gap-0.5 bg-white rounded-xl border border-slate-200 shadow-lg px-1 py-0.5">
          {!isFirst && (
            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Mover arriba">
              <HiOutlineArrowUp className="h-3.5 w-3.5" />
            </button>
          )}
          {!isLast && (
            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Mover abajo">
              <HiOutlineArrowDown className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar bloque">
            <HiOutlineTrash className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div onClick={() => onSelect(block.id)} className={`rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${activeBlockId === block.id ? "ring-2 ring-primary-500 ring-offset-2 shadow-lg" : "ring-1 ring-slate-200 hover:ring-slate-300 shadow-sm"}`}>
        <BlockRenderer type={block.type} content={block.content} />
      </div>
    </div>
  );
}

function BlockPalette({ onAdd, onClose }: { onAdd: (type: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = Object.entries(blockCategories).map(([cat, types]) => ({
    cat,
    types: types.filter(t => !search || BLOCK_META[t]?.label?.toLowerCase().includes(search.toLowerCase()) || t.includes(search.toLowerCase())),
  })).filter(g => g.types.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[75vh] flex flex-col m-4 z-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-semibold text-sm text-slate-900">Agregar bloque</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600"><HiOutlineX className="h-4 w-4" /></button>
        </div>
        <div className="p-3 border-b border-slate-100">
          <input className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20" placeholder="Buscar bloque..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {filtered.map(({ cat, types }) => (
            <div key={cat}>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">{cat}</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {types.map(type => (
                  <button key={type} onClick={() => { onAdd(type); onClose(); }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-primary-50 hover:border-primary-200 border border-slate-100 transition-all group">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">{BLOCK_META[type]?.icon === "Megaphone" ? "📢" : BLOCK_META[type]?.icon === "HelpCircle" ? "❓" : BLOCK_META[type]?.icon === "Star" ? "⭐" : BLOCK_META[type]?.icon === "Mail" ? "✉️" : BLOCK_META[type]?.icon === "Users" ? "👥" : BLOCK_META[type]?.icon === "DollarSign" ? "💰" : BLOCK_META[type]?.icon === "Image" ? "🖼️" : BLOCK_META[type]?.icon === "Play" ? "▶️" : "📦"}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 group-hover:text-primary-700 truncate">{BLOCK_META[type]?.label || type}</p>
                      <p className="text-[10px] text-slate-400 truncate">{BLOCK_META[type]?.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SiteEditor({ siteId }: { siteId: string }) {
  const [site, setSite] = useState<Site | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddBlock, setShowAddBlock] = useState(false);
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

  const addBlock = async (type: string) => {
    if (!activePageId) return;
    try {
      const content = getBlockDefaultContent(type as any);
      const res: any = await api.post(`/pages/${activePageId}/blocks`, { type, content });
      const newBlock = res.data || res;
      setSite(p => {
        if (!p) return p;
        const next = { ...p, pages: p.pages.map(pg => pg.id === activePageId ? { ...pg, blocks: [...pg.blocks, newBlock] } : pg) };
        pushHistory(next);
        return next;
      });
      setDirty(true);
      setToast(`${BLOCK_META[type]?.label || type} agregado`);
    } catch (err: any) { setToast(err.response?.data?.message || "Error al agregar bloque"); }
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

  const moveBlock = async (blockId: string, direction: "up" | "down") => {
    if (!activePageId || !activePage) return;
    const sorted = [...activePage.blocks].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(b => b.id === blockId);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const newOrder = [...sorted];
    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];
    const blockIds = newOrder.map(b => b.id);

    const reorderedBlocks = newOrder.map((b, i) => ({ ...b, sortOrder: i }));

    setSite(p => {
      if (!p) return p;
      const next = { ...p, pages: p.pages.map(pg => pg.id === activePageId ? { ...pg, blocks: reorderedBlocks } : pg) };
      pushHistory(next);
      return next;
    });
    setDirty(true);

    try {
      await api.put(`/pages/${activePageId}/blocks/reorder`, { blockIds });
    } catch (err: any) { setToast(err.response?.data?.message || "Error al reordenar"); }
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
      await api.put(`/sites/${siteId}`, siteSettings);
      setSite(p => p ? { ...p, ...siteSettings, domain: siteSettings.domain || undefined } : p);
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
    <div className="flex flex-col h-dvh overflow-hidden bg-white">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg animate-fade-in">{toast}</div>}

      {/* TOP TOOLBAR */}
      <div className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/sites" className="text-slate-400 hover:text-slate-600 p-1"><HiOutlineArrowLeft className="h-4 w-4" /></Link>
          <span className="font-medium text-sm text-slate-700 truncate max-w-[200px]">{site.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${site.isPublished?"bg-green-50 text-green-700":"bg-amber-50 text-amber-700"}`}>{site.isPublished?"Publicado":"Borrador"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPagesModal(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"><HiOutlineDocumentText className="h-3.5 w-3.5" />Páginas ({site.pages.length})</button>
          <button onClick={openPreview} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"><HiOutlineEye className="h-3.5 w-3.5" />Preview</button>
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg">
            <button onClick={undo} disabled={historyIdx <= 0} className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Deshacer (Ctrl+Z)">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
            </button>
            <button onClick={redo} disabled={historyIdx >= history.length - 1} className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Rehacer (Ctrl+Shift+Z)">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" /></svg>
            </button>
          </div>
          {saving?<span className="text-[10px] text-slate-400 flex items-center gap-1"><svg className="animate-spin h-2.5 w-2.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Guardando</span>:dirty?<span className="text-[10px] text-amber-500">Cambios sin guardar</span>:lastSaved?<span className="text-[10px] text-slate-400">Guardado {(()=>{const s=Math.floor((Date.now()-lastSaved.getTime())/1000);return s<5?"ahora":s<60?`hace ${s}s`:`hace ${Math.floor(s/60)}min`})()}</span>:null}
          {dirty&&<button onClick={()=>savePending()} disabled={saving} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-60"><HiOutlineCheck className="h-3.5 w-3.5" />Guardar</button>}
          {!dirty&&site.isPublished?<button onClick={unpublish} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">Despublicar</button>:<button onClick={publish} disabled={publishing||saving} className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 shadow-sm transition-colors disabled:opacity-60">{publishing?<><svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Publicando...</>:<><HiOutlineCheck className="h-3.5 w-3.5"/>{dirty?"Publicar cambios":site.isPublished?"Actualizar":"Publicar"}</>}</button>}
        </div>
      </div>

      {/* CANVAS */}
      <div className={`flex-1 overflow-y-auto bg-slate-100/50 ${activePage?.blocks?.[0]?.content?.variant === 'art-culinaire' ? 'theme-art-culinaire bg-background font-body-md text-body-md' : ''}`}>
        {activePage && sortedBlocks.length > 0 ? (
          <div className="max-w-6xl mx-auto py-8 px-6 space-y-6">
            {sortedBlocks.map((block, idx) => (
              <BlockWrapper
                key={block.id}
                block={block}
                activeBlockId={activeBlockId}
                onSelect={setActiveBlockId}
                onMoveUp={() => moveBlock(block.id, "up")}
                onMoveDown={() => moveBlock(block.id, "down")}
                onDelete={() => deleteBlock(block.id)}
                isFirst={idx === 0}
                isLast={idx === sortedBlocks.length - 1}
              />
            ))}
            <button onClick={() => setShowAddBlock(true)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50/30 transition-all flex items-center justify-center gap-2">
              <HiOutlinePlus className="h-4 w-4" /> Agregar bloque
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full"><div className="text-center py-16 max-w-sm"><div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5"><svg className="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg></div><h3 className="text-lg font-bold text-slate-700 mb-2">{hasPages?"Página vacía":"Creá tu primera página"}</h3><p className="text-sm text-slate-500 mb-6">Esta página no tiene bloques.</p><div className="flex flex-col gap-2">{hasPages ? <button onClick={() => setShowAddBlock(true)} className="btn-primary text-sm flex items-center justify-center gap-1.5"><HiOutlinePlus className="h-4 w-4" /> Agregar bloque</button> : <button onClick={()=>setShowPagesModal(true)} className="btn-primary text-sm">+ Crear página</button>}</div></div></div>
        )}
      </div>

      {/* BLOCK PALETTE MODAL */}
      {showAddBlock && <BlockPalette onAdd={addBlock} onClose={() => setShowAddBlock(false)} />}

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
              <div className="flex gap-3"><div className="flex-1"><label className="block text-xs font-medium text-slate-600 mb-1">Color primario</label><div className="flex gap-2"><input type="color" className="h-8 w-8 rounded border-0 p-0 cursor-pointer" value={siteSettings.primaryColor} onChange={e=>setSiteSettings({...siteSettings,primaryColor:e.target.value})}/><input className="input-field text-xs flex-1" value={siteSettings.primaryColor} onChange={e=>setSiteSettings({...siteSettings,primaryColor:e.target.value})}/></div></div><div className="flex-1"><label className="block text-xs font-medium text-slate-600 mb-1">Color secundario</label><div className="flex gap-2"><input type="color" className="h-8 w-8 rounded border-0 p-0 cursor-pointer" value={siteSettings.secondaryColor} onChange={e=>setSiteSettings({...siteSettings,secondaryColor:e.target.value})}/><input className="input-field text-xs flex-1" value={siteSettings.secondaryColor} onChange={e=>setSiteSettings({...siteSettings,secondaryColor:e.target.value})}/></div></div></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Logo URL</label><input className="input-field text-xs" value={siteSettings.logoUrl} onChange={e=>setSiteSettings({...siteSettings,logoUrl:e.target.value})} placeholder="https://..."/></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Favicon</label><ImageField label="Favicon" value={siteSettings.faviconUrl} onChange={v=>setSiteSettings({...siteSettings,faviconUrl:v})}/></div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div><label className="block text-xs font-semibold text-slate-700 mb-1">Dominio personalizado</label><div className="flex gap-2"><input className="input-field text-xs flex-1" value={siteSettings.domain} onChange={e=>setSiteSettings({...siteSettings,domain:e.target.value})} placeholder="www.midominio.com"/><button onClick={checkDomainDns} disabled={checkingDns||!siteSettings.domain} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 whitespace-nowrap">{checkingDns?"Verificando...":"Verificar"}</button></div></div>
                {dnsStatus==="checking"&&<div className="flex items-center gap-2 text-xs text-slate-500"><svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Verificando DNS...</div>}
                {dnsStatus==="ok"&&<div className="rounded-lg bg-green-50 border border-green-200 p-2.5"><p className="text-xs font-medium text-green-700">Dominio conectado</p><p className="text-xs text-green-600 mt-0.5">Tu sitio en <strong>https://{siteSettings.domain}</strong></p></div>}
                {dnsStatus==="error"&&<div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5"><p className="text-xs font-medium text-amber-700">DNS no configurado</p><p className="text-xs text-amber-600 mt-0.5">Apunta tu dominio al servidor y verifica de nuevo.</p></div>}
              </div>
              <div className="flex gap-2"><input className="input-field text-xs flex-1" placeholder="Título SEO" value={site.seoTitle||""} onChange={e=>{setSite({...site,seoTitle:e.target.value});pendingSeoRef.current.seoTitle=e.target.value;setDirty(true);}}/><input className="input-field text-xs flex-1" placeholder="Descripción SEO" value={site.seoDesc||""} onChange={e=>{setSite({...site,seoDesc:e.target.value});pendingSeoRef.current.seoDesc=e.target.value;setDirty(true);}}/></div>
              <button onClick={()=>{saveSiteSettings();setShowSettings(false)}} className="w-full btn-primary text-xs">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK EDITOR - slide from right */}
      {activeBlock && <>
        <div className="fixed inset-0 z-40 bg-black/20" onClick={()=>setActiveBlockId(null)}/>
        <aside className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white border-l border-slate-200 shadow-2xl overflow-y-auto animate-slide-in">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10"><div className="flex items-center justify-between"><h3 className="font-semibold text-sm text-slate-900">{BLOCK_META[activeBlock.type]?.label||activeBlock.type}</h3><button onClick={()=>setActiveBlockId(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600"><HiOutlineX className="h-4 w-4"/></button></div><p className="text-xs text-slate-400 mt-0.5">{BLOCK_META[activeBlock.type]?.description}</p></div>
          <BlockEditor type={activeBlock.type} content={activeBlock.content} onChange={c=>updateBlock(activeBlock.id,c)} />
        </aside>
      </>}

      <style jsx global>{`
        @keyframes fade-in{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}}.animate-fade-in{animation:fade-in .2s ease-out}
        @keyframes slide-in{from{transform:translateX(100%)}to{transform:translateX(0)}}.animate-slide-in{animation:slide-in .2s ease-out}
      `}</style>
    </div>
  );
}
