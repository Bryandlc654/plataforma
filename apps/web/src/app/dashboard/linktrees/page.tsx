"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Plus, Trash2, Copy, Eye, EyeOff, Link as LinkIcon, Share2, Upload, Image as ImageIcon, X } from "lucide-react";

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
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [links, setLinks] = useState<{ title: string; url: string; isActive: boolean }[]>([]);
  const [socials, setSocials] = useState<{ platform: string; url: string }[]>([]);
  const [bgType, setBgType] = useState<"none" | "color" | "image">("none");
  const [bgColor, setBgColor] = useState("#f8fafc");
  const [bgImage, setBgImage] = useState("");

  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const { confirm } = useConfirm();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

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
    setSocials([]); setBgType("none"); setBgColor("#f8fafc"); setBgImage("");
    setIsActive(true); setShowForm(true);
  };

  const openEdit = (s: Linktree) => {
    setEditId(s.id); setTitle(s.title); setSlug(s.slug); setDescription(s.description || "");
    setLogoUrl(s.logoUrl || ""); setIsActive(s.isActive);
    setLinks(s.links || []); setSocials(s.socials || []);
    const bg = s.background;
    if (bg?.type === "image") { setBgType("image"); setBgImage(bg.value || ""); setBgColor("#f8fafc"); }
    else if (bg?.type === "color") { setBgType("color"); setBgColor(bg.value || "#f8fafc"); setBgImage(""); }
    else { setBgType("none"); setBgColor("#f8fafc"); setBgImage(""); }
    setShowForm(true);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const form = new FormData();
    form.append("file", file);
    try {
      const res: any = await api.post("/media/upload", form);
      const data = res.data || res;
      return data.url || null;
    } catch {
      setToast({ kind: "error", message: "Error al subir imagen" });
      return null;
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) setLogoUrl(url);
    e.target.value = "";
  };

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) { setBgImage(url); setBgType("image"); }
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!title.trim()) { setToast({ kind: "error", message: "El título es obligatorio" }); return; }
    setSaving(true);
    try {
      let bg = null;
      if (bgType === "color") bg = { type: "color", value: bgColor };
      else if (bgType === "image" && bgImage) bg = { type: "image", value: bgImage };

      const body = { title, slug, description, logoUrl, links, socials, background: bg, isActive };
      if (editId) await api.put(`/linktrees/${editId}`, body);
      else await api.post("/linktrees", body);

      setToast({ kind: "success", message: editId ? "Bio Link actualizado" : "Bio Link creado" });
      setShowForm(false);
      fetchLinktrees();
    } catch (err: any) {
      setToast({ kind: "error", message: err.response?.data?.message || "Error al guardar" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm("¿Eliminar este Bio Link? Esta acción no se puede deshacer."))) return;
    try {
      await api.delete(`/linktrees/${id}`);
      setToast({ kind: "success", message: "Bio Link eliminado" });
      fetchLinktrees();
    } catch {
      setToast({ kind: "error", message: "Error al eliminar" });
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await api.put(`/linktrees/${id}`, { isActive: !current });
      fetchLinktrees();
    } catch {
      setToast({ kind: "error", message: "Error al actualizar estado" });
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
    setToast({ kind: "success", message: "Enlace copiado" });
  };

  return (
    <div className="p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.kind === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.message}
        </div>
      )}

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
      ) : linktrees.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
          <p className="text-gray-500 mb-2">Sin Bio Links</p>
          <p className="text-sm text-gray-400 mb-4">Crea tu primer Bio Link para compartir en redes</p>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Crear primer Bio Link</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {linktrees.map((lt) => (
            <div key={lt.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">{lt.title}</h3>
                    <p className="text-sm text-gray-500">/{lt.slug}</p>
                  </div>
                  <button onClick={() => toggleStatus(lt.id, lt.isActive)} className={`p-2 rounded-full ${lt.isActive ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}>
                    {lt.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                <div className="flex gap-4 border-t pt-4 mt-4">
                  <button onClick={() => openEdit(lt)} className="flex-1 text-sm text-blue-600 font-medium hover:underline text-center">Editar</button>
                  <button onClick={() => copyLink(lt.slug)} className="flex-1 text-sm text-gray-600 font-medium hover:underline flex items-center justify-center gap-1">
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">{editId ? "Editar Bio Link" : "Nuevo Bio Link"}</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Título *</label>
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

              <div>
                <label className="block text-sm font-medium mb-1">Logo</label>
                <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
                {logoUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border" />
                    <div className="flex gap-2">
                      <button onClick={() => logoInputRef.current?.click()} className="text-sm text-blue-600 hover:underline">Cambiar</button>
                      <button onClick={() => setLogoUrl("")} className="text-sm text-red-500 hover:underline">Eliminar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => logoInputRef.current?.click()} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full">
                    <Upload size={18} /> Subir logo
                  </button>
                )}
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
                <h3 className="font-semibold mb-3">Diseño</h3>
                <div className="flex gap-2 mb-3">
                  {(["none", "color", "image"] as const).map(t => (
                    <button key={t} onClick={() => setBgType(t)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${bgType === t ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      {t === "none" ? "Sin fondo" : t === "color" ? "Color sólido" : "Imagen"}
                    </button>
                  ))}
                </div>
                {bgType === "color" && (
                  <div className="flex items-center gap-3">
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
                    <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="#f8fafc" />
                  </div>
                )}
                {bgType === "image" && (
                  <div>
                    <input type="file" accept="image/*" className="hidden" ref={bgInputRef} onChange={handleBgImageUpload} />
                    {bgImage ? (
                      <div className="relative">
                        <img src={bgImage} alt="Fondo" className="w-full h-32 object-cover rounded-lg border" />
                        <button onClick={() => { setBgImage(""); setBgType("none"); }} className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-white shadow">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => bgInputRef.current?.click()} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full">
                        <ImageIcon size={18} /> Subir imagen de fondo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
              <button onClick={() => setShowForm(false)} disabled={saving} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !title.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? "Guardando..." : "Guardar Bio Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
