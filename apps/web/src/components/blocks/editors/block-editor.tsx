"use client";

import { ImageField } from "./image-field";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", rows }: { value: any; onChange: (v: any) => void; placeholder?: string; type?: string; rows?: number }) {
  if (type === "textarea" || rows) {
    return <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={rows || 3} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none placeholder:text-slate-300" />;
  }
  return <input type={type} value={value || ""} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} placeholder={placeholder}
    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-300" />;
}

function ArrayEditor({ value, onChange, fields }: { value: any[]; onChange: (v: any[]) => void; fields: Array<{ key: string; label: string; type?: string }> }) {
  const items = value || [];
  const add = () => { const item: any = {}; fields.forEach((f) => (item[f.key] = "")); onChange([...items, item]); };
  const update = (idx: number, key: string, val: any) => onChange(items.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="relative p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase">Item {i + 1}</span>
              <button onClick={() => remove(i)} className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((f) =>
                f.type === "image" ? (
                  <ImageField key={f.key} label={f.label} value={item[f.key]} onChange={(v) => update(i, f.key, v)} />
                ) : (
                  <TextInput key={f.key} value={item[f.key]} onChange={(v) => update(i, f.key, v)} placeholder={f.label} type={f.type || "text"} />
                )
              )}
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-3 w-full rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
        + Agregar item
      </button>
    </div>
  );
}

export function BlockEditor({ type, content, onChange }: { type: string; content: any; onChange: (c: any) => void }) {
  const set = (key: string, value: any) => onChange({ ...content, [key]: value });

  const renderFields = () => {
    switch (type) {
      case "hero":
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

      case "services":
        if (content.variant === "indigo") {
          return <>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Servicio destacado Indigo (imagen + texto)</div>
            <Field label="Número / Kicker"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="01" /></Field>
            <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="LETRAS 3D" /></Field>
            <Field label="Párrafo"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={3} /></Field>
            <Field label="Imagen"><ImageField label="Imagen" value={content.imageUrl} onChange={(v) => set("imageUrl", v)} /></Field>
            <Field label="Lista de items"><ArrayEditor value={content.features} onChange={(v) => set("features", v)} fields={[{ key: "text", label: "Item" }]} /></Field>
            <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} /></Field>
            <Field label="URL del botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} /></Field>
          </>;
        }
        return <>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} /></Field>
          <Field label="Servicios"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[{ key: "title", label: "Título" }, { key: "desc", label: "Descripción", type: "textarea" }]} /></Field>
        </>;

      case "faq":
        return <>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
          <Field label="Preguntas"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[{ key: "question", label: "Pregunta" }, { key: "answer", label: "Respuesta", type: "textarea" }]} /></Field>
        </>;

      case "cta":
        return <>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} /></Field>
          <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} /></Field>
          <Field label="URL del botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} /></Field>
        </>;

      case "review-form":
        return <>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Déjanos tu opinión" /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} placeholder="Valoramos tu experiencia" /></Field>
        </>;

      case "testimonials":
        return <>
          <Field label="Origen de reseñas">
            <select value={content.source || "manual"} onChange={(e) => set("source", e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="manual">Manual (Configurar aquí)</option>
              <option value="dynamic">Dinámico (Opiniones de clientes reales)</option>
            </select>
          </Field>
          <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Testimonios" /></Field>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} /></Field>
          <Field label="Columnas (escritorio)">
            <select value={content.columns || 3} onChange={(e) => set("columns", parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value={1}>1 columna</option>
              <option value={2}>2 columnas</option>
              <option value={3}>3 columnas</option>
            </select>
          </Field>
          <Field label="Modo carrusel">
            <select value={content.carousel ? "yes" : "no"} onChange={(e) => set("carousel", e.target.value === "yes")}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="no">Cuadrícula estática</option>
              <option value="yes">Carrusel automático</option>
            </select>
          </Field>
          <Field label="Testimonios"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[{ key: "name", label: "Nombre" }, { key: "role", label: "Cargo" }, { key: "quote", label: "Testimonio", type: "textarea" }]} /></Field>
        </>;

      case "gallery":
        return <>
          <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Detrás de escena" /></Field>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} /></Field>
          <Field label="Imágenes"><ArrayEditor value={content.images} onChange={(v) => set("images", v)} fields={[{ key: "url", label: "Imagen", type: "image" }, { key: "alt", label: "Texto alternativo" }]} /></Field>
        </>;

      case "header":
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

      case "footer":
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

      case "whatsapp":
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

      case "pricing":
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

      case "team":
        return <>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Nuestro equipo" /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} /></Field>
          <Field label="Miembros">
            <div className="space-y-3">
              {(content.members || []).map((m: any, i: number) => (
                <div key={i} className="relative p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400 uppercase">Miembro {i + 1}</span>
                    <button onClick={() => { const arr = [...(content.members || [])]; arr.splice(i, 1); set("members", arr); }}
                      className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div className="space-y-2">
                    <TextInput value={m.name} onChange={(v) => { const arr = [...(content.members || [])]; arr[i] = { ...arr[i], name: v }; set("members", arr); }} placeholder="Nombre" />
                    <TextInput value={m.role} onChange={(v) => { const arr = [...(content.members || [])]; arr[i] = { ...arr[i], role: v }; set("members", arr); }} placeholder="Cargo" />
                    <ImageField label="Foto" value={m.image} onChange={(v) => { const arr = [...(content.members || [])]; arr[i] = { ...arr[i], image: v }; set("members", arr); }} />
                    <TextInput value={m.bio} onChange={(v) => { const arr = [...(content.members || [])]; arr[i] = { ...arr[i], bio: v }; set("members", arr); }} placeholder="Bio" type="textarea" rows={2} />
                  </div>
                </div>
              ))}
              <button onClick={() => set("members", [...(content.members || []), { name: "", role: "", image: "", bio: "" }])}
                className="w-full rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
                + Agregar miembro
              </button>
            </div>
          </Field>
        </>;

      case "features":
        return <>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="¿Por qué elegirnos?" /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} /></Field>
          <Field label="Items"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
            { key: "icon", label: "Icono (emoji)" },
            { key: "title", label: "Título" },
            { key: "desc", label: "Descripción", type: "textarea" },
          ]} /></Field>
        </>;

      case "image":
        return <>
          <ImageField label="URL de la imagen" value={content.url} onChange={(v) => set("url", v)} />
          <Field label="Texto alternativo"><TextInput value={content.alt} onChange={(v) => set("alt", v)} placeholder="Describe la imagen" /></Field>
          <Field label="Enlace (opcional)"><TextInput value={content.link} onChange={(v) => set("link", v)} placeholder="https://..." /></Field>
          <Field label="Caption"><TextInput value={content.caption} onChange={(v) => set("caption", v)} placeholder="Texto debajo de la imagen" /></Field>
          <Field label="Alineación">
            <select value={content.alignment || "center"} onChange={(e) => set("alignment", e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </Field>
        </>;

      case "video":
        return <>
          <Field label="URL del video (YouTube/Vimeo)"><TextInput value={content.url} onChange={(v) => set("url", v)} placeholder="https://www.youtube.com/watch?v=..." /></Field>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Título del video" /></Field>
          <Field label="Aspect ratio">
            <select value={content.aspectRatio || "16/9"} onChange={(e) => set("aspectRatio", e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="16/9">16:9 (Horizontal)</option>
              <option value="4/3">4:3 (Clásico)</option>
              <option value="1/1">1:1 (Cuadrado)</option>
              <option value="9/16">9:16 (Vertical)</option>
            </select>
          </Field>
          <Field label="Autoplay">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={content.autoplay || false} onChange={(e) => set("autoplay", e.target.checked)}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-slate-600">Reproducir automáticamente</span>
            </label>
          </Field>
        </>;

      case "about":
        return <>
          <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Nosotros" /></Field>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Sobre nosotros" /></Field>
          <Field label="Descripción"><TextInput value={content.description} onChange={(v) => set("description", v)} type="textarea" rows={4} placeholder="Cuenta la historia de tu negocio..." /></Field>
          <ImageField label="Imagen" value={content.imageUrl} onChange={(v) => set("imageUrl", v)} />
          <Field label="Etiqueta de la insignia (ej: ISO 9001)"><TextInput value={content.badgeTitle} onChange={(v) => set("badgeTitle", v)} placeholder="ISO 9001" /></Field>
          <Field label="Subetiqueta de la insignia"><TextInput value={content.badgeSubtitle} onChange={(v) => set("badgeSubtitle", v)} placeholder="Calidad certificada" /></Field>
          <Field label="Checklist"><ArrayEditor value={content.features} onChange={(v) => set("features", v)} fields={[{ key: "text", label: "Item" }]} /></Field>
          <Field label="Texto del enlace"><TextInput value={content.linkText} onChange={(v) => set("linkText", v)} placeholder="Conocer más" /></Field>
          <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Conocer más" /></Field>
          <Field label="URL del botón"><TextInput value={content.buttonUrl} onChange={(v) => set("buttonUrl", v)} placeholder="#contacto" /></Field>
        </>;

      case "stats":
        return <>
          <Field label="Indicadores"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
            { key: "icon", label: "Icono (ej: bi-crosshair)" },
            { key: "value", label: "Valor (ej: 2500)" },
            { key: "suffix", label: "Sufijo (ej: +, %, Tn)" },
            { key: "label", label: "Etiqueta" },
          ]} /></Field>
        </>;

      case "portfolio":
        return <>
          <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Productos" /></Field>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} /></Field>
          <Field label="Items"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
            { key: "image", label: "Imagen del producto", type: "image" },
            { key: "tag", label: "Etiqueta (ej: Agrícola)" },
            { key: "title", label: "Título" },
            { key: "icon", label: "Icono (ej: bi-crosshair)" },
            { key: "link", label: "URL de enlace" },
            { key: "desc", label: "Descripción", type: "textarea" },
          ]} /></Field>
        </>;

      case "benefits":
        return <>
          <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Beneficios" /></Field>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
          <Field label="Items"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
            { key: "icon", label: "Icono (ej: bi-shield-check)" },
            { key: "title", label: "Título" },
            { key: "desc", label: "Descripción", type: "textarea" },
          ]} /></Field>
        </>;

      case "process":
        return <>
          <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Proceso" /></Field>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
          <Field label="Imagen de fondo (opcional)"><ImageField label="Imagen de fondo" value={content.backgroundImage} onChange={(v) => set("backgroundImage", v)} /></Field>
          <Field label="Pasos"><ArrayEditor value={content.items} onChange={(v) => set("items", v)} fields={[
            { key: "icon", label: "Icono (ej: bi-arrow-repeat)" },
            { key: "title", label: "Título" },
            { key: "desc", label: "Descripción", type: "textarea" },
          ]} /></Field>
        </>;

      case "form":
      case "contact":
        return <>
          <Field label="Kicker (etiqueta opcional)"><TextInput value={content.kicker} onChange={(v) => set("kicker", v)} placeholder="Contacto" /></Field>
          <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} placeholder="Contáctanos" /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={(v) => set("subtitle", v)} type="textarea" rows={2} placeholder="Déjanos tu mensaje" /></Field>
          <Field label="Texto del botón"><TextInput value={content.buttonText} onChange={(v) => set("buttonText", v)} placeholder="Enviar" /></Field>
          <Field label="Dirección"><TextInput value={content.address} onChange={(v) => set("address", v)} placeholder="Parque Industrial · Guayaquil, Ecuador" /></Field>
          <Field label="Teléfono"><TextInput value={content.phone} onChange={(v) => set("phone", v)} placeholder="+593 4 000 0000" /></Field>
          <Field label="Correo"><TextInput value={content.email} onChange={(v) => set("email", v)} placeholder="ventas@miempresa.ec" /></Field>
          <Field label="URL de Google Maps"><TextInput value={content.mapUrl} onChange={(v) => set("mapUrl", v)} placeholder="https://maps.app.goo.gl/... o https://www.google.com/maps/..." /></Field>
          <Field label="Campos"><ArrayEditor value={content.fields} onChange={(v) => set("fields", v)} fields={[{ key: "label", label: "Etiqueta" }, { key: "name", label: "Nombre" }, { key: "type", label: "Tipo (text, textarea, email)" }, { key: "required", label: "Requerido (true/false)" }]} /></Field>
        </>;

      default:
        return <p className="text-sm text-slate-400 py-8 text-center">Editor no disponible</p>;
    }
  };

  return (
    <div className="p-4 pb-20">
      {renderFields()}
    </div>
  );
}
