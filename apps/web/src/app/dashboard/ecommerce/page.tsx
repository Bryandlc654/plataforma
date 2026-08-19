"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useConfirm } from "@/components/providers/confirm-provider";

interface Product { id: string; name: string; slug: string; price: string; stock: number; isActive: boolean; category: { name: string } | null; }
interface Category { id: string; name: string; slug: string; }
interface Order { id: string; status: string; totalAmount: string; customerName: string; customerEmail: string; discount: string; createdAt: string; items: Array<{ quantity: number; price: string; product: { name: string } }>; }
interface Coupon { id: string; code: string; type: string; value: string; usedCount: number; maxUses: number; isActive: boolean; expiresAt: string; }

export default function EcommercePage() {
  const [tab, setTab] = useState<"products" | "orders" | "coupons">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({});
  const { confirm } = useConfirm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "products") {
        const [pRes, cRes]: any[] = await Promise.all([api.get("/products"), api.get("/product-categories")]);
        setProducts(pRes.data || pRes); setCategories(cRes.data || cRes);
      } else if (tab === "orders") {
        const res: any = await api.get("/orders"); setOrders(res.data || res);
      } else {
        const res: any = await api.get("/coupons"); setCoupons(res.data || res);
      }
    } catch {} finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createProduct = async () => {
    try { await api.post("/products", { ...form, price: Number(form.price), stock: Number(form.stock) }); setShowCreate(false); setForm({}); fetchData(); }
    catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const createCoupon = async () => {
    try { await api.post("/coupons", { ...form, value: Number(form.value), maxUses: form.maxUses ? Number(form.maxUses) : null, type: form.type || "percentage" }); setShowCreate(false); setForm({}); fetchData(); }
    catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const updateOrderStatus = async (id: string, status: string) => { await api.put(`/orders/${id}/status`, { status }); fetchData(); };
  const deleteCoupon = async (id: string) => { if (!(await confirm("¿Eliminar cupón?"))) return; await api.delete(`/coupons/${id}`); fetchData(); };

  if (loading) return <div className="p-8 text-slate-500">Cargando...</div>;

  return (
      <main className="flex-1 p-8 bg-slate-50 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">E-commerce</h1>
          {tab !== "orders" && <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">+ {tab === "products" ? "Producto" : "Cupón"}</button>}
        </div>

        <div className="flex gap-2 mb-6">
          {(["products", "orders", "coupons"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setShowCreate(false); }} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === t ? "bg-primary-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              {t === "products" ? "Productos" : t === "orders" ? "Pedidos" : "Cupones"}
            </button>
          ))}
        </div>

        {showCreate && tab === "products" && (
          <div className="card mb-6 space-y-3"><h3 className="font-semibold">Nuevo producto</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Nombre</label><input className="input-field" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Slug</label><input className="input-field" onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div><label className="label">Precio</label><input className="input-field" type="number" onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><label className="label">Stock</label><input className="input-field" type="number" onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            </div>
            <div className="flex gap-2"><button onClick={createProduct} className="btn-primary text-sm">Crear</button><button onClick={() => setShowCreate(false)} className="btn-ghost text-sm">Cancelar</button></div>
          </div>
        )}

        {showCreate && tab === "coupons" && (
          <div className="card mb-6 space-y-3"><h3 className="font-semibold">Nuevo cupón</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Código</label><input className="input-field" onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
              <div><label className="label">Tipo</label><select className="input-field" onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="percentage">Porcentaje</option><option value="fixed">Monto fijo</option></select></div>
              <div><label className="label">Valor</label><input className="input-field" type="number" onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
              <div><label className="label">Usos máx.</label><input className="input-field" type="number" onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></div>
            </div>
            <div className="flex gap-2"><button onClick={createCoupon} className="btn-primary text-sm">Crear</button><button onClick={() => setShowCreate(false)} className="btn-ghost text-sm">Cancelar</button></div>
          </div>
        )}

        {/* Products */}
        {tab === "products" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="card"><div className="flex items-center justify-between mb-2"><h3 className="font-semibold">{p.name}</h3><span className={`rounded-full px-2 py-0.5 text-xs ${p.stock > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{p.stock > 0 ? `${p.stock} uds` : "Agotado"}</span></div>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(Number(p.price))}</p>
                <p className="text-xs text-slate-400 mt-2">{p.category?.name || "Sin categoría"}</p></div>
            ))}
          </div>
        )}

        {/* Orders */}
        {tab === "orders" && orders.length === 0 ? <div className="card text-center py-8"><p className="text-slate-500">Sin pedidos</p></div> : tab === "orders" && (
          <div className="space-y-3">{orders.map((o) => (
            <div key={o.id} className="card">
              <div className="flex items-center justify-between mb-3"><div><span className="font-semibold">{o.customerName || "Cliente"}</span><span className="text-xs text-slate-400 ml-2">{formatDate(o.createdAt)}</span></div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${o.status === "paid" ? "bg-green-50 text-green-700" : o.status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-slate-50 text-slate-700"}`}>{o.status}</span>
              </div>
              <div className="text-sm text-slate-600 space-y-1 mb-3">{o.items.map((i, idx) => <div key={idx}>{i.quantity}x {i.product.name} - {formatCurrency(Number(i.price))}</div>)}</div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <p className="font-bold text-lg">{formatCurrency(Number(o.totalAmount))}{Number(o.discount) > 0 && <span className="text-xs text-green-600 ml-2">(-{formatCurrency(Number(o.discount))})</span>}</p>
                {o.status === "pending" && <button onClick={() => updateOrderStatus(o.id, "paid")} className="btn-primary text-xs">Marcar pagado</button>}
              </div>
            </div>
          ))}</div>
        )}

        {/* Coupons */}
        {tab === "coupons" && coupons.length === 0 ? <div className="card text-center py-8"><p className="text-slate-500">Sin cupones</p></div> : tab === "coupons" && (
          <div className="space-y-3">{coupons.map((c) => (
            <div key={c.id} className="card flex items-center justify-between">
              <div><div className="flex items-center gap-2"><span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded text-sm">{c.code}</span>
                <span className="text-sm">{c.type === "percentage" ? `${c.value}%` : formatCurrency(Number(c.value))}</span></div>
                <p className="text-xs text-slate-400 mt-1">{c.usedCount}/{c.maxUses || "∞"} usos{c.expiresAt && ` · Expira ${formatDate(c.expiresAt)}`}</p></div>
              <button onClick={() => deleteCoupon(c.id)} className="text-xs text-red-500">Eliminar</button>
            </div>
          ))}</div>
        )}
      </main>
    );
}
