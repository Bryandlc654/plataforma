"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function ContactSectionFields({ content, set }: FieldProps) {
    return <>
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Sección de contacto Indigo (info + formulario)</div>
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Información (textos)</p>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          <TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Información" />
          <TextInput value={content.email} onChange={(v) => set("email", v)} placeholder="hola@indigopublicidad.com" />
          <TextInput value={content.emailLabel} onChange={(v) => set("emailLabel", v)} placeholder="Email" />
          <TextInput value={content.phone} onChange={(v) => set("phone", v)} placeholder="+1 (555) 123-4567" />
          <TextInput value={content.phoneLabel} onChange={(v) => set("phoneLabel", v)} placeholder="Teléfono" />
          <TextInput value={content.address} onChange={(v) => set("address", v)} type="textarea" rows={2} placeholder="Distrito de Diseño 0987..." />
          <TextInput value={content.addressLabel} onChange={(v) => set("addressLabel", v)} placeholder="Estudio" />
        </div>
      </div>
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Formulario (textos)</p>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          <TextInput value={content.formTitle} onChange={(v) => set("formTitle", v)} placeholder="Escríbenos" />
          <TextInput value={content.submitText} onChange={(v) => set("submitText", v)} placeholder="ENVIAR MENSAJE" />
          <TextInput value={content.nameLabel} onChange={(v) => set("nameLabel", v)} placeholder="Nombre" />
          <TextInput value={content.namePlaceholder} onChange={(v) => set("namePlaceholder", v)} placeholder="TU NOMBRE" />
          <TextInput value={content.emailFieldLabel} onChange={(v) => set("emailFieldLabel", v)} placeholder="Email" />
          <TextInput value={content.emailPlaceholder} onChange={(v) => set("emailPlaceholder", v)} placeholder="TU@EMAIL.COM" />
          <TextInput value={content.messageLabel} onChange={(v) => set("messageLabel", v)} placeholder="Mensaje" />
          <TextInput value={content.messagePlaceholder} onChange={(v) => set("messagePlaceholder", v)} placeholder="CUÉNTANOS SOBRE TU PROYECTO..." />
          <TextInput value={content.serviceLabel} onChange={(v) => set("serviceLabel", v)} placeholder="Servicio de interés" />
          <Field label="Opciones de servicio (separadas por coma)"><TextInput value={(content.serviceOptions || []).join(", ")} onChange={(v) => set("serviceOptions", v.split(",").map((s: string) => s.trim()).filter(Boolean))} placeholder="Letras 3D, Branding Estratégico, Diseño Corporativo, Otro" /></Field>
        </div>
      </div>
    </>;
}
