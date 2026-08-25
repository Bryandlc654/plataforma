"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Plus, Trash2, ExternalLink, Copy, Eye, EyeOff, Link as LinkIcon, Share2 } from "lucide-react";

interface Linktree {
  id: string; title: string; slug: string; description: string | null;
  logoUrl: string | null; isActive: boolean;
  background?: any; socials?: any[]; links?: any[];
  createdAt: string;
}

export default function LinktreesPage() {
  const [linktrees, setLinktrees] = useState<Linktree[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  
  const [links, setLinks] = useState<{ title: string; url: string; isActive: boolean }[]>([]);
  const [socials, setSocials] = useState<{ platform: string; url: string }[]>([]);
  const [bg, setBg] = useState<{ type: string; value: string }>({ type: "color", value: "#f8fafc" });

  const { confirm } = useConfirm();

  const fetchLinktrees = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/linktrees");
      const data = res.data || res;
      setLinktrees(data.items || data.data || []);
    } catch { setLinktrees([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLinktrees(); }, [fetchLinktrees]);

  const openCreate = () => {
    setEditId(null); setTitle(""); setSlug(""); setDescription(""); setLogoUrl("");
    setLinks([{ title: "Mi Sitio Web", url: "https://", isActive: true }]);
    setSocials([]); setBg({ type: "color", value: "#f8fafc" });
    setIsActive(true); setShowForm(true);
  };

  const openEdit = (s: Linktree) => {
    setEditId(s.id); setTitle(s.title); setSlug(s.slug); setDescription(s.description || "");
    setLogoUrl(s.logoUrl || ""); setIsActive(s.isActive);
    setLinks(s.links || []); setSocials(s.socials || []);
    setBg(s.background || { type: "color", value: "#f8fafc" });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const body = { title, slug, description, logoUrl, links, socials, background: bg, isActive };
      if (editId) await api.put(`/linktrees/${editId}`, body);
      else await api.post("/linktrees", body);
      
      alert("Enlace guardado exitosamente");
      setShowForm(false);
      fetchLinktrees();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm("¿Eliminar este Bio Link? Esta acción no se puede deshacer.")) {
      try {
        await api.delete(`/linktrees/${id}`);
        alert("Bio Link eliminado");
        fetchLinktrees();
      } catch {
        alert("Error al eliminar");
      }
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await api.put(`/linktrees/${id}`, { isActive: !current });
      fetchLinktrees();
    } catch {
      alert("Error al actualizar estado");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bio Links</h1>
          <p className="text-gray-500">Crea páginas personalizadas estilo Linktree.</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} /> Crear Bio Link
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {linktrees.map((lt) => (
            <div key={lt.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{lt.title}</h3>
                    <p className="text-sm text-gray-500">/{lt.slug}</p>
                  </div>
                  <button onClick={() => toggleStatus(lt.id, lt.isActive)} className={`p-2 rounded-full ${lt.isActive ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}>
                    {lt.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                
                <div className="flex gap-4 border-t pt-4 mt-4">
                  <button onClick={() => openEdit(lt)} className="flex-1 text-sm text-blue-600 font-medium hover:underline text-center">Editar</button>
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/${lt.slug}`);
                    alert("Enlace copiado");
                  }} className="flex-1 text-sm text-gray-600 font-medium hover:underline flex items-center justify-center gap-1">
                    <Copy size={14} /> Copiar URL
                  </button>
                  <button onClick={() => handleDelete(lt.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-6">{editId ? "Editar Bio Link" : "Nuevo Bio Link"}</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Título</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Mi Empresa" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                  <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="mi-empresa" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows={2} />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2"><LinkIcon size={18} /> Enlaces</h3>
                  <button onClick={() => setLinks([...links, { title: "", url: "", isActive: true }])} className="text-blue-600 text-sm font-medium">+ Añadir Link</button>
                </div>
                {links.map((link, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center bg-gray-50 p-2 rounded">
                    <input type="text" value={link.title} onChange={e => { const l = [...links]; l[idx].title = e.target.value; setLinks(l); }} placeholder="Título" className="flex-1 border rounded px-2 py-1 text-sm" />
                    <input type="text" value={link.url} onChange={e => { const l = [...links]; l[idx].url = e.target.value; setLinks(l); }} placeholder="URL" className="flex-1 border rounded px-2 py-1 text-sm" />
                    <button onClick={() => setLinks(links.filter((_, i) => i !== idx))} className="text-red-500 p-1"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2"><Share2 size={18} /> Redes Sociales</h3>
                  <button onClick={() => setSocials([...socials, { platform: "instagram", url: "" }])} className="text-blue-600 text-sm font-medium">+ Añadir Red</button>
                </div>
                {socials.map((social, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center bg-gray-50 p-2 rounded">
                    <select value={social.platform} onChange={e => { const s = [...socials]; s[idx].platform = e.target.value; setSocials(s); }} className="w-32 border rounded px-2 py-1 text-sm">
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="twitter">Twitter / X</option>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube">YouTube</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                    <input type="text" value={social.url} onChange={e => { const s = [...socials]; s[idx].url = e.target.value; setSocials(s); }} placeholder="URL" className="flex-1 border rounded px-2 py-1 text-sm" />
                    <button onClick={() => setSocials(socials.filter((_, i) => i !== idx))} className="text-red-500 p-1"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Diseño</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Color de Fondo</label>
                  <input type="color" value={bg.value} onChange={e => setBg({ type: "color", value: e.target.value })} className="h-10 w-20 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar Bio Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

