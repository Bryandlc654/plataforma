"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import api from "@/lib/api";
import { MediaLibrary } from "@/components/media/media-library";

export function ImageField({ value, onChange, label }: {
  value: any;
  onChange: (v: string) => void;
  label: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const url = value || "";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res: any = await api.post("/media/upload", form);
      const media = res.data || res;
      onChange(media.url);
    } catch { alert("Error al subir imagen"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {url ? (
        <div className="space-y-2">
          <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <Image src={url} alt="Preview" fill className="object-contain p-1" sizes="400px" unoptimized />
          </div>
          <div className="flex gap-2">
            <label className={`flex-1 px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer text-center ${uploading ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-primary-600 text-white border-primary-600 hover:bg-primary-700"}`}>
              {uploading ? "Subiendo..." : "Cambiar imagen"}
              <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="image/*" />
            </label>
            <button type="button" onClick={() => setShowPicker(true)} className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Galería</button>
            <button type="button" onClick={() => onChange("")} className="px-3 py-2 text-xs font-medium text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">Quitar</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <label className={`flex-1 px-4 py-3 text-sm font-medium rounded-xl border-2 border-dashed transition-colors cursor-pointer text-center ${uploading ? "bg-slate-50 text-slate-400 border-slate-200" : "text-primary-600 border-primary-200 hover:border-primary-400 hover:bg-primary-50"}`}>
            {uploading ? "Subiendo..." : (<span className="flex items-center justify-center gap-1.5"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Subir imagen</span>)}
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="image/*" />
          </label>
          <button type="button" onClick={() => setShowPicker(true)} className="flex-1 px-4 py-3 text-sm font-medium rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition-colors"><span className="flex items-center justify-center gap-1.5"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>Galería</span></button>
        </div>
      )}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPicker(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-lg max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-800">Biblioteca de imágenes</span>
              <button onClick={() => setShowPicker(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
            </div>
            <MediaLibrary onSelect={(mediaUrl) => { onChange(mediaUrl); setShowPicker(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}

