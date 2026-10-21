"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

type Status = "checking" | "ok" | "error" | "info";

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const { hasHydrated, ensureSession } = useAuthStore();
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!hasHydrated) return;

    const provider = searchParams.get("provider");
    const invoiceId = searchParams.get("invoice");
    const orderId = searchParams.get("token");

    if (provider !== "paypal") {
      setStatus("info");
      return;
    }
    if (!invoiceId || !orderId) {
      setStatus("error");
      setMessage("No se recibieron los datos del pago de PayPal.");
      return;
    }

    let active = true;
    setStatus("checking");
    (async () => {
      const ok = await ensureSession();
      if (!active) return;
      if (!ok) {
        setStatus("error");
        setMessage("Tu sesión expiró. Inicia sesión y vuelve a intentarlo.");
        return;
      }
      try {
        await api.post("/billing/paypal/capture-order", { invoiceId, orderId });
        if (active) setStatus("ok");
      } catch (err: any) {
        if (!active) return;
        setStatus("error");
        setMessage(err.response?.data?.message || "No se pudo confirmar el pago con PayPal.");
      }
    })();

    return () => {
      active = false;
    };
  }, [ensureSession, hasHydrated, searchParams]);

  return (
    <div className="p-6 max-w-lg mx-auto text-center">
      <div className="card p-8">
        {status === "checking" ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
              <svg className="h-6 w-6 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Confirmando pago</h1>
            <p className="text-sm text-slate-500">Estamos verificando el pago con PayPal. No cierres esta ventana.</p>
          </>
        ) : status === "ok" ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-green-600">✓</div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Pago confirmado</h1>
            <p className="text-sm text-slate-500 mb-6">
              PayPal confirmó el pago y tu plan ya está activo. Los cobros de planes llegarán a la cuenta configurada por el administrador.
            </p>
            <div className="flex flex-col items-center gap-3">
              <button type="button" onClick={() => { window.location.href = "/dashboard"; }} className="btn-primary text-sm inline-flex">Ir al panel</button>
              <button type="button" onClick={() => { window.location.href = "/dashboard/billing"; }} className="text-xs font-medium text-slate-500 hover:underline">Ver facturación</button>
            </div>
          </>
        ) : status === "error" ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">!</div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">No pudimos confirmar el pago</h1>
            <p className="text-sm text-slate-500 mb-6">{message || "Inténtalo de nuevo desde facturación."}</p>
            <Link href="/dashboard/billing" className="btn-primary text-sm inline-flex">Volver a facturación</Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-green-600">✓</div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Pago recibido</h1>
            <p className="text-sm text-slate-500 mb-6">
              Estamos confirmando el pago con la pasarela. Tu plan se activará automáticamente en unos segundos. Si no se refleja, actualiza la página de facturación.
            </p>
            <Link href="/dashboard/billing" className="btn-primary text-sm inline-flex">Volver a facturación</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Cargando...</div>}>
      <BillingSuccessContent />
    </Suspense>
  );
}
