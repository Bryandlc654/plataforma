"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/providers/confirm-provider";

interface Site { id: string; name: string; subdomain: string; isPublished: boolean; primaryColor: string; createdAt: string; updatedAt: string; _count: { pages: number }; template: { id: string; name: string } | null; }

export default function SitesPage() {
  const router = useRouter(); const { tenant, isAuthenticated } = useAuthStore();
  const [sites, setSites] = useState<Site[]>([]); const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();
  const fetchSites = useCallback(async () => {
    setLoading(true);
    try { const res: any = await api.get("/sites"); setSites((res.data || res) as Site[]); }
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

  if (loading) return <div className="p-8 flex items-center justify-center"><p className="text-slate-500">Cargando sitios...</p></div>;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div><h1 className="text-2xl font-bold text-slate-900">Sitios Web</h1><p className="text-sm text-slate-500 mt-1">{tenant?.name} · {sites.length} sitio{sites.length !== 1 ? "s" : ""}</p></div>
        <Link href="/dashboard/sites/new" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Nuevo sitio</Link>
      </div>

      {sites.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg></div>
          <h3 className="text-lg font-semibold text-slate-900">Sin sitios aún</h3><p className="text-sm text-slate-500 mt-1 mb-6">Crea tu primer sitio web con el editor visual</p>
          <Link href="/dashboard/sites/new" className="btn-primary">Crear mi primer sitio</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => (
            <div key={site.id} className="group bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-lg transition-all overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-slate-50 to-slate-100 relative flex items-center justify-center" style={site.primaryColor ? { background: `linear-gradient(135deg, ${site.primaryColor}15, ${site.primaryColor}05)` } : {}}>
                <div className="absolute top-3 left-3 flex gap-2"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${site.isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{site.isPublished ? "Publicado" : "Borrador"}</span></div>
                <span className="text-3xl font-black text-slate-200 group-hover:text-slate-300 transition-colors">{site.name.charAt(0)}</span>
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 text-xs text-slate-400"><span className="flex items-center gap-1"><svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>{site._count.pages} páginas</span>{site.template && <span className="bg-slate-100 rounded-full px-2 py-0.5">{site.template.name}</span>}</div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-slate-900 mb-1">{site.name}</h3>
                <p className="text-xs text-slate-400 mb-3 truncate">{typeof window !== "undefined" ? `${window.location.origin}/${site.subdomain}` : `/${site.subdomain}`}</p>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Link href={`/dashboard/sites/${site.id}`} className="flex-1 text-center text-xs font-medium text-primary-600 hover:text-primary-700 py-2 rounded-lg hover:bg-primary-50 transition-colors">Editar</Link>
                  {site.isPublished && <Link href={`/${site.subdomain}`} target="_blank" className="text-xs text-slate-400 hover:text-primary-600 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">Visitar</Link>}
                  <button onClick={() => deleteSite(site)} className="text-xs text-slate-300 hover:text-red-500 py-2 px-2 rounded-lg hover:bg-red-50 transition-colors"><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
