"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function TeamFields({ content, set }: FieldProps) {
    if (content.variant === "graduate") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Equipo Graduate (grilla de tarjetas)</div>
        <Field label="Etiqueta (eyebrow)"><TextInput value={content.teamEyebrow} onChange={(v) => set("teamEyebrow", v)} placeholder="Conócenos" /></Field>
        <Field label="Título (parte 1)"><TextInput value={content.teamTitleLine1} onChange={(v) => set("teamTitleLine1", v)} placeholder="El talento detrás de" /></Field>
        <Field label="Título (palabra destacada)"><TextInput value={content.teamTitleHighlight} onChange={(v) => set("teamTitleHighlight", v)} placeholder="Graduate." /></Field>
        <Field label="Miembros"><ArrayEditor value={content.members} onChange={(v) => set("members", v)} fields={[
          { key: "name", label: "Nombre" },
          { key: "role", label: "Cargo" },
          { key: "image", label: "Foto", type: "image" },
          { key: "roleColor", label: "Color cargo", type: "select", options: [{ label: "Azul oscuro", value: "text-[#2d2e81]" }, { label: "Naranja", value: "text-[#fa7202]" }, { label: "Azul", value: "text-[#21b1fe]" }, { label: "Verde", value: "text-[#7dd958]" }] },
        ]} /></Field>
      </>;
    }
    return <>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Nuestro equipo" /></Field>
      <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} /></Field>
      <Field label="Miembros">
        <div className="space-y-3">
          {(content.members || []).map((m: any, i: number) => (
            <div key={i} className="relative p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase">Miembro {i + 1}</span>
                <button onClick={() => { const arr = [...(content.members || [])]; arr.splice(i, 1); set("members", arr); }}
                  className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-2">
                <TextInput value={m.name} onChange={(v) => { const arr = [...(content.members || [])]; arr[i] = { ...arr[i], name: v }; set("members", arr); }} placeholder="Nombre" />
                <TextInput value={m.role} onChange={(v) => { const arr = [...(content.members || [])]; arr[i] = { ...arr[i], role: v }; set("members", arr); }} placeholder="Cargo" />
                <ImageField label="Foto" value={m.image} onChange={(v) => { const arr = [...(content.members || [])]; arr[i] = { ...arr[i], image: v }; set("members", arr); }} />
                <TextInput value={m.bio} onChange={(v) => { const arr = [...(content.members || [])]; arr[i] = { ...arr[i], bio: v }; set("members", arr); }} placeholder="Bio" type="textarea" rows={2} />
              </div>
            </div>
          ))}
          <button onClick={() => set("members", [...(content.members || []), { name: "", role: "", image: "", bio: "" }])}
            className="w-full rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
            + Agregar miembro
          </button>
        </div>
      </Field>
    </>;
}
