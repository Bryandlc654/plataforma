"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function BenefitsFields({ content, set }: FieldProps) {
    if (content.variant === "urban-noir") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Beneficios Urban Noir (3 columnas con íconos en círculo negro)</div>
        <Field label="Ancla / ID"><TextInput value={content.anchor} onChange={(v) => set("anchor", v)} placeholder="beneficios" /></Field>
        <Field label="Items"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
          { key: "icon", label: "Ícono (emoji o texto)" },
          { key: "title", label: "Título" },
          { key: "desc", label: "Descripción", type: "textarea" },
        ]} /></Field>
      </>;
    }
    if (content.variant === "rodriplast") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Beneficios Rodriplast (marquee de tarjetas con iconos)</div>
        <Field label="Ancla / ID"><TextInput value={content.anchor} onChange={(v) => set("anchor", v)} placeholder="beneficios" /></Field>
        <Field label="Kicker (etiqueta)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Beneficios" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Ventajas que marcan la diferencia" /></Field>
        <Field label="Tarjetas"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
          { key: "icon", label: "Icono", type: "icon", bi: true },
          { key: "title", label: "Título" },
          { key: "desc", label: "Descripción", type: "textarea" },
        ]} /></Field>
      </>;
    }
    if (content.variant === "indigo") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Beneficios Indigo (fondo oscuro + 3 columnas)</div>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="EL PODER DEL BRANDING" /></Field>
        <Field label="Acento">
          <select value={content.accent || "default"} onChange={(e) => set("accent", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="default">Amarillo</option>
            <option value="brand">Marca completa</option>
          </select>
        </Field>
        <Field label="Columnas"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
          { key: "number", label: "Número (ej: 01)" },
          { key: "title", label: "Título" },
          { key: "desc", label: "Descripción", type: "textarea" },
        ]} /></Field>
      </>;
    }
    return <>
      <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Beneficios" /></Field>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
      <Field label="Items"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
        { key: "icon", label: "Icono (ej: bi-shield-check)" },
        { key: "title", label: "Título" },
        { key: "desc", label: "Descripción", type: "textarea" },
      ]} /></Field>
    </>;
}
