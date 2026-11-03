"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function PricingFields({ content, set }: FieldProps) {
    return <>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Nuestros planes" /></Field>
      <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} /></Field>
      <Field label="Planes"><ArrayEditor value={content.plans} onChange={(v) => set("plans", v)} fields={[
        { key: "name", label: "Nombre del plan" },
        { key: "price", label: "Precio (ej: $29/mes)" },
        { key: "description", label: "Descripción" },
        { key: "features", label: "Características (separar con comas)" },
        { key: "buttonText", label: "Texto botón" },
        { key: "buttonUrl", label: "URL botón" },
        { key: "highlighted", label: "Destacado (true/false)" },
      ]} /></Field>
    </>;
}
