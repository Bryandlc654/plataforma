"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { HiOutlineArrowLeft } from "react-icons/hi";
import api from "@/lib/api";
import { BlockRenderer } from "@/components/blocks/renderers/block-renderer";
import { useCatalog, usesCatalog } from "@/components/editor/catalog";
import { applyCatalogToContent } from "@/lib/templates";
import { TemplateGlobalStyles, templateWrapperClass } from "@/components/templates/template-global-styles";
import { hasExplicitPalette, resolveSitePalette } from "@/lib/templates";

interface Block { id: string; type: string; content: any; styles?: any; sortOrder: number; }
interface Page { id: string; name: string; path: string; isDefault: boolean; sortOrder: number; blocks: Block[]; }
interface Site { id: string; name: string; isPublished: boolean; primaryColor: string; secondaryColor?: string; settings?: any; pages: Page[]; }

/** Vista previa del sitio tal como está guardado ahora (sirve también para borradores sin publicar). */
export default function SitePreviewPage() {
  const { siteId } = useParams() as { siteId: string };
  const [site, setSite] = useState<Site | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);
  // Productos en vivo: los mismos que mostrará el sitio publicado.
  const catalog = useCatalog(usesCatalog(site?.pages as any));
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/sites/${siteId}`)
      .then((res: any) => {
        const s = (res.data || res) as Site;
        setSite(s);
        setPageId((s.pages.find((p) => p.isDefault) || s.pages[0])?.id || null);
      })
      .catch((err: any) => setError(err.response?.data?.message || "No se pudo cargar la vista previa."));
  }, [siteId]);

  const page = site?.pages.find((p) => p.id === pageId);
  const blocks = useMemo(
    () => (page ? [...page.blocks].sort((a, b) => a.sortOrder - b.sortOrder).filter((b) => !b.styles?.hidden) : []),
    [page],
  );

  if (error) return <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-[#616161]">{error}</div>;
  if (!site) return <div className="flex min-h-screen items-center justify-center text-sm text-[#8a8a8a]">Cargando vista previa…</div>;

  const palette = hasExplicitPalette(site.settings) ? resolveSitePalette(site.settings, site.primaryColor, site.secondaryColor) : undefined;
  const pages = [...site.pages].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-white">
      <div className="fixed inset-x-0 top-0 z-[9999] flex items-center justify-between gap-3 bg-[color:var(--color-primary)] px-4 py-2.5 text-white shadow-lg">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/dashboard/sites/${siteId}`} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20">
            <HiOutlineArrowLeft className="h-4 w-4" /> Volver al editor
          </Link>
          <span className="hidden truncate text-sm font-semibold sm:inline">{site.name}</span>
          <span className="rounded bg-[color:var(--color-secondary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-on-secondary,#201b51)]">
            Vista previa{site.isPublished ? "" : " · aún no publicado"}
          </span>
        </div>
        {pages.length > 1 && (
          <select value={pageId || ""} onChange={(e) => setPageId(e.target.value)} className="rounded-lg border-0 bg-white/10 px-2 py-1.5 text-sm text-white focus:outline-none">
            {pages.map((p) => <option key={p.id} value={p.id} className="text-[#303030]">{p.name}</option>)}
          </select>
        )}
      </div>

      <div className={`pt-12 ${templateWrapperClass(site.settings?.globalStyles, page?.path)}`}>
        <TemplateGlobalStyles globalStyles={site.settings?.globalStyles} pagePath={page?.path} palette={palette} colors={palette ? undefined : { primary: site.primaryColor, secondary: site.secondaryColor || site.primaryColor }} />
        {blocks.length === 0
          ? <div className="flex h-64 items-center justify-center text-[#616161]">Esta página todavía no tiene secciones.</div>
          : blocks.map((b) => <BlockRenderer key={b.id} type={b.type} content={applyCatalogToContent(b.type, b.content, catalog.products)} palette={palette} />)}
      </div>
    </div>
  );
}
