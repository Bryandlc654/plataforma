"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft, HiOutlineCheck, HiOutlineChevronDown, HiOutlineCog, HiOutlineColorSwatch, HiOutlineDesktopComputer,
  HiOutlineDeviceMobile, HiOutlineDocumentText, HiOutlineEye,
} from "react-icons/hi";

export type EditorDevice = "desktop" | "mobile";

interface PageLite { id: string; name: string; isDefault: boolean; sortOrder: number; }

export interface GuideStep { id: string; label: string; hint: string; done: boolean; actionLabel?: string; onAction?: () => void; }

interface Props {
  guide?: GuideStep[];
  siteName: string;
  isPublished: boolean;
  pages: PageLite[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  onManagePages: () => void;
  device: EditorDevice;
  onDeviceChange: (d: EditorDevice) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saving: boolean;
  dirty: boolean;
  /** Hay cambios hechos desde la última publicación. */
  hasChanges: boolean;
  saveError: boolean;
  lastSaved: Date | null;
  publishing: boolean;
  onRetry: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onPreview: () => void;
  onTheme: () => void;
  onSettings: () => void;
}

const Spinner = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

function saveLabel(saving: boolean, dirty: boolean, saveError: boolean, lastSaved: Date | null, onRetry: () => void) {
  if (saveError) return <button onClick={onRetry} className="text-xs font-medium text-red-600 hover:underline">No se pudo guardar · Reintentar</button>;
  if (saving || dirty) return <span className="flex items-center justify-end gap-1 text-xs text-slate-500"><Spinner className="h-3 w-3" />Guardando…</span>;
  if (lastSaved) return <span className="text-xs text-slate-400">Guardado</span>;
  return null;
}

export function EditorTopBar(p: Props) {
  const [pagesOpen, setPagesOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);
  const steps = p.guide || [];
  const doneCount = steps.filter((s) => s.done).length;
  const ref = useRef<HTMLDivElement>(null);
  const activePage = p.pages.find((x) => x.id === p.activePageId);

  useEffect(() => {
    if (!guideOpen) return;
    const close = (e: MouseEvent) => { if (guideRef.current && !guideRef.current.contains(e.target as Node)) setGuideOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [guideOpen]);

  useEffect(() => {
    if (!pagesOpen) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setPagesOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [pagesOpen]);

  const iconBtn = "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3">
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/dashboard/sites" className={iconBtn} title="Volver a sitios"><HiOutlineArrowLeft className="h-4 w-4" /></Link>
        <span className="max-w-[180px] truncate text-sm font-semibold text-slate-800">{p.siteName}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${p.isPublished ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          {p.isPublished ? "Publicado" : "Borrador"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={ref}>
          <button
            onClick={() => setPagesOpen((v) => !v)}
            className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <HiOutlineDocumentText className="h-3.5 w-3.5 text-slate-400" />
            <span className="max-w-[140px] truncate">{activePage?.name || "Sin página"}</span>
            <HiOutlineChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          {pagesOpen && (
            <div className="absolute left-1/2 top-10 z-50 w-56 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
              {[...p.pages].sort((a, b) => a.sortOrder - b.sortOrder).map((pg) => (
                <button
                  key={pg.id}
                  onClick={() => { p.onSelectPage(pg.id); setPagesOpen(false); }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs ${pg.id === p.activePageId ? "bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)] font-semibold text-[color:var(--color-primary)]" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  <span className="truncate">{pg.name}</span>
                  {pg.isDefault && <span className="text-[10px] text-slate-400">Inicio</span>}
                </button>
              ))}
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={() => { setPagesOpen(false); p.onManagePages(); }}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-[color:var(--color-primary)] hover:bg-slate-50"
              >
                Administrar páginas…
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 p-0.5">
          {([["desktop", HiOutlineDesktopComputer, "Escritorio"], ["mobile", HiOutlineDeviceMobile, "Móvil"]] as const).map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => p.onDeviceChange(key)}
              title={label}
              className={`flex h-7 w-8 items-center justify-center rounded-md ${p.device === key ? "bg-[color:var(--color-primary)] text-white" : "text-slate-500 hover:bg-slate-100"}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={p.onUndo} disabled={!p.canUndo} className={iconBtn} title="Deshacer (Ctrl+Z)">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
        </button>
        <button onClick={p.onRedo} disabled={!p.canRedo} className={iconBtn} title="Rehacer (Ctrl+Shift+Z)">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" /></svg>
        </button>
        {steps.length > 0 && doneCount < steps.length && (
          <div className="relative" ref={guideRef}>
            <button
              onClick={() => setGuideOpen((v) => !v)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[color:color-mix(in_srgb,var(--color-secondary)_60%,transparent)] bg-[color:color-mix(in_srgb,var(--color-secondary)_12%,transparent)] px-2.5 text-xs font-semibold text-slate-700 hover:bg-[color:color-mix(in_srgb,var(--color-secondary)_20%,transparent)]"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--color-secondary)] text-[10px] font-bold text-[color:var(--color-on-secondary,#201b51)]">{doneCount}</span>
              de {steps.length} pasos
            </button>
            {guideOpen && (
              <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <p className="text-sm font-semibold text-slate-900">Deja tu sitio listo</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[color:var(--color-primary)] transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} /></div>
                <ul className="mt-3 space-y-3">
                  {steps.map((s) => (
                    <li key={s.id} className="flex gap-2.5">
                      <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] ${s.done ? "bg-green-500 text-white" : "border border-slate-300"}`}>{s.done ? "✓" : ""}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] font-medium ${s.done ? "text-slate-400 line-through" : "text-slate-800"}`}>{s.label}</p>
                        {!s.done && s.hint && <p className="text-xs text-slate-500">{s.hint}</p>}
                        {!s.done && s.onAction && (
                          <button onClick={() => { setGuideOpen(false); s.onAction?.(); }} className="mt-1.5 rounded-md bg-[color:var(--color-primary)] px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90">{s.actionLabel}</button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <button onClick={p.onTheme} className={iconBtn} title="Tema (colores y logo)"><HiOutlineColorSwatch className="h-4 w-4" /></button>
        <button onClick={p.onSettings} className={iconBtn} title="Configuración del sitio"><HiOutlineCog className="h-4 w-4" /></button>
        <button onClick={p.onPreview} className={iconBtn} title="Vista previa"><HiOutlineEye className="h-4 w-4" /></button>
        <div className="mx-1 min-w-[96px] text-right">{saveLabel(p.saving, p.dirty, p.saveError, p.lastSaved, p.onRetry)}</div>
        {!p.hasChanges && p.isPublished ? (
          <button data-tour="publish" onClick={p.onUnpublish} className="h-8 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-700 hover:bg-amber-100">
            Despublicar
          </button>
        ) : (
          <button
            data-tour="publish"
            onClick={p.onPublish}
            disabled={p.publishing}
            title={p.isPublished ? "Tus cambios se guardan como borrador: tus clientes los verán cuando publiques." : "Publica tu sitio para que tus clientes lo vean."}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-b from-[color:color-mix(in_srgb,var(--color-primary)_88%,white)] to-[color:var(--color-primary)] px-4 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {p.publishing ? <><Spinner />Publicando…</> : p.isPublished ? "Publicar cambios" : "Publicar"}
          </button>
        )}
      </div>
    </header>
  );
}
