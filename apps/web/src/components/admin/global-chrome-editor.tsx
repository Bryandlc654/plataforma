"use client";

import { ImageField } from "@/components/blocks/editors/image-field";
import type { ChangeEvent } from "react";

interface Chrome {
  header?: any;
  footer?: any;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, rows }: { value: any; onChange: (v: any) => void; placeholder?: string; rows?: number }) {
  if (rows) {
    return <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none placeholder:text-slate-300" />;
  }
  return <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-300" />;
}

function ArrayEditor({ value, onChange, fields }: { value: any[]; onChange: (v: any[]) => void; fields: Array<{ key: string; label: string; type?: string }> }) {
  const items = value || [];
  const add = () => { const item: any = {}; fields.forEach((f) => (item[f.key] = "")); onChange([...items, item]); };
  const update = (idx: number, key: string, val: any) => onChange(items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  return (
    <div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="relative p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase">Item {i + 1}</span>
              <button onClick={() => remove(i)} className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((f) =>
                f.type === "image" ? (
                  <ImageField key={f.key} label={f.label} value={item[f.key]} onChange={(v) => update(i, f.key, v)} />
                ) : (
                  <TextInput key={f.key} value={item[f.key]} onChange={(v) => update(i, f.key, v)} placeholder={f.label} />
                )
              )}
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="w-full mt-3 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/30 transition-all">+ Agregar</button>
    </div>
  );
}

function EmptyHint({ onEnable, label }: { onEnable: () => void; label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
      <p className="text-xs text-slate-500 mb-2">
        {label === "header"
          ? "No hay header global configurado. Las páginas usarán sus propios bloques."
          : "No hay footer global configurado. Las páginas usarán sus propios bloques."}
      </p>
      <button onClick={onEnable} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
        + Activar {label} global
      </button>
    </div>
  );
}

interface Props {
  header: any;
  footer: any;
  onChange: (next: Chrome) => void;
  showOverrides?: boolean;
}

export function GlobalChromeEditor({ header, footer, onChange, showOverrides }: Props) {
  const setHeader = (patch: any) => onChange({ header: { variant: "indigo", ...(header || {}), ...patch }, footer });
  const setFooter = (patch: any) => onChange({ header, footer: { variant: "indigo", ...(footer || {}), ...patch } });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Header global</h4>
          {header && (
            <button onClick={() => onChange({ header: undefined, footer })} className="text-xs font-semibold text-red-500 hover:text-red-600">
              Desactivar
            </button>
          )}
        </div>
        {!header ? (
          <EmptyHint label="header" onEnable={() => setHeader({ navbarStyle: "white", companyName: "Mi Negocio", links: [] })} />
        ) : (
          <div className="rounded-xl border border-slate-200 p-4">
            {showOverrides && header._override && (
              <p className="text-[11px] font-medium text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mb-3">Override activo para este sitio</p>
            )}
            <Field label="Estilo de nav">
              <select value={header.navbarStyle || "white"} onChange={(e) => setHeader({ navbarStyle: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white">
                <option value="white">Blanco (fondo claro)</option>
                <option value="dark">Oscuro (fondo oscuro)</option>
              </select>
            </Field>
            <Field label="Nombre de la empresa"><TextInput value={header.companyName} onChange={(v) => setHeader({ companyName: v })} /></Field>
            <Field label="Logo (imagen)">
              <ImageField label="Logo" value={header.logoImage} onChange={(v) => setHeader({ logoImage: v })} />
            </Field>
            <Field label="Enlaces del menú">
              <ArrayEditor value={header.links} onChange={(v) => setHeader({ links: v })} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} />
            </Field>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Footer global</h4>
          {footer && (
            <button onClick={() => onChange({ header, footer: undefined })} className="text-xs font-semibold text-red-500 hover:text-red-600">
              Desactivar
            </button>
          )}
        </div>
        {!footer ? (
          <EmptyHint label="footer" onEnable={() => setFooter({ companyName: "Mi Negocio", links: [], social: [] })} />
        ) : (
          <div className="rounded-xl border border-slate-200 p-4">
            {showOverrides && footer._override && (
              <p className="text-[11px] font-medium text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mb-3">Override activo para este sitio</p>
            )}
            <Field label="Empresa"><TextInput value={footer.companyName} onChange={(v) => setFooter({ companyName: v })} /></Field>
            <Field label="Logo (imagen)">
              <ImageField label="Logo" value={footer.logoImage} onChange={(v) => setFooter({ logoImage: v })} />
            </Field>
            <Field label="Correo"><TextInput value={footer.email} onChange={(v) => setFooter({ email: v })} /></Field>
            <Field label="Teléfono"><TextInput value={footer.phone} onChange={(v) => setFooter({ phone: v })} /></Field>
            <Field label="Dirección"><TextInput value={footer.address} onChange={(v) => setFooter({ address: v })} rows={2} /></Field>
            <Field label="Enlaces">
              <ArrayEditor value={footer.links} onChange={(v) => setFooter({ links: v })} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} />
            </Field>
            <Field label="Redes sociales">
              <ArrayEditor value={footer.social} onChange={(v) => setFooter({ social: v })} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
