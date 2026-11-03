"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function FaqFields({ content, set }: FieldProps) {
    return <>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
      <Field label="Preguntas"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[{ key: "question", label: "Pregunta" }, { key: "answer", label: "Respuesta", type: "textarea" }]} /></Field>
    </>;
}
