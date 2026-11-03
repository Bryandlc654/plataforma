"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function PortfolioFields({ content, set }: FieldProps) {
    if (content.variant === "urban-noir") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Productos Urban Noir (grid de productos en escala de grises)</div>
        <Field label="Ancla / ID"><TextInput value={content.anchor} onChange={(v) => set("anchor", v)} placeholder="productos" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="MÁS BUSCADOS" /></Field>
        <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} /></Field>
        <Field label="Productos"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
          { key: "image", label: "Imagen", type: "image" },
          { key: "tag", label: "Etiqueta (ej: Nuevo, -20%)" },
          { key: "title", label: "Título" },
          { key: "desc", label: "Descripción", type: "textarea" },
          { key: "price", label: "Precio (ej: 45.00)" },
          { key: "compareAt", label: "Precio antiguo (opcional, ej: 95.00)" },
        ]} /></Field>
        <Field label="Texto del botón (abajo)"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Ver Todo el Catálogo" /></Field>
        <Field label="URL del botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} placeholder="#" /></Field>
      </>;
    }
    if (content.variant === "rodriplast") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Productos Rodriplast (tarjetas con imagen de fondo + icono bi)</div>
        <Field label="Ancla / ID"><TextInput value={content.anchor} onChange={(v) => set("anchor", v)} placeholder="productos" /></Field>
        <Field label="Kicker (etiqueta)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Productos" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Soluciones que se adaptan a cada industria" /></Field>
        <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} /></Field>
        <Field label="Tarjetas"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
          { key: "image", label: "Imagen de fondo", type: "image" },
          { key: "tag", label: "Etiqueta (ej: Agrícola)" },
          { key: "title", label: "Título" },
          { key: "icon", label: "Icono", type: "icon", bi: true },
          { key: "link", label: "URL de enlace" },
          { key: "desc", label: "Descripción", type: "textarea" },
        ]} /></Field>
      </>;
    }
    if (content.variant === "indigo") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Portafolio Indigo (imagen grande + overlay)</div>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Proyectos destacados" /></Field>
        <Field label="Descripción"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={2} /></Field>
        <Field label="Imagen de la sección"><ImageField label="Imagen de la sección" value={content.imageUrl} onChange={(v) => set("imageUrl", v)} /></Field>
        <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="VER TODOS" /></Field>
        <Field label="URL del botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} /></Field>
      </>;
    }
    return <>
      <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Productos" /></Field>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
      <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} /></Field>
      <Field label="Items"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
        { key: "image", label: "Imagen del producto", type: "image" },
        { key: "tag", label: "Etiqueta (ej: Agrícola)" },
        { key: "title", label: "Título" },
        { key: "icon", label: "Icono (ej: bi-crosshair)" },
        { key: "link", label: "URL de enlace" },
        { key: "desc", label: "Descripción", type: "textarea" },
      ]} /></Field>
    </>;
}
