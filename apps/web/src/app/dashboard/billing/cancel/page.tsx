"use client";

import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="p-6 max-w-lg mx-auto text-center">
      <div className="card p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 text-2xl">!</div>
        <h1 className="text-lg font-bold text-slate-900 mb-2">Pago cancelado</h1>
        <p className="text-sm text-slate-500 mb-6">
          No se completó el pago. No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.
        </p>
        <Link href="/dashboard/billing" className="btn-primary text-sm inline-flex">Volver a facturación</Link>
      </div>
    </div>
  );
}
