"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function PortfolioGridFields({ content, set }: FieldProps) {
    return <>
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Grilla de proyectos Indigo</div>
      <Field label="Título (CTA final)"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="TU MARCA ES EL PRÓXIMO CASO DE ÉXITO." /></Field>
      <Field label="Texto del botón (CTA final)"><TextInput value={content.ctaText} onChange={(v) => set("ctaText", v)} placeholder="EMPECEMOS AHORA" /></Field>
      <Field label="URL del botón (CTA final)"><TextInput value={content.ctaUrl} onChange={(v) => set("ctaUrl", v)} placeholder="#contacto" /></Field>
      <Field label="Sombra de los proyectos">
        <select value={content.shadow === false ? "off" : "on"} onChange={(e) => set("shadow", e.target.value === "on")}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
          <option value="on">Activada</option>
          <option value="off">Desactivada</option>
        </select>
      </Field>
      <Field label="Proyectos"><ArrayEditor value={content.projects || content.items} onChange={(v) => set("projects", v)} fields={[
        { key: "number", label: "Número (ej: 01)" },
        { key: "title", label: "Título" },
        { key: "sub", label: "Subtítulo" },
        { key: "hover", label: "Estilo (slide, overlay-brand, overlay-dark)" },
        { key: "colSpan", label: "Columnas (5, 7 o 12)" },
        { key: "imgHeight", label: "Altura imagen (ej: h-[400px] md:h-[600px])" },
        { key: "img", label: "Imagen", type: "image" },
        { key: "url", label: "URL del proyecto" },
        { key: "numberStyle", label: "Color número (brand/dark)" },
        { key: "mt", label: "Margen superior (ej: mt-12 md:mt-24)" },
      ]} /></Field>
    </>;
}
