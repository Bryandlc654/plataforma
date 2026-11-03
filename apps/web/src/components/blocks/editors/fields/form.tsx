"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function FormFields({ content, set }: FieldProps) {
    if (content.variant === "rodriplast") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Contacto Rodriplast (formulario + tarjetas + mapa)</div>
        <Field label="Ancla / ID"><TextInput value={content.anchor} onChange={(v) => set("anchor", v)} placeholder="contacto" /></Field>
        <Field label="Kicker (etiqueta)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Contacto" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Solicita tu cotización" /></Field>
        <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} /></Field>
        <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Enviar solicitud" /></Field>
        <Field label="Dirección"><TextInput value={content.address} onChange={(v) => set("address", v)} placeholder="Parque Industrial · Guayaquil, Ecuador" /></Field>
        <Field label="Teléfono"><TextInput value={content.phone} onChange={(v) => set("phone", v)} placeholder="+593 4 000 0000" /></Field>
        <Field label="Correo"><TextInput value={content.email} onChange={(v) => set("email", v)} placeholder="ventas@rodriplast.com" /></Field>
        <Field label="URL del mapa (OpenStreetMap o Google)"><TextInput value={content.mapUrl} onChange={(v) => set("mapUrl", v)} placeholder="https://www.openstreetmap.org/export/embed.html?..." /></Field>
        <Field label="Campos del formulario"><ArrayEditor value={content.fields} onChange={(v) => set("fields", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "name", label: "Nombre" }, { key: "type", label: "Tipo (text, textarea, email, tel)" }, { key: "required", label: "Requerido (true/false)" }, { key: "placeholder", label: "Placeholder (opcional)" }]} /></Field>
      </>;
    }
    if (content.variant === "indigo") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Sección de contacto Indigo (título + párrafo + botón + formulario)</div>
        <Field label="Kicker (etiqueta arriba del título)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="CONTACTO" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Trabajemos juntos" /></Field>
        <Field label="Párrafo"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={3} placeholder="Cuéntanos tu proyecto y te responderemos en menos de 24 horas." /></Field>
        <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Iniciar Proyecto" /></Field>
        <Field label="URL del botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} placeholder="#contacto" /></Field>
        <Field label="Texto del botón del formulario"><TextInput value={content.submitText} onChange={(v) => set("submitText", v)} placeholder="ENVIAR" /></Field>
        <Field label="Fondo de la sección">
          <select value={content.background || "light"} onChange={(e) => set("background", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </Field>
        <Field label="Campos del formulario"><ArrayEditor value={content.fields} onChange={(v) => set("fields", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "name", label: "Nombre" }, { key: "type", label: "Tipo (text, textarea, email)" }, { key: "required", label: "Requerido (true/false)" }]} /></Field>
      </>;
    }
    return <>
      <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Contacto" /></Field>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Contáctanos" /></Field>
      <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} placeholder="Déjanos tu mensaje" /></Field>
      <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Enviar" /></Field>
      <Field label="Dirección"><TextInput value={content.address} onChange={(v) => set("address", v)} placeholder="Parque Industrial · Guayaquil, Ecuador" /></Field>
      <Field label="Teléfono"><TextInput value={content.phone} onChange={(v) => set("phone", v)} placeholder="+593 4 000 0000" /></Field>
      <Field label="Correo"><TextInput value={content.email} onChange={(v) => set("email", v)} placeholder="ventas@miempresa.ec" /></Field>
      <Field label="URL de Google Maps"><TextInput value={content.mapUrl} onChange={(v) => set("mapUrl", v)} placeholder="https://maps.app.goo.gl/... o https://www.google.com/maps/..." /></Field>
      <Field label="Campos"><ArrayEditor value={content.fields} onChange={(v) => set("fields", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "name", label: "Nombre" }, { key: "type", label: "Tipo (text, textarea, email)" }, { key: "required", label: "Requerido (true/false)" }]} /></Field>
    </>;
}
