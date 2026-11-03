"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function TimelineFields({ content, set }: FieldProps) {
    return <>
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Línea de tiempo Graduate (historia de la marca)</div>
      <Field label="Etiqueta (eyebrow)"><TextInput value={content.timelineEyebrow} onChange={(v) => set("timelineEyebrow", v)} placeholder="Nuestra Historia" /></Field>
      <Field label="Icono del eyebrow"><IconPicker value={content.timelineEyebrowIcon} onChange={(v) => set("timelineEyebrowIcon", v)} /></Field>
      <Field label="Título (parte 1)"><TextInput value={content.timelineTitleLine1} onChange={(v) => set("timelineTitleLine1", v)} placeholder="El camino que nos ha" /></Field>
      <Field label="Título (palabra destacada)"><TextInput value={content.timelineHighlight} onChange={(v) => set("timelineHighlight", v)} placeholder="traído aquí." /></Field>
      <Field label="Hitos"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
        { key: "year", label: "Año (ej: 2019)" },
        { key: "icon", label: "Icono (ej: fa-solid fa-lightbulb)", type: "icon" },
        { key: "title", label: "Título del hito" },
        { key: "desc", label: "Descripción", type: "textarea" },
        { key: "color", label: "Color (año e icono)", type: "select", options: [{ label: "Naranja", value: "text-[#fa7202]" }, { label: "Azul", value: "text-[#21b1fe]" }, { label: "Verde", value: "text-[#7dd958]" }, { label: "Azul oscuro", value: "text-[#2d2e81]" }] },
        { key: "borderColor", label: "Borde del punto", type: "select", options: [{ label: "Naranja", value: "border-[#fa7202]" }, { label: "Azul", value: "border-[#21b1fe]" }, { label: "Verde", value: "border-[#7dd958]" }, { label: "Azul oscuro", value: "border-[#2d2e81]" }] },
      ]} /></Field>
    </>;
}
