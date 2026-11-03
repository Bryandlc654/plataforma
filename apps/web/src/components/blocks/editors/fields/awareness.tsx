"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function AwarenessFields({ content, set }: FieldProps) {
    return <>
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Bloque de conciencia Indigo (pregunta + párrafo + destacado)</div>
      <Field label="Título (pregunta)"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="¿Estás compitiendo solo por precio?" /></Field>
      <Field label="Párrafo"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={4} placeholder="Cuando tu marca se ve igual a todas las demás..." /></Field>
      <Field label="Texto destacado"><TextInput value={content.highlight} onChange={(v) => set("highlight", v)} placeholder="Es momento de subir el nivel." /></Field>
      <Field label="Estilo del destacado">
        <select value={content.highlightStyle || "default"} onChange={(e) => set("highlightStyle", e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
          <option value="default">Amarillo</option>
          <option value="dark">Oscuro</option>
        </select>
      </Field>
    </>;
}
