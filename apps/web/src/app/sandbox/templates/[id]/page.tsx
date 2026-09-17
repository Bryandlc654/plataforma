"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { BlockRenderer } from "@/components/blocks/renderers/block-renderer";
import { useAuthStore } from "@/stores/auth-store";

type Device = "desktop" | "tablet" | "mobile";

export default function TemplateSandboxPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { hasHydrated } = useAuthStore();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageId, setPageId] = useState("");
  const [device, setDevice] = useState<Device>("desktop");

  useEffect(() => {
    if (!hasHydrated) return;
    const u = useAuthStore.getState().user;
    if (!useAuthStore.getState().isAuthenticated) { router.replace("/login"); return; }
    if (!u?.roles?.includes("super_admin")) { router.replace("/dashboard/admin/templates"); return; }

    let cancelled = false;
    api
      .get(`/templates/admin/${params.id}`)
      .then((res: any) => {
        if (cancelled) return;
        const t = res.data || res;
        setTemplate(t);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e.response?.data?.message || "No se pudo cargar la plantilla");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hasHydrated, params.id, router]);

  const pages: any[] = template?.pages || [];
  const activePage =
    pages.find((p) => p.id === pageId) ||
    pages.find((p) => p.isDefault) ||
    pages[0] ||
    null;

  const widths: Record<Device, string> = {
    desktop: "w-full max-w-[1440px]",
    tablet: "w-[768px]",
    mobile: "w-[390px]",
  };

  if (loading || !hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-white mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-400">Cargando plantilla...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/admin/templates")}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-2 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Plantillas
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{template?.name || "Plantilla"}</p>
          {activePage && <p className="truncate text-xs text-slate-400">{activePage.isDefault ? "Home" : activePage.name} · {activePage.path}</p>}
        </div>
        {pages.length > 1 && (
          <select
            value={activePage?.id || ""}
            onChange={(e) => setPageId(e.target.value)}
            className="text-sm bg-slate-800 text-white border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>{p.isDefault ? "Home" : p.name} · {p.path}</option>
            ))}
          </select>
        )}
        <div className="inline-flex rounded-xl bg-white/10 p-1">
          {([
            { key: "desktop" as Device, icon: "M4 17V7m0 10a1 1 0 001 1h14a1 1 0 001-1V7a1 1 0 00-1-1H5a1 1 0 00-1 1m1 10H4a1 1 0 010-2" },
            { key: "tablet" as Device, icon: "M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
            { key: "mobile" as Device, icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
          ]).map((d) => (
            <button
              key={d.key}
              onClick={() => setDevice(d.key)}
              title={d.key}
              className={`p-2 rounded-lg transition-colors ${device === d.key ? "bg-white text-slate-900" : "text-slate-300 hover:text-white"}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d.icon} /></svg>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && !template && (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-4">{error}</p>
            <Link href="/dashboard/admin/templates" className="text-sm font-semibold text-primary-400 hover:text-primary-300">Volver a plantillas</Link>
          </div>
        </div>
      )}

      {/* Sandbox */}
      {template && activePage && (
        <div className="py-8 bg-slate-950">
          <div className={`mx-auto ${widths[device]} rounded-t-3xl overflow-hidden bg-white shadow-2xl border border-white/10`}>
            <div className={`bg-slate-100 ${device === "mobile" ? "min-h-[calc(100vh-3rem)]" : "min-h-[calc(100vh-6rem)]"}`}>
              {activePage.blocks?.map((b: any) => (
                <BlockRenderer key={b.id} type={b.type} content={b.content} />
              ))}
            </div>
          </div>
        </div>
      )}

      {template && !activePage && (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <p className="text-sm text-slate-400">Esta plantilla no tiene páginas.</p>
        </div>
      )}
    </div>
  );
}