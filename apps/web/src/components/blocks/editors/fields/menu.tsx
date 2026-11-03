"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function MenuFields({ content, set }: FieldProps) {
    if (content.variant === "dishora") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Carrusel de platos Dishora (el estilo es fijo de la plantilla)</div>
        <Field label="Etiqueta (encabezado)"><TextInput value={content.menuEyebrow} onChange={(v) => set("menuEyebrow", v)} placeholder="Chef's Words" /></Field>
        <Field label="Título (encabezado)"><TextInput value={content.menuTitle} onChange={(v) => set("menuTitle", v)} placeholder="What's On The Menu" /></Field>
        <Field label="Texto del botón"><TextInput value={content.menuCtaText} onChange={(v) => set("menuCtaText", v)} placeholder="Explore The Full Menu" /></Field>
        <Field label="URL del botón"><TextInput value={content.menuCtaUrl} onChange={(v) => set("menuCtaUrl", v)} placeholder="#full-menu" /></Field>
        <Field label="Icono del botón de reserva">
          <select value={content.menuCtaIcon || "calendar"} onChange={(e) => set("menuCtaIcon", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="calendar">Calendario (reserva)</option>
            <option value="calendar-check">Calendario con check</option>
            <option value="arrow-right">Flecha derecha</option>
            <option value="phone">Teléfono</option>
            <option value="clock">Reloj (horario)</option>
            <option value="cutlery">Cubiertos</option>
            <option value="book-open">Menú / libro</option>
            <option value="users">Personas (mesa)</option>
          </select>
        </Field>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Información de contacto</p>
          <Field label="Horario de atención (una línea por horario)"><TextInput value={(content.openLines || []).join("\n")} onChange={(v) => set("openLines", v.split("\n").map((s: string) => s.trim()).filter(Boolean))} type="textarea" rows={3} placeholder={"Sun-Thurs: 11:30am – 11pm\nEvery Fri-Sat (8pm onwards)"} /></Field>
          <Field label="Correo"><TextInput value={content.email} onChange={(v) => set("email", v)} placeholder="reservations@disora.com" /></Field>
          <Field label="Dirección"><TextInput value={content.address} onChange={(v) => set("address", v)} placeholder="296 Ridao Avenie Mor Berlin 251584" /></Field>
          <Field label="Teléfono"><TextInput value={content.phone} onChange={(v) => set("phone", v)} placeholder="123 456 7899" /></Field>
        </div>
        <Field label="Platos"><ArrayEditor value={content.dishes} onChange={(v) => set("dishes", v)} fields={[{ key: "name", label: "Nombre", type: "textarea" }, { key: "price", label: "Precio" }, { key: "image", label: "Imagen", type: "image" }]} /></Field>
      </>;
    }
    return <>
      <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} /></Field>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
      <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" /></Field>
      <Field label="Items"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[{ key: "name", label: "Nombre" }, { key: "price", label: "Precio" }, { key: "image", label: "Imagen", type: "image" }]} /></Field>
    </>;
}
