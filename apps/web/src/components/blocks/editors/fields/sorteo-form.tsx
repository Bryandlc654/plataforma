"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function SorteoFormFields({ content, set }: FieldProps) {
    return <>
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Formulario de sorteo Indigo (título + descripción)</div>
      <Field label="Kicker (etiqueta)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="SORTEO" /></Field>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Participa y gana" /></Field>
      <Field label="Descripción"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={3} /></Field>
    </>;
}
