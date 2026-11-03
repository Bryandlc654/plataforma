"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function MarqueeFields({ content, set }: FieldProps) {
    return <>
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Cinta animada Indigo (amarilla con palabras)</div>
      <Field label="Palabras (separadas por coma)"><TextInput value={(content.words || content.marqueeWords || []).join(", ")} onChange={(v) => set("words", v.split(",").map((s: string) => s.trim()).filter(Boolean))} placeholder="INDIGO PUBLICIDAD, LETRAS 3D, BRANDING, DISEÑO DISRUPTIVO" /></Field>
    </>;
}
