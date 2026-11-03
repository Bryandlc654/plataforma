"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function ProcessFields({ content, set }: FieldProps) {
    if (content.variant === "rodriplast") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Proceso Rodriplast (fondo oscuro, 4 pasos numerados)</div>
        <Field label="Ancla / ID"><TextInput value={content.anchor} onChange={(v) => set("anchor", v)} placeholder="proceso" /></Field>
        <Field label="Kicker (etiqueta)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Proceso" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="De residuo a manguera: cuatro pasos con propósito" /></Field>
        <Field label="Imagen de fondo (opcional)"><ImageField label="Imagen de fondo" value={content.backgroundImage} onChange={(v) => set("backgroundImage", v)} /></Field>
        <Field label="Pasos"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
          { key: "icon", label: "Icono", type: "icon", bi: true },
          { key: "title", label: "Título" },
          { key: "desc", label: "Descripción", type: "textarea" },
        ]} /></Field>
      </>;
    }
    if (content.variant === "indigo") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Sección Indigo (imagen + pasos)</div>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Cómo trabajamos" /></Field>
        <Field label="Imagen de la sección"><ImageField label="Imagen de la sección" value={content.imageUrl} onChange={(v) => set("imageUrl", v)} /></Field>
        <Field label="Pasos"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[{ key: "number", label: "Número (ej: 01)" }, { key: "title", label: "Título" }, { key: "desc", label: "Descripción", type: "textarea" }]} /></Field>
      </>;
    }
    return <>
      <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Proceso" /></Field>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
      <Field label="Imagen de fondo (opcional)"><ImageField label="Imagen de fondo" value={content.backgroundImage} onChange={(v) => set("backgroundImage", v)} /></Field>
      <Field label="Pasos"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
        { key: "icon", label: "Icono (ej: bi-arrow-repeat)" },
        { key: "title", label: "Título" },
        { key: "desc", label: "Descripción", type: "textarea" },
      ]} /></Field>
    </>;
}
