"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function WhatsappFields({ content, set }: FieldProps) {
    return <>
      <Field label="Número de WhatsApp"><TextInput value={content.phone} onChange={(v) => set("phone", v)} placeholder="521234567890" /></Field>
      <Field label="Mensaje predeterminado"><TextInput value={content.message} onChange={(v) => set("message", v)} placeholder="Hola, quisiera más información" /></Field>
      <Field label="Posición">
        <select value={content.position || "bottom-right"} onChange={(e) => set("position", e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
          <option value="bottom-right">Abajo derecha</option>
          <option value="bottom-left">Abajo izquierda</option>
        </select>
      </Field>
      <Field label="Tamaño"><TextInput value={content.size || 56} onChange={(v) => set("size", parseInt(v) || 56)} type="number" /></Field>
      <Field label="Color"><TextInput value={content.color || "#25D366"} onChange={(v) => set("color", v)} placeholder="#25D366" /></Field>
      <Field label="Tooltip"><TextInput value={content.tooltip || ""} onChange={(v) => set("tooltip", v)} placeholder="Chatea con nosotros" /></Field>
    </>;
}
