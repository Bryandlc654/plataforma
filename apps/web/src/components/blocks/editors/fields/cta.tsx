"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function CtaFields({ content, set }: FieldProps) {
    if (content.variant === "urban-noir") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">CTA Urban Noir (promoción oscura / newsletter)</div>
        <Field label="Tipo">
          <select value={content.newsletter ? "newsletter" : "promo"} onChange={(e) => set("newsletter", e.target.value === "newsletter")}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="promo">Promoción (fondo negro + imagen)</option>
            <option value="newsletter">Newsletter (formulario de suscripción)</option>
          </select>
        </Field>
        {content.newsletter ? <>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="ÚNETE AL CLUB" /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={3} /></Field>
          <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Suscribirse" /></Field>
        </> : <>
          <Field label="Ancla / ID"><TextInput value={content.anchor} onChange={(v) => set("anchor", v)} placeholder="promociones" /></Field>
          <Field label="Kicker (etiqueta)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Oferta Especial" /></Field>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="HASTA 50% DE DESCUENTO" /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} /></Field>
          <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Comprar Ahora" /></Field>
          <Field label="URL del botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} placeholder="#" /></Field>
          <Field label="Imagen (derecha)"><ImageField label="Imagen" value={content.backgroundImage} onChange={(v) => set("backgroundImage", v)} /></Field>
          <Field label="Texto de fondo (watermark)"><TextInput value={content.watermark} onChange={(v) => set("watermark", v)} placeholder="SALE SALE SALE" /></Field>
        </>}
      </>;
    }
    if (content.variant === "graduate") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">CTA Graduate (tarjeta de WhatsApp)</div>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sección</p>
          <Field label="Etiqueta (badge)"><TextInput value={content.ctaBadge} onChange={(v) => set("ctaBadge", v)} placeholder="¿List@ para el siguiente nivel?" /></Field>
          <Field label="Título (parte 1)"><TextInput value={content.ctaTitleLine1} onChange={(v) => set("ctaTitleLine1", v)} placeholder="Haz crecer tu" /></Field>
          <Field label="Título (palabra destacada)"><TextInput value={content.ctaHighlight} onChange={(v) => set("ctaHighlight", v)} placeholder="siguiente paso?" /></Field>
          <Field label="Subtítulo"><TextInput value={content.ctaSubtitle} onChange={(v) => set("ctaSubtitle", v)} type="textarea" rows={2} /></Field>
        </div>
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tarjeta de WhatsApp</p>
          <Field label="Título de la tarjeta"><TextInput value={content.cardTitle} onChange={(v) => set("cardTitle", v)} placeholder="¿Hablamos?" /></Field>
          <Field label="Subtítulo de la tarjeta"><TextInput value={content.cardSubtitle} onChange={(v) => set("cardSubtitle", v)} placeholder="Conversemos sobre tu proyecto" /></Field>
          <Field label="Texto del botón"><TextInput value={content.whatsappButtonText} onChange={(v) => set("whatsappButtonText", v)} placeholder="Agendar Asesoría" /></Field>
          <Field label="Número de WhatsApp (formato internacional)"><TextInput value={content.whatsappNumber} onChange={(v) => set("whatsappNumber", v)} placeholder="593999999999" /></Field>
        </div>
      </>;
    }
    if (content.variant === "indigo") {
      const isFunnel = content.style === "funnel";
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">CTA Indigo (contacto amarillo con formulario / funnel)</div>
        <Field label="Estilo">
          <select value={content.style || "contact"} onChange={(e) => set("style", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="contact">Contacto (amarillo + formulario)</option>
            <option value="funnel">Funnel (botón grande)</option>
          </select>
        </Field>
        {isFunnel ? <>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="DOMINA TU MERCADO." /></Field>
          <Field label="Párrafo"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={3} placeholder="Deja de ser uno más del montón..." /></Field>
          <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="INICIAR REBRANDING" /></Field>
          <Field label="URL del botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} placeholder="#contacto" /></Field>
        </> : <>
          <Field label="Kicker (arriba del título)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="¿Listo para" /></Field>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="destacar?" /></Field>
          <Field label="Párrafo"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={3} placeholder="Hagamos que tu marca sea imposible de ignorar." /></Field>
          <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Iniciar Proyecto" /></Field>
          <Field label="URL del botón (o vacío para mailto)"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} placeholder="#contacto" /></Field>
          <Field label="Correo de contacto"><TextInput value={content.email} onChange={(v) => set("email", v)} placeholder="hola@indigopublicidad.com" /></Field>
          <Field label="Teléfono"><TextInput value={content.phone} onChange={(v) => set("phone", v)} /></Field>
          <Field label="Dirección"><TextInput value={content.address} onChange={(v) => set("address", v)} /></Field>
          <Field label="Texto del botón del formulario"><TextInput value={content.submitText} onChange={(v) => set("submitText", v)} placeholder="ENVIAR" /></Field>
          <Field label="Campos del formulario"><ArrayEditor value={content.fields} onChange={(v) => set("fields", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "name", label: "Nombre" }, { key: "type", label: "Tipo (text, textarea, email)" }, { key: "required", label: "Requerido (true/false)" }]} /></Field>
        </>}
      </>;
    }
    return <>
      <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
      <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} /></Field>
      <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} /></Field>
      <Field label="URL del botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} /></Field>
    </>;
}
