"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function HeaderFields({ content, set }: FieldProps) {
    if (content.variant === "urban-noir") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Header Urban Noir (barra blanca fija con logo tipográfico + enlaces)</div>
        <Field label="Logo (texto)"><TextInput value={content.logoText} onChange={(v) => set("logoText", v)} placeholder="URBAN NOIR" /></Field>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Navegación</p>
        <Field label="Enlaces del menú"><ArrayEditor value={content.links} onChange={(v) => set("links", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} /></Field>
      </>;
    }
    if (content.variant === "rodriplast") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Header Rodriplast (logo que cambia al hacer scroll)</div>
        <Field label="Nombre del logo"><TextInput value={content.logoText} onChange={(v) => set("logoText", v)} placeholder="RODRIPLAST" /></Field>
        <Field label="Logo (imagen)"><ImageField label="Logo" value={content.logoImage} onChange={(v) => set("logoImage", v)} /></Field>
        <Field label="Logo al hacer scroll"><ImageField label="Logo scrolled" value={content.logoScrolled} onChange={(v) => set("logoScrolled", v)} /></Field>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Navegación</p>
        <Field label="Enlaces del menú"><ArrayEditor value={content.links} onChange={(v) => set("links", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} /></Field>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Botón CTA</p>
          <Field label="Texto"><TextInput value={content.ctaText} onChange={(v) => set("ctaText", v)} placeholder="Solicitar cotización" /></Field>
          <Field label="URL"><TextInput value={content.ctaUrl} onChange={(v) => set("ctaUrl", v)} placeholder="#contacto" /></Field>
        </div>
      </>;
    }
    if (content.variant === "graduate") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Header Graduate (barra superior de contacto + menú con logo y CTA)</div>
        <Field label="Nombre del logo"><TextInput value={content.brand} onChange={(v) => set("brand", v)} placeholder="graduate" /></Field>
        <Field label="Inicial del logo (círculo)"><TextInput value={content.brandInitial} onChange={(v) => set("brandInitial", v)} placeholder="g" /></Field>
        <Field label="Logo (imagen, opcional)"><ImageField label="Logo" value={content.logoUrl} onChange={(v) => set("logoUrl", v)} /></Field>
        <Field label="URL del logo (inicio)"><TextInput value={content.brandUrl} onChange={(v) => set("brandUrl", v)} placeholder="#inicio" /></Field>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Navegación</p>
        <Field label="Enlaces del menú"><ArrayEditor value={content.links} onChange={(v) => set("links", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} /></Field>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Botón CTA</p>
          <Field label="Texto"><TextInput value={content.ctaText} onChange={(v) => set("ctaText", v)} placeholder="Agendar Cita" /></Field>
          <Field label="URL"><TextInput value={content.ctaUrl} onChange={(v) => set("ctaUrl", v)} placeholder="#contacto" /></Field>
        </div>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Barra superior (fondo #2d2e81)</p>
          <label className="flex items-center gap-2 text-sm text-slate-600 mb-3"><input type="checkbox" checked={content.topbarEnabled !== false} onChange={(e) => set("topbarEnabled", e.target.checked)} className="h-4 w-4 accent-primary rounded border-slate-300" /> Mostrar barra superior</label>
          <Field label="Teléfono"><TextInput value={content.topbarPhone} onChange={(v) => set("topbarPhone", v)} placeholder="+593 99 123 4567" /></Field>
          <Field label="Correo"><TextInput value={content.topbarEmail} onChange={(v) => set("topbarEmail", v)} placeholder="hola@graduate.ec" /></Field>
          <Field label="Redes sociales"><ArrayEditor value={content.topbarSocials} onChange={(v) => set("topbarSocials", v)} fields={[{ key: "icon", label: "Icono", type: "icon", brand: true }, { key: "url", label: "URL" }]} /></Field>
        </div>
      </>;
    }
    if (content.variant === "dishora") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Header Dishora (barra de contacto + logo + navegación + botón de reserva)</div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Marca</p>
        <Field label="Nombre / logo"><TextInput value={content.brand} onChange={(v) => set("brand", v)} placeholder="DISHORA" /></Field>
        <Field label="URL del logo (inicio)"><TextInput value={content.logoUrl} onChange={(v) => set("logoUrl", v)} placeholder="# o /" /></Field>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Navegación</p>
        <Field label="Enlaces del menú"><ArrayEditor value={content.links} onChange={(v) => set("links", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }, { key: "dropdown", label: "Tiene submenú (flecha)", type: "checkbox" }]} /></Field>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Barra superior</p>
        <Field label="Horario 1 (izquierda)"><TextInput value={content.topLeft} onChange={(v) => set("topLeft", v)} placeholder="Mon-Wed: 11a-9p" /></Field>
        <Field label="Horario 2 (centro)"><TextInput value={content.topMiddle} onChange={(v) => set("topMiddle", v)} placeholder="Thurs-Sat: 11a-10p" /></Field>
        <Field label="Correo"><TextInput value={content.email} onChange={(v) => set("email", v)} placeholder="reservations@disora.com" /></Field>
        <Field label="Teléfono"><TextInput value={content.phone} onChange={(v) => set("phone", v)} placeholder="123 456 7899" /></Field>
        <Field label="Dirección"><TextInput value={content.address} onChange={(v) => set("address", v)} placeholder="296 Ridao Avenie Mor Berlin 251584" /></Field>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Botón de reserva</p>
          <Field label="Texto del botón"><TextInput value={content.ctaText} onChange={(v) => set("ctaText", v)} placeholder="Make a Reservation Online" /></Field>
          <Field label="URL del botón"><TextInput value={content.ctaUrl} onChange={(v) => set("ctaUrl", v)} placeholder="#reservation" /></Field>
          <Field label="Icono del botón">
            <select value={content.ctaIcon || "calendar"} onChange={(e) => set("ctaIcon", e.target.value)}
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
        </div>
      </>;
    }
    if (content.variant === "indigo") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Menú Indigo (se muestra en todas las páginas como sección)</div>
        <Field label="Estilo de menú">
          <select value={content.navbarStyle || "dark"} onChange={(e) => set("navbarStyle", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="dark">Oscuro (transparente)</option>
            <option value="white">Blanco (fondo claro)</option>
          </select>
        </Field>
        <Field label="Nombre de la empresa"><TextInput value={content.companyName} onChange={(v) => set("companyName", v)} /></Field>
        <Field label="Logo (imagen)"><ImageField label="Logo" value={content.logoImage} onChange={(v) => set("logoImage", v)} /></Field>
        <Field label="Enlaces del menú"><ArrayEditor value={content.links} onChange={(v) => set("links", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} /></Field>
        <Field label="URL del logo (inicio)"><TextInput value={content.logoUrl} onChange={(v) => set("logoUrl", v)} placeholder="/" /></Field>
      </>;
    }
    return <>
      <Field label="Estilo">
        <select value={content.variant || "classic"} onChange={(e) => set("variant", e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
          <option value="classic">Clásico (logo izq, nav der)</option>
          <option value="centered">Centrado (logo centro, nav abajo)</option>
          <option value="minimal">Minimal (transparente, solo links)</option>
        </select>
      </Field>
      <Field label="Tipo de logo">
        <select value={content.logoType || "text"} onChange={(e) => set("logoType", e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
          <option value="text">Solo texto</option>
          <option value="image">Imagen</option>
          <option value="both">Texto + Imagen</option>
        </select>
      </Field>
      {(content.logoType !== "image") && (
        <Field label="Nombre / Logo texto"><TextInput value={content.logoText} onChange={(v) => set("logoText", v)} placeholder="Mi Negocio" /></Field>
      )}
      {(content.logoType !== "text") && (
        <ImageField label="Logo (imagen)" value={content.logoImage} onChange={(v) => set("logoImage", v)} />
      )}
      {(content.logoType !== "text") && (
        <ImageField label="Logo (al hacer scroll)" value={content.logoScrolled} onChange={(v) => set("logoScrolled", v)} />
      )}
      <Field label="Enlaces"><ArrayEditor value={content.links} onChange={(v) => set("links", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} /></Field>
      <Field label="Texto del botón CTA"><TextInput value={content.ctaText} onChange={(v) => set("ctaText", v)} placeholder="Contáctanos" /></Field>
      <Field label="URL del botón CTA"><TextInput value={content.ctaUrl} onChange={(v) => set("ctaUrl", v)} placeholder="#contacto" /></Field>
    </>;
}
