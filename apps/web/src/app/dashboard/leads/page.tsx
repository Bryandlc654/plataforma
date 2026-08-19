"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  data: any;
  createdAt: string;
}

const PAGE_SIZE = 25;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Lead | null>(null);
  const debounceRef = useRef<any>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res: any = await api.get("/leads", { params });
      const body = res?.data || res;
      setLeads(body?.items || body || []);
      setTotal(body?.total ?? leads.length);
    } catch { setLeads([]); setTotal(0); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res: any = await api.get("/leads/stats");
      setStats(res?.data || res);
    } catch {}
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); fetchLeads(); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const updateStatus = async (id: string, status: string) => {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    try { await api.put(`/leads/${id}/status`, { status }); fetchStats(); }
    catch { fetchLeads(); }
  };

  const bulkStatus = async (status: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setLeads((prev) => prev.map((l) => selected.has(l.id) ? { ...l, status } : l));
    setSelected(new Set());
    try { await api.put("/leads/bulk-status", { ids, status }); fetchStats(); }
    catch { fetchLeads(); }
  };

  const exportCsv = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/leads/export", { params, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res as any]));
      const a = document.createElement("a");
      a.href = url; a.download = "leads.csv";
      a.click(); window.URL.revokeObjectURL(url);
    } catch { alert("Error al exportar"); }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-50 text-blue-700", contacted: "bg-yellow-50 text-yellow-700",
      qualified: "bg-purple-50 text-purple-700", converted: "bg-green-50 text-green-700",
      archived: "bg-slate-50 text-slate-700",
    };
    return colors[status] || "bg-slate-50 text-slate-700";
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <main className="flex-1 p-8 bg-slate-50 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
        <button onClick={exportCsv} className="btn-secondary text-sm">Exportar CSV</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <p className="text-sm text-slate-600">Total</p>
            <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600">Últimos 30 días</p>
            <p className="text-2xl font-bold text-primary-600">{stats.last30Days}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600">Últimos 7 días</p>
            <p className="text-2xl font-bold text-green-600">{stats.last7Days}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600">Convertidos</p>
            <p className="text-2xl font-bold text-purple-600">{stats.byStatus?.find((s: any) => s.status === "converted")?.count || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre, email, teléfono..."
          className="input-field max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-44"
        >
          <option value="">Todos los estados</option>
          <option value="new">Nuevo</option>
          <option value="contacted">Contactado</option>
          <option value="qualified">Calificado</option>
          <option value="converted">Convertido</option>
          <option value="archived">Archivado</option>
        </select>
        <button onClick={() => { setPage(1); fetchLeads(); }} className="btn-secondary text-sm">Buscar</button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-slate-500 text-sm">Cargando...</p>
      ) : leads.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="font-semibold text-slate-900 mb-2">Sin leads</h3>
          <p className="text-sm text-slate-600">Los leads aparecerán cuando alguien envíe un formulario</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-primary-50/50 border-b border-primary-100">
              <span className="text-xs font-medium text-primary-700">{selected.size} seleccionado{selected.size>1?"s":""}</span>
              <select onChange={(e) => { if(e.target.value) { bulkStatus(e.target.value); } }} className="text-xs rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 text-primary-700">
                <option value="">Cambiar estado...</option>
                <option value="contacted">Contactado</option><option value="qualified">Calificado</option><option value="converted">Convertido</option><option value="archived">Archivado</option>
              </select>
              <button onClick={() => { const s = new Set(leads.map(l=>l.id)); setSelected(s.size === selected.size ? new Set() : s); }} className="text-xs text-primary-600 hover:text-primary-700">{selected.size === leads.length ? "Deseleccionar todo" : "Seleccionar todo"}</button>
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 text-slate-600 font-medium w-8"><input type="checkbox" onChange={() => { const s = new Set(leads.map(l=>l.id)); setSelected(selected.size === leads.length ? new Set() : s); }} checked={selected.size === leads.length && leads.length > 0} className="rounded border-slate-300"/></th>
                <th className="text-left py-3 px-4 text-slate-600 font-medium">Nombre</th>
                <th className="text-left py-3 px-4 text-slate-600 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-slate-600 font-medium">Teléfono</th>
                <th className="text-left py-3 px-4 text-slate-600 font-medium">Estado</th>
                <th className="text-left py-3 px-4 text-slate-600 font-medium">Origen</th>
                <th className="text-left py-3 px-4 text-slate-600 font-medium">Fecha</th>
                <th className="text-left py-3 px-4 text-slate-600 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-2"><input type="checkbox" checked={selected.has(lead.id)} onChange={() => { const s = new Set(selected); s.has(lead.id) ? s.delete(lead.id) : s.add(lead.id); setSelected(s); }} className="rounded border-slate-300"/></td>
                  <td className="py-3 px-4 font-medium">{lead.name || "-"}</td>
                  <td className="py-3 px-4">{lead.email || "-"}</td>
                  <td className="py-3 px-4">{lead.phone || "-"}</td>
                  <td className="py-3 px-4">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className={`text-xs rounded-full px-2 py-0.5 font-medium border border-slate-200 bg-white ${statusBadge(lead.status)}`}
                    >
                      <option value="new">Nuevo</option>
                      <option value="contacted">Contactado</option>
                      <option value="qualified">Calificado</option>
                      <option value="converted">Convertido</option>
                      <option value="archived">Archivado</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{lead.source || "-"}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(lead.createdAt)}</td>
                  <td className="py-3 px-4">
                    {lead.data && Object.keys(lead.data as object).length > 0 && (
                      <button
                        onClick={() => setDetail(lead)}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        Ver datos
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">{total} resultado{total !== 1 ? "s" : ""} · Página {safePage} de {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary text-xs disabled:opacity-40">← Anterior</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary text-xs disabled:opacity-40">Siguiente →</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-900">{detail.name || "Lead"}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{detail.email || "-"} · {formatDate(detail.createdAt)}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Datos del formulario</p>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {Object.entries(detail.data as Record<string, any>).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-4 px-4 py-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-1/3">{key}</span>
                      <span className="text-sm text-slate-800 flex-1 break-words">{String(value ?? "-")}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Teléfono</p>
                  <p className="text-sm text-slate-800">{detail.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Origen</p>
                  <p className="text-sm text-slate-800">{detail.source || "-"}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(detail.status)}`}>{detail.status}</span>
              <button
                onClick={() => { setDetail(null); updateStatus(detail.id, "contacted"); }}
                className="btn-primary text-xs"
              >
                Marcar como contactado
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
