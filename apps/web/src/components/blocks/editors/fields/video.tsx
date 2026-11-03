"use client";

import { Field, TextInput, ArrayEditor, IconPicker, type FieldProps } from "./shared";
import { ImageField } from "../image-field";

export function VideoFields({ content, set }: FieldProps) {
    if (content.variant === "indigo") {
      return <>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-700">Video Indigo (fondo oscuro)</div>
        <Field label="URL del video (embed)"><TextInput value={content.videoUrl} onChange={(v) => { set("videoUrl", v); set("url", v); }} placeholder="https://www.youtube.com/embed/..." /></Field>
        <Field label="Título"><TextInput value={content.title} onChange={(v) => set("title", v)} /></Field>
        <Field label="Imagen de portada (si no hay video)"><ImageField label="Portada" value={content.thumbnail} onChange={(v) => { set("thumbnail", v); set("imageUrl", v); }} /></Field>
      </>;
    }
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
}
