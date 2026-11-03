"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineCheckCircle, HiOutlineGlobeAlt, HiOutlineSearch, HiOutlineX } from "react-icons/hi";
import api from "@/lib/api";

interface Result {
  domain: string;
  tld: string;
  available: boolean;
  restriction: string | null;
  isSuggestion: boolean;
  priceCents: number | null;
  renewalCents: number | null;
  currency: string | null;
}

interface Status { configured: boolean; purchasesEnabled: boolean; paypalEnabled: boolean; }

const money = (cents: number | null, currency: string | null) =>
  cents === null ? "—" : new Intl.NumberFormat("es", { style: "currency", currency: currency || "USD" }).format(cents / 100);

const brandBtn = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[color:color-mix(in_srgb,var(--color-primary)_88%,white)] to-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60";

export function DomainSearchModal({ siteId, onClose, initialQuery }: { siteId: string; onClose: () => void; initialQuery?: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [query, setQuery] = useState(initialQuery || "");
  const autoSearched = useRef(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [suggestions, setSuggestions] = useState<Result[]>([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Result | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api.get("/domains/status").then((r: any) => setStatus(r.data || r)).catch(() => setStatus({ configured: false, purchasesEnabled: false, paypalEnabled: false }));
  }, []);

  // Si ya conocemos el nombre del negocio, la búsqueda arranca sola.
  useEffect(() => {
    if (status?.configured && initialQuery && !autoSearched.current) {
      autoSearched.current = true;
      search(undefined, initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !paying) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, paying]);

  const search = async (e?: React.FormEvent, override?: string) => {
    e?.preventDefault();
    const q = (override ?? query).trim();
    if (!q || searching) return;
    setSearching(true); setError(""); setSelected(null);
    try {
      const res: any = await api.get("/domains/search", { params: { q } });
      const data = res.data || res;
      setResults(data.results || []);
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      setResults(null);
      setError(err.response?.data?.message || "No se pudo buscar. Inténtalo de nuevo.");
    } finally { setSearching(false); }
  };

  const pay = async () => {
    if (!selected || paying) return;
    setPaying(true); setError("");
    try {
      const res: any = await api.post("/domains/orders", { domain: selected.domain, siteId });
      const data = res.data || res;
      window.location.href = data.paymentUrl; // PayPal; al volver se confirma el pago y se registra el dominio
    } catch (err: any) {
      setPaying(false);
      setError(err.response?.data?.message || "No se pudo iniciar el pago.");
    }
  };

  const canBuy = !!status?.purchasesEnabled;

  const Row = ({ r }: { r: Result }) => (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{r.domain}</p>
        {r.available
          ? <p className="text-xs text-slate-500">{money(r.priceCents, r.currency)} el primer año · renueva a {money(r.renewalCents, r.currency)}/año</p>
          : <p className="text-xs text-slate-400">{r.restriction ? "Con restricciones de registro" : "No disponible"}</p>}
      </div>
      {r.available && !r.restriction ? (
        <button onClick={() => setSelected(r)} disabled={!canBuy} title={canBuy ? undefined : "La compra aún no está habilitada"} className={brandBtn}>Comprar</button>
      ) : (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-400">Ocupado</span>
      )}
    </li>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]" onClick={() => !paying && onClose()}>
      <div className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2"><HiOutlineGlobeAlt className="h-5 w-5 text-[color:var(--color-primary)]" /><h3 className="font-sans text-base font-semibold normal-case tracking-normal text-slate-900">Busca tu dominio</h3></div>
          <button onClick={onClose} disabled={paying} className="rounded-lg p-1 text-slate-400 hover:text-slate-600"><HiOutlineX className="h-5 w-5" /></button>
        </div>

        {selected ? (
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--color-primary)_25%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_5%,transparent)] p-4">
              <p className="text-lg font-bold text-slate-900">{selected.domain}</p>
              <p className="mt-1 text-sm text-slate-600">Registro por 1 año: <strong>{money(selected.priceCents, selected.currency)}</strong></p>
              <p className="text-xs text-slate-500">Se renueva a {money(selected.renewalCents, selected.currency)} al año.</p>
            </div>
            <ul className="space-y-1.5 text-[13px] text-slate-600">
              {["Pagas con PayPal.", "Al confirmarse el pago registramos el dominio por ti.", "Lo conectamos a tu sitio automáticamente (puede tardar unos minutos en funcionar).", "Si no se puede registrar, te devolvemos el pago."].map((t) => (
                <li key={t} className="flex gap-2"><HiOutlineCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />{t}</li>
              ))}
            </ul>
            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setSelected(null); setError(""); }} disabled={paying} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Volver</button>
              <button onClick={pay} disabled={paying} className={`${brandBtn} flex-1`}>{paying ? "Abriendo PayPal…" : `Pagar ${money(selected.priceCents, selected.currency)} con PayPal`}</button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={search} className="flex gap-2 border-b border-slate-100 px-5 py-3">
              <div className="relative flex-1">
                <HiOutlineSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="minegocio  o  minegocio.com"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
                />
              </div>
              <button type="submit" disabled={searching || !query.trim() || status?.configured === false} className={brandBtn}>{searching ? "Buscando…" : "Buscar"}</button>
            </form>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {status && !status.configured && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">La búsqueda de dominios aún no está configurada. Contacta al administrador.</p>}
              {status?.configured && !status.purchasesEnabled && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Puedes buscar y ver precios, pero la compra todavía no está habilitada.</p>}
              {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              {!results && !error && <p className="py-8 text-center text-sm text-slate-400">Escribe el nombre de tu negocio para ver qué dominios están libres.</p>}
              {results && results.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No encontramos resultados para esa búsqueda.</p>}
              {results && results.length > 0 && <ul className="space-y-2">{results.map((r) => <Row key={r.domain} r={r} />)}</ul>}
              {suggestions.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Alternativas disponibles</p>
                  <ul className="space-y-2">{suggestions.map((r) => <Row key={r.domain} r={r} />)}</ul>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
