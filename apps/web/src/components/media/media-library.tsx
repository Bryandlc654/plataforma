"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import Image from "next/image";
import { useConfirm } from "@/components/providers/confirm-provider";

interface MediaItem {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: string;
  width: number;
  height: number;
  createdAt: string;
}

export function MediaLibrary({ onSelect, compact }: { onSelect?: (url: string) => void; compact?: boolean }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { confirm } = useConfirm();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async (p = 1, append = false) => {
    setLoading(true);
    try {
      const res: any = await api.get(`/media?page=${p}&limit=20`);
      const response = res.data || res;
      const list = response.data || response;
      const meta = response.meta;
      if (append) {
        setItems((prev) => [...prev, ...list]);
      } else {
        setItems(Array.isArray(list) ? list : []);
      }
      setHasMore(meta ? meta.page < meta.totalPages : false);
      setPage(p);
    } catch {
      if (!append) setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post("/media/upload", form);
      fetchMedia(1);
    } catch {
      alert("Error al subir archivo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">Biblioteca de medios</span>
        <label className="text-xs font-medium text-primary-600 hover:text-primary-700 cursor-pointer">
          {uploading ? "Subiendo..." : "+ Subir archivo"}
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf,application/pdf" />
        </label>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-xs text-slate-400">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-400">Sin archivos</p>
      ) : (
        <>
          <div className={`grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4"} max-h-60 overflow-y-auto`}>
            {items.map((item) => (
              <div key={item.id} className="group relative cursor-pointer" onClick={() => onSelect?.(item.url)}>
                {item.mimeType.startsWith("image/") ? (
                  <Image
                    src={item.url}
                    alt={item.originalName}
                    width={item.width || 320}
                    height={item.height || 180}
                    unoptimized
                    className="w-full h-20 object-cover rounded-lg pointer-events-none hover:opacity-80 transition-opacity"
                  />
                ) : item.mimeType === "application/pdf" ? (
                  <div className="w-full h-20 rounded-lg bg-red-50 flex flex-col items-center justify-center gap-1 text-red-500">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    <span className="text-[10px] font-medium">PDF</span>
                  </div>
                ) : (
                  <div className="w-full h-20 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    Archivo
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 pointer-events-none">
                  <span className="text-white text-[10px]">{formatSize(item.size)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="pointer-events-auto text-white text-xs hover:text-red-300"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => fetchMedia(page + 1, true)}
              disabled={loading}
              className="w-full mt-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {loading ? "Cargando..." : "Cargar más"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

