"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function LunchMenuFields({ content, set }: FieldProps) {
    return <>
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Menú de almuerzo Dishora (el estilo es fijo de la plantilla)</div>
      <Field label="Etiqueta (encabezado)"><TextInput value={content.lunchEyebrow} onChange={(v) => set("lunchEyebrow", v)} placeholder="CHEF'S WORDS" /></Field>
      <Field label="Título (encabezado)"><TextInput value={content.lunchTitle} onChange={(v) => set("lunchTitle", v)} placeholder="LUNCH MENU" /></Field>
      <Field label="Fondo (imagen)"><ImageField label="Fondo" value={content.diningBg} onChange={(v) => set("diningBg", v)} /></Field>
      <Field label="Plato superpuesto (imagen)"><ImageField label="Plato" value={content.dishOverlapImg} onChange={(v) => set("dishOverlapImg", v)} /></Field>
      <Field label="Items del menú"><ArrayEditor value={content.lunchItems} onChange={(v) => set("lunchItems", v)} fields={[{ key: "name", label: "Nombre" }, { key: "desc", label: "Descripción", type: "textarea" }, { key: "price", label: "Precio" }, { key: "thumb", label: "Imagen", type: "image" }]} /></Field>
    </>;
}
