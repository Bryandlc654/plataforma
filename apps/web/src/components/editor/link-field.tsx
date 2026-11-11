"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface LinkOption { label: string; value: string; }

/** Una página del sitio y las secciones a las que se puede saltar dentro de ella. */
export interface LinkPage {
  label: string;
  /** Ruta de la página ("/" para el inicio). */
  value: string;
  /** Es la página que se está editando: sus secciones se enlazan como #id. */
  current: boolean;
  sections: LinkOption[];
}

export interface LinkOptions { pages: LinkPage[]; }

export const LinkOptionsContext = createContext<LinkOptions>({ pages: [] });

const CUSTOM = "__custom__";
const NONE = "";

const inputCls =
  "block w-full rounded-lg border border-[#8a8a8a]/50 bg-white px-2.5 py-1.5 text-[13px] text-[#303030] outline-none placeholder:text-[#8a8a8a] focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary)_25%,transparent)]";

const CUSTOM_KINDS = [
  { label: "Otra web", prefix: "https://", placeholder: "https://ejemplo.com" },
  { label: "WhatsApp", prefix: "https://wa.me/", placeholder: "Número con código de país, ej. 593991234567" },
  { label: "Correo", prefix: "mailto:", placeholder: "nombre@correo.com" },
  { label: "Teléfono", prefix: "tel:", placeholder: "+593 99 123 4567" },
];

function kindOf(value: string): number {
  if (/^https?:\/\/(wa\.me|api\.whatsapp)/i.test(value)) return 1;
  if (/^mailto:/i.test(value)) return 2;
  if (/^tel:/i.test(value)) return 3;
  return 0;
}

/** "#catalogo" y "/#catalogo" son lo mismo si se está en el inicio. */
function normalize(value: string, pages: LinkPage[]): string {
  const current = pages.find((p) => p.current);
  if (current && value.startsWith(`${current.value === "/" ? "" : current.value}/#`)) return value.slice(value.indexOf("#"));
  return value;
}

/**
 * Destino de un enlace o botón: se elige una página o una sección de una página del sitio,
 * o "Personalizado" para otra web, WhatsApp, correo o teléfono.
 */
export function LinkField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  const { pages } = useContext(LinkOptionsContext);
  const v = normalize(String(value || ""), pages);
  const options = pages.flatMap((p) => [p.value, ...p.sections.map((s) => s.value)]);
  const known = options.includes(v);
  const [custom, setCustom] = useState(!known && v !== "" && v !== "#");
  useEffect(() => { if (known) setCustom(false); }, [known]);
  const selected = custom ? CUSTOM : known ? v : NONE;

  const kind = kindOf(v);
  const bare = v.slice(CUSTOM_KINDS[kind].prefix.length * (v.toLowerCase().startsWith(CUSTOM_KINDS[kind].prefix) ? 1 : 0));

  return (
    <div>
      <span className="mb-1 block text-[13px] font-medium text-[#303030]">{label}</span>
      <select
        className={inputCls}
        value={selected}
        onChange={(e) => {
          const next = e.target.value;
          if (next === CUSTOM) { setCustom(true); onChange(known || v === "#" ? "https://" : v); return; }
          setCustom(false);
          onChange(next || "#");
        }}
      >
        <option value={NONE}>Sin destino</option>
        {pages.length > 0 && (
          <optgroup label="Páginas">
            {pages.map((p) => <option key={`p:${p.value}`} value={p.value}>{p.label}</option>)}
          </optgroup>
        )}
        {pages.filter((p) => p.sections.length > 0).map((p) => (
          <optgroup key={`s:${p.value}`} label={p.current ? `Secciones de esta página (${p.label})` : `Secciones de ${p.label}`}>
            {p.sections.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </optgroup>
        ))}
        <option value={CUSTOM}>Personalizado (otra web, WhatsApp, correo, teléfono)…</option>
      </select>

      {custom && (
        <div className="mt-1.5 rounded-lg border border-[#e3e3e3] bg-[#fafafa] p-2">
          <div className="mb-1.5 flex flex-wrap gap-1">
            {CUSTOM_KINDS.map((k, i) => (
              <button
                key={k.label}
                type="button"
                onClick={() => onChange(k.prefix + (i === kind ? bare : ""))}
                className={`rounded-md px-2 py-0.5 text-[12px] font-medium ${i === kind ? "bg-white text-[#303030] shadow-[0_0_0_1px_rgba(0,0,0,0.12)]" : "text-[#616161] hover:bg-white"}`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <input
            className={inputCls}
            value={bare}
            onChange={(e) => {
              const raw = e.target.value.trim();
              // Pegaron una dirección completa: se usa tal cual.
              if (/^(https?:|mailto:|tel:|#|\/)/i.test(raw)) { onChange(raw); return; }
              onChange(CUSTOM_KINDS[kind].prefix + (kind === 1 ? raw.replace(/[^0-9]/g, "") : raw));
            }}
            placeholder={CUSTOM_KINDS[kind].placeholder}
            inputMode={kind === 3 || kind === 1 ? "tel" : kind === 2 ? "email" : "url"}
            autoFocus
          />
        </div>
      )}
      {hint && <p className="mt-1 text-[12px] text-[#616161]">{hint}</p>}
    </div>
  );
}
