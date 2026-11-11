"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { BLOCK_TYPES, BLOCK_META, getBlockDefaultContent } from "@/components/blocks";
import { BlockRenderer } from "@/components/blocks/renderers/block-renderer";
import { TemplateGlobalStyles, templateWrapperClass } from "@/components/templates/template-global-styles";
import { DEFAULT_SITE_PALETTE, PALETTE_LABELS, PALETTE_PRESETS, hasExplicitPalette, resolveSitePalette, type PaletteRole, type SitePalette } from "@/lib/templates";
import { ImageField } from "@/components/blocks/editors/image-field";
import { HiOutlineEye, HiOutlinePlus, HiOutlineX, HiOutlineCog, HiOutlineArrowLeft, HiOutlineCheck, HiOutlineDocumentText, HiOutlineDuplicate, HiOutlineTrash } from "react-icons/hi";
import { EditorTopBar, type EditorDevice } from "@/components/editor/editor-top-bar";
import { SectionsSidebar } from "@/components/editor/sections-sidebar";
import { SectionSettings } from "@/components/editor/section-settings";
import { withDefaults } from "@/components/editor/template-fields";
import { CatalogContext, useCatalog, usesCatalog } from "@/components/editor/catalog";
import { LinkOptionsContext, type LinkOptions } from "@/components/editor/link-field";
import { SiteSettingsPanel, type SettingsTab } from "@/components/editor/site-settings-panel";
import { EditorTour } from "@/components/editor/editor-tour";
import { sitePublicUrl } from "@/lib/site-url";
import { DomainSearchModal } from "@/components/editor/domain-search-modal";
import { SectionPicker } from "@/components/editor/section-picker";
import { CanvasBlock } from "@/components/editor/canvas-block";
import { CanvasFrame } from "@/components/editor/canvas-frame";
import { genericPageBaseCss, isTemplateVariant, paletteCssVariables, renderGenericBlockHtml, renderTemplateVariantHtml, sanitizeTemplateContent, templateCanvasClass, TEMPLATE_SCHEMA, applyCatalogToContent } from "@/lib/templates";
import { useConfirm } from "@/components/providers/confirm-provider";
import { SHARED_BLOCK_TYPES, byOrder, patchBlock, remapBlockIds, sameJson, slugify, uniqueSlug, withSnapshotBlocks, type Block, type Site } from "@/components/editor/editor-model";
import { PagesModal } from "@/components/editor/pages-modal";
import { PublishedModal } from "@/components/editor/published-modal";

/** Id y título de una sección tal como se dibuja (para enlazarla desde un botón o menú). */
function sectionAnchor(type: string, content: any): { id: string; title: string } | null {
  try {
    const html = isTemplateVariant(content?.variant)
      ? renderTemplateVariantHtml(type, content, "")
      : renderGenericBlockHtml(type, sanitizeTemplateContent(content || {}), { apiBaseUrl: "" });
    const id = html && /\bid="([A-Za-z][\w-]*)"/.exec(html)?.[1];
    if (!id) return null;
    const heading = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i.exec(html || "")?.[1] || "";
    const title = heading.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 40);
    return { id, title };
  } catch {
    return null;
  }
}

export function SiteEditor({ siteId }: { siteId: string }) {
  const [site, setSite] = useState<Site | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<EditorDevice>("desktop");
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDomainSearch, setShowDomainSearch] = useState(false);
  const [publishedModal, setPublishedModal] = useState(false);
  const customizedRef = useRef(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("theme");
  const [showPagesModal, setShowPagesModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState({ name: "", primaryColor: "#2563EB", secondaryColor: "#1E40AF", logoUrl: "", faviconUrl: "", domain: "" });
  const [palette, setPalette] = useState<SitePalette>(DEFAULT_SITE_PALETTE);
  const [paletteDirty, setPaletteDirty] = useState(false);
  const [unpublishedBehavior, setUnpublishedBehavior] = useState<"404" | "maintenance">("404");
  const [history, setHistory] = useState<Site[]>([]);
  const [historyIdx, setHistoryIdxState] = useState(-1);
  const historyRef = useRef<Site[]>([]);
  const histPos = useRef(-1);
  
  const [dnsStatus, setDnsStatus] = useState<"idle"|"checking"|"ok"|"error">("idle");
  const [dnsResult, setDnsResult] = useState<any>(null);
  const [checkingDns, setCheckingDns] = useState(false);
  const pendingBlocksRef = useRef<Record<string, any>>({});
  const pendingSeoRef = useRef<{ seoTitle?: string; seoDesc?: string }>({});
  const inflightRef = useRef<Promise<void> | null>(null);
  const rerunRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savePendingRef = useRef<() => Promise<void>>(async () => {});
  const { confirm } = useConfirm();
  const syncingRef = useRef(false);
  const siteRef = useRef<Site | null>(null);
  const canvasDocRef = useRef<Document | null>(null);
  const [canvasDoc, setCanvasDoc] = useState<Document | null>(null);
  siteRef.current = site;

  /** Los bloques se dibujan dentro del iframe del lienzo. */
  const scrollToBlock = (id: string, block: ScrollLogicalPosition = "start") => {
    (canvasDocRef.current || document).getElementById(`block-${id}`)?.scrollIntoView({ behavior: "smooth", block });
  };

  const fetchSite = useCallback(async (keepPageId?: string) => {
    setLoading(true);
    try {
      const res: any = await api.get(`/sites/${siteId}`);
      const s = (res.data || res) as Site;
      setSite(s);
      // El borrador difiere de lo publicado (el público ve la copia del último "Publicar").
      setHasChanges(!!(s as any).hasUnpublishedChanges);
      historyRef.current = [JSON.parse(JSON.stringify(s))];
      histPos.current = 0;
      setHistory([...historyRef.current]);
      setHistoryIdxState(0);
      setSiteSettings({ name: s.name, primaryColor: s.primaryColor || "#2563EB", secondaryColor: s.secondaryColor || "#1E40AF", logoUrl: s.logoUrl || "", faviconUrl: s.faviconUrl || "", domain: s.domain || "" });
      setPalette(resolveSitePalette(s.settings, s.primaryColor, s.secondaryColor));
      setPaletteDirty(false);
      setUnpublishedBehavior((s.settings as any)?.unpublishedBehavior === "maintenance" ? "maintenance" : "404");
      if (s.pages.length > 0) setActivePageId((keepPageId && s.pages.some(p => p.id === keepPageId) ? keepPageId : null) || s.pages.find(p => p.isDefault)?.id || s.pages[0].id);
    } catch { setSite(null); }
    finally { setLoading(false); }
  }, [siteId]);

  useEffect(() => { fetchSite(); }, [fetchSite]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const coalesceRef = useRef<{ key: string; at: number } | null>(null);

  /**
   * Historial con referencias: evita duplicados (StrictMode) y conserva el estado inicial.
   * Con `coalesceKey`, los cambios seguidos del mismo campo (escribir en el panel) se juntan
   * en un solo paso de deshacer.
   */
  const pushHistory = useCallback((s: Site, coalesceKey?: string) => {
    const h = historyRef.current;
    const json = JSON.stringify(s);
    if (histPos.current >= 0 && JSON.stringify(h[histPos.current]) === json) return;
    const last = coalesceRef.current;
    const now = Date.now();
    coalesceRef.current = coalesceKey ? { key: coalesceKey, at: now } : null;
    if (coalesceKey && last && last.key === coalesceKey && now - last.at < 1500 && histPos.current === h.length - 1 && histPos.current > 0) {
      h[histPos.current] = JSON.parse(json);
      setHistory([...h]);
      return;
    }
    h.splice(histPos.current + 1);
    h.push(JSON.parse(json));
    if (h.length > 50) h.shift();
    histPos.current = h.length - 1;
    setHistory([...h]);
    setHistoryIdxState(histPos.current);
  }, []);

  /**
   * Lleva el servidor del estado `from` al estado `to`: borra, vuelve a crear, reordena y
   * actualiza estilos y contenido. Los bloques recreados reciben un id nuevo, que se
   * reemplaza en el historial para que deshacer/rehacer sigan funcionando.
   */
  const syncBlocks = async (from: Site, to: Site) => {
    const idMap = new Map<string, string>();
    for (const pg of to.pages) {
      const before = from.pages.find((p) => p.id === pg.id);
      if (!before) continue;
      const beforeById = new Map(before.blocks.map((b) => [b.id, b]));
      const targetIds = new Set(pg.blocks.map((b) => b.id));
      let structural = false;

      for (const b of before.blocks) {
        if (targetIds.has(b.id)) continue;
        delete pendingBlocksRef.current[b.id];
        await api.delete(`/blocks/${b.id}`);
        structural = true;
      }

      const ordered = [...pg.blocks].sort(byOrder);
      for (const b of ordered) {
        const prev = beforeById.get(b.id);
        if (!prev) {
          const res: any = await api.post(`/pages/${pg.id}/blocks`, { type: b.type, content: b.content, ...(b.styles ? { styles: b.styles } : {}) });
          idMap.set(b.id, (res.data || res).id);
          structural = true;
          continue;
        }
        if (!sameJson(prev.styles || {}, b.styles || {})) await api.put(`/blocks/${b.id}`, { styles: b.styles || {} });
        if (!sameJson(prev.content, b.content)) pendingBlocksRef.current[b.id] = b.content;
      }

      const beforeOrder = [...before.blocks].sort(byOrder).map((b) => b.id).filter((id) => targetIds.has(id));
      const afterOrder = ordered.map((b) => b.id).filter((id) => beforeById.has(id));
      if (structural || !sameJson(beforeOrder, afterOrder)) {
        await api.put(`/pages/${pg.id}/blocks/reorder`, { blockIds: ordered.map((b) => idMap.get(b.id) || b.id) });
      }
    }

    if (idMap.size > 0) {
      historyRef.current = historyRef.current.map((snap) => remapBlockIds(snap, idMap));
      setHistory([...historyRef.current]);
      setSite((p) => (p ? remapBlockIds(p, idMap) : p));
      setActiveBlockId((id) => (id && idMap.has(id) ? idMap.get(id)! : id));
    }
    setHasChanges(true);
    if (Object.keys(pendingBlocksRef.current).length > 0) { setDirty(true); scheduleSave(); }
  };

  const restoreHistory = async (pos: number) => {
    const current = siteRef.current;
    const snapshot = historyRef.current[pos];
    if (!current || !snapshot || syncingRef.current) return;
    syncingRef.current = true;
    const next = withSnapshotBlocks(current, snapshot);
    histPos.current = pos;
    setHistoryIdxState(pos);
    setSite(next);
    try {
      await syncBlocks(current, next);
    } catch (err: any) {
      setToast(err.response?.data?.message || "No se pudo deshacer en el servidor; se recargó el sitio");
      await fetchSite(activePageId || undefined);
    } finally {
      syncingRef.current = false;
    }
  };
  const restoreRef = useRef(restoreHistory);
  restoreRef.current = restoreHistory;

  const undo = useCallback(() => { if (histPos.current > 0) restoreRef.current(histPos.current - 1); }, []);
  const redo = useCallback(() => { if (histPos.current < historyRef.current.length - 1) restoreRef.current(histPos.current + 1); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
    };
    // El lienzo es un iframe: sus teclas no llegan a la ventana del editor.
    const canvasWin = canvasDoc?.defaultView;
    window.addEventListener("keydown", handler);
    canvasWin?.addEventListener("keydown", handler);
    return () => { window.removeEventListener("keydown", handler); canvasWin?.removeEventListener("keydown", handler); };
  }, [undo, redo, canvasDoc]);

  useEffect(() => { if (!dirty && !saving && !saveError) return; const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; }; window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h); }, [dirty, saving, saveError]);

  const activePage = site?.pages.find(p => p.id === activePageId);
  const sortedBlocks = activePage ? [...activePage.blocks].sort((a, b) => a.sortOrder - b.sortOrder) : [];
  const activeBlock = sortedBlocks.find(b => b.id === activeBlockId);

  /**
   * Destinos para los enlaces y botones: todas las páginas del sitio y, de cada una, sus
   * secciones (el id que tiene cada sección al dibujarse: #catalogo, #promociones…).
   */
  const linkOptions: LinkOptions = useMemo(() => {
    const pages = [...(site?.pages || [])].sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      pages: pages.map((pg) => {
        const path = pg.isDefault ? "/" : pg.path;
        const current = pg.id === activePageId;
        const seen = new Set<string>();
        const sections = [...pg.blocks].sort(byOrder).flatMap((b) => {
          if (b.styles?.hidden || b.type === "header" || b.type === "footer") return [];
          const anchor = sectionAnchor(b.type, b.content);
          if (!anchor || seen.has(anchor.id)) return [];
          seen.add(anchor.id);
          const name = BLOCK_META[b.type]?.label || b.type;
          return [{ label: anchor.title ? `${name}: ${anchor.title}` : name, value: current ? `#${anchor.id}` : `${path === "/" ? "" : path}/#${anchor.id}` }];
        });
        return { label: pg.isDefault ? `${pg.name} (inicio)` : pg.name, value: path, current, sections };
      }),
    };
  }, [site?.pages, activePageId]);

  // Productos en vivo: el lienzo muestra los mismos productos que el sitio publicado.
  const catalog = useCatalog(usesCatalog(site?.pages));
  const injectCatalog = (block: Block): Block => {
    const content = applyCatalogToContent(block.type, block.content, catalog.products);
    return content === block.content ? block : { ...block, content };
  };

  /** Plantilla de diseño del sitio (la de sus secciones) y los tipos de sección que sabe dibujar. */
  const siteVariant: string | undefined = (site?.pages || []).flatMap((pg) => pg.blocks).map((b) => b.content?.variant).find((v) => v && TEMPLATE_SCHEMA[v]);
  const allowedSectionTypes = siteVariant ? Object.keys(TEMPLATE_SCHEMA[siteVariant]).filter((t) => t !== "checkout" && t !== "sorteo-form") : undefined;

  const paletteActive = hasExplicitPalette(site?.settings) || paletteDirty;
  const variantPalette = paletteActive ? palette : undefined;

  const blogCfg = (site?.settings as any)?.blog;
  const injectBlogNav = (block: Block): Block => {
    if (!site || blogCfg?.enabled !== true || block.type !== "header") return block;
    const url = `${sitePublicUrl(site).replace(/\/+$/, "")}/${blogCfg.slug || "blog"}`;
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

  /** Guarda lo pendiente de a una tanda por vez; si llegan cambios mientras guarda, repite al terminar. */
  const savePending = useCallback((): Promise<void> => {
    if (inflightRef.current) { rerunRef.current = true; return inflightRef.current; }
    const run = async () => {
      do {
        rerunRef.current = false;
        const blocks = { ...pendingBlocksRef.current };
        const seo = { ...pendingSeoRef.current };
        const hasSeo = !!(seo.seoTitle || seo.seoDesc);
        if (Object.keys(blocks).length === 0 && !hasSeo) break;
        setSaving(true);
        try {
          for (const [id, content] of Object.entries(blocks)) {
            try { await api.put(`/blocks/${id}`, { content }); }
            catch (err: any) {
              // El bloque ya no existe (se borró en otra pestaña): no tiene sentido reintentar.
              if (err.response?.status === 404) { if (pendingBlocksRef.current[id] === content) delete pendingBlocksRef.current[id]; continue; }
              throw err;
            }
          }
          if (hasSeo) await api.put(`/seo/sites/${siteId}`, seo);
          // Solo se descarta lo que no cambió mientras se guardaba.
          for (const [id, content] of Object.entries(blocks)) if (pendingBlocksRef.current[id] === content) delete pendingBlocksRef.current[id];
          if (hasSeo && pendingSeoRef.current.seoTitle === seo.seoTitle && pendingSeoRef.current.seoDesc === seo.seoDesc) pendingSeoRef.current = {};
          setLastSaved(new Date());
          setSaveError(false);
        } catch (err: any) {
          setSaveError(true);
          setToast(err.response?.data?.message || "No se pudo guardar. Reintentando…");
          retryRef.current = setTimeout(() => { savePendingRef.current(); }, 5000);
          break;
        }
      } while (rerunRef.current);
      setDirty(Object.keys(pendingBlocksRef.current).length > 0 || !!(pendingSeoRef.current.seoTitle || pendingSeoRef.current.seoDesc));
      setSaving(false);
    };
    const p = run().finally(() => { inflightRef.current = null; });
    inflightRef.current = p;
    return p;
  }, [siteId]);
  savePendingRef.current = savePending;

  /** Programa un guardado automático 1,2 s después del último cambio. */
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null; }
    saveTimerRef.current = setTimeout(() => { savePendingRef.current(); }, 1200);
  }, []);

  // Al salir de la pestaña o cerrar, intenta guardar lo pendiente.
  useEffect(() => {
    const flush = () => { if (document.visibilityState === "hidden") savePendingRef.current(); };
    document.addEventListener("visibilitychange", flush);
    return () => { document.removeEventListener("visibilitychange", flush); if (saveTimerRef.current) clearTimeout(saveTimerRef.current); if (retryRef.current) clearTimeout(retryRef.current); };
  }, []);

  const addPage = async (rawName: string) => {
    const name = rawName.trim();
    if (!name) return;
    const slug = uniqueSlug(site?.pages || [], slugify(name));
    try {
      const res: any = await api.post(`/sites/${siteId}/pages`, { name, slug });
      const page = res.data || res;
      setSite(p => p ? { ...p, pages: [...p.pages, { ...page, blocks: [] }] } : p);
      setActivePageId(page.id);
      setActiveBlockId(null);
      setHasChanges(true);
      setToast("Página creada");

      // Enlace en el menú: el header es compartido, el API lo copia a todas las páginas.
      const headerBlock = site?.pages.find(p => p.isDefault)?.blocks.find(b => b.type === "header");
      if (headerBlock) {
        const links = Array.isArray(headerBlock.content?.links) ? headerBlock.content.links : [];
        const content = { ...headerBlock.content, links: [...links, { label: name, url: `/${slug}` }] };
        await api.put(`/blocks/${headerBlock.id}`, { content });
        setSite(p => (p ? patchBlock(p, headerBlock.id, { content }) : p));
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
      setHasChanges(true);
      setToast("Página eliminada");
    } catch (err: any) { setToast(err.response?.data?.message || "Error al eliminar"); }
  };

  const duplicatePage = async (pageId: string) => {
    const page = site?.pages.find(p => p.id === pageId);
    if (!page) return;
    try {
      // Sin `path`: el API lo arma con el slug; con el del original habría dos páginas en la misma ruta.
      const res: any = await api.post(`/sites/${siteId}/pages`, { name: `${page.name} (copia)`, slug: uniqueSlug(site?.pages || [], `${page.slug}-copia`) });
      const newP = res.data || res;
      // En orden y de a uno: el API calcula la posición con los bloques que ya existen.
      for (const b of [...page.blocks].sort(byOrder)) {
        await api.post(`/pages/${newP.id}/blocks`, { type: b.type, content: JSON.parse(JSON.stringify(b.content)), ...(b.styles ? { styles: b.styles } : {}) });
      }
      await fetchSite(newP.id);
      setHasChanges(true);
      setToast("Página duplicada");
    } catch (err: any) { setToast(err.response?.data?.message || "Error al duplicar"); }
  };

  const updateBlock = (blockId: string, content: any, opts: { coalesce?: boolean } = {}) => {
    setSite(p => {
      if (!p) return p;
      const next = patchBlock(p, blockId, { content });
      pushHistory(next, opts.coalesce ? `block:${blockId}` : undefined);
      return next;
    });
    pendingBlocksRef.current[blockId] = content;
    setDirty(true);
    setHasChanges(true);
    scheduleSave();
    if (!customizedRef.current && site && !site.settings?.setup?.customized) {
      customizedRef.current = true;
      const settings = { ...(site.settings || {}), setup: { ...(site.settings?.setup || {}), customized: true } };
      setSite(p => (p ? { ...p, settings } : p));
      api.put(`/sites/${siteId}`, { settings }).catch(() => { customizedRef.current = false; });
    }
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
    setHasChanges(true);
  };

  const addBlock = async (type: string) => {
    if (!activePageId) return;
    const afterIndex = insertAfterIndex;
    try {
      let content = getBlockDefaultContent(type as any);
      const tmplVariant = siteVariant;
      // Con plantilla de diseño propio: la sección nueva trae el contenido de ejemplo de la plantilla.
      if (tmplVariant && !content.variant) content = { ...content, ...withDefaults(type, { variant: tmplVariant }) };
      const res: any = await api.post(`/pages/${activePageId}/blocks`, { type, content, ...(afterIndex !== null ? { afterIndex } : {}) });
      const newBlock = (res.data || res) as Block;
      insertLocal(newBlock, afterIndex);
      setActiveBlockId(newBlock.id);
      setTimeout(() => scrollToBlock(newBlock.id, "center"), 50);
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
      const res: any = await api.post(`/pages/${activePageId}/blocks`, { type: src.type, content: JSON.parse(JSON.stringify(src.content)), afterIndex: idx, ...(src.styles ? { styles: src.styles } : {}) });
      const copy = (res.data || res) as Block;
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
    if (styles.hidden && SHARED_BLOCK_TYPES.has(block.type) && (site?.pages.length || 0) > 1) {
      const label = block.type === "header" ? "el encabezado" : "el pie de página";
      const ok = await confirm({ title: `Ocultar ${label}`, message: `${label[0].toUpperCase()}${label.slice(1)} es el mismo en todas las páginas: se ocultará en todo el sitio. ¿Continuar?` });
      if (!ok) return;
    }
    try {
      await api.put(`/blocks/${blockId}`, { styles });
      setSite(p => {
        if (!p) return p;
        const next = patchBlock(p, blockId, { styles });
        pushHistory(next);
        return next;
      });
      setHasChanges(true);
      setToast(styles.hidden ? "Sección oculta (no se publicará)" : "Sección visible");
    } catch (err: any) { setToast(err.response?.data?.message || "Error al actualizar"); }
  };

  const deleteBlock = async (blockId: string) => {
    if (!(await confirm({ title: "Eliminar bloque", message: "¿Eliminar este bloque?" }))) return;
    try {
      delete pendingBlocksRef.current[blockId];
      await api.delete(`/blocks/${blockId}`);
      setSite(p => {
        if (!p) return p;
        const next = { ...p, pages: p.pages.map(pg => ({ ...pg, blocks: pg.blocks.filter(b => b.id !== blockId) })) };
        pushHistory(next);
        return next;
      });
      if (activeBlockId === blockId) setActiveBlockId(null);
      setHasChanges(true);
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
    setHasChanges(true);

    try {
      await api.put(`/pages/${activePageId}/blocks/reorder`, { blockIds });
    } catch (err: any) { setToast(err.response?.data?.message || "Error al reordenar"); fetchSite(); }
  };


  const publish = async () => {
    setPublishing(true);
    try {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      await savePending();
      if (Object.keys(pendingBlocksRef.current).length > 0) { setToast("Hay cambios sin guardar; inténtalo de nuevo en unos segundos"); return; }
      const firstPublish = !site?.isPublished;
      await api.post(`/sites/${siteId}/publish`);
      setSite(p => p ? { ...p, isPublished: true } : p);
      setHasChanges(false);
      if (firstPublish) setPublishedModal(true);
      else setToast("¡Cambios publicados!");
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

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#f7f7f7]"><div className="text-center"><svg className="animate-spin h-8 w-8 text-[color:var(--color-primary)] mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><p className="text-sm text-[#616161]">Cargando editor...</p></div></div>;
  if (!site) return <div className="flex h-screen items-center justify-center bg-[#f7f7f7]"><div className="text-center"><h2 className="text-xl font-semibold text-[#303030] mb-2">Sitio no encontrado</h2><Link href="/dashboard/sites" className="btn-primary inline-flex items-center gap-1.5"><HiOutlineArrowLeft className="h-4 w-4" /> Volver</Link></div></div>;

  // La vista previa muestra lo guardado hoy, también cuando el sitio aún es un borrador.
  const openPreview = () => window.open(`/dashboard/sites/${siteId}/preview`, "_blank");
  const hasPages = site.pages.length > 0;
  const publicUrl = sitePublicUrl(site);
  const guide = [
    { id: "template", label: "Elegiste tu plantilla", hint: "", done: true },
    { id: "customize", label: "Personaliza tu sitio", hint: "Haz clic en un texto o imagen de la página para cambiarlo.", done: !!site.settings?.setup?.customized },
    { id: "domain", label: "Conecta tu dominio", hint: "Busca y compra tu dirección propia, ej. minegocio.com.", done: !!site.domain, actionLabel: "Buscar dominio", onAction: () => setShowDomainSearch(true) },
    { id: "publish", label: "Publica tu sitio", hint: "Así tus clientes podrán verlo en internet.", done: site.isPublished, actionLabel: "Publicar", onAction: () => publish() },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-white">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-[#1a1a1a] text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg animate-fade-in">{toast}</div>}

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
        hasChanges={hasChanges}
        saveError={saveError}
        lastSaved={lastSaved}
        publishing={publishing}
        onRetry={() => savePending()}
        onPublish={publish}
        onUnpublish={unpublish}
        onPreview={openPreview}
        guide={guide}
        onTheme={() => { setSettingsTab("theme"); setShowSettings(true); }}
        onSettings={() => { setSettingsTab("config"); setShowSettings(true); }}
      />

      <EditorTour ready={!loading && !!site} />

      <div className="flex min-h-0 flex-1">
        {/* Barra izquierda (como Shopify): lista de secciones o ajustes de la sección elegida. */}
        <aside data-tour="sections" className="flex w-[300px] flex-shrink-0 flex-col border-r border-[#e3e3e3] bg-white">
          {activeBlock ? (
            <LinkOptionsContext.Provider value={linkOptions}>
            <CatalogContext.Provider value={catalog}>
            <SectionSettings
              key={activeBlock.id}
              block={activeBlock}
              hidden={!!activeBlock.styles?.hidden}
              onChange={(c) => updateBlock(activeBlock.id, c, { coalesce: true })}
              onBack={() => setActiveBlockId(null)}
              onToggleHidden={() => toggleHidden(activeBlock.id)}
              onDuplicate={() => duplicateBlock(activeBlock.id)}
              onDelete={() => deleteBlock(activeBlock.id)}
            />
            </CatalogContext.Provider>
            </LinkOptionsContext.Provider>
          ) : (
            <SectionsSidebar
              pageName={activePage?.name}
              blocks={sortedBlocks.map(b => ({ id: b.id, type: b.type, hidden: !!b.styles?.hidden }))}
              activeBlockId={activeBlockId}
              onSelect={(id) => { setActiveBlockId(id); scrollToBlock(id); }}
              onReorder={reorderBlocks}
              onDuplicate={duplicateBlock}
              onToggleHidden={toggleHidden}
              onDelete={deleteBlock}
              onAdd={() => openPicker()}
            />
          )}
        </aside>

        {/* CANVAS: iframe para que la vista móvil use los breakpoints reales */}
        <main data-tour="canvas" className={`flex min-w-0 flex-1 justify-center overflow-hidden bg-[#f1f1f1] ${device === "mobile" ? "py-6" : "p-3"}`} onClick={() => setActiveBlockId(null)}>
          <CanvasFrame
            onDocument={(doc) => { canvasDocRef.current = doc; setCanvasDoc(doc); }}
            className={`block h-full border-0 bg-white transition-all duration-200 ${device === "mobile" ? "w-[390px] max-w-full rounded-[20px] shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_12px_32px_-8px_rgba(0,0,0,0.25)]" : "w-full rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_12px_-4px_rgba(0,0,0,0.12)]"}`}
          >
          <div
            className={`min-h-screen bg-white ${templateWrapperClass(site?.settings?.globalStyles, activePage?.path)} ${templateCanvasClass(activePage?.blocks?.[0]?.content?.variant)}`}
            onClick={(e) => e.stopPropagation()}
          >
            <TemplateGlobalStyles
              globalStyles={site?.settings?.globalStyles}
              pagePath={activePage?.path}
              palette={paletteActive ? palette : undefined}
              colors={paletteActive ? undefined : { primary: siteSettings.primaryColor, secondary: siteSettings.secondaryColor }}
            />
            {/* Sitios sin plantilla de diseño propio: el mismo CSS base que la página publicada. */}
            {!isTemplateVariant(activePage?.blocks?.[0]?.content?.variant) && (
              <style>{genericPageBaseCss(
                { primary: paletteActive ? palette.primary : siteSettings.primaryColor, secondary: paletteActive ? palette.secondary : siteSettings.secondaryColor, accent: palette.accent },
                paletteActive ? paletteCssVariables(palette) : "",
              )}</style>
            )}
            {activePage && sortedBlocks.length > 0 ? (
              <>
                {sortedBlocks.map((block, idx) => (
                  <CanvasBlock key={block.id} block={injectBlogNav(injectCatalog(block))} active={activeBlockId === block.id} hidden={!!block.styles?.hidden} sourceContent={block.content} onSelect={setActiveBlockId} onInsertAfter={() => openPicker(idx)} onContentChange={updateBlock} palette={variantPalette} />
                ))}
                <button onClick={() => openPicker()} className="flex w-full items-center justify-center gap-2 border-t-2 border-dashed border-[#e3e3e3] py-6 text-sm font-medium text-[#8a8a8a] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-primary)_5%,transparent)] hover:text-[color:var(--color-primary)]">
                  <HiOutlinePlus className="h-4 w-4" /> Agregar sección
                </button>
              </>
            ) : (
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="max-w-sm py-16 text-center">
                  <h3 className="mb-2 text-lg font-bold text-[#303030]">{hasPages ? "Esta página está vacía" : "Crea tu primera página"}</h3>
                  <p className="mb-6 text-sm text-[#616161]">{hasPages ? "Agrega una sección para empezar a diseñar." : "Necesitas al menos una página para editar tu sitio."}</p>
                  {hasPages
                    ? <button onClick={() => openPicker()} className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"><HiOutlinePlus className="h-4 w-4" /> Agregar sección</button>
                    : <button onClick={() => setShowPagesModal(true)} className="rounded-lg bg-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">+ Crear página</button>}
                </div>
              </div>
            )}
          </div>
          </CanvasFrame>
        </main>

        {/* TEMA Y CONFIGURACIÓN DEL SITIO */}
        {showSettings && (
          <SiteSettingsPanel
            tab={settingsTab}
            onTabChange={setSettingsTab}
            onClose={() => { setShowSettings(false); saveSiteSettings(); }}
            onSave={() => { saveSiteSettings(); }}
            form={siteSettings}
            onFormChange={setSiteSettings}
            palette={palette}
            onPreset={(pl) => { setPalette(pl); setPaletteDirty(true); }}
            onColor={updatePaletteColor}
            unpublishedBehavior={unpublishedBehavior}
            onUnpublishedBehavior={setUnpublishedBehavior}
            dnsStatus={dnsStatus}
            checkingDns={checkingDns}
            onCheckDns={checkDomainDns}
            onBuyDomain={() => setShowDomainSearch(true)}
          />
        )}

      </div>

      {showDomainSearch && <DomainSearchModal siteId={siteId} initialQuery={site.name} onClose={() => setShowDomainSearch(false)} />}

      {publishedModal && (
        <PublishedModal
          publicUrl={publicUrl}
          hasDomain={!!site.domain}
          onClose={() => setPublishedModal(false)}
          onBuyDomain={() => { setPublishedModal(false); setShowDomainSearch(true); }}
        />
      )}

      {/* BLOCK PALETTE MODAL */}
      {showAddBlock && <SectionPicker onAdd={addBlock} onClose={() => setShowAddBlock(false)} allowedTypes={allowedSectionTypes} />}

      {/* PAGES MODAL */}
      {showPagesModal && (
        <PagesModal
          pages={site.pages}
          activePageId={activePageId}
          publicUrl={site.isPublished ? publicUrl : null}
          onClose={() => setShowPagesModal(false)}
          onSelect={(id) => { setActivePageId(id); setActiveBlockId(null); setShowPagesModal(false); }}
          onAddPage={addPage}
          onDuplicate={duplicatePage}
          onDelete={deletePage}
          onOpenSettings={() => { setSettingsTab("config"); setShowSettings(true); setShowPagesModal(false); }}
        />
      )}

      <style jsx global>{`
        @keyframes fade-in{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}}.animate-fade-in{animation:fade-in .2s ease-out}
        @keyframes slide-in{from{transform:translateX(100%)}to{transform:translateX(0)}}.animate-slide-in{animation:slide-in .2s ease-out}
      `}</style>
    </div>
  );
}
