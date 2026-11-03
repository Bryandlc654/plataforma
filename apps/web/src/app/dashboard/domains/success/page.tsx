"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

type Phase = "checking" | "registered" | "pending" | "failed" | "error";

interface Order { id: string; siteId: string | null; domain: string; status: string; dnsConnected: boolean; errorMessage: string | null; }

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
        {phase === "registered" && order && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-green-600">✓</div>
            <h1 className="mb-2 text-lg font-bold text-slate-900">¡{order.domain} es tuyo!</h1>
            <p className="mb-2 text-sm text-slate-500">El dominio quedó registrado y asignado a tu sitio.</p>
            <p className="mb-6 text-xs text-slate-400">{order.dnsConnected ? "Ya configuramos el DNS. Puede tardar desde unos minutos hasta unas horas en funcionar." : "No pudimos configurar el DNS automáticamente; puedes verificarlo en Configuración del sitio."}</p>
            <Link href={back} className="btn-primary inline-flex text-sm">Volver al editor</Link>
          </>
        )}
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
