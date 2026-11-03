"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function GalleryFields({ content, set }: FieldProps) {
    if (content.variant === "rodriplast") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Galería Rodriplast (detrás de escena)</div>
        <Field label="Ancla / ID"><TextInput value={content.anchor} onChange={(v) => set("anchor", v)} placeholder="galeria" /></Field>
        <Field label="Kicker (etiqueta)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Detrás de escena" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Así nace cada manguera" /></Field>
        <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} /></Field>
        <Field label="Imágenes"><ArrayEditor value={content.images} onChange={(v) => set("images", v)} fields={[{ key: "url", label: "Imagen", type: "image" }, { key: "alt", label: "Texto alternativo" }]} /></Field>
      </>;
    }
    return <>
      <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Detrás de escena" /></Field>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
      <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} /></Field>
      <Field label="Imágenes"><ArrayEditor value={content.images} onChange={(v) => set("images", v)} fields={[{ key: "url", label: "Imagen", type: "image" }, { key: "alt", label: "Texto alternativo" }]} /></Field>
    </>;
}
