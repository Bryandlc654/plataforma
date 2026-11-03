"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function ReviewFormFields({ content, set }: FieldProps) {
    return <>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Déjanos tu opinión" /></Field>
      <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} placeholder="Valoramos tu experiencia" /></Field>
    </>;
}
