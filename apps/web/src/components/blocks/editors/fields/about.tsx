"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function AboutFields({ content, set }: FieldProps) {
    if (content.variant === "rodriplast") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Nosotros Rodriplast (imagen + insignia ISO + checklist + CTA)</div>
        <Field label="Ancla / ID"><TextInput value={content.anchor} onChange={(v) => set("anchor", v)} placeholder="nosotros" /></Field>
        <Field label="Kicker (etiqueta)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Nosotros" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Una industria ecuatoriana que transforma residuos en soluciones." /></Field>
        <Field label="Descripción"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={4} /></Field>
        <Field label="Imagen"><ImageField label="Imagen" value={content.imageUrl} onChange={(v) => set("imageUrl", v)} /></Field>
        <Field label="Insignia (valor, ej: ISO 9001)"><TextInput value={content.badgeTitle} onChange={(v) => set("badgeTitle", v)} placeholder="ISO 9001" /></Field>
        <Field label="Insignia (subtítulo)"><TextInput value={content.badgeSubtitle} onChange={(v) => set("badgeSubtitle", v)} placeholder="Calidad certificada" /></Field>
        <Field label="Checklist"><ArrayEditor value={content.features} onChange={(v) => set("features", v)} fields={[{ key: "text", label: "Item" }]} /></Field>
        <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Conocer más" /></Field>
        <Field label="URL del botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} placeholder="#contacto" /></Field>
      </>;
    }
    if (content.variant === "indigo") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Sección Agencia Indigo (imagen + texto + indicadores)</div>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="El Laboratorio" /></Field>
        <Field label="Párrafo"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={4} placeholder="Aquí es donde ocurre la magia..." /></Field>
        <Field label="Imagen"><ImageField label="Imagen" value={content.imageUrl} onChange={(v) => set("imageUrl", v)} /></Field>
        <Field label="Estilo de imagen">
          <select value={content.imageStyle || "shadow"} onChange={(e) => set("imageStyle", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="shadow">Sombra</option>
            <option value="offset">Offset amarillo</option>
          </select>
        </Field>
        <Field label="Posición de la imagen">
          <select value={content.reverse ? "reverse" : "normal"} onChange={(e) => set("reverse", e.target.value === "reverse")}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="normal">A la derecha</option>
            <option value="reverse">A la izquierda</option>
          </select>
        </Field>
        <Field label="Lista (opcional)"><ArrayEditor value={content.features} onChange={(v) => set("features", v)} fields={[{ key: "label", label: "Texto" }]} /></Field>
        <Field label="Indicadores"><ArrayEditor value={content.stats} onChange={(v) => set("stats", v)} fields={[{ key: "value", label: "Valor (ej: 10+)" }, { key: "label", label: "Etiqueta" }]} /></Field>
      </>;
    }
    if (content.variant === "graduate") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Nosotros Graduate (texto + imágenes apiladas + insignia)</div>
        <Field label="Etiqueta (eyebrow)"><TextInput value={content.eyebrow} onChange={(v) => set("eyebrow", v)} placeholder="Nuestra Esencia" /></Field>
        <Field label="Título (parte 1)"><TextInput value={content.aboutTitleLine1} onChange={(v) => set("aboutTitleLine1", v)} placeholder="Transformamos" /></Field>
        <Field label="Título (parte destacada 1)"><TextInput value={content.aboutTitleHighlight1} onChange={(v) => set("aboutTitleHighlight1", v)} placeholder="seguidores en" /></Field>
        <Field label="Título (parte destacada 2)"><TextInput value={content.aboutTitleHighlight2} onChange={(v) => set("aboutTitleHighlight2", v)} placeholder="clientes reales." /></Field>
        <Field label="Descripción (HTML permitido)"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={5} /></Field>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Características</p>
          <Field label="Características"><ArrayEditor value={content.features} onChange={(v) => set("features", v)} fields={[
            { key: "icon", label: "Icono", type: "icon" },
            { key: "color", label: "Color", type: "color" },
            { key: "title", label: "Título" },
            { key: "desc", label: "Descripción", type: "textarea" },
          ]} /></Field>
        </div>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Imágenes</p>
          <Field label="Imagen principal"><ImageField label="Imagen principal" value={content.mainImage} onChange={(v) => set("mainImage", v)} /></Field>
          <Field label="Texto alternativo principal"><TextInput value={content.mainImageAlt} onChange={(v) => set("mainImageAlt", v)} placeholder="Equipo" /></Field>
          <Field label="Imagen secundaria (círculo)"><ImageField label="Imagen secundaria" value={content.secondaryImage} onChange={(v) => set("secondaryImage", v)} /></Field>
          <Field label="Texto alternativo secundario"><TextInput value={content.secondaryImageAlt} onChange={(v) => set("secondaryImageAlt", v)} /></Field>
        </div>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Insignia flotante</p>
          <Field label="Valor (ej: +5)"><TextInput value={content.badgeValue} onChange={(v) => set("badgeValue", v)} placeholder="+5" /></Field>
          <Field label="Etiqueta"><TextInput value={content.badgeLabel} onChange={(v) => set("badgeLabel", v)} placeholder="Años de<br/>Experiencia" /></Field>
        </div>
      </>;
    }
    return <>
      <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Nosotros" /></Field>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Sobre nosotros" /></Field>
      <Field label="Descripción"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={4} placeholder="Cuenta la historia de tu negocio..." /></Field>
      <ImageField label="Imagen" value={content.imageUrl} onChange={(v) => set("imageUrl", v)} />
      <Field label="Etiqueta de la insignia (ej: ISO 9001)"><TextInput value={content.badgeTitle} onChange={(v) => set("badgeTitle", v)} placeholder="ISO 9001" /></Field>
      <Field label="Subetiqueta de la insignia"><TextInput value={content.badgeSubtitle} onChange={(v) => set("badgeSubtitle", v)} placeholder="Calidad certificada" /></Field>
      <Field label="Checklist"><ArrayEditor value={content.features} onChange={(v) => set("features", v)} fields={[{ key: "text", label: "Item" }]} /></Field>
      <Field label="Texto del enlace"><TextInput value={content.linkText} onChange={(v) => set("linkText", v)} placeholder="Conocer más" /></Field>
      <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Conocer más" /></Field>
      <Field label="URL del botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} placeholder="#contacto" /></Field>
    </>;
}
