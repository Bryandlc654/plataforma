"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function StatsFields({ content, set }: FieldProps) {
    if (content.variant === "rodriplast") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Indicadores Rodriplast (tarjetas con contador animado)</div>
        <Field label="Indicadores"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
          { key: "icon", label: "Icono", type: "icon", bi: true },
          { key: "value", label: "Valor (ej: 2500)" },
          { key: "suffix", label: "Sufijo (ej: +, Tn, %)" },
          { key: "label", label: "Etiqueta" },
        ]} /></Field>
      </>;
    }
    if (content.variant === "graduate") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Indicadores Graduate (banda oscura)</div>
        <Field label="Indicadores"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
          { key: "icon", label: "Icono (ej: fa-solid fa-medal)", type: "icon" },
          { key: "value", label: "Valor (ej: +500)" },
          { key: "label", label: "Etiqueta" },
          { key: "color", label: "Color del número", type: "select", options: [{ label: "Naranja", value: "text-[#fa7202]" }, { label: "Azul", value: "text-[#21b1fe]" }, { label: "Verde", value: "text-[#7dd958]" }, { label: "Azul oscuro", value: "text-[#2d2e81]" }] },
        ]} /></Field>
      </>;
    }
    if (content.variant === "indigo") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Indicadores Indigo</div>
        <Field label="Estilo">
          <select value={content.style || "default"} onChange={(e) => set("style", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="default">Sólido</option>
            <option value="drop-shadow">Sombra difusa</option>
          </select>
        </Field>
        <Field label="Indicadores"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
          { key: "value", label: "Valor (ej: 12+)" },
          { key: "label", label: "Etiqueta" },
        ]} /></Field>
      </>;
    }
    return <>
      <Field label="Indicadores"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
        { key: "icon", label: "Icono (ej: bi-crosshair)" },
        { key: "value", label: "Valor (ej: 2500)" },
        { key: "suffix", label: "Sufijo (ej: +, %, Tn)" },
        { key: "label", label: "Etiqueta" },
      ]} /></Field>
    </>;
}
