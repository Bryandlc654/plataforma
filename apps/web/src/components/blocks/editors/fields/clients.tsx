"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function ClientsFields({ content, set }: FieldProps) {
    if (content.variant === "graduate") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Formación de calidad (fondo #2d2e81, rectángulo con bordes blancos)</div>
        <Field label="Título"><TextInput value={content.clientsTitle} onChange={(v) => set("clientsTitle", v)} placeholder="Formación de calidad" /></Field>
        <Field label="Logos (3 a 4)"><ArrayEditor value={content.clients} onChange={(v) => set("clients", v)} fields={[
          { key: "image", label: "Logo", type: "image" },
          { key: "alt", label: "Alt / nombre" },
        ]} /></Field>
      </>;
    }
    return <>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
      <Field label="Logos"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
        { key: "image", label: "Logo", type: "image" },
      ]} /></Field>
    </>;
}
