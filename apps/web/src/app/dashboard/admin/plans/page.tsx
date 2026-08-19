"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface Plan { id: string; name: string; slug: string; description?: string; price: number; currency: string; billingInterval: string; maxUsers: number; maxSites: number; maxStorage: string | number; isActive: boolean; sortOrder: number; features: any; }

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState<Plan|null>(null);
  const [form, setForm] = useState({ name:"", slug:"", price:"0", maxUsers:"1", maxSites:"1", maxStorage:"50", description:"", billingInterval:"monthly" });

  useEffect(() => { fetchPlans(); }, []);
  const fetchPlans = async () => {
    try {
      const res: any = await api.get("/plans/admin/all");
      setPlans(res.data || res);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setForm({ name:"", slug:"", price:"0", maxUsers:"1", maxSites:"1", maxStorage:"50", description:"", billingInterval:"monthly" }); setShowModal(true); };
  const openEdit = (p: Plan) => { setEditing(p); setForm({ name:p.name, slug:p.slug, price:String(p.price), maxUsers:String(p.maxUsers), maxSites:String(p.maxSites), maxStorage:String(Math.round(Number(p.maxStorage)/1024/1024)), description:p.description||"", billingInterval:p.billingInterval }); setShowModal(true); };

  const save = async () => {
    const name = form.name.trim();
    const data = {
      name,
      slug: (form.slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).trim(),
      price: Number(form.price),
      maxUsers: Number(form.maxUsers),
      maxSites: Number(form.maxSites),
      maxStorage: Number(form.maxStorage) * 1024 * 1024,
      description: form.description,
      billingInterval: form.billingInterval,
    };
    try {
      if (editing) await api.put(`/plans/${editing.id}`, data); else await api.post("/plans", data);
      setShowModal(false); fetchPlans();
    } catch (err: any) { alert(err.response?.data?.message||"Error"); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await api.put(`/plans/${id}`, { isActive: !active });
      fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error");
    }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><p className="text-slate-500">Cargando planes...</p></div>;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold text-slate-900">Planes y Precios</h1><p className="text-sm text-slate-500 mt-1">{plans.length} planes configurados</p></div><button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 shadow-sm"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Nuevo plan</button></div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map(p => (
          <div key={p.id} className={`bg-white rounded-xl border-2 ${p.isActive?"border-slate-200":"border-slate-100 opacity-60"} p-6 relative`}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg text-slate-900">{p.name}</h3><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.isActive?"bg-green-50 text-green-700":"bg-red-50 text-red-700"}`}>{p.isActive?"Activo":"Inactivo"}</span></div>
            <p className="text-3xl font-bold text-primary-700">{Number(p.price)===0?"Gratis":formatCurrency(Number(p.price))}<span className="text-sm font-normal text-slate-400">/{p.billingInterval==="monthly"?"mes":"año"}</span></p>
            <div className="mt-5 space-y-2 text-sm text-slate-600"><div className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>Hasta {p.maxUsers} usuarios</div><div className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>Hasta {p.maxSites} sitios</div><div className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>{Math.round(Number(p.maxStorage)/1024/1024)} MB</div></div>
            {p.description && <p className="mt-4 text-xs text-slate-400">{p.description}</p>}
            <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
              <button onClick={() => openEdit(p)} className="flex-1 text-xs font-medium text-primary-600 hover:text-primary-700 py-1.5 rounded-lg hover:bg-primary-50 transition-colors">Editar</button>
              <button
                disabled={p.slug === "free"}
                onClick={() => toggleActive(p.id, p.isActive)}
                className={`text-xs font-medium py-1.5 px-3 rounded-lg transition-colors ${
                  p.slug === "free"
                    ? "text-slate-300 bg-slate-50 cursor-not-allowed"
                    : p.isActive
                      ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      : "text-green-600 hover:text-green-700 hover:bg-green-50"
                }`}
                title={p.slug === "free" ? "El plan Free no se puede desactivar" : (p.isActive ? "Desactivar" : "Activar")}
              >
                {p.isActive ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center px-4"><div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={()=>setShowModal(false)}/><div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"><h3 className="text-lg font-semibold text-slate-900 mb-4">{editing?"Editar plan":"Nuevo plan"}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label><input className="input-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div><label className="block text-xs font-medium text-slate-600 mb-1">Slug</label><input className="input-field" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-medium text-slate-600 mb-1">Precio</label><input className="input-field" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></div><div><label className="block text-xs font-medium text-slate-600 mb-1">Facturación</label><select className="input-field" value={form.billingInterval} onChange={e=>setForm({...form,billingInterval:e.target.value})}><option value="monthly">Mensual</option><option value="annual">Anual</option></select></div></div>
          <div className="grid grid-cols-3 gap-3"><div><label className="block text-xs font-medium text-slate-600 mb-1">Usuarios máx</label><input className="input-field" type="number" value={form.maxUsers} onChange={e=>setForm({...form,maxUsers:e.target.value})}/></div><div><label className="block text-xs font-medium text-slate-600 mb-1">Sitios máx</label><input className="input-field" type="number" value={form.maxSites} onChange={e=>setForm({...form,maxSites:e.target.value})}/></div><div><label className="block text-xs font-medium text-slate-600 mb-1">Storage (MB)</label><input className="input-field" type="number" value={form.maxStorage} onChange={e=>setForm({...form,maxStorage:e.target.value})}/></div></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label><textarea className="input-field" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
        </div>
        <div className="flex gap-3 mt-5"><button onClick={()=>setShowModal(false)} className="flex-1 btn-secondary text-sm">Cancelar</button><button onClick={save} className="flex-1 btn-primary text-sm">{editing?"Guardar cambios":"Crear plan"}</button></div></div></div>}
    </div>);
}
