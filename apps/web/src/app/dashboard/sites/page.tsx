"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/providers/confirm-provider";
import { sitePublicUrl, siteDisplayUrl } from "@/lib/site-url";
import { EmptyState, Page } from "@/components/ui/page";

interface Site { id: string; name: string; subdomain: string; domain?: string | null; isPublished: boolean; primaryColor: string; createdAt: string; updatedAt: string; _count: { pages: number }; template: { id: string; name: string } | null; }

export default function SitesPage() {
  const router = useRouter(); const { tenant, isAuthenticated } = useAuthStore();
  const [sites, setSites] = useState<Site[]>([]); const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();
  const fetchSites = useCallback(async () => {
    setLoading(true);
    try { const res: any = await api.get("/sites"); setSites((res.data?.items || res.items || []) as Site[]); }
    catch { setSites([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    fetchSites();
  }, [fetchSites, isAuthenticated, router]);
  const deleteSite = async (site: Site) => {
    const ok = await confirm({
      title: "Eliminar sitio",
      message: `Esta acción eliminará "${site.name}" permanentemente. Escribe el nombre del sitio para confirmar.`,
      confirmText: "Eliminar sitio",
      matchText: site.name,
      matchLabel: "Escribe el nombre del sitio",
    });
    if (!ok) return;
    await api.delete(`/sites/${site.id}`);
    fetchSites();
  };

  const plusIcon = <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;

  if (loading) return (
    <Page title="Sitios web">
      <div className="card animate-pulse space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-lg bg-[#f1f1f1]" />)}
      </div>
    </Page>
  );

  return (
    <Page
      title="Sitios web"
      subtitle={`${tenant?.name ? `${tenant.name} · ` : ""}${sites.length} sitio${sites.length !== 1 ? "s" : ""}`}
      primaryAction={<Link href="/dashboard/sites/new" className="btn-primary">{plusIcon}Crear sitio</Link>}
    >
      {sites.length === 0 ? (
        <EmptyState
          icon={<svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h18v14H3zM3 9h18" /></svg>}
          title="Crea tu primer sitio"
          description="Elige una plantilla y personalízala con el editor visual. Todo se puede editar."
          action={<Link href="/dashboard/sites/new" className="btn-primary">{plusIcon}Crear sitio</Link>}
        />
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-[#ebebeb] bg-[#f7f7f7] text-[12px] font-medium text-[#616161]">
              <tr>
                <th className="px-4 py-2 font-medium">Sitio</th>
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Estado</th>
                <th className="hidden px-4 py-2 font-medium md:table-cell">Plantilla</th>
                <th className="hidden px-4 py-2 font-medium lg:table-cell">Actualizado</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              {sites.map((site) => (
                <tr key={site.id} className="group hover:bg-[#f7f7f7]">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/sites/${site.id}`} className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-[15px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
                        style={{ background: site.primaryColor || "#303030" }}
                      >
                        {site.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-[#303030] group-hover:underline">{site.name}</span>
                        <span className="block truncate text-[12px] text-[#616161]">{siteDisplayUrl(site)} · {site._count.pages} página{site._count.pages !== 1 ? "s" : ""}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={`badge ${site.isPublished ? "badge-success" : ""}`}>{site.isPublished ? "Publicado" : "Borrador"}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-[#616161] md:table-cell">{site.template?.name || "—"}</td>
                  <td className="hidden px-4 py-3 text-[#616161] lg:table-cell">{formatDate(site.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {site.isPublished
                        ? <a href={sitePublicUrl(site)} target="_blank" rel="noopener" className="btn-ghost !px-2">Ver</a>
                        : <Link href={`/dashboard/sites/${site.id}/preview`} target="_blank" className="btn-ghost !px-2">Vista previa</Link>}
                      <Link href={`/dashboard/sites/${site.id}`} className="btn-secondary">Personalizar</Link>
                      <button onClick={() => deleteSite(site)} className="btn-ghost !px-2 text-[#8a8a8a] hover:!text-[#c70a24]" title="Eliminar sitio" aria-label={`Eliminar ${site.name}`}>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
