"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function FeaturesFields({ content, set }: FieldProps) {
    if (content.variant === "urban-noir") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Catálogo Urban Noir (tarjetas de categoría con imagen en escala de grises)</div>
        <Field label="Ancla / ID"><TextInput value={content.anchor} onChange={(v) => set("anchor", v)} placeholder="catalogo" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Catálogo" /></Field>
        <Field label="Texto del enlace (arriba a la derecha)"><TextInput value={content.linkText} onChange={(v) => set("linkText", v)} placeholder="Ver todas las categorías" /></Field>
        <Field label="URL del enlace"><TextInput value={content.linkUrl} onChange={(v) => set("linkUrl", v)} placeholder="#" /></Field>
        <Field label="Categorías"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
          { key: "image", label: "Imagen", type: "image" },
          { key: "title", label: "Título" },
          { key: "link", label: "URL de enlace" },
        ]} /></Field>
      </>;
    }
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
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Sección Indigo (imagen + texto)</div>
        <Field label="Número / Kicker"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="02" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="STRATEGIC BRANDING" /></Field>
        <Field label="Párrafo"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={3} /></Field>
        <Field label="Imagen de la sección"><ImageField label="Imagen de la sección" value={content.imageUrl} onChange={(v) => set("imageUrl", v)} /></Field>
        <Field label="Items (grid)"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[{ key: "title", label: "Título" }, { key: "desc", label: "Descripción", type: "textarea" }]} /></Field>
      </>;
    }
    if (content.variant === "graduate") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Academia Graduate (tarjetas de cursos)</div>
        <Field label="Etiqueta (eyebrow)"><TextInput value={content.academiaEyebrow} onChange={(v) => set("academiaEyebrow", v)} placeholder="Nuestra Academia" /></Field>
        <Field label="Icono del eyebrow"><IconPicker value={content.academiaEyebrowIcon} onChange={(v) => set("academiaEyebrowIcon", v)} /></Field>
        <Field label="Título (parte 1)"><TextInput value={content.academiaTitleLine1} onChange={(v) => set("academiaTitleLine1", v)} placeholder="Aprende con los" /></Field>
        <Field label="Título (palabra destacada)"><TextInput value={content.academiaHighlight} onChange={(v) => set("academiaHighlight", v)} placeholder="mejores." /></Field>
        <Field label="Texto del lado derecho"><TextInput value={content.academiaRightText} onChange={(v) => set("academiaRightText", v)} type="textarea" rows={2} /></Field>
        <Field label="Texto del enlace"><TextInput value={content.academiaLinkText} onChange={(v) => set("academiaLinkText", v)} placeholder="Explorar todos los programas" /></Field>
        <Field label="URL del enlace"><TextInput value={content.academiaLinkUrl} onChange={(v) => set("academiaLinkUrl", v)} placeholder="#contacto" /></Field>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cursos</p>
          <Field label="Cursos"><ArrayEditor value={content.courses} onChange={(v) => set("courses", v)} fields={[
            { key: "image", label: "Imagen (URL)" },
            { key: "badge", label: "Etiqueta superior (ej: Más solicitado)" },
            { key: "title", label: "Título" },
            { key: "desc", label: "Descripción", type: "textarea" },
            { key: "duration", label: "Duración (ej: 12 Horas)" },
            { key: "buttonText", label: "Texto del botón (ej: Inscríbete)" },
            { key: "buttonUrl", label: "URL del botón" },
          ]} /></Field>
        </div>
      </>;
    }
    return <>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="¿Por qué elegirnos?" /></Field>
      <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} /></Field>
      <Field label="Items"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
        { key: "icon", label: "Icono (emoji)" },
        { key: "title", label: "Título" },
        { key: "desc", label: "Descripción", type: "textarea" },
      ]} /></Field>
    </>;
}
