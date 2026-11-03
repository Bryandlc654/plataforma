"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function HeroFields({ content, set }: FieldProps) {
    if (content.variant === "urban-noir") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Hero Urban Noir (pantalla completa negra, imagen en escala de grises)</div>
        <Field label="Imagen de fondo"><ImageField label="Imagen de fondo" value={content.backgroundImage} onChange={(v) => set("backgroundImage", v)} /></Field>
        <Field label="Kicker (etiqueta)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Colección Fall/Winter" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="REDEFINE YOUR STREETS" /></Field>
        <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={3} /></Field>
        <Field label="Texto botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Explorar Colección" /></Field>
        <Field label="URL botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} placeholder="#catalogo" /></Field>
      </>;
    }
    if (content.variant === "rodriplast") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Hero Rodriplast (pantalla completa con slider de fondo)</div>
        <Field label="Ancla / ID"><TextInput value={content.anchor} onChange={(v) => set("anchor", v)} placeholder="inicio" /></Field>
        <Field label="Slides del fondo (imagen de cada slide)"><ArrayEditor value={content.slides} onChange={(v) => set("slides", v)} fields={[{ key: "backgroundImage", label: "Imagen del slide", type: "image" }]} /></Field>
        <Field label="Imagen de respaldo"><ImageField label="Imagen de respaldo" value={content.backgroundImage} onChange={(v) => set("backgroundImage", v)} /></Field>
        <Field label="Kicker (etiqueta)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Fabricado en Ecuador · 100% reciclado" /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Mangueras del futuro, hechas del plástico de ayer." /></Field>
        <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={3} /></Field>
        <Field label="Texto botón principal"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Solicitar cotización" /></Field>
        <Field label="URL botón principal"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} placeholder="#contacto" /></Field>
        <Field label="Texto botón secundario"><TextInput value={content.secondaryButtonText} onChange={(v) => set("secondaryButtonText", v)} placeholder="Conocer más" /></Field>
        <Field label="URL botón secundario"><TextInput value={content.secondaryButtonUrl} onChange={(v) => set("secondaryButtonUrl", v)} placeholder="#nosotros" /></Field>
      </>;
    }
    if (content.variant === "graduate") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Hero Graduate (fondo oscuro, sin degradados de texto)</div>
        <Field label="Estilo del hero">
          <select value={content.heroStyle || content.sub || "carousel"} onChange={(e) => set("heroStyle", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="light">Claro con imagen a la derecha</option>
            <option value="carousel">Centrado + carrusel 3D</option>
            <option value="intro">Intro simple (sin carrusel)</option>
          </select>
        </Field>
        {(content.heroStyle || content.sub || "carousel") === "light" && (
          <Field label="Imagen derecha"><ImageField label="Imagen derecha" value={content.heroImage} onChange={(v) => set("heroImage", v)} /></Field>
        )}
        <Field label="Imagen de fondo"><ImageField label="Imagen de fondo" value={content.backgroundImage} onChange={(v) => set("backgroundImage", v)} /></Field>
        <Field label="Etiqueta (tag)"><TextInput value={content.tag} onChange={(v) => set("tag", v)} placeholder="Agencia & Academia Digital" /></Field>
        <Field label="Título (línea 1)"><TextInput value={content.titleLine1} onChange={(v) => set("titleLine1", v)} placeholder="Revoluciona el" /></Field>
        <Field label="Título (palabra destacada)"><TextInput value={content.titleHighlight} onChange={(v) => set("titleHighlight", v)} placeholder="Crecimiento" /></Field>
        <Field label="Título (línea final)"><TextInput value={content.titleLine2} onChange={(v) => set("titleLine2", v)} placeholder="de tu negocio." /></Field>
        <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={3} /></Field>
        <Field label="Texto botón principal"><TextInput value={content.primaryButtonText} onChange={(v) => set("primaryButtonText", v)} placeholder="Escalar mi negocio" /></Field>
        <Field label="URL botón principal"><TextInput value={content.primaryButtonUrl} onChange={(v) => set("primaryButtonUrl", v)} placeholder="#servicios" /></Field>
        <Field label="Texto botón secundario"><TextInput value={content.secondaryButtonText} onChange={(v) => set("secondaryButtonText", v)} placeholder="Asesoría Gratuita" /></Field>
        <Field label="URL botón secundario"><TextInput value={content.secondaryButtonUrl} onChange={(v) => set("secondaryButtonUrl", v)} placeholder="#contacto" /></Field>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tarjetas del carrusel</p>
          <Field label="Tarjetas"><ArrayEditor value={content.cards} onChange={(v) => set("cards", v)} fields={[
            { key: "badge", label: "Etiqueta (ej: Emprendedor)" },
            { key: "color", label: "Color de la etiqueta", type: "color" },
            { key: "title", label: "Título" },
            { key: "image", label: "Imagen", type: "image" },
            { key: "alt", label: "Texto alternativo" },
          ]} /></Field>
        </div>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Insignia flotante</p>
          <Field label="Icono"><IconPicker value={content.badgeIcon} onChange={(v) => set("badgeIcon", v)} /></Field>
          <Field label="Etiqueta"><TextInput value={content.badgeLabel} onChange={(v) => set("badgeLabel", v)} placeholder="Comunidad" /></Field>
          <Field label="Valor"><TextInput value={content.badgeValue} onChange={(v) => set("badgeValue", v)} placeholder="+500 Alumnos" /></Field>
        </div>
      </>;
    }
    if (content.variant === "indigo") {
      return <>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Publicidad" /></Field>
        <Field label="Subtítulo (amarillo)"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} placeholder="Creativa." /></Field>
        <Field label="Párrafo (debajo del título)"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={3} placeholder="Rompemos las reglas del diseño..." /></Field>
        <Field label="Imagen de fondo"><ImageField label="Imagen de fondo" value={content.backgroundImage} onChange={(v) => set("backgroundImage", v)} /></Field>
      </>;
    }
    return <>
      <Field label="Fondo">
        <select value={content.bgType || "gradient"} onChange={(e) => set("bgType", e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
          <option value="gradient">Color degradado</option>
          <option value="image">Imagen de fondo</option>
        </select>
      </Field>
      {content.bgType === "image" && <ImageField label="Imagen de fondo" value={content.backgroundImage} onChange={(v) => set("backgroundImage", v)} />}
      <Field label="Imágenes del carrusel (opcional)">
        <ArrayEditor value={content.slides} onChange={(v) => set("slides", v)} fields={[{ key: "backgroundImage", label: "Imagen de fondo del slide", type: "image" }]} />
      </Field>
      <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="OFERTA · NUEVO" /></Field>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Título principal" /></Field>
      <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} placeholder="Subtítulo descriptivo" /></Field>
      <Field label="Texto botón principal"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Contáctanos" /></Field>
      <Field label="URL botón principal"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} placeholder="#contacto" /></Field>
      <Field label="Texto botón secundario"><TextInput value={content.secondaryButtonText} onChange={(v) => set("secondaryButtonText", v)} placeholder="Ver más" /></Field>
      <Field label="URL botón secundario"><TextInput value={content.secondaryButtonUrl} onChange={(v) => set("secondaryButtonUrl", v)} placeholder="#servicios" /></Field>
    </>;
}
