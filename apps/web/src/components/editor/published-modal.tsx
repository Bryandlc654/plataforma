"use client";

import { useState } from "react";

interface Props {
  publicUrl: string;
  hasDomain: boolean;
  onClose: () => void;
  onBuyDomain: () => void;
}

/** Aviso tras la primera publicación: dirección del sitio y atajo para comprar dominio. */
export function PublishedModal({ publicUrl, hasDomain, onClose, onBuyDomain }: Props) {
  const [copied, setCopied] = useState(false);
  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* sin portapapeles */ }
  };
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-green-600">✓</div>
        <h3 className="text-lg font-bold text-slate-900">¡Tu sitio ya está en internet!</h3>
        <p className="mt-1 text-sm text-slate-500">Comparte esta dirección con tus clientes:</p>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5 pl-3">
          <a href={publicUrl} target="_blank" rel="noopener" className="min-w-0 flex-1 truncate text-left text-sm font-medium text-[color:var(--color-primary)] hover:underline">{publicUrl.replace(/^https?:\/\//, "")}</a>
          <button onClick={copyUrl} className="flex-shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">{copied ? "¡Copiado!" : "Copiar"}</button>
        </div>
        {!hasDomain && (
          <button onClick={onBuyDomain} className="mt-4 w-full rounded-lg border border-dashed border-[color:color-mix(in_srgb,var(--color-primary)_40%,transparent)] px-3 py-2 text-sm font-semibold text-[color:var(--color-primary)] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
            Dale una dirección propia a tu sitio
          </button>
        )}
        <button onClick={onClose} className="mt-3 text-sm font-medium text-slate-500 hover:text-slate-700">Seguir editando</button>
      </div>
    </div>
  );
}
