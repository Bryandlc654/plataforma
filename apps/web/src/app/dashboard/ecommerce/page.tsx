"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useConfirm } from "@/components/providers/confirm-provider";

interface Product { id: string; name: string; slug: string; price: string; comparePrice?: string | null; stock: number; isActive: boolean; isFeatured: boolean; description?: string | null; images?: any; categoryId?: string | null; category: { id: string; name: string } | null; }
interface Category { id: string; name: string; slug: string; }
interface Order { id: string; status: string; totalAmount: string; customerName: string; customerEmail: string; discount: string; createdAt: string; items: Array<{ quantity: number; price: string; product: { name: string } }>; }
interface Coupon { id: string; code: string; type: string; value: string; usedCount: number; maxUses: number; isActive: boolean; expiresAt: string; }

function firstImage(images: any): string {
  if (typeof images === "string") return images;
  if (Array.isArray(images) && images.length) {
    const f = images[0];
    if (typeof f === "string") return f;
    if (f && typeof f === "object") return f.url || f.src || "";
  }
  if (images && typeof images === "object") return images.url || images.src || "";
  return "";
}

export default function EcommercePage() {
  const [tab, setTab] = useState<"products" | "orders" | "coupons">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const resetForm = () => { setForm({}); setShowCreate(false); setEditingId(null); };

  const saveProduct = async () => {
    const payload: any = { ...form };
    if (payload.price !== undefined) payload.price = Number(payload.price) || 0;
    if (payload.comparePrice) payload.comparePrice = Number(payload.comparePrice);
    if (payload.stock !== undefined) payload.stock = Number(payload.stock) || 0;
    if (payload.isActive === undefined) payload.isActive = true;
    if (payload.categoryId === "") payload.categoryId = null;
    if (payload.name && !payload.slug) {
      payload.slug = payload.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    if (payload.slug === "") payload.slug = `producto-${Date.now()}`;
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post("/products", payload);
      }
      resetForm();
      fetchData();
    } catch (err: any) { alert(err.response?.data?.message || "Error al guardar producto"); }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name, slug: p.slug, price: p.price, comparePrice: p.comparePrice ?? "",
      stock: p.stock, description: p.description || "", images: firstImage(p.images),
      categoryId: p.categoryId || "", isActive: p.isActive,
    });
    setShowCreate(true);
  };

  const toggleActive = async (p: Product) => {
    try { await api.put(`/products/${p.id}`, { isActive: !p.isActive }); fetchData(); }
    catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const toggleFeatured = async (p: Product) => {
    try { await api.put(`/products/${p.id}`, { isFeatured: !p.isFeatured }); fetchData(); }
    catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const deleteProduct = async (p: Product) => {
    if (!(await confirm(`¿Eliminar "${p.name}"?`))) return;
    try { await api.delete(`/products/${p.id}`); fetchData(); }
    catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const addCategory = async () => {
    const name = window.prompt("Nombre de la categoría");
    if (!name?.trim()) return;
    try { await api.post("/product-categories", { name: name.trim() }); fetchData(); }
    catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const createCoupon = async () => {
    try { await api.post("/coupons", { ...form, value: Number(form.value), maxUses: form.maxUses ? Number(form.maxUses) : null, type: form.type || "percentage" }); resetForm(); fetchData(); }
    catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const updateOrderStatus = async (id: string, status: string) => { await api.put(`/orders/${id}/status`, { status }); fetchData(); };
  const deleteCoupon = async (id: string) => { if (!(await confirm("¿Eliminar cupón?"))) return; await api.delete(`/coupons/${id}`); fetchData(); };

  if (loading) return <div className="p-8 animate-pulse space-y-4"><div className="h-8 w-56 rounded-lg bg-slate-200" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_,i)=><div key={i} className="h-40 rounded-xl bg-slate-200" />)}</div></div>;

  const inputCls = "input-field";
  const labelCls = "label";

  return (
      <main className="flex-1 p-8 bg-slate-50 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">E-commerce</h1>
          {tab !== "orders" && <button onClick={() => { if (tab === "products") resetForm(); setShowCreate(!showCreate); }} className="btn-primary text-sm">+ {tab === "products" ? "Producto" : "Cupón"}</button>}
        </div>

        <div className="flex gap-2 mb-6">
          {(["products", "orders", "coupons"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setShowCreate(false); }} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === t ? "bg-primary-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              {t === "products" ? "Productos" : t === "orders" ? "Pedidos" : "Cupones"}
            </button>
          ))}
        </div>

        {showCreate && tab === "products" && (
          <div className="card mb-6 space-y-3"><div className="flex items-center justify-between">
            <h3 className="font-semibold">{editingId ? "Editar producto" : "Nuevo producto"}</h3>
            <button onClick={resetForm} className="text-xs text-slate-400 hover:text-slate-600">Cerrar</button>
          </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className={labelCls}>Nombre</label><input className={inputCls} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Camiseta Oversize" /></div>
              <div><label className={labelCls}>Slug</label><input className={inputCls} value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="camiseta-oversize" /></div>
              <div><label className={labelCls}>Categoría</label><div className="flex gap-2">
                <select className={inputCls} value={form.categoryId || ""} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={addCategory} className="btn-ghost text-sm whitespace-nowrap">+ Nueva</button>
              </div></div>
              <div><label className={labelCls}>Precio ($)</label><input className={inputCls} type="number" step="0.01" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><label className={labelCls}>Precio anterior (tachado, $)</label><input className={inputCls} type="number" step="0.01" value={form.comparePrice || ""} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} placeholder="95.00" /></div>
              <div><label className={labelCls}>Stock</label><input className={inputCls} type="number" value={form.stock ?? ""} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>URL de imagen</label><input className={inputCls} value={form.images || ""} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="https://..." /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Descripción</label><textarea className={inputCls} rows={2} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Activo</label>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Destacado (badge "Nuevo")</label>
            </div>
            <div className="flex gap-2"><button onClick={saveProduct} className="btn-primary text-sm">{editingId ? "Guardar cambios" : "Crear"}</button><button onClick={resetForm} className="btn-ghost text-sm">Cancelar</button></div>
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
            <div className="flex gap-2"><button onClick={createCoupon} className="btn-primary text-sm">Crear</button><button onClick={() => { setShowCreate(false); setForm({}); }} className="btn-ghost text-sm">Cancelar</button></div>
          </div>
        )}

        {/* Products */}
        {tab === "products" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const img = firstImage(p.images);
              return (
              <div key={p.id} className="card overflow-hidden">
                <div className="relative h-40 bg-slate-100">
                  {img ? <img src={img} alt={p.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-slate-300 text-sm">Sin imagen</div>}
                  <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs ${p.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{p.isActive ? "Activo" : "Inactivo"}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{p.category?.name || "Sin categoría"}{p.stock > 0 ? ` · ${p.stock} uds` : " · Agotado"}</p>
                    </div>
                    {p.isFeatured && <span className="rounded bg-black text-white text-[10px] font-bold px-1.5 py-0.5 uppercase shrink-0">Nuevo</span>}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-primary-600">{formatCurrency(Number(p.price))}</span>
                    {Number(p.comparePrice) > Number(p.price) && <span className="text-sm text-slate-400 line-through">{formatCurrency(Number(p.comparePrice))}</span>}
                  </div>
                  {p.description && <p className="mt-2 text-xs text-slate-500 line-clamp-2">{p.description}</p>}
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => startEdit(p)} className="btn-ghost text-xs">Editar</button>
                    <button onClick={() => toggleFeatured(p)} className="btn-ghost text-xs">{p.isFeatured ? "Quitar destacado" : "Destacar"}</button>
                    <button onClick={() => toggleActive(p)} className="btn-ghost text-xs">{p.isActive ? "Desactivar" : "Activar"}</button>
                    <button onClick={() => deleteProduct(p)} className="text-xs text-red-500 ml-auto">Eliminar</button>
                  </div>
                </div>
              </div>
            );})}
            {products.length === 0 && <div className="card text-center py-10 col-span-full"><p className="text-slate-500 mb-2">Sin productos todavía. Crea tu primer producto y se mostrará automáticamente en el sitio publicado.</p><Link href="/dashboard/media" className="text-xs text-primary-600">Subir imágenes en Archivos Media</Link></div>}
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