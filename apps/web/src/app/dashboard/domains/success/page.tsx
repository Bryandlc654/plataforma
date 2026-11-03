"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

type Phase = "checking" | "registered" | "pending" | "failed" | "error";

interface Order { id: string; siteId: string | null; domain: string; status: string; dnsConnected: boolean; errorMessage: string | null; }

type Conn = { step: "registering" | "verifying" | "ready" | "attention" | "failed"; message?: string } | null;

function Check({ done, spin, children }: { done?: boolean; spin?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-left text-sm">
      <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] ${done ? "bg-green-500 text-white" : "border border-slate-300 text-slate-300"}`}>
        {done ? "✓" : spin ? <svg className="h-3 w-3 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : null}
      </span>
      <span className={done ? "text-slate-700" : "text-slate-500"}>{children}</span>
    </li>
  );
}

function RegisteredProgress({ order, back }: { order: Order; back: string }) {
  const [conn, setConn] = useState<Conn>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async (n: number) => {
      try {
        const res: any = await api.get(`/domains/orders/${order.id}/connection`);
        if (!active) return;
        const c = (res.data || res) as Conn;
        setConn(c);
        setTries(n);
        if (c?.step === "verifying" && n < 36) timer = setTimeout(() => poll(n + 1), 5000); // hasta ~3 min
      } catch {
        if (active && n < 36) timer = setTimeout(() => poll(n + 1), 5000);
      }
    };
    poll(0);
    return () => { active = false; clearTimeout(timer); };
  }, [order.id]);

  const ready = conn?.step === "ready";
  const waiting = !ready && order.dnsConnected;

  return (
    <>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-green-600">✓</div>
      <h1 className="mb-1 text-lg font-bold text-slate-900">¡{order.domain} es tuyo!</h1>
      <p className="mb-5 text-sm text-slate-500">Lo estamos conectando a tu sitio. No tienes que hacer nada más.</p>
      <ul className="mx-auto mb-6 max-w-xs space-y-2.5">
        <Check done>Pago confirmado</Check>
        <Check done>Dominio registrado</Check>
        <Check done={order.dnsConnected} spin={!order.dnsConnected}>Conectado con tu sitio</Check>
        <Check done={ready} spin={waiting}>{ready ? "¡Tu sitio ya responde en tu dominio!" : "Esperando que internet reconozca tu dominio"}</Check>
      </ul>
      {!ready && waiting && <p className="mb-5 text-xs text-slate-400">{tries >= 36 ? "Sigue en proceso. Puede tardar hasta unas horas; lo verás como \"Funcionando\" en Dominios." : "Puede tardar desde unos minutos hasta unas horas."}</p>}
      {!order.dnsConnected && <p className="mb-5 text-xs text-amber-600">No pudimos conectar el DNS automáticamente. Contacta a soporte y lo resolvemos.</p>}
      <div className="flex flex-col items-center gap-3">
        {ready && <a href={`https://${order.domain}`} target="_blank" rel="noopener" className="btn-primary inline-flex text-sm">Ver mi sitio</a>}
        <Link href={back} className={ready ? "text-xs font-medium text-slate-500 hover:underline" : "btn-primary inline-flex text-sm"}>Volver al editor</Link>
        <Link href="/dashboard/domains" className="text-xs font-medium text-slate-500 hover:underline">Ver mis dominios</Link>
      </div>
    </>
  );
}

function DomainSuccessContent() {
  const searchParams = useSearchParams();
  const { hasHydrated, ensureSession } = useAuthStore();
  const [phase, setPhase] = useState<Phase>("checking");
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!hasHydrated) return;
    const orderId = searchParams.get("order");
    const paypalOrderId = searchParams.get("token"); // PayPal devuelve su id de orden en "token"
    if (!orderId || !paypalOrderId) {
      setPhase("error");
      setMessage("No se recibieron los datos del pago de PayPal.");
      return;
    }

    let active = true;
    (async () => {
      const ok = await ensureSession();
      if (!active) return;
      if (!ok) { setPhase("error"); setMessage("Tu sesión expiró. Inicia sesión y vuelve a abrir este enlace."); return; }
      try {
        const res: any = await api.post(`/domains/orders/${orderId}/capture`, { paypalOrderId });
        if (!active) return;
        const o = (res.data || res) as Order;
        setOrder(o);
        if (o.status === "registered") setPhase("registered");
        else if (["pending_registration", "paid", "registering", "capturing"].includes(o.status)) setPhase("pending");
        else setPhase("failed");
      } catch (err: any) {
        if (!active) return;
        setPhase("error");
        setMessage(err.response?.data?.message || "No se pudo confirmar el pago con PayPal.");
      }
    })();
    return () => { active = false; };
  }, [ensureSession, hasHydrated, searchParams]);

  const back = order?.siteId ? `/dashboard/sites/${order.siteId}` : "/dashboard/sites";

  return (
    <div className="mx-auto max-w-lg p-6 text-center">
      <div className="card p-8">
        {phase === "checking" && (
          <>
            <svg className="mx-auto mb-4 h-8 w-8 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <h1 className="mb-2 text-lg font-bold text-slate-900">Confirmando tu pago…</h1>
            <p className="text-sm text-slate-500">Estamos registrando tu dominio. No cierres esta ventana.</p>
          </>
        )}
        {phase === "registered" && order && <RegisteredProgress order={order} back={back} />}
        {phase === "pending" && order && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl text-amber-600">…</div>
            <h1 className="mb-2 text-lg font-bold text-slate-900">Tu pago fue recibido</h1>
            <p className="mb-6 text-sm text-slate-500">Estamos terminando de registrar <strong>{order.domain}</strong>. Un administrador lo confirmará y te avisaremos cuando esté listo.</p>
            <Link href={back} className="btn-primary inline-flex text-sm">Volver al editor</Link>
          </>
        )}
        {phase === "failed" && order && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">!</div>
            <h1 className="mb-2 text-lg font-bold text-slate-900">No pudimos registrar {order.domain}</h1>
            <p className="mb-6 text-sm text-slate-500">{order.status === "refunded" ? "Te devolvimos el pago automáticamente." : "Revisaremos tu pedido y, si hace falta, te devolveremos el pago."}</p>
            <Link href={back} className="btn-primary inline-flex text-sm">Volver al editor</Link>
          </>
        )}
        {phase === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">!</div>
            <h1 className="mb-2 text-lg font-bold text-slate-900">No pudimos confirmar el pago</h1>
            <p className="mb-6 text-sm text-slate-500">{message}</p>
            <Link href="/dashboard/sites" className="btn-primary inline-flex text-sm">Volver a mis sitios</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function DomainSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Cargando...</div>}>
      <DomainSuccessContent />
    </Suspense>
  );
}
