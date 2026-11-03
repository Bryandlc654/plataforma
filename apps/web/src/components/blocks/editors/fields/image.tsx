"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function ImageFields({ content, set }: FieldProps) {
    if (content.variant === "indigo") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Imagen Indigo (con borde)</div>
        <Field label="Imagen"><ImageField label="Imagen" value={content.imageUrl} onChange={(v) => { set("imageUrl", v); set("url", v); }} /></Field>
        <Field label="Texto alternativo"><TextInput value={content.title || content.alt} onChange={(v) => { set("title", v); set("alt", v); }} placeholder="Describe la imagen" /></Field>
        <Field label="Fondo">
          <select value={content.background || "light"} onChange={(e) => set("background", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </Field>
      </>;
    }
    return <>
      <ImageField label="URL de la imagen" value={content.url} onChange={(v) => set("url", v)} />
      <Field label="Texto alternativo"><TextInput value={content.alt} onChange={(v) => set("alt", v)} placeholder="Describe la imagen" /></Field>
      <Field label="Enlace (opcional)"><TextInput value={content.link} onChange={(v) => set("link", v)} placeholder="https://..." /></Field>
      <Field label="Caption"><TextInput value={content.caption} onChange={(v) => set("caption", v)} placeholder="Texto debajo de la imagen" /></Field>
      <Field label="Alineación">
        <select value={content.alignment || "center"} onChange={(e) => set("alignment", e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
        </select>
      </Field>
    </>;
}
