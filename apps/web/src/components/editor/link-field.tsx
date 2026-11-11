"use client";

import { createContext, useContext, useState } from "react";

export interface LinkOption { label: string; value: string; }

/** Destinos que ofrece el selector: páginas del sitio y secciones de la página abierta. */
export interface LinkOptions { pages: LinkOption[]; sections: LinkOption[]; }

export const LinkOptionsContext = createContext<LinkOptions>({ pages: [], sections: [] });

const CUSTOM = "__custom__";
const NONE = "";

const inputCls =
  "block w-full rounded-lg border border-[#8a8a8a]/50 bg-white px-2.5 py-1.5 text-[13px] text-[#303030] outline-none placeholder:text-[#8a8a8a] focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary)_25%,transparent)]";

function describe(value: string): string {
  if (/^https?:\/\/(wa\.me|api\.whatsapp)/i.test(value)) return "WhatsApp";
  if (/^mailto:/i.test(value)) return "Correo";
  if (/^tel:/i.test(value)) return "Teléfono";
  if (/^https?:\/\//i.test(value)) return "Otra web";
  return "";
}

/**
 * Selector de destino de un enlace o botón (como en Shopify): una página del sitio, una
 * sección de esta página o una dirección propia (otra web, WhatsApp, correo, teléfono).
 */
export function LinkField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  const { pages, sections } = useContext(LinkOptionsContext);
  const v = String(value || "");
  const known = [...pages, ...sections].some((o) => o.value === v);
  const [custom, setCustom] = useState(!known && v !== "" && v !== "#");
  const selected = custom ? CUSTOM : known ? v : NONE;

  return (
    <div>
      <span className="mb-1 block text-[13px] font-medium text-[#303030]">{label}</span>
      <select
        className={inputCls}
        value={selected}
        onChange={(e) => {
          const next = e.target.value;
          if (next === CUSTOM) { setCustom(true); if (known || v === "#") onChange(""); return; }
          setCustom(false);
          onChange(next || "#");
        }}
      >
        <option value={NONE}>Sin destino</option>
        {pages.length > 0 && (
          <optgroup label="Páginas">
            {pages.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </optgroup>
        )}
        {sections.length > 0 && (
          <optgroup label="Secciones de esta página">
            {sections.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </optgroup>
        )}
        <option value={CUSTOM}>Otra dirección (web, WhatsApp, correo…)</option>
      </select>
      {custom && (
        <div className="mt-1.5">
          <input
            className={inputCls}
            value={v}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… · https://wa.me/593… · mailto:… · tel:…"
            inputMode="url"
            autoFocus
          />
          {describe(v) && <p className="mt-1 text-[12px] text-[#616161]">Tipo: {describe(v)}</p>}
        </div>
      )}
      {hint && <p className="mt-1 text-[12px] text-[#616161]">{hint}</p>}
    </div>
  );
}
