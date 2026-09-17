"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useConfirm } from "@/components/providers/confirm-provider";

interface Product { id: string; name: string; slug: string; price: string; comparePrice?: string | null; stock: number; isActive: boolean; isFeatured: boolean; description?: string | null; images?: any; categoryId?: string | null; category: { id: string; name: string } | null; }
interface Category { id: string; name: string; slug: string; }
interface Order { id: string; status: string; totalAmount: string; customerName: string; customerEmail: string; customerPhone?: string; customerAddress?: string; discount: string; paymentMethod?: string; paymentReference?: string; notes?: string; createdAt: string; items: Array<{ id: string; quantity: number; price: string; product: { id: string; name: string; images?: any } }>; }
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
  const [tab, setTab] = useState<"products" | "orders" | "coupons" | "payments">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [payForm, setPayForm] = useState<any>(null);
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
      } else if (tab === "payments") {
        const res: any = await api.get("/payments/config");
        const cfg = res.data || res || {};
        const p = cfg?.providers?.paypal || {};
        setPayForm({ defaultMethod: cfg?.defaultMethod || "cod", paypalEnabled: !!p.enabled, paypalMode: p.mode || "sandbox", paypalClientId: p.clientId || "", hasSecret: !!p.hasSecret, paypalSecret: "" });
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

  const savePayConfig = async () => {
    if (!payForm) return;
    const body: any = {
      defaultMethod: payForm.defaultMethod,
      providers: { paypal: { enabled: !!payForm.paypalEnabled, mode: payForm.paypalMode, clientId: (payForm.paypalClientId || "").trim() } },
    };
    if (payForm.paypalSecret?.trim()) body.providers.paypal.secret = payForm.paypalSecret.trim();
    try { await api.put("/payments/config", body); fetchData(); alert("Configuración de pagos guardada."); }
    catch (err: any) { alert(err.response?.data?.message || "Error al guardar la configuración de pagos"); }
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
          {(["products", "orders", "coupons", "payments"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setShowCreate(false); }} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === t ? "bg-primary-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              {t === "products" ? "Productos" : t === "orders" ? "Pedidos" : t === "coupons" ? "Cupones" : "Pagos"}
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
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Destacado (badge &quot;Nuevo&quot;)</label>
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
              <div className="flex items-center justify-between mb-3"><div><span className="font-semibold">{o.customerName || "Cliente"}</span><span className="text-xs text-slate-400 ml-2">{formatDate(o.createdAt)}</span>{o.customerPhone ? <span className="text-xs text-slate-400 ml-2">· {o.customerPhone}</span> : null}</div>
                <div className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${o.status === "paid" ? "bg-green-50 text-green-700" : o.status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-slate-50 text-slate-700"}`}>{o.status}</span><span className="text-[10px] uppercase tracking-wide bg-black text-white rounded-full px-2 py-0.5">{o.paymentMethod === "cod" ? "Contra entrega" : o.paymentMethod === "paypal" ? "PayPal" : o.paymentMethod || "—"}</span></div>
              </div>
<div className="text-sm space-y-2">{o.items.map((i, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {(() => {
                    const imgs = i.product?.images;
                    const url = typeof imgs === "string" ? imgs : Array.isArray(imgs) && imgs[0] ? (typeof imgs[0] === "string" ? imgs[0] : imgs[0]?.url || "") : "";
                    return url ? <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100"><img src={url} alt={i.product?.name || ""} className="w-full h-full object-cover" /></div> : <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 grid place-items-center shrink-0 text-sm font-bold">{String(i.product?.name || "?").charAt(0)}</div>;
                  })()}
                  <div className="flex-1 min-w-0"><p className="font-medium truncate">{i.product?.name}</p></div>
                  <div className="text-right shrink-0"><p className="text-slate-500 text-xs">{i.quantity} × {formatCurrency(Number(i.price))}</p><p className="font-semibold">{formatCurrency(Number(i.price) * i.quantity)}</p></div>
                </div>
              ))}
              {o.customerEmail && <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.9 5.26a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg><span className="truncate">{o.customerEmail}</span></div>}
                {o.notes && <p className="text-xs text-slate-400 whitespace-pre-line pt-1 border-t border-slate-100">{o.notes}</p>}
              </div>
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

        {/* Payments */}
        {tab === "payments" && (
          <div className="max-w-3xl space-y-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Pago contra entrega</h3>
                  <p className="text-sm text-slate-500 mt-1">Activado por defecto. El cliente paga en efectivo al recibir el pedido en la dirección indicada. No requiere credenciales.</p>
                </div>
                <span className="rounded-full bg-green-50 text-green-700 text-xs px-2 py-0.5">Siempre activo</span>
              </div>
            </div>

            <div className="card space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">PayPal</h3>
                  <p className="text-sm text-slate-500 mt-1">Acepta pagos con PayPal en el checkout. Para activarlo obtén tus credenciales en <span className="font-medium text-slate-700">PayPal Developer</span> (aplicación tipo <span className="font-medium text-slate-700">Business / API REST</span>): copia el <span className="font-medium text-slate-700">Client ID</span> y el <span className="font-medium text-slate-700">Secret</span>. Éstas vinculan tu cuenta de PayPal a este negocio.</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 whitespace-nowrap">
                  <input type="checkbox" checked={payForm?.paypalEnabled || false} onChange={(e) => setPayForm({ ...payForm, paypalEnabled: e.target.checked })} className="h-4 w-4" />
                  Activar PayPal
                </label>
              </div>

              {(!payForm?.paypalEnabled) && <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">PayPal desactivado. El checkout mostrará solo &quot;Pago contra entrega&quot;.</p>}

              {payForm?.paypalEnabled && (
                <div className="grid sm:grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <label className="label">Modo</label>
                    <select className="input-field" value={payForm.paypalMode} onChange={(e) => setPayForm({ ...payForm, paypalMode: e.target.value })}>
                      <option value="sandbox">Sandbox (pruebas)</option>
                      <option value="live">Producción (Live)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Client ID</label>
                    <input className="input-field" value={payForm.paypalClientId || ""} onChange={(e) => setPayForm({ ...payForm, paypalClientId: e.target.value })} placeholder="AaB...TuClientId" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Secret</label>
                    <input className="input-field" type="password" value={payForm.paypalSecret || ""} onChange={(e) => setPayForm({ ...payForm, paypalSecret: e.target.value })} placeholder={payForm.hasSecret ? "•••••••• (dejar vacío para conservar)" : "Tu secret"} />
                    <p className="text-xs text-slate-400 mt-1">{payForm.hasSecret ? "Ya tienes un secret guardado. Déjalo vacío si no quieres cambiarlo." : "El secret no se muestra de nuevo; se guarda cifrado en tu configuración."}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <label className="label">Método de pago preseleccionado en el checkout</label>
              <select className="input-field" value={payForm?.defaultMethod || "cod"} onChange={(e) => setPayForm({ ...payForm, defaultMethod: e.target.value })}>
                <option value="cod">Pago contra entrega</option>
                {payForm?.paypalEnabled && <option value="paypal">PayPal</option>}
              </select>
              <p className="text-xs text-slate-400 mt-1">El cliente siempre puede elegir otro método disponible.</p>
            </div>

            <div className="flex gap-2">
              <button onClick={savePayConfig} className="btn-primary text-sm">Guardar cambios</button>
            </div>
          </div>
        )}
      </main>
    );
}