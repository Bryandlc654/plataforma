"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Upload, X, Search } from "lucide-react";

interface MediaItem {
  id: string; url: string; originalName: string; mimeType: string;
  width?: number; height?: number;
}

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  accept?: string;
}

export default function MediaPicker({ open, onClose, onSelect, accept = "image/*" }: MediaPickerProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: 24, type: "image" };
      if (search) params.search = search;
      const res: any = await api.get("/media", { params });
      const response = res.data || res;
      const list = response.data || response;
      const meta = response.meta;
      setItems(Array.isArray(list) ? list : []);
      if (meta) setTotalPages(meta.totalPages || 1);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { if (open) { setPage(1); fetchMedia(1); } }, [open, fetchMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res: any = await api.post("/media/upload", form);
      const data = res.data || res;
      if (data.url) {
        onSelect(data.url);
        onClose();
      }
    } catch { /* silent */ }
    finally { setUploading(false); e.target.value = ""; }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Seleccionar imagen</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        <div className="flex gap-2 p-4 border-b">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" />
          </div>
          <input type="file" accept={accept} className="hidden" ref={fileRef} onChange={handleUpload} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
            <Upload size={16} /> {uploading ? "Subiendo..." : "Subir nueva"}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <p className="text-center text-gray-400 py-8">Cargando...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Sin imágenes. Sube una nueva.</p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {items.map(item => (
                <button key={item.id} onClick={() => { onSelect(item.url); onClose(); }}
                  className="aspect-square rounded-lg border-2 border-transparent hover:border-blue-500 overflow-hidden bg-gray-100 transition-colors relative group">
                  <img src={item.url} alt={item.originalName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-3 border-t">
            <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); fetchMedia(page - 1); }}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40">Anterior</button>
            <span className="text-sm text-gray-500 self-center">Página {page}</span>
            <button disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); fetchMedia(page + 1); }}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40">Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
}
