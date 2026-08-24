"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Plus, Trash2, Users, ExternalLink, Copy, Eye, EyeOff } from "lucide-react";

interface SorteoField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "select" | "textarea";
  required: boolean;
  options?: string[];
}

interface Sorteo {
  id: string; title: string; slug: string; description: string;
  fields: SorteoField[]; isActive: boolean;
  startDate: string | null; endDate: string | null;
  participantCount: number; createdAt: string;
}

const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "email", label: "Correo" },
  { value: "tel", label: "Teléfono" },
  { value: "number", label: "Número" },
  { value: "select", label: "Selección" },
  { value: "textarea", label: "Texto largo" },
];

const DEFAULT_FIELDS: SorteoField[] = [
  { name: "nombre", label: "Nombre", type: "text", required: true },
  { name: "apellido", label: "Apellido", type: "text", required: true },
  { name: "correo", label: "Correo electrónico", type: "email", required: true },
  { name: "telefono", label: "Teléfono", type: "tel", required: false },
];

export default function SorteosPage() {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<SorteoField[]>(DEFAULT_FIELDS);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);
  const [showParticipants, setShowParticipants] = useState<string | null>(null);
  const [participantPage, setParticipantPage] = useState(1);
  const [participantTotal, setParticipantTotal] = useState(0);
  const { confirm } = useConfirm();

  const fetchSorteos = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/sorteos");
      const data = res.data || res;
      setSorteos(data.items || data.data || []);
    } catch { setSorteos([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSorteos(); }, [fetchSorteos]);

  const openCreate = () => {
    setEditId(null); setTitle(""); setSlug(""); setDescription("");
    setFields(DEFAULT_FIELDS); setStartDate(""); setEndDate(""); setShowForm(true);
  };

  const openEdit = (s: Sorteo) => {
    setEditId(s.id); setTitle(s.title); setSlug(s.slug); setDescription(s.description || "");
    setFields(s.fields?.length ? s.fields : DEFAULT_FIELDS);
    setStartDate(s.startDate ? s.startDate.slice(0, 16) : "");
    setEndDate(s.endDate ? s.endDate.slice(0, 16) : ""); setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const body = {
        title, slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description, fields, startDate: startDate || undefined, endDate: endDate || undefined,
      };
      if (editId) await api.put(`/sorteos/${editId}`, body);
      else await api.post("/sorteos", body);
      setShowForm(false); fetchSorteos();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm("¿Eliminar este sorteo y todos sus participantes?"))) return;
    await api.delete(`/sorteos/${id}`); fetchSorteos();
  };

  const toggleActive = async (s: Sorteo) => {
    await api.put(`/sorteos/${s.id}`, { isActive: !s.isActive }); fetchSorteos();
  };

  const viewParticipants = async (sorteoId: string, page = 1) => {
    setShowParticipants(sorteoId); setParticipantPage(page);
    try {
      const res: any = await api.get(`/sorteos/${sorteoId}/participants`, { params: { page, limit: 50 } });
      const data = res.data || res;
      setParticipants(data.items || []); setParticipantTotal(data.total || 0);
    } catch { setParticipants([]); }
  };

  const removeParticipant = async (sorteoId: string, pid: string) => {
    await api.delete(`/sorteos/${sorteoId}/participants/${pid}`);
    viewParticipants(sorteoId, participantPage);
  };

  const exportCsv = (s: Sorteo) => {
    if (!participants.length) return;
    const headers = s.fields.map(f => f.label);
    const rows = participants.map(p => s.fields.map(f => String((p.data as any)?.[f.name] || "")));
    const csv = "\uFEFF" + [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `sorteo-${s.slug}-participantes.csv`; a.click();
  };

  const addField = () => setFields([...fields, { name: `campo_${fields.length + 1}`, label: "", type: "text", required: false }]);
  const removeField = (i: number) => setFields(fields.filter((_, idx) => idx !== i));
  const updateField = (i: number, key: string, value: any) => {
    const arr = [...fields]; arr[i] = { ...arr[i], [key]: value }; setFields(arr);
  };

  return (
    <main className="flex-1 p-8 bg-slate-50 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sorteos</h1>
          <p className="text-sm text-slate-600">{sorteos.length} sorteos</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nuevo sorteo
        </button>
      </div>

      {showParticipants && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowParticipants(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-bold">Participantes</h2>
                <p className="text-sm text-slate-500">{participantTotal} registros</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { const s = sorteos.find(s => s.id === showParticipants); if (s) exportCsv(s); }} className="btn-secondary text-xs">Exportar CSV</button>
                <button onClick={() => setShowParticipants(null)} className="text-slate-400 hover:text-slate-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="overflow-auto flex-1 p-6">
              {participants.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Sin participantes aún</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-slate-500">
                    <th className="pb-2 font-medium">#</th>
                    {sorteos.find(s => s.id === showParticipants)?.fields.map(f => (
                      <th key={f.name} className="pb-2 font-medium">{f.label}</th>
                    ))}
                    <th className="pb-2 font-medium">Fecha</th>
                    <th className="pb-2 font-medium"></th>
                  </tr></thead>
                  <tbody>{participants.map((p, i) => (
                    <tr key={p.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 text-slate-400">{(participantPage - 1) * 50 + i + 1}</td>
                      {sorteos.find(s => s.id === showParticipants)?.fields.map(f => (
                        <td key={f.name} className="py-2">{String((p.data as any)?.[f.name] || "")}</td>
                      ))}
                      <td className="py-2 text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-2"><button onClick={() => removeParticipant(showParticipants!, p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
            {participantTotal > 50 && (
              <div className="flex justify-center gap-2 p-4 border-t">
                <button disabled={participantPage <= 1} onClick={() => viewParticipants(showParticipants!, participantPage - 1)} className="btn-secondary text-xs">Anterior</button>
                <span className="text-sm text-slate-500 self-center">Página {participantPage}</span>
                <button disabled={participants.length < 50} onClick={() => viewParticipants(showParticipants!, participantPage + 1)} className="btn-secondary text-xs">Siguiente</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b"><h2 className="text-lg font-bold">{editId ? "Editar" : "Nuevo"} Sorteo</h2></div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Título *</label><input className="input-field w-full" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Sorteo de Navidad" /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Slug (URL)</label><input className="input-field w-full" value={slug} onChange={e => setSlug(e.target.value)} placeholder="sorteo-navidad" /></div>
              </div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label><textarea className="input-field w-full" rows={2} value={description} onChange={e => setDescription(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Inicio (opcional)</label><input type="datetime-local" className="input-field w-full" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Fin (opcional)</label><input type="datetime-local" className="input-field w-full" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600">Campos del formulario</label>
                  <button onClick={addField} className="text-xs text-primary-600 hover:text-primary-700">+ Agregar campo</button>
                </div>
                <div className="space-y-2">
                  {fields.map((f, i) => (
                    <div key={i} className="flex gap-2 items-start bg-slate-50 rounded-lg p-2">
                      <input className="input-field flex-1 text-sm" placeholder="Nombre interno" value={f.name} onChange={e => updateField(i, "name", e.target.value.replace(/[^a-z0-9_]/g, "_"))} />
                      <input className="input-field flex-1 text-sm" placeholder="Etiqueta" value={f.label} onChange={e => updateField(i, "label", e.target.value)} />
                      <select className="input-field w-28 text-sm" value={f.type} onChange={e => updateField(i, "type", e.target.value)}>
                        {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                        <input type="checkbox" checked={f.required} onChange={e => updateField(i, "required", e.target.checked)} /> Req
                      </label>
                      <button onClick={() => removeField(i)} className="text-slate-400 hover:text-red-500 mt-2"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                <strong>URL pública:</strong> tu-dominio.com/{slug || "sorteo-slug"} — Los participantes verán el formulario con los campos configurados.
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancelar</button>
              <button onClick={handleSave} disabled={!title} className="btn-primary text-sm">{editId ? "Guardar" : "Crear sorteo"}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <p className="text-slate-500">Cargando...</p> : sorteos.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-500 mb-2">Sin sorteos</p>
          <p className="text-sm text-slate-400 mb-4">Crea sorteos personalizados para captar participantes</p>
          <button onClick={openCreate} className="btn-primary text-sm">Crear primer sorteo</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sorteos.map(s => (
            <div key={s.id} className="card p-5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {s.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">/{s.slug} · {s.fields?.length || 0} campos</p>
                <div className="flex gap-3 mt-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {s.participantCount} participantes</span>
                  <span>Creado: {new Date(s.createdAt).toLocaleDateString()}</span>
                  {s.endDate && <span>Fin: {new Date(s.endDate).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => viewParticipants(s.id)} className="btn-secondary text-xs inline-flex items-center gap-1" title="Ver participantes">
                  <Users className="h-3.5 w-3.5" /> {s.participantCount}
                </button>
                <button onClick={() => toggleActive(s)} className="btn-secondary text-xs" title={s.isActive ? "Desactivar" : "Activar"}>
                  {s.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => openEdit(s)} className="btn-secondary text-xs">Editar</button>
                <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
