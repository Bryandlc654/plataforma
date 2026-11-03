"use client";

import { useState } from "react";
import { ImageField } from "../image-field";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, type = "text", rows }: { value: any; onChange: (v: any) => void; placeholder?: string; type?: string; rows?: number }) {
  if (type === "textarea" || rows) {
    return <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={rows || 3} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none placeholder:text-slate-300" />;
  }
  return <input type={type} value={value || ""} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} placeholder={placeholder}
    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-300" />;
}

export function ArrayEditor({ value, onChange, fields }: { value: any[]; onChange: (v: any[]) => void; fields: Array<{ key: string; label: string; type?: string; options?: { label: string; value: string }[]; brand?: boolean; bi?: boolean }> }) {
  const items = value || [];
  const [toggled, setToggled] = useState<Record<number, boolean>>({});
  const isOpen = (i: number) => toggled[i] ?? items.length <= 3;
  const preview = (item: any) => { const k = fields.find((f) => !f.type && typeof item[f.key] === "string" && item[f.key].trim()); return k ? String(item[k.key]).trim() : ""; };
  const add = () => { const item: any = {}; fields.forEach((f) => (item[f.key] = f.type === "checkbox" ? false : "")); setToggled((s) => ({ ...s, [items.length]: true })); onChange([...items, item]); };
  const update = (idx: number, key: string, val: any) => onChange(items.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <div className={"flex items-center justify-between" + (isOpen(i) ? " mb-3" : "")}>
              <button type="button" onClick={() => setToggled((s) => ({ ...s, [i]: !isOpen(i) }))} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <svg className={"h-3 w-3 flex-shrink-0 text-slate-400 transition-transform " + (isOpen(i) ? "rotate-90" : "")} fill="currentColor" viewBox="0 0 20 20"><path d="M7 4l6 6-6 6V4z" /></svg>
                <span className="flex-shrink-0 text-xs font-semibold text-slate-500">{i + 1}.</span>
                <span className="truncate text-xs text-slate-600">{preview(item) || "Sin título"}</span>
              </button>
              <button onClick={() => remove(i)} className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            {isOpen(i) && <div className="space-y-2">
              {fields.map((f) =>
                f.type === "image" ? (
                  <ImageField key={f.key} label={f.label} value={item[f.key]} onChange={(v) => update(i, f.key, v)} />
                ) : f.type === "checkbox" ? (
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={!!item[f.key]} onChange={(e) => update(i, f.key, e.target.checked)} className="h-4 w-4 accent-primary rounded border-slate-300" />
                    <span className="text-sm text-slate-600">{f.label}</span>
                  </label>
                ) : f.type === "icon" ? (
                  <div key={f.key} className="space-y-1">
                    <label className="block text-xs font-medium text-slate-500">{f.label}</label>
                    <IconPicker value={item[f.key]} onChange={(v) => update(i, f.key, v)} brand={f.brand} bi={f.bi} />
                  </div>
                ) : f.type === "select" ? (
                  <div key={f.key} className="space-y-1">
                    <label className="block text-xs font-medium text-slate-500">{f.label}</label>
                    <select value={item[f.key] || ""} onChange={(e) => update(i, f.key, e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white">
                      <option value="">—</option>
                      {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                ) : f.type === "color" ? (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(item[f.key] || "") ? item[f.key] : "#2d2e81"}
                        onChange={(e) => update(i, f.key, e.target.value)} className="h-10 w-14 rounded-lg border border-slate-200 cursor-pointer flex-shrink-0" />
                      <TextInput value={item[f.key]} onChange={(v) => update(i, f.key, v)} placeholder="#2d2e81" />
                    </div>
                  </div>
                ) : (
                  <TextInput key={f.key} value={item[f.key]} onChange={(v) => update(i, f.key, v)} placeholder={f.label} type={f.type || "text"} />
                )
              )}
            </div>}
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-3 w-full rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
        + Agregar item
      </button>
    </div>
  );
}

export function RawHtmlFields({ content, set }: { content: any; set: (k: string, v: any) => void }) {
  const [showHtml, setShowHtml] = useState(false);
  const schema: Array<{ key: string; label: string; type: string; fields?: any[]; bi?: boolean; brand?: boolean }> = content.fieldSchema || [];

  return (
    <>
      <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 mb-4 text-xs text-indigo-700">
        Bloque importado desde ZIP. Edita los textos e imágenes detectados.
      </div>
      {schema.length === 0 && (
        <p className="text-sm text-slate-400 py-4 text-center">No se detectaron campos editables. Usa el HTML avanzado.</p>
      )}
      {schema.map((f) => {
        if (f.type === "array") {
          return (
            <Field key={f.key} label={f.label}>
              <ArrayEditor value={content[f.key]} onChange={(v) => set(f.key, v)} fields={f.fields || []} />
            </Field>
          );
        }
        if (f.type === "image") {
          return <ImageField key={f.key} label={f.label} value={content[f.key]} onChange={(v) => set(f.key, v)} />;
        }
        if (f.type === "icon") {
          return (
            <Field key={f.key} label={f.label}>
              <IconPicker value={content[f.key]} onChange={(v) => set(f.key, v)} bi={f.bi} brand={f.brand} />
            </Field>
          );
        }
        return (
          <Field key={f.key} label={f.label}>
            <TextInput value={content[f.key]} onChange={(v) => set(f.key, v)} type={f.type || "text"} />
          </Field>
        );
      })}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <button type="button" onClick={() => setShowHtml((s) => !s)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700">
          <span>HTML avanzado</span>
          <span>{showHtml ? "▲" : "▼"}</span>
        </button>
        {showHtml && (
          <textarea value={content.html || ""} onChange={(e) => set("html", e.target.value)} rows={14} spellCheck={false}
            className="mt-3 w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
        )}
      </div>
    </>
  );
}

const FA_ICONS = [
  { value: "fa-solid fa-bullhorn", label: "Megáfono" },
  { value: "fa-solid fa-fire", label: "Fuego" },
  { value: "fa-solid fa-bolt", label: "Rayo" },
  { value: "fa-solid fa-rocket", label: "Cohete" },
  { value: "fa-solid fa-chart-line", label: "Gráfico de línea" },
  { value: "fa-solid fa-chart-pie", label: "Gráfico de pastel" },
  { value: "fa-solid fa-arrow-trend-up", label: "Tendencia al alza" },
  { value: "fa-solid fa-comments", label: "Comentarios" },
  { value: "fa-solid fa-thumbs-up", label: "Me gusta" },
  { value: "fa-solid fa-heart", label: "Corazón" },
  { value: "fa-solid fa-star", label: "Estrella" },
  { value: "fa-solid fa-trophy", label: "Trofeo" },
  { value: "fa-solid fa-award", label: "Premio" },
  { value: "fa-solid fa-graduation-cap", label: "Graduación" },
  { value: "fa-solid fa-book-open", label: "Libro" },
  { value: "fa-solid fa-laptop-code", label: "Laptop con código" },
  { value: "fa-solid fa-code", label: "Código" },
  { value: "fa-solid fa-mobile-screen", label: "Móvil" },
  { value: "fa-solid fa-globe", label: "Globo" },
  { value: "fa-solid fa-bullseye", label: "Diana" },
  { value: "fa-solid fa-crosshairs", label: "Precisión" },
  { value: "fa-solid fa-pen-nib", label: "Pluma" },
  { value: "fa-solid fa-palette", label: "Paleta" },
  { value: "fa-solid fa-camera", label: "Cámara" },
  { value: "fa-solid fa-video", label: "Video" },
  { value: "fa-solid fa-clapperboard", label: "Claqueta" },
  { value: "fa-solid fa-wand-magic-sparkles", label: "Varita mágica" },
  { value: "fa-solid fa-user-plus", label: "Agregar usuario" },
  { value: "fa-solid fa-users", label: "Usuarios" },
  { value: "fa-solid fa-users-gear", label: "Usuarios con engranaje" },
  { value: "fa-solid fa-handshake", label: "Apretón de manos" },
  { value: "fa-solid fa-phone", label: "Teléfono" },
  { value: "fa-solid fa-envelope", label: "Sobre" },
  { value: "fa-solid fa-cart-shopping", label: "Carrito" },
  { value: "fa-solid fa-bag-shopping", label: "Bolsa de compras" },
  { value: "fa-solid fa-credit-card", label: "Tarjeta de crédito" },
  { value: "fa-solid fa-money-bill-trend-up", label: "Dinero y crecimiento" },
  { value: "fa-solid fa-coins", label: "Monedas" },
  { value: "fa-solid fa-circle-check", label: "Check en círculo" },
  { value: "fa-solid fa-check", label: "Check" },
  { value: "fa-solid fa-lightbulb", label: "Bombilla" },
  { value: "fa-solid fa-magnifying-glass", label: "Lupa" },
  { value: "fa-solid fa-gear", label: "Engranaje" },
  { value: "fa-solid fa-shield-halved", label: "Escudo" },
  { value: "fa-solid fa-lock", label: "Candado" },
  { value: "fa-solid fa-calendar-check", label: "Calendario con check" },
  { value: "fa-solid fa-clock", label: "Reloj" },
  { value: "fa-solid fa-paper-plane", label: "Avión de papel" },
  { value: "fa-solid fa-sliders", label: "Controles / ajustes" },
  { value: "fa-solid fa-spinner", label: "Carga / dinámico" },
  { value: "fa-solid fa-download", label: "Descarga" },
  { value: "fa-solid fa-receipt", label: "Recibo / factura" },
];

const FA_BRAND_ICONS = [
  { value: "fa-brands fa-facebook-f", label: "Facebook" },
  { value: "fa-brands fa-instagram", label: "Instagram" },
  { value: "fa-brands fa-whatsapp", label: "WhatsApp" },
  { value: "fa-brands fa-tiktok", label: "TikTok" },
  { value: "fa-brands fa-x-twitter", label: "X (Twitter)" },
  { value: "fa-brands fa-youtube", label: "YouTube" },
  { value: "fa-brands fa-linkedin-in", label: "LinkedIn" },
  { value: "fa-brands fa-telegram", label: "Telegram" },
  { value: "fa-brands fa-discord", label: "Discord" },
  { value: "fa-brands fa-github", label: "GitHub" },
  { value: "fa-brands fa-spotify", label: "Spotify" },
  { value: "fa-brands fa-google", label: "Google" },
];

const BI_ICONS = [
  { value: "bi-arrow-repeat", label: "Reciclaje / repetir" },
  { value: "bi-arrow-right", label: "Flecha derecha" },
  { value: "bi-arrow-up-right", label: "Flecha diagonal" },
  { value: "bi-award", label: "Premio" },
  { value: "bi-box-seam", label: "Caja / paquete" },
  { value: "bi-building", label: "Edificio" },
  { value: "bi-calendar-check", label: "Calendario" },
  { value: "bi-check-lg", label: "Check" },
  { value: "bi-check2-circle", label: "Check en círculo" },
  { value: "bi-clock", label: "Reloj" },
  { value: "bi-crosshair", label: "Precisión / diana" },
  { value: "bi-cup-straw", label: "Sorbete / bebida" },
  { value: "bi-envelope", label: "Sobre" },
  { value: "bi-flag", label: "Bandera" },
  { value: "bi-flower1", label: "Flor" },
  { value: "bi-gear", label: "Engranaje" },
  { value: "bi-geo-alt", label: "Ubicación" },
  { value: "bi-geo-alt-fill", label: "Ubicación rellena" },
  { value: "bi-globe-americas", label: "Globo América" },
  { value: "bi-heart", label: "Corazón" },
  { value: "bi-house", label: "Casa" },
  { value: "bi-lightbulb", label: "Bombilla" },
  { value: "bi-map", label: "Mapa" },
  { value: "bi-patch-check", label: "Certificado" },
  { value: "bi-pencil", label: "Lápiz" },
  { value: "bi-people", label: "Personas" },
  { value: "bi-person", label: "Persona" },
  { value: "bi-play-circle", label: "Reproducir" },
  { value: "bi-quote", label: "Comillas" },
  { value: "bi-rocket-takeoff", label: "Cohete" },
  { value: "bi-send", label: "Enviar" },
  { value: "bi-shield-check", label: "Escudo verificado" },
  { value: "bi-speedometer2", label: "Velocímetro" },
  { value: "bi-star", label: "Estrella" },
  { value: "bi-star-fill", label: "Estrella rellena" },
  { value: "bi-sun", label: "Sol" },
  { value: "bi-telephone", label: "Teléfono" },
  { value: "bi-box-arrow-up-right", label: "Enlace externo" },
];

const BI_BRAND_ICONS = [
  { value: "bi-facebook", label: "Facebook" },
  { value: "bi-instagram", label: "Instagram" },
  { value: "bi-whatsapp", label: "WhatsApp" },
  { value: "bi-tiktok", label: "TikTok" },
  { value: "bi-twitter-x", label: "X (Twitter)" },
  { value: "bi-youtube", label: "YouTube" },
  { value: "bi-linkedin", label: "LinkedIn" },
  { value: "bi-telegram", label: "Telegram" },
];

export function IconPicker({ value, onChange, brand = false, bi = false }: { value?: string; onChange: (v: string) => void; brand?: boolean; bi?: boolean }) {
  const [open, setOpen] = useState(false);
  const list = brand ? (bi ? BI_BRAND_ICONS : FA_BRAND_ICONS) : (bi ? BI_ICONS : FA_ICONS);
  const matched = list.some((i) => i.value === value);
  return (
    <div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(!open)}
          className="flex-shrink-0 inline-flex items-center justify-center w-12 h-11 text-lg text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all">
          <i className={`${bi ? `bi ${value}` : value || "fa-solid fa-icons"}`} />
        </button>
        <TextInput value={value || ""} onChange={onChange} placeholder={bi ? "Icono Bootstrap (bi-...)" : (matched ? "Icono Font Awesome" : "Clase personalizada (fa-...)")} />
      </div>
      {open && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-lg p-2">
          <div className="grid grid-cols-8 gap-1 max-h-44 overflow-y-auto pr-1">
            {list.map((ic) => (
              <button key={ic.value} type="button" title={ic.label} onClick={() => { onChange(ic.value); setOpen(false); }}
                className={`p-2 rounded-lg text-center ${value === ic.value ? "bg-primary-100 text-primary-700 ring-2 ring-primary-300" : "text-slate-500 hover:bg-slate-100"}`}>
                <i className={`${bi ? `bi ${ic.value}` : ic.value} text-base`} />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setOpen(false)} className="mt-2 w-full py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600">Cerrar</button>
        </div>
      )}
    </div>
  );
}

export interface FieldProps { content: any; set: (key: string, value: any) => void; }
