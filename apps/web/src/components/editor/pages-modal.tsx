"use client";

import { useState } from "react";
import { HiOutlineCog, HiOutlineDuplicate, HiOutlineEye, HiOutlineX } from "react-icons/hi";
import type { SitePage } from "@/components/editor/editor-model";

interface Props {
  pages: SitePage[];
  activePageId: string | null;
  /** Dirección pública si el sitio está publicado. */
  publicUrl: string | null;
  onClose: () => void;
  onSelect: (pageId: string) => void;
  onAddPage: (name: string) => Promise<void> | void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onOpenSettings: () => void;
}

/** Lista de páginas del sitio: cambiar, crear, duplicar y eliminar. */
export function PagesModal({ pages, activePageId, publicUrl, onClose, onSelect, onAddPage, onDuplicate, onDelete, onOpenSettings }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const create = async () => {
    if (!name.trim()) return;
    await onAddPage(name);
    setAdding(false);
    setName("");
  };
  const cancel = () => { setAdding(false); setName(""); };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 m-4 flex max-h-[70vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Páginas ({pages.length})</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600"><HiOutlineX className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {adding ? (
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input
                className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary)_20%,transparent)]"
                placeholder="Ej: Servicios, Contacto..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") create(); else if (e.key === "Escape") cancel(); }}
              />
              <div className="flex gap-1.5">
                <button onClick={create} className="flex-1 rounded-lg bg-[color:var(--color-primary)] py-1.5 text-xs font-medium text-white">Crear</button>
                <button onClick={cancel} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500">Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="mb-3 w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-xs font-medium text-slate-400 transition-all hover:border-[color:color-mix(in_srgb,var(--color-primary)_22%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_2%,transparent)] hover:text-[color:var(--color-primary)]">+ Nueva página</button>
          )}
          <div className="space-y-0.5">
            {[...pages].sort((a, b) => a.sortOrder - b.sortOrder).map((page) => (
              <div key={page.id} className="group relative">
                <button
                  onClick={() => onSelect(page.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-all ${page.id === activePageId ? "border border-[color:color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_6%,transparent)] font-medium text-[color:var(--color-primary)]" : "border border-transparent text-slate-600 hover:bg-slate-50"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">
                      {page.name}
                      {page.isDefault && <span className="ml-1 rounded bg-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-1 text-[10px] font-medium text-[color:var(--color-primary)]">Home</span>}
                    </span>
                    <span className="text-xs text-slate-400">{page.blocks.length}</span>
                  </div>
                </button>
                <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); onDuplicate(page.id); }} title="Duplicar" className="flex h-6 w-6 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-400 hover:text-blue-600"><HiOutlineDuplicate className="h-3 w-3" /></button>
                  {!page.isDefault && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(page.id); }} title="Eliminar" className="flex h-6 w-6 items-center justify-center rounded-lg border border-red-200 bg-white text-red-400 hover:text-red-600"><HiOutlineX className="h-3 w-3" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 border-t border-slate-200 p-3">
          <button onClick={onOpenSettings} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><HiOutlineCog className="h-3.5 w-3.5" />Configuración</button>
          {publicUrl && <a href={publicUrl} target="_blank" rel="noopener" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><HiOutlineEye className="h-3.5 w-3.5" />Ver sitio</a>}
        </div>
      </div>
    </div>
  );
}
