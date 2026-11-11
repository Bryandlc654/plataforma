"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const STORAGE_KEY = "editor-tour-v1";

const STEPS = [
  { target: "sections", title: "1. Elige una sección", text: "Aquí están las secciones de tu página. Arrástralas para reordenarlas, ocúltalas o agrega nuevas con “Agregar sección”.", place: "right" },
  { target: "canvas", title: "2. Edita directamente", text: "Haz clic en cualquier texto o imagen de la página para cambiarlo. Se guarda solo, sin botones.", place: "center" },
  { target: "publish", title: "3. Publica tus cambios", text: "Tus cambios se guardan solos, pero tus visitantes solo los ven cuando presionas Publicar. Puedes publicar de nuevo cuando quieras.", place: "below" },
] as const;

interface Rect { top: number; left: number; width: number; height: number; }

function readStored(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
}

/** Guía de 3 pasos que se muestra solo la primera vez que alguien abre el editor. */
export function EditorTour({ ready }: { ready: boolean }) {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (ready && !readStored()) setStep(0);
  }, [ready]);

  const measure = () => {
    if (step === null) return;
    const el = document.querySelector(`[data-tour="${STEPS[step].target}"]`);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step === null || !rect) return null;

  const done = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* sin almacenamiento */ }
    setStep(null);
  };
  const s = STEPS[step];
  const CARD_W = 300;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  let top = rect.top + 16;
  let left = rect.left + 16;
  if (s.place === "right") { left = rect.left + rect.width + 14; top = rect.top + 70; }
  if (s.place === "center") { left = rect.left + rect.width / 2 - CARD_W / 2; top = rect.top + Math.min(160, rect.height / 3); }
  if (s.place === "below") { left = rect.left + rect.width - CARD_W; top = rect.top + rect.height + 14; }
  left = Math.max(12, Math.min(left, vw - CARD_W - 12));

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Resalta el elemento y atenúa el resto */}
      <div
        className="pointer-events-none absolute rounded-lg ring-2 ring-[color:var(--color-secondary)] transition-all duration-200"
        style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8, boxShadow: "0 0 0 9999px rgba(18,15,51,0.55)" }}
      />
      <div className="absolute rounded-xl bg-white p-4 shadow-2xl" style={{ top, left, width: CARD_W }}>
        <p className="text-sm font-semibold text-[#303030]">{s.title}</p>
        <p className="mt-1 text-[13px] leading-snug text-[#616161]">{s.text}</p>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={done} className="text-xs font-medium text-[#8a8a8a] hover:text-[#616161]">Omitir</button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#8a8a8a]">{step + 1} de {STEPS.length}</span>
            <button
              onClick={() => (step === STEPS.length - 1 ? done() : setStep(step + 1))}
              className="rounded-lg bg-gradient-to-b from-[color:color-mix(in_srgb,var(--color-primary)_88%,white)] to-[color:var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              {step === STEPS.length - 1 ? "¡Listo!" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
