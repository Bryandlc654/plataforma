"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { BlockRenderer } from "@/components/blocks/renderers/block-renderer";
import { HiArrowLeft } from "react-icons/hi";

export default function TemplatePreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      api.get(`/templates/${id}`)
        .then(res => {
          setTemplate(res.data || res);
          setLoading(false);
        })
        .catch(err => {
          setError(err.response?.data?.message || "Error al cargar la plantilla");
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Cargando vista previa...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Ups, algo salió mal</h1>
        <p className="text-slate-500 mb-6">{error || "Plantilla no encontrada"}</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          Volver
        </button>
      </div>
    );
  }

  const defaultPage = template.pages?.find((p: any) => p.isDefault) || template.pages?.[0];
  const blocks = defaultPage?.blocks || [];

  return (
    <div className="min-h-screen bg-white relative pb-20">
      {/* Top Floating Header for Preview Mode */}
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.close()} 
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
          >
            <HiArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div>
            <span className="bg-primary-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mr-2">Modo Vista Previa</span>
            <span className="font-semibold text-sm">{template.name}</span>
          </div>
        </div>
      </div>

      {/* Render Template Blocks */}
      <div className={`pt-12 ${template.variant === 'art-culinaire' ? 'theme-art-culinaire bg-background text-on-background font-body-md text-body-md selection:bg-tertiary-fixed-dim selection:text-on-tertiary-fixed-variant' : ''}`}>
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            Esta plantilla no tiene bloques configurados.
          </div>
        ) : (
          blocks.map((block: any) => (
            <BlockRenderer key={block.id} type={block.type} content={block.content} />
          ))
        )}
      </div>
    </div>
  );
}
