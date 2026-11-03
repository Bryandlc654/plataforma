"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function ServicesFields({ content, set }: FieldProps) {
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
    if (content.variant === "graduate") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Servicios Graduate (grilla bento con tarjetas editables)</div>
        <Field label="Etiqueta (eyebrow)"><TextInput value={content.servicesEyebrow} onChange={(v) => set("servicesEyebrow", v)} placeholder="Lo que hacemos por ti" /></Field>
        <Field label="Icono del eyebrow"><IconPicker value={content.servicesEyebrowIcon} onChange={(v) => set("servicesEyebrowIcon", v)} /></Field>
        <Field label="Título (parte 1)"><TextInput value={content.servicesTitleLine1} onChange={(v) => set("servicesTitleLine1", v)} placeholder="Soluciones Integrales" /></Field>
        <Field label="Título (parte 2, pequeña)"><TextInput value={content.servicesTitleLine2} onChange={(v) => set("servicesTitleLine2", v)} placeholder="de" /></Field>
        <Field label="Título (palabra destacada)"><TextInput value={content.servicesHighlight} onChange={(v) => set("servicesHighlight", v)} placeholder="Marketing" /></Field>
        <Field label="Subtítulo"><TextInput value={content.servicesSubtitle} onChange={(v) => set("servicesSubtitle", v)} type="textarea" rows={2} /></Field>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tarjetas del bento</p>
          <Field label="Tarjetas"><ArrayEditor value={content.cards} onChange={(v) => set("cards", v)} fields={[
            { key: "colSpan", label: "Ancho de la tarjeta", type: "select", options: [{ label: "1 columna", value: "" }, { label: "2 columnas (ancho doble)", value: "lg:col-span-2" }] },
            { key: "dark", label: "Tarjeta oscura (para equipos y empresas)", type: "checkbox" },
            { key: "badge", label: "Etiqueta (tarjeta oscura)" },
            { key: "icon", label: "Icono", type: "icon" },
            { key: "iconBg", label: "Gradiente del icono", type: "select", options: [
              { label: "Azul oscuro", value: "from-[#2d2e81] to-blue-600" },
              { label: "Naranja", value: "from-[#fa7202] to-[#ffb347]" },
              { label: "Celeste", value: "from-[#21b1fe] to-sky-400" },
              { label: "Verde lima", value: "from-[#7dd958] to-[#4ea837]" },
              { label: "Oscuro", value: "from-[#0a0b2e] to-[#2d2e81]" },
            ] },
            { key: "iconShadow", label: "Sombra del icono", type: "select", options: [
              { label: "Azul", value: "shadow-blue-500/30" },
              { label: "Naranja", value: "shadow-orange-500/30" },
              { label: "Celeste", value: "shadow-sky-500/30" },
              { label: "Verde", value: "shadow-green-500/30" },
            ] },
            { key: "title", label: "Título" },
            { key: "titleSize", label: "Tamaño del título", type: "select", options: [
              { label: "Grande (text-3xl)", value: "text-3xl" },
              { label: "Mediano (text-2xl)", value: "text-2xl" },
              { label: "Pequeño (text-xl)", value: "text-xl" },
            ] },
            { key: "desc", label: "Descripción", type: "textarea" },
            { key: "blob", label: "Blob de fondo", type: "select", options: [
              { label: "Azul", value: "from-blue-100" },
              { label: "Naranja", value: "from-orange-100" },
              { label: "Celeste", value: "from-sky-100" },
              { label: "Verde", value: "from-green-100" },
              { label: "Gris", value: "from-gray-100" },
            ] },
            { key: "linkColor", label: "Color del enlace", type: "select", options: [
              { label: "Naranja", value: "text-[#fa7202]" },
              { label: "Celeste", value: "text-[#21b1fe]" },
              { label: "Azul", value: "text-[#2d2e81]" },
              { label: "Verde", value: "text-[#7dd958]" },
            ] },
            { key: "linkText", label: "Texto del enlace" },
            { key: "linkUrl", label: "URL del enlace" },
            { key: "buttonText", label: "Texto del botón (oscura)" },
            { key: "buttonUrl", label: "URL del botón (oscura)" },
            { key: "checks", label: "Checks (separados por coma)" },
          ]} /></Field>
        </div>
      </>;
    }
    if (content.variant === "indigo") {
      const isPhilosophy = content.layout === "philosophy";
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Sección de servicio Indigo</div>
        <Field label="Estilo de sección">
          <select value={content.layout || "featured"} onChange={(e) => set("layout", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="featured">Destacado (imagen + texto + botón)</option>
            <option value="philosophy">Filosofía (título + 3 columnas)</option>
          </select>
        </Field>
        {isPhilosophy ? <>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="NUESTRA FILOSOFÍA" /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} placeholder="El diseño no solo debe verse bien, debe funcionar..." /></Field>
          <Field label="Columnas"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
            { key: "number", label: "Número (ej: 01)" },
            { key: "title", label: "Título" },
            { key: "desc", label: "Descripción", type: "textarea" },
          ]} /></Field>
        </> : <>
          <Field label="Número / Kicker"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="01" /></Field>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="LETRAS 3D" /></Field>
          <Field label="Párrafo"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={3} /></Field>
          <Field label="Imagen"><ImageField label="Imagen" value={content.imageUrl} onChange={(v) => set("imageUrl", v)} /></Field>
          <Field label="Lista de items"><ArrayEditor value={content.features} onChange={(v) => set("features", v)} fields={[{ key: "text", label: "Item" }]} /></Field>
          <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} /></Field>
          <Field label="URL del botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} /></Field>
        </>}
      </>;
    }
    return <>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
      <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} /></Field>
      <Field label="Servicios"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[{ key: "title", label: "Título" }, { key: "desc", label: "Descripción", type: "textarea" }]} /></Field>
    </>;
}
