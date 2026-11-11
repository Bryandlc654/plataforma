"use client";

import Link from "next/link";

export default function DomainCancelPage() {
  return (
    <div className="mx-auto max-w-lg p-6 text-center">
      <div className="card p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl text-amber-600">!</div>
        <h1 className="mb-2 text-lg font-bold text-[#303030]">Compra cancelada</h1>
        <p className="mb-6 text-sm text-[#616161]">No se realizó ningún cargo ni se registró el dominio. Puedes volver a buscarlo cuando quieras.</p>
        <Link href="/dashboard/sites" className="btn-primary inline-flex text-sm">Volver a mis sitios</Link>
      </div>
    </div>
  );
}
