"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Service { id: string; name: string; duration: number; price: string; color: string; isActive: boolean; }
interface Booking { id: string; customerName: string; customerEmail: string; startTime: string; endTime: string; status: string; service: { name: string; color: string }; }

export default function BookingsPage() {
  const [tab, setTab] = useState<"bookings" | "services">("bookings");
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "services") { const res: any = await api.get("/bookings/services"); setServices(res.data || res); }
      else { const res: any = await api.get("/bookings"); setBookings(res.data || res); }
    } catch {} finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createService = async () => {
    try { await api.post("/bookings/services", { ...form, price: Number(form.price), duration: Number(form.duration) }); setShowCreate(false); setForm({}); fetchData(); }
    catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const createBooking = async () => {
    try { await api.post("/bookings", { ...form, startTime: new Date(form.startTime).toISOString() }); setShowCreate(false); setForm({}); fetchData(); }
    catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const updateBookingStatus = async (id: string, status: string) => { await api.put(`/bookings/${id}/status`, { status }); fetchData(); };

  if (loading) return <div className="p-8 text-slate-500">Cargando...</div>;

  return (
      <main className="flex-1 p-8 bg-slate-50 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Reservas</h1>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">+ {tab === "services" ? "Servicio" : "Reserva"}</button>
        </div>

        <div className="flex gap-2 mb-6">
          {(["bookings", "services"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setShowCreate(false); }} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === t ? "bg-primary-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              {t === "bookings" ? "Reservas" : "Servicios"}
            </button>
          ))}
        </div>

        {showCreate && (tab === "services" ? (
          <div className="card mb-6 space-y-3"><h3 className="font-semibold">Nuevo servicio</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Nombre</label><input className="input-field" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Duración (min)</label><input className="input-field" type="number" defaultValue={30} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
              <div><label className="label">Precio</label><input className="input-field" type="number" onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><label className="label">Color</label><input className="input-field" type="color" defaultValue="#2563EB" onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
            </div>
            <div className="flex gap-2"><button onClick={createService} className="btn-primary text-sm">Crear</button><button onClick={() => setShowCreate(false)} className="btn-ghost text-sm">Cancelar</button></div>
          </div>
        ) : (
          <div className="card mb-6 space-y-3"><h3 className="font-semibold">Nueva reserva</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Servicio</label><select className="input-field" onChange={(e) => setForm({ ...form, serviceId: e.target.value })}><option value="">Seleccionar</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.duration}min)</option>)}</select></div>
              <div><label className="label">Cliente</label><input className="input-field" onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
              <div><label className="label">Email</label><input className="input-field" type="email" onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></div>
              <div><label className="label">Fecha y hora</label><input className="input-field" type="datetime-local" onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
            </div>
            <div className="flex gap-2"><button onClick={createBooking} className="btn-primary text-sm">Crear</button><button onClick={() => setShowCreate(false)} className="btn-ghost text-sm">Cancelar</button></div>
          </div>
        ))}

        {/* Services */}
        {tab === "services" && services.length === 0 ? <div className="card text-center py-8"><p className="text-slate-500">Sin servicios</p></div> : tab === "services" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map((s) => (
            <div key={s.id} className="card"><div className="flex items-center gap-2 mb-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} /><h3 className="font-semibold">{s.name}</h3></div>
              <p className="text-2xl font-bold text-primary-600">{Number(s.price) === 0 ? "Gratis" : formatCurrency(Number(s.price))}</p>
              <p className="text-xs text-slate-400 mt-2">{s.duration} min</p></div>
          ))}</div>
        )}

        {/* Bookings */}
        {tab === "bookings" && bookings.length === 0 ? <div className="card text-center py-8"><p className="text-slate-500">Sin reservas</p></div> : tab === "bookings" && (
          <div className="space-y-3">{bookings.map((b) => (
            <div key={b.id} className="card flex items-center justify-between">
              <div><div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: b.service?.color || "#2563EB" }} /><span className="font-semibold text-sm">{b.customerName}</span>
                <span className="text-xs bg-slate-100 rounded px-2 py-0.5">{b.service?.name}</span></div>
                <p className="text-xs text-slate-500 mt-1">{formatDate(b.startTime)} - {new Date(b.endTime).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</p></div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${b.status === "confirmed" ? "bg-green-50 text-green-700" : b.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>{b.status}</span>
                {b.status === "confirmed" && <button onClick={() => updateBookingStatus(b.id, "cancelled")} className="text-xs text-red-500">Cancelar</button>}
              </div>
            </div>
          ))}</div>
        )}
      </main>
    );
}
