"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate } from "@/lib/utils";

interface Ticket { id: string; subject: string; description: string; priority: string; status: string; category: string; images?: string[]; createdAt: string; tenant: { name: string } | null; user: { firstName: string; lastName: string; email: string } | null; _count: { replies: number }; }
interface TicketDetail extends Ticket { replies: Array<{ id: string; message: string; isStaff: boolean; images?: string[]; createdAt: string; user: { firstName: string; lastName: string } }>; }

export default function SupportPage() {
  const { user, tenantId } = useAuthStore();
  const isStaff = user?.roles?.includes("support") || user?.roles?.includes("super_admin");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTicket, setActiveTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "low", category: "general" });
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filter) params.status = filter;
      const res: any = await api.get("/tickets", { params });
      setTickets(res.data?.items || res.items || []);
    } catch {} finally { setLoading(false); }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try { const res: any = await api.get("/tickets/stats"); setStats(res.data || res); } catch {}
  }, []);

  useEffect(() => { fetchTickets(); fetchStats(); }, [fetchTickets, fetchStats]);

  const fetchTicket = async (id: string) => {
    try { const res: any = await api.get(`/tickets/${id}`); setActiveTicket(res.data || res); }
    catch { setActiveTicket(null); }
  };

  const createTicket = async () => {
    if (!form.subject.trim() || !form.description.trim()) { alert("Completa el asunto y la descripción"); return; }
    setUploading(true);
    try {
      let uploadedImages: string[] = [];
      if (images.length > 0) {
        for (const file of images) {
          const formData = new FormData();
          formData.append("file", file);
          const res: any = await api.post("/media/upload?folder=tickets", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          if (res.data?.url) uploadedImages.push(res.data.url);
          else if (res.url) uploadedImages.push(res.url);
        }
      }
      await api.post("/tickets", { ...form, images: uploadedImages });
      setShowCreate(false);
      setForm({ subject: "", description: "", priority: "low", category: "general" });
      setImages([]);
      fetchTickets();
      fetchStats();
    }
    catch (err: any) { alert(err.response?.data?.message || "Error"); }
    finally { setUploading(false); }
  };

  const changeStatus = async (status: string) => {
    if (!activeTicket) return;
    try { await api.put(`/tickets/${activeTicket.id}/status`, { status }); setActiveTicket({ ...activeTicket, status }); fetchTickets(); }
    catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeTicket) return;
    try { await api.post(`/tickets/${activeTicket.id}/reply`, { message: reply }); setReply(""); fetchTicket(activeTicket.id); fetchTickets(); }
    catch { alert("Error"); }
  };

  const statusLabel = (s: string) => ({ open: "Abierto", in_progress: "En progreso", closed: "Cerrado" }[s] || s);
  const priorityLabel = (p: string) => ({ low: "Baja", medium: "Media", high: "Alta", urgent: "Urgente" }[p] || p);
  const priorityColor = (p: string) => ({ low: "bg-slate-50 text-slate-700", medium: "bg-blue-50 text-blue-700", high: "bg-amber-50 text-amber-700", urgent: "bg-red-50 text-red-700" }[p] || "");
  const statusColor = (s: string) => ({ open: "bg-blue-50 text-blue-700", in_progress: "bg-yellow-50 text-yellow-700", closed: "bg-green-50 text-green-700" }[s] || "");

  return (
      <main className="flex-1 p-8 bg-slate-50 overflow-auto">
        {activeTicket ? (
          <div>
            <button onClick={() => { setActiveTicket(null); fetchTickets(); }} className="text-sm text-primary-600 mb-4 block">← Volver</button>
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-3">
                <div><h2 className="font-semibold text-lg text-slate-900">{activeTicket.subject}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeTicket.user?.firstName} {activeTicket.user?.lastName}
                    {activeTicket.tenant && ` · ${activeTicket.tenant.name}`} · {formatDate(activeTicket.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(activeTicket.status)}`}>{statusLabel(activeTicket.status)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor(activeTicket.priority)}`}>{priorityLabel(activeTicket.priority)}</span>
                  </div>
                  {isStaff && (
                    <div className="flex gap-2">
                      {activeTicket.status !== "open" && <button onClick={() => changeStatus("open")} className="btn-ghost text-xs py-1 px-2">Abrir</button>}
                      {activeTicket.status !== "in_progress" && <button onClick={() => changeStatus("in_progress")} className="btn-ghost text-xs py-1 px-2">En progreso</button>}
                      {activeTicket.status !== "closed" && <button onClick={() => changeStatus("closed")} className="btn-secondary text-xs py-1 px-2">Cerrar</button>}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{activeTicket.description}</p>
              {activeTicket.images && activeTicket.images.length > 0 && (
                <div className="flex gap-3 flex-wrap mt-4 border-t pt-4 border-slate-100">
                  {activeTicket.images.map((img: string, i: number) => (
                    <img key={i} src={img} alt="Adjunto" className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
                  ))}
                </div>
              )}
            </div>

            {/* Replies */}
            <div className="space-y-3 mb-6">
              {activeTicket.replies.map((r) => (
                <div key={r.id} className={`p-4 rounded-lg ${r.isStaff ? "bg-blue-50 border border-blue-100 ml-4" : "bg-slate-100 mr-4"}`}>
                  <div className="flex items-center gap-2 mb-1"><span className="text-xs font-medium text-slate-700">{r.user.firstName} {r.user.lastName}</span>{r.isStaff && <span className="text-xs bg-blue-200 text-blue-700 rounded px-1.5 py-0.5">Staff</span>}<span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span></div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
            </div>

            {/* Reply form */}
            {activeTicket.status !== "closed" && (
              <div className="card flex gap-2">
                <textarea className="input-field flex-1" rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Escribe una respuesta..." />
                <button onClick={sendReply} className="btn-primary self-end">Enviar</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div><h1 className="text-2xl font-bold text-slate-900">Soporte</h1><p className="text-sm text-slate-600">{isStaff ? "Panel de soporte técnico" : "Tus tickets de soporte"}</p></div>
              <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">+ Nuevo ticket</button>
            </div>

            {stats && isStaff && (
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="card py-3"><p className="text-xs text-slate-600">Abiertos</p><p className="text-xl font-bold text-blue-600">{stats.open}</p></div>
                <div className="card py-3"><p className="text-xs text-slate-600">En progreso</p><p className="text-xl font-bold text-amber-600">{stats.inProgress}</p></div>
                <div className="card py-3"><p className="text-xs text-slate-600">Cerrados</p><p className="text-xl font-bold text-green-600">{stats.closed}</p></div>
                <div className="card py-3"><p className="text-xs text-slate-600">Alta prioridad</p><p className="text-xl font-bold text-red-600">{stats.highPriority}</p></div>
              </div>
            )}

            {showCreate && (
              <div className="card mb-6 space-y-3">
                <h3 className="font-semibold">Nuevo ticket</h3>
                <div><label className="label">Asunto</label><input className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
                <div><label className="label">Descripción</label><textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="label">Prioridad</label><select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></div>
                  <div><label className="label">Categoría</label><select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="general">General</option><option value="technical">Técnico</option><option value="billing">Facturación</option></select></div>
                </div>
                <div>
                  <label className="label">Imágenes adjuntas (opcional)</label>
                  <input type="file" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files || []))} className="input-field text-sm" />
                  {images.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {images.map((file, i) => (
                        <div key={i} className="text-xs bg-slate-100 p-1.5 rounded text-slate-600">{file.name}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2"><button onClick={createTicket} disabled={uploading} className="btn-primary text-sm">{uploading ? "Subiendo..." : "Crear"}</button><button onClick={() => { setShowCreate(false); setImages([]); }} className="btn-ghost text-sm">Cancelar</button></div>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              {["", "open", "in_progress", "closed"].map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium ${filter === s ? "bg-primary-50 text-primary-700" : "bg-slate-100 text-slate-600"}`}>{s || "Todos"}</button>
              ))}
            </div>

            {tickets.length === 0 ? <div className="card text-center py-8"><p className="text-slate-500">Sin tickets</p></div> : (
              <div className="space-y-3">{tickets.map((t) => (
                <div key={t.id} className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => fetchTicket(t.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1"><h3 className="font-medium text-slate-900">{t.subject}</h3><p className="text-xs text-slate-500 mt-1">{t.user?.firstName} {t.user?.lastName}{t.tenant && ` · ${t.tenant.name}`} · {t._count.replies} respuestas</p></div>
                    <div className="flex items-center gap-2 ml-4"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor(t.priority)}`}>{priorityLabel(t.priority)}</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(t.status)}`}>{statusLabel(t.status)}</span></div>
                  </div>
                </div>
              ))}</div>
            )}
          </>
        )}
      </main>
    );
}
