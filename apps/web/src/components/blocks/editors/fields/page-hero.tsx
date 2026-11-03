"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function PageHeroFields({ content, set }: FieldProps) {
    if (content.variant === "indigo") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Hero de página Indigo (título + párrafo)</div>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="NUESTRA AGENCIA" /></Field>
        <Field label="Párrafo"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={3} placeholder="Llevamos más de una década transformando ideas locas en marcas sólidas..." /></Field>
        <Field label="Fondo">
          <select value={content.background || "light"} onChange={(e) => set("background", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="light">Claro</option>
            <option value="brand">Amarillo marca</option>
            <option value="dark">Oscuro (texto resaltado)</option>
            <option value="dark-plain">Oscuro plano</option>
            <option value="works">Obras (con marquee)</option>
            <option value="contact">Contacto (con marquee)</option>
          </select>
        </Field>
        {(content.background === "contact" || content.background === "works") && <>
          <Field label="Texto del marquee"><TextInput value={content.marqueeText} onChange={(v) => set("marqueeText", v)} placeholder="HABLEMOS" /></Field>
          <Field label="Tamaño del texto del marquee"><TextInput value={content.marqueeSize} onChange={(v) => set("marqueeSize", v)} placeholder="18rem" /></Field>
          <Field label="Opacidad del marquee (0.05 - 1)"><TextInput value={content.marqueeOpacity} onChange={(v) => set("marqueeOpacity", v)} type="number" placeholder="0.1" /></Field>
        </>}
      </>;
    }
    return <p className="text-sm text-slate-400 py-8 text-center">Editor no disponible</p>;
}
