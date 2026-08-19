"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Tenant {
  id: string; name: string; slug: string; subdomain: string;
  isActive: boolean; planId: string | null; plan: { id: string; name: string; slug: string } | null;
  _count: { userTenants: number; sites: number };
  createdAt: string;
}

interface Plan { id: string; name: string; slug: string; }

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filtered, setFiltered] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ id: string; action: string } | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", subdomain: "", planId: "" });

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let list = tenants;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
    }
    if (statusFilter === "active") list = list.filter((t) => t.isActive);
    if (statusFilter === "suspended") list = list.filter((t) => !t.isActive);
    setFiltered(list);
  }, [search, statusFilter, tenants]);

  const fetchData = async () => {
    try {
      const [tRes, pRes]: any[] = await Promise.all([api.get("/tenants/admin/all"), api.get("/plans")]);
      setTenants(tRes.data || tRes);
      setPlans((pRes.data || pRes).filter((p: any) => p.slug !== "free"));
    } catch {} finally { setLoading(false); }
  };

  const submitTenant = async () => {
    if (!form.name.trim()) return;
    try {
      const payload: any = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        subdomain: form.subdomain.trim() || undefined,
        planId: editingId ? form.planId : (form.planId || undefined),
      };

      if (editingId) {
        await api.put(`/tenants/admin/${editingId}`, payload);
      } else {
        await api.post("/tenants/admin", payload);
      }

      setShowModal(false);
      setEditing(false);
      setEditingId(null);
      setForm({ name: "", slug: "", subdomain: "", planId: "" });
      fetchData();
    } catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const confirmAction = async () => {
    if (!showConfirm) return;
    const { id, action } = showConfirm;
    try {
      if (action === "suspend") await api.post(`/tenants/admin/${id}/suspend`);
      else if (action === "reactivate") await api.post(`/tenants/admin/${id}/reactivate`);
      else if (action === "delete") await api.delete(`/tenants/admin/${id}`);
      setShowConfirm(null); setSelected(null); fetchData();
    } catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const changePlan = async (id: string, planId: string) => {
    try {
      await api.post(`/tenants/admin/${id}/change-plan`, { planId: planId || "" });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error");
    }
  };

  const openCreate = () => {
    setForm({ name: "", slug: "", subdomain: "", planId: "" });
    setEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (t: Tenant) => {
    setForm({
      name: t.name || "",
      slug: t.slug || "",
      subdomain: t.subdomain || "",
      planId: t.plan?.slug === "free" ? "" : (t.planId || ""),
    });
    setEditing(true);
    setEditingId(t.id);
    setShowModal(true);
  };

  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.isActive).length,
    suspended: tenants.filter((t) => !t.isActive).length,
    withPlan: tenants.filter((t) => t.plan && t.plan.slug !== "free").length,
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Cargando tenants...</p>
        </div>
      </div>
);
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <p className="text-sm text-slate-500 mt-1">Administración de negocios en la plataforma</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo tenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total, color: "bg-primary-50 text-primary-700" },
          { label: "Activos", value: stats.active, color: "bg-green-50 text-green-700" },
          { label: "Suspendidos", value: stats.suspended, color: "bg-red-50 text-red-700" },
          { label: "Con plan", value: stats.withPlan, color: "bg-purple-50 text-purple-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color.split(" ")[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            placeholder="Buscar por nombre o slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["", "active", "suspended"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 text-xs font-medium rounded-xl border transition-all ${
                statusFilter === s
                  ? "bg-primary-50 text-primary-700 border-primary-200"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {s === "" ? "Todos" : s === "active" ? "Activos" : "Suspendidos"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="text-center py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuarios</th>
                <th className="text-center py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sitios</th>
                <th className="text-center py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="text-center py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-slate-400 text-sm">No se encontraron tenants</p>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-3.5 px-4">
                      <button onClick={() => setSelected(t)} className="text-left hover:text-primary-600 transition-colors">
                        <p className="font-medium text-slate-900">{t.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.subdomain || t.slug}</p>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={t.plan?.slug === "free" || !t.plan ? "" : t.plan.id}
                        onChange={(e) => changePlan(t.id, e.target.value)}
                        className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                      >
                        <option value="">Free</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {t._count?.userTenants || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600">{t._count?.sites || 0}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        t.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${t.isActive ? "bg-green-500" : "bg-red-500"}`} />
                        {t.isActive ? "Activo" : "Suspendido"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelected(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Ver detalles"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setShowConfirm({ id: t.id, action: t.isActive ? "suspend" : "reactivate" })}
                          className={`p-1.5 rounded-lg transition-colors ${
                            t.isActive
                              ? "text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                              : "text-green-500 hover:text-green-700 hover:bg-green-50"
                          }`}
                          title={t.isActive ? "Suspender" : "Reactivar"}
                        >
                          {t.isActive ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => setShowConfirm({ id: t.id, action: "delete" })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-slide-left">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-2">Información</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Slug</span><span className="font-medium text-slate-700">{selected.slug}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Subdominio</span><span className="font-medium text-slate-700">{selected.subdomain || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className="font-medium text-slate-700">{selected.plan?.name || "Free"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Usuarios</span><span className="font-medium text-slate-700">{selected._count?.userTenants || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Sitios</span><span className="font-medium text-slate-700">{selected._count?.sites || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Creado</span><span className="font-medium text-slate-700">{formatDate(selected.createdAt)}</span></div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estado</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${selected.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{selected.isActive ? "Activo" : "Suspendido"}</span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-3">Acciones rápidas</p>
                <div className="space-y-2">
                  <button
                    onClick={() => { openEdit(selected); setSelected(null); }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Editar tenant
                  </button>
                  <button
                    onClick={() => { setShowConfirm({ id: selected.id, action: selected.isActive ? "suspend" : "reactivate" }); setSelected(null); }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      selected.isActive
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {selected.isActive ? "Suspender tenant" : "Reactivar tenant"}
                  </button>
                  <button
                    onClick={() => { setShowConfirm({ id: selected.id, action: "delete" }); setSelected(null); }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                  >
                    Eliminar tenant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3 ${
                showConfirm.action === "delete" ? "bg-red-100" : "bg-amber-100"
              }`}>
                {showConfirm.action === "delete" ? (
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h4 className="text-lg font-semibold text-slate-900">
                {showConfirm.action === "delete" ? "Eliminar tenant" : showConfirm.action === "suspend" ? "Suspender tenant" : "Reactivar tenant"}
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                {showConfirm.action === "delete"
                  ? "Esta acción no se puede deshacer. El tenant será eliminado permanentemente."
                  : showConfirm.action === "suspend"
                  ? "El tenant será suspendido y sus usuarios no podrán acceder."
                  : "El tenant será reactivado y sus usuarios podrán acceder nuevamente."}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 btn-secondary text-sm">Cancelar</button>
              <button
                onClick={confirmAction}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
                  showConfirm.action === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setShowModal(false); setEditing(false); setEditingId(null); }} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">{editing ? "Editar tenant" : "Nuevo tenant"}</h3>
              <button onClick={() => { setShowModal(false); setEditing(false); setEditingId(null); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del negocio</label>
                <input className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="Ej: Restaurante El Buen Sabor" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Slug</label>
                  <input className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="mi-negocio" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Subdominio</label>
                  <input className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="mi-negocio" value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Plan inicial</label>
                <select className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
                  <option value="">Free</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditing(false); setEditingId(null); }} className="flex-1 btn-secondary text-sm">Cancelar</button>
              <button onClick={submitTenant} className="flex-1 btn-primary text-sm">{editing ? "Guardar cambios" : "Crear tenant"}</button>
            </div>
          </div>
        </div>
      )}
  </div>
    );
}
