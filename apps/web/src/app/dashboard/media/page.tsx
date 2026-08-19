"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import Image from "next/image";
import { FileText, Clipboard, X, Upload } from "lucide-react";
import { useConfirm } from "@/components/providers/confirm-provider";

interface MediaItem {
  id: string; url: string; originalName: string; mimeType: string; size: string;
  width: number; height: number; folder: string; createdAt: string;
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const { confirm } = useConfirm();

  const fetchMedia = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: 20 };
      if (type) params.type = type;
      const res: any = await api.get("/media", { params });
      const response = res.data || res;
      const list = response.data || response;
      const meta = response.meta;
      setItems(Array.isArray(list) ? list : []);
      if (meta) {
        setTotal(meta.total);
        setTotalPages(meta.totalPages);
        setPage(meta.page);
      }
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [type]);

  useEffect(() => { fetchMedia(1); }, [fetchMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        await api.post("/media/upload", form);
      }
      fetchMedia(1);
    } catch (err: any) { 
      const msg = err.response?.data?.message || err.message || "Error desconocido";
      alert("Error al subir archivo: " + msg); 
    }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm("¿Eliminar este archivo?"))) return;
    await api.delete(`/media/${id}`);
    fetchMedia(1);
  };

  const formatSize = (bytes: string) => {
    const size = Number(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
      <main className="flex-1 p-8 bg-slate-50 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-2xl font-bold text-slate-900">Biblioteca de Medios</h1><p className="text-sm text-slate-600">{total} archivos</p></div>
          <label className="btn-primary text-sm cursor-pointer inline-flex items-center gap-2">
            {uploading ? "Subiendo..." : (<><Upload className="h-4 w-4" /> Subir archivos</>)}
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="image/*" multiple />
          </label>
        </div>

        <div className="flex gap-3 mb-6">
          <select className="input-field w-44" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="image">Imágenes</option>
          </select>
        </div>

        {loading ? <p className="text-slate-500">Cargando...</p> : items.length === 0 ? (
          <div className="card text-center py-16"><p className="text-slate-500 mb-2">Sin archivos</p><p className="text-sm text-slate-400">Sube imágenes para usar en tus sitios web</p></div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.id} className="card p-3 group relative">
                  {item.mimeType.startsWith("image/") ? (
                    <Image
                      src={item.url}
                      alt={item.originalName}
                      width={item.width || 640}
                      height={item.height || 360}
                      unoptimized
                      className="w-full h-36 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-36 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <FileText className="h-8 w-8" />
                    </div>
                  )}
                  <div className="mt-2">
                    <p className="text-xs text-slate-700 truncate">{item.originalName}</p>
                    <p className="text-xs text-slate-400">{formatSize(item.size)}{item.width && ` · ${item.width}×${item.height}`}</p>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { navigator.clipboard.writeText(item.url); alert("URL copiada"); }} className="bg-white rounded p-1.5 text-slate-500 hover:text-slate-700 shadow" title="Copiar URL"><Clipboard className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(item.id)} className="bg-white rounded p-1.5 text-red-500 shadow hover:bg-red-50" title="Eliminar"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => fetchMedia(i + 1)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${page === i + 1 ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    );
}
