"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function TestimonialsFields({ content, set }: FieldProps) {
    if (content.variant === "rodriplast") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Testimonios Rodriplast (marquee de citas)</div>
        <Field label="Ancla / ID"><TextInput value={content.anchor} onChange={(v) => set("anchor", v)} placeholder="clientes" /></Field>
        <Field label="Kicker (etiqueta)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Testimonios" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Lo que dicen nuestros clientes" /></Field>
        <Field label="Testimonios"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[{ key: "name", label: "Nombre" }, { key: "role", label: "Cargo" }, { key: "quote", label: "Testimonio", type: "textarea" }]} /></Field>
      </>;
    }
    if (content.variant === "graduate") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Testimonios Graduate (muro de reseñas + marcas de confianza)</div>
        <Field label="Etiqueta (eyebrow)"><TextInput value={content.testiEyebrow} onChange={(v) => set("testiEyebrow", v)} placeholder="Casos de Éxito" /></Field>
        <Field label="Título (parte 1)"><TextInput value={content.testiTitleLine1} onChange={(v) => set("testiTitleLine1", v)} placeholder="Resultados que hablan por" /></Field>
        <Field label="Título (palabra destacada)"><TextInput value={content.testiHighlight} onChange={(v) => set("testiHighlight", v)} placeholder="sí solos." /></Field>
        <Field label="Subtítulo"><TextInput value={content.testiSubtitle} onChange={(v) => set("testiSubtitle", v)} type="textarea" rows={2} /></Field>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Testimonios</p>
          <Field label="Tarjetas"><ArrayEditor value={content.testimonials} onChange={(v) => set("testimonials", v)} fields={[
            { key: "large", label: "Tarjeta grande (true/false)", type: "text" },
            { key: "gradient", label: "Gradiente (ej: from-[#2d2e81] to-[#0a0b2e])" },
            { key: "starColor", label: "Color estrellas (text-[hex])" },
            { key: "quote", label: "Testimonio", type: "textarea" },
            { key: "name", label: "Nombre" },
            { key: "role", label: "Cargo" },
            { key: "roleColor", label: "Color del cargo (text-[color])" },
            { key: "avatar", label: "Avatar", type: "image" },
            { key: "online", label: "Conectado (true/false)", type: "text" },
          ]} /></Field>
        </div>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Marcas de confianza</p>
          <Field label="Marcas"><ArrayEditor value={content.brands} onChange={(v) => set("brands", v)} fields={[
            { key: "title", label: "Nombre de la marca" },
            { key: "accent", label: "Color del punto (class, ej: bg-[#fa7202])" },
            { key: "color", label: "Color del texto (class)" },
            { key: "classes", label: "Clases extra" },
          ]} /></Field>
        </div>
      </>;
    }
    return <>
      <Field label="Origen de reseñas">
        <select value={content.source || "manual"} onChange={(e) => set("source", e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
          <option value="manual">Manual (Configurar aquí)</option>
          <option value="dynamic">Dinámico (Opiniones de clientes reales)</option>
        </select>
      </Field>
      <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Testimonios" /></Field>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
      <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} /></Field>
      <Field label="Columnas (escritorio)">
        <select value={content.columns || 3} onChange={(e) => set("columns", parseInt(e.target.value))}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
          <option value={1}>1 columna</option>
          <option value={2}>2 columnas</option>
          <option value={3}>3 columnas</option>
        </select>
      </Field>
      <Field label="Modo carrusel">
        <select value={content.carousel ? "yes" : "no"} onChange={(e) => set("carousel", e.target.value === "yes")}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
          <option value="no">Cuadrícula estática</option>
          <option value="yes">Carrusel automático</option>
        </select>
      </Field>
      <Field label="Testimonios"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[{ key: "name", label: "Nombre" }, { key: "role", label: "Cargo" }, { key: "quote", label: "Testimonio", type: "textarea" }]} /></Field>
    </>;
}
