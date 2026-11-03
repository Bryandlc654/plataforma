"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function FooterFields({ content, set }: FieldProps) {
    if (content.variant === "urban-noir") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Footer Urban Noir (fondo negro, 4 columnas)</div>
        <Field label="Nombre de la empresa"><TextInput value={content.companyName} onChange={(v) => set("companyName", v)} placeholder="URBAN NOIR" /></Field>
        <Field label="Descripción"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={3} /></Field>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Columnas de enlaces</p>
        <Field label="Títulos de las columnas"><ArrayEditor value={content.columns} onChange={(v) => set("columns", v)} fields={[{ key: "title", label: "Título" }]} /></Field>
        <Field label="Enlaces de la primera columna"><ArrayEditor value={content.navLinks || content.columns?.[0]?.links} onChange={(v) => { set("navLinks", v); set("columns", content.columns?.map((col: any, i: number) => i === 0 ? { ...col, links: v } : col) || [{ title: content.columns?.[0]?.title || "Tienda", links: v }]); }} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} /></Field>
        <Field label="Redes sociales"><ArrayEditor value={content.social} onChange={(v) => set("social", v)} fields={[{ key: "label", label: "Nombre (Instagram, Twitter)" }, { key: "url", label: "URL" }]} /></Field>
        <Field label="Copyright"><TextInput value={content.copyright} onChange={(v) => set("copyright", v)} /></Field>
      </>;
    }
    if (content.variant === "rodriplast") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Footer Rodriplast (fondo oscuro, logo, marca, navegación, contacto y redes)</div>
        <Field label="Nombre de la empresa"><TextInput value={content.companyName} onChange={(v) => set("companyName", v)} placeholder="Rodriplast" /></Field>
        <ImageField label="Logo (imagen)" value={content.logoImage} onChange={(v) => set("logoImage", v)} />
        <Field label="Descripción"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={3} /></Field>
        <Field label="Dirección"><TextInput value={content.address} onChange={(v) => set("address", v)} placeholder="Parque Industrial · Guayaquil, Ecuador" /></Field>
        <Field label="Teléfono"><TextInput value={content.phone} onChange={(v) => set("phone", v)} placeholder="+593 4 000 0000" /></Field>
        <Field label="Correo"><TextInput value={content.email} onChange={(v) => set("email", v)} placeholder="ventas@rodriplast.com" /></Field>
        <Field label="Horario"><TextInput value={content.schedule} onChange={(v) => set("schedule", v)} placeholder="Lun – Vie · 8:00 – 17:00" /></Field>
        <Field label="Título de la columna de navegación"><TextInput value={content.columns?.[0]?.title} onChange={(v) => set("columns", [{ ...(content.columns?.[0] || {}), title: v }])} placeholder="Navegación" /></Field>
        <Field label="Enlaces de navegación"><ArrayEditor value={content.navLinks} onChange={(v) => set("navLinks", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} /></Field>
        <Field label="Redes sociales"><ArrayEditor value={content.social} onChange={(v) => set("social", v)} fields={[{ key: "icon", label: "Icono", type: "icon", bi: true, brand: true }, { key: "url", label: "URL" }, { key: "label", label: "Etiqueta (accesibilidad)" }]} /></Field>
        <Field label="Copyright"><TextInput value={content.copyright} onChange={(v) => set("copyright", v)} /></Field>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <Field label="Imagen flotante (opcional)">
            <ImageField label="Imagen flotante" value={content.floatingImage} onChange={(v) => set("floatingImage", v)} />
            <div className="mt-2"><TextInput value={content.floatingImageAlt} onChange={(v) => set("floatingImageAlt", v)} placeholder="Texto alternativo" /></div>
          </Field>
        </div>
      </>;
    }
    if (content.variant === "indigo") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Footer Indigo (se muestra en todas las páginas como sección)</div>
        <Field label="Nombre de la empresa"><TextInput value={content.companyName} onChange={(v) => set("companyName", v)} /></Field>
        <ImageField label="Logo (imagen)" value={content.logoImage} onChange={(v) => set("logoImage", v)} />
        <Field label="Correo"><TextInput value={content.email} onChange={(v) => set("email", v)} /></Field>
        <Field label="Teléfono"><TextInput value={content.phone} onChange={(v) => set("phone", v)} /></Field>
        <Field label="Dirección"><TextInput value={content.address} onChange={(v) => set("address", v)} /></Field>
        <Field label="Enlaces"><ArrayEditor value={content.links} onChange={(v) => set("links", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} /></Field>
        <Field label="Redes sociales"><ArrayEditor value={content.social} onChange={(v) => set("social", v)} fields={[{ key: "label", label: "Nombre" }, { key: "url", label: "URL" }]} /></Field>
      </>;
    }
    if (content.variant === "graduate") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Footer Graduate (fondo oscuro + tipografía gigante)</div>
        <Field label="Nombre del logo"><TextInput value={content.brand} onChange={(v) => set("brand", v)} placeholder="Graduate." /></Field>
        <Field label="Inicial del logo"><TextInput value={content.brandInitial} onChange={(v) => set("brandInitial", v)} placeholder="G" /></Field>
        <Field label="Descripción de la marca"><TextInput value={content.brandDesc} onChange={(v) => set("brandDesc", v)} type="textarea" rows={2} /></Field>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Redes sociales</p>
        <Field label="Redes"><ArrayEditor value={content.socials} onChange={(v) => set("socials", v)} fields={[
          { key: "icon", label: "Icono", type: "icon", brand: true },
          { key: "url", label: "URL" },
          { key: "hover", label: "Hover (class tailwind)" },
        ]} /></Field>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Navegación</p>
        <Field label="Título de columna"><TextInput value={content.navTitle} onChange={(v) => set("navTitle", v)} placeholder="Navegación" /></Field>
        <Field label="Enlaces"><ArrayEditor value={content.navLinks} onChange={(v) => set("navLinks", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} /></Field>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contacto</p>
        <Field label="Título"><TextInput value={content.contactTitle} onChange={(v) => set("contactTitle", v)} placeholder="Contacto" /></Field>
        <Field label="Ubicación (ciudad)"><TextInput value={content.locationTitle} onChange={(v) => set("locationTitle", v)} placeholder="Quito, Ecuador" /></Field>
        <Field label="Ubicación (detalle)"><TextInput value={content.locationSub} onChange={(v) => set("locationSub", v)} placeholder="Servicio remoto a nivel nacional." /></Field>
        <Field label="Teléfono (mostrado)"><TextInput value={content.phone} onChange={(v) => set("phone", v)} placeholder="+593 99 999 9999" /></Field>
        <Field label="Teléfono (solo números, para el enlace)"><TextInput value={content.phoneTel} onChange={(v) => set("phoneTel", v)} placeholder="+593000000000" /></Field>
        <Field label="Email"><TextInput value={content.email} onChange={(v) => set("email", v)} placeholder="hola@graduate.com.ec" /></Field>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Barra inferior</p>
        <Field label="Copyright"><TextInput value={content.copyright} onChange={(v) => set("copyright", v)} /></Field>
        <Field label="Enlaces legales"><ArrayEditor value={content.legalLinks} onChange={(v) => set("legalLinks", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} /></Field>
        <Field label="Texto gigante de fondo"><TextInput value={content.giantText} onChange={(v) => set("giantText", v)} placeholder="GRADUATE" /></Field>
      </>;
    }
    return <>
      <Field label="Empresa"><TextInput value={content.companyName} onChange={(v) => set("companyName", v)} /></Field>
      <Field label="Descripción"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={2} /></Field>
      <ImageField label="Logo (imagen)" value={content.logoImage} onChange={(v) => set("logoImage", v)} />
      <Field label="Dirección"><TextInput value={content.address} onChange={(v) => set("address", v)} /></Field>
      <Field label="Teléfono"><TextInput value={content.phone} onChange={(v) => set("phone", v)} /></Field>
      <Field label="Correo"><TextInput value={content.email} onChange={(v) => set("email", v)} /></Field>
      <Field label="Horario"><TextInput value={content.schedule} onChange={(v) => set("schedule", v)} placeholder="Lun – Vie · 8:00 – 17:00" /></Field>
      <Field label="Copyright"><TextInput value={content.copyright} onChange={(v) => set("copyright", v)} /></Field>
      <Field label="Columna de navegación"><ArrayEditor value={content.columns} onChange={(v) => set("columns", v)} fields={[{ key: "title", label: "Título" }]} /></Field>
      <Field label="Enlaces de navegación"><ArrayEditor value={content.navLinks} onChange={(v) => set("navLinks", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "url", label: "URL" }]} /></Field>
      <Field label="Redes sociales"><ArrayEditor value={content.social} onChange={(v) => set("social", v)} fields={[{ key: "icon", label: "Icono (ej: bi-facebook)" }, { key: "url", label: "URL" }, { key: "label", label: "Etiqueta" }]} /></Field>
      <div className="border-t border-slate-200 pt-4 mt-2">
        <Field label="Imagen flotante (derecha, entre secciones)">
          <ImageField label="Subir imagen" value={content.floatingImage} onChange={(v) => set("floatingImage", v)} />
          <div className="mt-2"><TextInput value={content.floatingImageAlt} onChange={(v) => set("floatingImageAlt", v)} placeholder="Texto alternativo" /></div>
        </Field>
      </div>
    </>;
}
