"use client";

import { useEffect, useMemo, useState } from "react";
import { HiOutlineSearch, HiOutlineX } from "react-icons/hi";
import { BLOCK_META } from "@/components/blocks";

export const BLOCK_CATEGORIES: Record<string, string[]> = {
  "Encabezado": ["hero", "header"],
  "Contenido": ["services", "features", "stats", "portfolio", "benefits", "process", "about", "faq", "testimonials", "gallery", "image", "video", "timeline", "clients"],
  "Conversión": ["cta", "pricing", "contact", "form", "review-form"],
  "Social": ["whatsapp", "team"],
  "Estructura": ["footer"],
};

type Wire = "hero" | "header" | "grid" | "rows" | "split" | "cta" | "form" | "footer" | "media" | "stats" | "quote" | "pricing" | "dot";

const WIRE: Record<string, Wire> = {
  hero: "hero", header: "header", services: "grid", features: "grid", stats: "stats", portfolio: "grid",
  benefits: "grid", process: "rows", about: "split", faq: "rows", testimonials: "quote", gallery: "media",
  image: "media", video: "media", timeline: "rows", clients: "stats", cta: "cta", pricing: "pricing",
  contact: "form", form: "form", "review-form": "form", whatsapp: "dot", team: "grid", footer: "footer",
};

const bar = "rounded-sm bg-[#d4d4d4]";
const accent = "rounded-sm bg-[color:var(--color-primary)]";

/** Boceto esquemático de la sección (ligero, sin renderizar el bloque real). */
function Wireframe({ kind }: { kind: Wire }) {
  const box = "flex h-full w-full flex-col gap-1.5 p-2.5";
  switch (kind) {
    case "header":
      return <div className={box}><div className="flex items-center justify-between"><div className={`${accent} h-2 w-8`} /><div className="flex gap-1"><div className={`${bar} h-1.5 w-5`} /><div className={`${bar} h-1.5 w-5`} /><div className={`${bar} h-1.5 w-5`} /></div></div></div>;
    case "hero":
      return <div className={`${box} items-center justify-center`}><div className={`${bar} h-2.5 w-3/4`} /><div className={`${bar} h-1.5 w-1/2 opacity-60`} /><div className={`${accent} mt-1 h-3 w-12`} /></div>;
    case "grid":
      return <div className={box}><div className={`${bar} mx-auto h-2 w-1/3`} /><div className="mt-1 grid flex-1 grid-cols-3 gap-1.5">{[0, 1, 2].map((i) => <div key={i} className="flex flex-col gap-1 rounded bg-white p-1 ring-1 ring-[#e3e3e3]"><div className={`${accent} h-2 w-2 opacity-70`} /><div className={`${bar} h-1 w-full`} /><div className={`${bar} h-1 w-2/3 opacity-60`} /></div>)}</div></div>;
    case "rows":
      return <div className={box}><div className={`${bar} h-2 w-1/3`} />{[0, 1, 2].map((i) => <div key={i} className="flex items-center gap-1.5"><div className={`${accent} h-2 w-2 rounded-full`} /><div className={`${bar} h-1.5 flex-1 opacity-70`} /></div>)}</div>;
    case "split":
      return <div className={`${box} flex-row items-center`}><div className="h-full w-2/5 rounded bg-[#e3e3e3]" /><div className="flex flex-1 flex-col gap-1.5"><div className={`${bar} h-2 w-3/4`} /><div className={`${bar} h-1 w-full opacity-60`} /><div className={`${bar} h-1 w-5/6 opacity-60`} /></div></div>;
    case "cta":
      return <div className={`${box} items-center justify-center bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)]`}><div className={`${bar} h-2 w-2/3 bg-[color:color-mix(in_srgb,var(--color-primary)_60%,transparent)]`} /><div className="mt-1 h-3 w-12 rounded-sm bg-[color:var(--color-secondary)]" /></div>;
    case "form":
      return <div className={`${box} items-center`}><div className={`${bar} h-2 w-1/3`} /><div className="h-2.5 w-3/5 rounded bg-white ring-1 ring-[#d4d4d4]" /><div className="h-2.5 w-3/5 rounded bg-white ring-1 ring-[#d4d4d4]" /><div className={`${accent} h-2.5 w-3/5`} /></div>;
    case "footer":
      return <div className={`${box} justify-end bg-[#e3e3e3]/70`}><div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => <div key={i} className="flex flex-col gap-1"><div className={`${bar} h-1.5 w-full bg-slate-400`} /><div className={`${bar} h-1 w-2/3`} /></div>)}</div></div>;
    case "media":
      return <div className={`${box} justify-center`}><div className="grid flex-1 grid-cols-3 gap-1">{[0, 1, 2].map((i) => <div key={i} className="rounded bg-[#e3e3e3]" />)}</div></div>;
    case "stats":
      return <div className={`${box} justify-center`}><div className="flex justify-around">{[0, 1, 2].map((i) => <div key={i} className="flex flex-col items-center gap-1"><div className={`${accent} h-3 w-6`} /><div className={`${bar} h-1 w-6`} /></div>)}</div></div>;
    case "quote":
      return <div className={`${box} items-center justify-center`}><div className="text-lg leading-none text-[color:var(--color-secondary)]">“</div><div className={`${bar} h-1.5 w-3/4`} /><div className={`${bar} h-1.5 w-1/2 opacity-60`} /></div>;
    case "pricing":
      return <div className={box}><div className="grid flex-1 grid-cols-3 gap-1.5">{[0, 1, 2].map((i) => <div key={i} className={`flex flex-col items-center gap-1 rounded bg-white p-1 ring-1 ${i === 1 ? "ring-[color:var(--color-primary)]" : "ring-[#e3e3e3]"}`}><div className={`${bar} h-1 w-1/2`} /><div className={`${accent} h-2 w-2/3`} /></div>)}</div></div>;
    default:
      return <div className={`${box} items-end justify-end`}><div className="h-5 w-5 rounded-full bg-green-500" /></div>;
  }
}

interface Props {
  onAdd: (type: string) => void;
  onClose: () => void;
  /** Tipos que dibuja la plantilla del sitio (sin esto se muestran todos). */
  allowedTypes?: string[];
}

export function SectionPicker({ onAdd, onClose, allowedTypes }: Props) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("Todas");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const groups = useMemo(() => {
    const categorized = new Set(Object.values(BLOCK_CATEGORIES).flat());
    const extra = Object.keys(BLOCK_META).filter((t) => !categorized.has(t));
    const all: Record<string, string[]> = { ...BLOCK_CATEGORIES, ...(extra.length ? { Otros: extra } : {}) };
    const q = search.trim().toLowerCase();
    return Object.entries(all)
      .filter(([c]) => cat === "Todas" || c === cat)
      .map(([c, types]) => ({
        cat: c,
        // Con una plantilla de diseño propio, solo las secciones que esa plantilla sabe dibujar.
        types: types.filter((t) => BLOCK_META[t] && (!allowedTypes || allowedTypes.includes(t)) && (!q || BLOCK_META[t].label.toLowerCase().includes(q) || BLOCK_META[t].description.toLowerCase().includes(q) || t.includes(q))),
      }))
      .filter((g) => g.types.length > 0);
  }, [search, cat, allowedTypes]);

  const cats = ["Todas", ...Object.keys(BLOCK_CATEGORIES)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-[2px]" />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#e3e3e3] px-5 py-4">
          <h3 className="text-base font-semibold text-[#303030]">Agregar sección</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-[#8a8a8a] hover:text-[#616161]"><HiOutlineX className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 border-b border-[#ebebeb] px-5 py-3">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a8a]" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar sección…"
              className="w-full rounded-lg border border-[#e3e3e3] py-2 pl-9 pr-3 text-sm focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${cat === c ? "bg-[color:var(--color-primary)] text-white" : "bg-[#f1f1f1] text-[#616161] hover:bg-[#e3e3e3]"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {groups.length === 0 && <p className="py-10 text-center text-sm text-[#8a8a8a]">No hay secciones que coincidan con tu búsqueda.</p>}
          {groups.map(({ cat: c, types }) => (
            <div key={c}>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">{c}</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {types.map((t) => (
                  <button
                    key={t}
                    onClick={() => { onAdd(t); onClose(); }}
                    className="group overflow-hidden rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] bg-white text-left transition-all hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--color-primary)_40%,transparent)] hover:shadow-lg"
                  >
                    <div className="aspect-[16/10] border-b border-[#ebebeb] bg-[#f7f7f7]"><Wireframe kind={WIRE[t] || "dot"} /></div>
                    <div className="p-2.5">
                      <p className="truncate text-[13px] font-semibold text-[#303030] group-hover:text-[color:var(--color-primary)]">{BLOCK_META[t].label}</p>
                      <p className="line-clamp-2 text-[11px] leading-snug text-[#8a8a8a]">{BLOCK_META[t].description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
