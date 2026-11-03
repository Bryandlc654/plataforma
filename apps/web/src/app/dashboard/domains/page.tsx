"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiOutlineGlobeAlt, HiOutlineSearch } from "react-icons/hi";
import api from "@/lib/api";
import { DomainSearchModal } from "@/components/editor/domain-search-modal";

interface Order { id: string; siteId: string | null; domain: string; priceCents: number; currency: string; status: string; dnsConnected: boolean; createdAt: string; registeredAt: string | null; errorMessage: string | null; }
interface SiteLite { id: string; name: string; domain: string | null; }
type Step = "registering" | "verifying" | "ready" | "attention" | "failed";

const STATUS: Record<string, { label: string; tone: string }> = {
  registered: { label: "Activo", tone: "bg-green-50 text-green-700" },
  pending_registration: { label: "En proceso", tone: "bg-amber-50 text-amber-700" },
  paid: { label: "En proceso", tone: "bg-amber-50 text-amber-700" },
  registering: { label: "En proceso", tone: "bg-amber-50 text-amber-700" },
  refunded: { label: "Reembolsado", tone: "bg-slate-100 text-slate-600" },
  failed: { label: "No se pudo registrar", tone: "bg-red-50 text-red-700" },
};

const money = (cents: number, currency: string) => new Intl.NumberFormat("es", { style: "currency", currency }).format(cents / 100);

export default function DomainsPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [sites, setSites] = useState<SiteLite[]>([]);
  const [siteId, setSiteId] = useState("");
  const [steps, setSteps] = useState<Record<string, Step>>({});
  const [search, setSearch] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [o, s]: any = await Promise.all([api.get("/domains/orders"), api.get("/sites")]);
        // Se ocultan los pedidos que nunca llegaron a pagarse (pago abandonado).
        const list = ((o.data || o) as Order[]).filter((x) => !["pending_payment", "capturing"].includes(x.status));
        setOrders(list);
        const siteList = ((s.data?.items || s.items || []) as SiteLite[]);
        setSites(siteList);
        setSiteId(siteList[0]?.id || "");
        list.filter((x) => x.status === "registered").forEach((x) =>
          api.get(`/domains/orders/${x.id}/connection`).then((r: any) => setSteps((p) => ({ ...p, [x.id]: (r.data || r).step }))).catch(() => {}),
        );
      } catch { setOrders([]); }
    })();
  }, []);

  const site = sites.find((s) => s.id === siteId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dominios</h1>
          <p className="mt-1 text-sm text-slate-500">La dirección propia de tu sitio, como minegocio.com.</p>
        </div>
        <div className="flex items-center gap-2">
          {sites.length > 1 && (
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button
            onClick={() => setSearch(true)}
            disabled={!siteId}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[color:color-mix(in_srgb,var(--color-primary)_88%,white)] to-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            <HiOutlineSearch className="h-4 w-4" /> Buscar un dominio
          </button>
        </div>
      </div>

      {sites.length === 0 && orders !== null && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Primero crea tu sitio y luego podrás darle un dominio. <Link href="/dashboard/sites/new" className="font-semibold underline">Crear mi sitio</Link>
        </p>
      )}

      {orders === null ? (
        <div className="h-28 animate-pulse rounded-xl bg-slate-200/70" />
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[color:var(--color-primary)]"><HiOutlineGlobeAlt className="h-6 w-6" /></span>
          <h2 className="font-semibold text-slate-900">Aún no tienes un dominio propio</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Busca el nombre de tu negocio y te lo registramos y conectamos a tu sitio automáticamente.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const st = STATUS[o.status] || { label: o.status, tone: "bg-slate-100 text-slate-600" };
            const step = steps[o.id];
            return (
              <li key={o.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{o.domain}</p>
                  <p className="text-xs text-slate-500">
                    {money(o.priceCents, o.currency)} · {new Date(o.registeredAt || o.createdAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                    {o.status === "registered" && step && (
                      <> · {step === "ready" ? "Funcionando" : step === "verifying" ? "Conectando… puede tardar unos minutos" : step === "attention" ? "Falta conectarlo" : ""}</>
                    )}
                  </p>
                  {o.errorMessage && o.status !== "registered" && <p className="mt-1 text-xs text-slate-400">{o.errorMessage}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.tone}`}>{st.label}</span>
                  {o.siteId && <Link href={`/dashboard/sites/${o.siteId}`} className="text-sm font-medium text-[color:var(--color-primary)] hover:underline">Abrir sitio</Link>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {search && siteId && <DomainSearchModal siteId={siteId} initialQuery={site?.name} onClose={() => setSearch(false)} />}
    </div>
  );
}
