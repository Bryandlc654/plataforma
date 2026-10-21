"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useConfirm } from "@/components/providers/confirm-provider";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  comparePrice?: string | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  description?: string | null;
  images?: any;
  categoryId?: string | null;
  category: { id: string; name: string } | null;
  createdAt?: string;
}
interface Category { id: string; name: string; slug: string; }
interface Order {
  id: string;
  status: string;
  totalAmount: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  discount: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
  items: Array<{ id: string; quantity: number; price: string; product: { id: string; name: string; images?: any } }>;
}
interface Coupon {
  id: string;
  code: string;
  type: string;
  value: string;
  usedCount: number;
  maxUses: number;
  isActive: boolean;
  expiresAt: string;
}

type Tab = "products" | "orders" | "coupons" | "payments";
type View = "grid" | "list";

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

function TabIcon({ tab }: { tab: Tab }) {
  const cls = "h-4 w-4";
  if (tab === "products") return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
  if (tab === "orders") return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6 4h6" /></svg>;
  if (tab === "coupons") return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a2 2 0 011.4.6l7 7a2 2 0 010 2.8l-5.6 5.6a2 2 0 01-2.8 0l-7-7A2 2 0 014 10.6V5a2 2 0 012-2h1z" /></svg>;
  return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm2 8h2" /></svg>;
}

function orderStatusLabel(status: string) {
  return ({ pending: "Pendiente", paid: "Pagado", cancelled: "Cancelado", shipped: "Enviado" } as Record<string, string>)[status] || status;
}

function orderStatusColor(status: string) {
  return (
    {
      pending: "bg-amber-50 text-amber-700",
      paid: "bg-emerald-50 text-emerald-700",
      cancelled: "bg-red-50 text-red-700",
      shipped: "bg-blue-50 text-blue-700",
    } as Record<string, string>
  )[status] || "bg-slate-100 text-slate-600";
}

const selectCls =
  "h-10 rounded-xl border border-[#e3e3e3] bg-white px-3 text-[13px] font-medium text-[#303030] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.12)]";

export default function EcommercePage() {
  const [tab, setTab] = useState<Tab>("products");
  const [view, setView] = useState<View>("grid");
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

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [couponSearch, setCouponSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, oRes, cpRes, payRes]: any[] = await Promise.all([
        api.get("/products"),
        api.get("/product-categories"),
        api.get("/orders"),
        api.get("/coupons"),
        api.get("/payments/config").catch(() => null),
      ]);
      setProducts(pRes.data || pRes);
      setCategories(cRes.data || cRes);
      setOrders(oRes.data || oRes);
      setCoupons(cpRes.data || cpRes);

      const cfg = payRes ? payRes.data || payRes : {};
      const p = cfg?.providers?.paypal || {};
      const ph = cfg?.providers?.payphone || {};
      setPayForm({
        defaultMethod: cfg?.defaultMethod || "cod",
        paypalEnabled: !!p.enabled,
        paypalMode: p.mode || "sandbox",
        paypalClientId: p.clientId || "",
        hasSecret: !!p.hasSecret,
        paypalSecret: "",
        payphoneEnabled: !!ph.enabled,
        payphoneMode: ph.mode || "sandbox",
        payphoneToken: ph.token || "",
        payphoneStoreId: ph.storeId || "",
      });
    } catch {
      // El estado previo se conserva si falla una carga.
    } finally {
      setLoading(false);
    }
  }, []);

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
      if (editingId) await api.put(`/products/${editingId}`, payload);
      else await api.post("/products", payload);
      resetForm();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al guardar producto");
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice ?? "",
      stock: p.stock,
      description: p.description || "",
      images: firstImage(p.images),
      categoryId: p.categoryId || "",
      isActive: p.isActive,
      isFeatured: p.isFeatured,
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
    try {
      await api.post("/coupons", {
        ...form,
        value: Number(form.value),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        type: form.type || "percentage",
      });
      resetForm();
      fetchData();
    } catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const savePayConfig = async () => {
    if (!payForm) return;
    const body: any = {
      defaultMethod: payForm.defaultMethod,
      providers: {
        paypal: { enabled: !!payForm.paypalEnabled, mode: payForm.paypalMode, clientId: (payForm.paypalClientId || "").trim() },
        payphone: { enabled: !!payForm.payphoneEnabled, mode: payForm.payphoneMode, token: (payForm.payphoneToken || "").trim(), storeId: (payForm.payphoneStoreId || "").trim() },
      },
    };
    if (payForm.paypalSecret?.trim()) body.providers.paypal.secret = payForm.paypalSecret.trim();
    try { await api.put("/payments/config", body); fetchData(); alert("Configuración de pagos guardada."); }
    catch (err: any) { alert(err.response?.data?.message || "Error al guardar la configuración de pagos"); }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await api.put(`/orders/${id}/status`, { status });
    fetchData();
  };
  const deleteCoupon = async (id: string) => {
    if (!(await confirm("¿Eliminar cupón?"))) return;
    await api.delete(`/coupons/${id}`);
    fetchData();
  };

  const productStats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.isActive).length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
    outOfStock: products.filter((p) => p.stock <= 0).length,
  }), [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (query) {
        const haystack = [p.name, p.slug, p.description, p.category?.name].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
      if (statusFilter === "active" && !p.isActive) return false;
      if (statusFilter === "inactive" && p.isActive) return false;
      if (stockFilter === "low" && !(p.stock > 0 && p.stock <= 5)) return false;
      if (stockFilter === "out" && p.stock > 0) return false;
      if (stockFilter === "in" && p.stock <= 0) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
      if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
      if (sortBy === "stock") return b.stock - a.stock;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [products, search, categoryFilter, statusFilter, stockFilter, sortBy]);

  const hasProductFilters =
    search.trim() !== "" || categoryFilter !== "all" || statusFilter !== "all" || stockFilter !== "all" || sortBy !== "newest";

  const resetProductFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setStockFilter("all");
    setSortBy("newest");
  };

  const orderStatuses = useMemo(() => Array.from(new Set(orders.map((o) => o.status))), [orders]);
  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatus !== "all" && o.status !== orderStatus) return false;
      if (!query) return true;
      const haystack = [o.customerName, o.customerEmail, o.customerPhone, o.id, o.paymentMethod].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [orders, orderSearch, orderStatus]);

  const filteredCoupons = useMemo(() => {
    const query = couponSearch.trim().toLowerCase();
    return coupons.filter((c) => !query || c.code.toLowerCase().includes(query));
  }, [coupons, couponSearch]);

  if (loading) {
    return (
      <main className="flex-1 overflow-auto bg-[#f6f6f8] p-4 sm:p-6 lg:p-8">
        <div className="mb-6 h-10 w-56 animate-pulse rounded-xl bg-slate-200" />
        <div className="mb-6 flex gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 w-28 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
      </main>
    );
  }

  const inputCls = "input-field";
  const labelCls = "label";

  const tabs: Array<{ key: Tab; label: string; count?: number }> = [
    { key: "products", label: "Productos", count: products.length },
    { key: "orders", label: "Pedidos", count: orders.length },
    { key: "coupons", label: "Cupones", count: coupons.length },
    { key: "payments", label: "Pagos" },
  ];

  return (
    <main className="flex-1 overflow-auto bg-[#f6f6f8] p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-secondary)]" />
            Tienda
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1f1f1f] sm:text-[28px]">E-commerce</h1>
          <p className="mt-1 text-sm text-[#616161]">Gestiona productos, pedidos, cupones y pagos de tu tienda.</p>
        </div>
        {tab !== "orders" && tab !== "payments" && (
          <button
            type="button"
            onClick={() => { if (tab === "products") resetForm(); setShowCreate(!showCreate); }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-secondary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-on-secondary)] shadow-sm transition hover:bg-[var(--brand-secondary-hover)]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {tab === "products" ? "Nuevo producto" : "Nuevo cupón"}
          </button>
        )}
      </div>

      <div className="mb-6 inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-[#e6e4ef] bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTab(t.key); resetForm(); }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition ${
              tab === t.key
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-[#616161] hover:bg-[#f7f7f9] hover:text-[#1f1f1f]"
            }`}
          >
            <TabIcon tab={t.key} />
            {t.label}
            {typeof t.count === "number" && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.key ? "bg-white/15 text-white" : "bg-[#f1f1f4] text-[#8a8a8a]"}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {showCreate && tab === "products" && (
        <div className="mb-6 rounded-2xl border border-[#e6e4ef] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#1f1f1f]">{editingId ? "Editar producto" : "Nuevo producto"}</h3>
              <p className="mt-0.5 text-xs text-[#8a8a8a]">Los cambios se reflejan en tu tienda publicada.</p>
            </div>
            <button type="button" onClick={resetForm} className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-[#f7f7f9] hover:text-[#303030]" title="Cerrar">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Nombre</label><input className={inputCls} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Camiseta Oversize" /></div>
            <div><label className={labelCls}>Slug</label><input className={inputCls} value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="camiseta-oversize" /></div>
            <div>
              <label className={labelCls}>Categoría</label>
              <div className="flex gap-2">
                <select className={inputCls} value={form.categoryId || ""} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={addCategory} className="btn-ghost whitespace-nowrap text-sm">+ Nueva</button>
              </div>
            </div>
            <div><label className={labelCls}>Precio ($)</label><input className={inputCls} type="number" step="0.01" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><label className={labelCls}>Precio anterior ($)</label><input className={inputCls} type="number" step="0.01" value={form.comparePrice || ""} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} placeholder="95.00" /></div>
            <div><label className={labelCls}>Stock</label><input className={inputCls} type="number" value={form.stock ?? ""} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <label className={labelCls}>URL de imagen</label>
              <div className="grid gap-3 sm:grid-cols-[1fr_88px]">
                <input className={inputCls} value={form.images || ""} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="https://..." />
                <div className="flex h-10 items-center justify-center overflow-hidden rounded-xl border border-[#e3e3e3] bg-[#f7f7f9]">
                  {form.images ? <img src={form.images} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-[#9a9aa5]">Vista previa</span>}
                </div>
              </div>
            </div>
            <div className="sm:col-span-2"><label className={labelCls}>Descripción</label><textarea className={inputCls} rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-[#303030]"><input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Activo</label>
            <label className="flex items-center gap-2 text-sm text-[#303030]"><input type="checkbox" checked={!!form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Destacado</label>
          </div>
          <div className="mt-5 flex gap-2 border-t border-[#efeff2] pt-5">
            <button type="button" onClick={saveProduct} className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)]">{editingId ? "Guardar cambios" : "Crear producto"}</button>
            <button type="button" onClick={resetForm} className="rounded-xl border border-[#e3e3e3] bg-white px-5 py-2.5 text-sm font-semibold text-[#616161] transition hover:bg-[#f7f7f9]">Cancelar</button>
          </div>
        </div>
      )}

      {showCreate && tab === "coupons" && (
        <div className="mb-6 rounded-2xl border border-[#e6e4ef] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#1f1f1f]">Nuevo cupón</h3>
              <p className="mt-0.5 text-xs text-[#8a8a8a]">Crea un código de descuento para tu tienda.</p>
            </div>
            <button type="button" onClick={resetForm} className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-[#f7f7f9] hover:text-[#303030]" title="Cerrar">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Código</label><input className="input-field font-mono uppercase" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="BIENVENIDO10" /></div>
            <div><label className="label">Tipo</label><select className="input-field" value={form.type || "percentage"} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="percentage">Porcentaje</option><option value="fixed">Monto fijo</option></select></div>
            <div><label className="label">Valor</label><input className="input-field" type="number" value={form.value || ""} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
            <div><label className="label">Usos máximos</label><input className="input-field" type="number" value={form.maxUses || ""} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="Ilimitado" /></div>
          </div>
          <div className="mt-5 flex gap-2 border-t border-[#efeff2] pt-5">
            <button type="button" onClick={createCoupon} className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)]">Crear cupón</button>
            <button type="button" onClick={resetForm} className="rounded-xl border border-[#e3e3e3] bg-white px-5 py-2.5 text-sm font-semibold text-[#616161] transition hover:bg-[#f7f7f9]">Cancelar</button>
          </div>
        </div>
      )}

      {tab === "products" && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Productos", value: productStats.total, color: "text-[var(--color-primary)]", dot: "bg-[var(--color-primary)]" },
              { label: "Activos", value: productStats.active, color: "text-emerald-700", dot: "bg-emerald-500" },
              { label: "Stock bajo", value: productStats.lowStock, color: "text-amber-700", dot: "bg-amber-500" },
              { label: "Agotados", value: productStats.outOfStock, color: "text-red-700", dot: "bg-red-500" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#e6e4ef] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">{s.label}</p>
                </div>
                <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-5 rounded-2xl border border-[#e6e4ef] bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9aa5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, categoría o descripción..."
                  className="h-10 w-full rounded-xl border border-[#e3e3e3] bg-white pl-10 pr-4 text-sm text-[#303030] placeholder:text-[#9a9aa5] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.12)]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectCls}>
                  <option value="all">Todas las categorías</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
                <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className={selectCls}>
                  <option value="all">Todo el stock</option>
                  <option value="in">Con stock</option>
                  <option value="low">Stock bajo (1-5)</option>
                  <option value="out">Agotados</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectCls}>
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguos</option>
                  <option value="name">Nombre A-Z</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="stock">Mayor stock</option>
                </select>
                <div className="inline-flex rounded-xl border border-[#e3e3e3] bg-[#f7f7f9] p-1">
                  <button type="button" onClick={() => setView("grid")} title="Vista de cuadrícula" className={`rounded-lg p-1.5 transition ${view === "grid" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-[#8a8a8a] hover:text-[#303030]"}`}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                  </button>
                  <button type="button" onClick={() => setView("list")} title="Vista de lista" className={`rounded-lg p-1.5 transition ${view === "list" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-[#8a8a8a] hover:text-[#303030]"}`}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                </div>
                {hasProductFilters && <button type="button" onClick={resetProductFilters} className="rounded-xl px-3 py-2 text-xs font-semibold text-[#b36b00] hover:bg-[#fdf3e5]">Limpiar</button>}
              </div>
            </div>
            <p className="mt-2 text-xs text-[#8a8a8a]">{filteredProducts.length} de {products.length} productos</p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9d9e2] bg-white p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f4f7] text-[#8a8a8a]">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <p className="text-sm font-semibold text-[#303030]">{products.length === 0 ? "Aún no tienes productos" : "No encontramos productos"}</p>
              <p className="mt-1 text-sm text-[#8a8a8a]">{products.length === 0 ? "Crea tu primer producto para mostrarlo en tu tienda." : "Prueba con otros filtros o limpia la búsqueda."}</p>
              {products.length === 0 ? (
                <button type="button" onClick={() => setShowCreate(true)} className="mt-5 rounded-full bg-[var(--color-secondary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-on-secondary)] transition hover:bg-[var(--brand-secondary-hover)]">Crear producto</button>
              ) : (
                <button type="button" onClick={resetProductFilters} className="mt-5 rounded-full border border-[#e3e3e3] bg-white px-5 py-2.5 text-sm font-semibold text-[#616161] transition hover:bg-[#f7f7f9]">Limpiar filtros</button>
              )}
            </div>
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((p) => {
                const img = firstImage(p.images);
                const price = Number(p.price) || 0;
                const compare = Number(p.comparePrice) || 0;
                return (
                  <article key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-[#e6e4ef] bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#f6f6f7]">
                      {img ? (
                        <img src={img} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#c9c9d1]">
                          <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)] backdrop-blur">{p.category?.name || "Sin categoría"}</span>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${p.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{p.isActive ? "Activo" : "Inactivo"}</span>
                      </div>
                      {p.isFeatured && <span className="absolute bottom-3 left-3 rounded-full bg-[var(--color-secondary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-on-secondary)]">Destacado</span>}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-semibold text-[#1f1f1f]">{p.name}</h3>
                          <p className="mt-0.5 text-xs text-[#8a8a8a]">{p.stock > 0 ? `${p.stock} disponibles` : "Agotado"}</p>
                        </div>
                        <button type="button" onClick={() => toggleFeatured(p)} title={p.isFeatured ? "Quitar destacado" : "Destacar"} className={`rounded-lg p-1.5 transition ${p.isFeatured ? "text-[var(--color-secondary)]" : "text-[#c9c9d1] hover:text-[var(--color-secondary)]"}`}>
                          <svg className="h-4 w-4" fill={p.isFeatured ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.077 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        </button>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-bold text-[var(--color-primary)]">{formatCurrency(price)}</span>
                        {compare > price && <span className="text-sm text-[#9a9aa5] line-through">{formatCurrency(compare)}</span>}
                      </div>
                      {p.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#616161]">{p.description}</p>}
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#efeff2] pt-3">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => startEdit(p)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#303030] hover:bg-[#f7f7f9]">Editar</button>
                          <button type="button" onClick={() => toggleActive(p)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#616161] hover:bg-[#f7f7f9]">{p.isActive ? "Desactivar" : "Activar"}</button>
                        </div>
                        <button type="button" onClick={() => deleteProduct(p)} title="Eliminar" className="rounded-lg p-1.5 text-[#c04b4b] hover:bg-red-50">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#e6e4ef] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-[#efeff2] bg-[#fafafa] text-left text-[11px] font-semibold uppercase tracking-wider text-[#8a8a8a]">
                      <th className="px-5 py-3">Producto</th>
                      <th className="px-5 py-3">Precio</th>
                      <th className="px-5 py-3">Stock</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f1f4]">
                    {filteredProducts.map((p) => {
                      const img = firstImage(p.images);
                      const price = Number(p.price) || 0;
                      const compare = Number(p.comparePrice) || 0;
                      return (
                        <tr key={p.id} className="transition hover:bg-[#fafafa]">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[#f6f6f7]">
                                {img ? <img src={img} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#c9c9d1]"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14" /></svg></div>}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-[#303030]">{p.name}</p>
                                <p className="text-xs text-[#8a8a8a]">{p.category?.name || "Sin categoría"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-semibold text-[#303030]">{formatCurrency(price)}</p>
                            {compare > price && <p className="text-xs text-[#9a9aa5] line-through">{formatCurrency(compare)}</p>}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.stock <= 0 ? "bg-red-50 text-red-700" : p.stock <= 5 ? "bg-amber-50 text-amber-700" : "bg-[#f1f1f4] text-[#616161]"}`}>
                              {p.stock <= 0 ? "Agotado" : `${p.stock} uds`}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{p.isActive ? "Activo" : "Inactivo"}</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button type="button" onClick={() => toggleFeatured(p)} title={p.isFeatured ? "Quitar destacado" : "Destacar"} className={`rounded-lg p-1.5 ${p.isFeatured ? "text-[var(--color-secondary)]" : "text-[#c9c9d1] hover:text-[var(--color-secondary)]"}`}>
                                <svg className="h-4 w-4" fill={p.isFeatured ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.077 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                              </button>
                              <button type="button" onClick={() => startEdit(p)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#303030] hover:bg-[#f7f7f9]">Editar</button>
                              <button type="button" onClick={() => toggleActive(p)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#616161] hover:bg-[#f7f7f9]">{p.isActive ? "Desactivar" : "Activar"}</button>
                              <button type="button" onClick={() => deleteProduct(p)} title="Eliminar" className="rounded-lg p-1.5 text-[#c04b4b] hover:bg-red-50">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "orders" && (
        <>
          <div className="mb-5 rounded-2xl border border-[#e6e4ef] bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9aa5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Buscar por cliente, correo o teléfono..." className="h-10 w-full rounded-xl border border-[#e3e3e3] bg-white pl-10 pr-4 text-sm text-[#303030] placeholder:text-[#9a9aa5] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.12)]" />
              </div>
              <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className={selectCls}>
                <option value="all">Todos los estados</option>
                {orderStatuses.map((s) => <option key={s} value={s}>{orderStatusLabel(s)}</option>)}
              </select>
            </div>
            <p className="mt-2 text-xs text-[#8a8a8a]">{filteredOrders.length} de {orders.length} pedidos</p>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9d9e2] bg-white p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f4f7] text-[#8a8a8a]"><TabIcon tab="orders" /></div>
              <p className="text-sm font-semibold text-[#303030]">{orders.length === 0 ? "Sin pedidos todavía" : "No encontramos pedidos"}</p>
              <p className="mt-1 text-sm text-[#8a8a8a]">{orders.length === 0 ? "Los pedidos de tu tienda aparecerán aquí." : "Prueba con otro estado o limpia la búsqueda."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((o) => (
                <div key={o.id} className="rounded-2xl border border-[#e6e4ef] bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#f1f1f4] pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(var(--color-primary-rgb),0.08)] text-sm font-bold text-[var(--color-primary)]">
                        {(o.customerName || "C").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1f1f1f]">{o.customerName || "Cliente"}</p>
                        <p className="text-xs text-[#8a8a8a]">{formatDate(o.createdAt)}{o.customerPhone ? ` · ${o.customerPhone}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusColor(o.status)}`}>{orderStatusLabel(o.status)}</span>
                      <span className="rounded-full bg-[#f1f1f4] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#616161]">
                        {o.paymentMethod === "cod" ? "Contra entrega" : o.paymentMethod === "paypal" ? "PayPal" : o.paymentMethod === "payphone" ? "Payphone" : o.paymentMethod || "—"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 py-4 text-sm">
                    {o.items.map((i, idx) => {
                      const url = firstImage(i.product?.images);
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          {url ? <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[#f6f6f7]"><img src={url} alt={i.product?.name || ""} className="h-full w-full object-cover" /></div> : <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--color-primary-rgb),0.08)] text-sm font-bold text-[var(--color-primary)]">{String(i.product?.name || "?").charAt(0)}</div>}
                          <div className="min-w-0 flex-1"><p className="truncate font-medium text-[#303030]">{i.product?.name}</p></div>
                          <div className="flex-shrink-0 text-right"><p className="text-xs text-[#8a8a8a]">{i.quantity} × {formatCurrency(Number(i.price))}</p><p className="font-semibold text-[#303030]">{formatCurrency(Number(i.price) * i.quantity)}</p></div>
                        </div>
                      );
                    })}
                    {o.customerEmail && <div className="flex items-center gap-1.5 border-t border-[#f1f1f4] pt-3 text-xs text-[#8a8a8a]"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.9 5.26a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg><span className="truncate">{o.customerEmail}</span></div>}
                    {o.notes && <p className="whitespace-pre-line border-t border-[#f1f1f4] pt-3 text-xs text-[#8a8a8a]">{o.notes}</p>}
                  </div>
                  <div className="flex items-center justify-between border-t border-[#f1f1f4] pt-4">
                    <p className="text-lg font-bold text-[#303030]">{formatCurrency(Number(o.totalAmount))}{Number(o.discount) > 0 && <span className="ml-2 text-xs font-medium text-emerald-600">(-{formatCurrency(Number(o.discount))})</span>}</p>
                    {o.status === "pending" && <button type="button" onClick={() => updateOrderStatus(o.id, "paid")} className="rounded-full bg-[var(--color-secondary)] px-4 py-2 text-xs font-semibold text-[var(--color-on-secondary)] transition hover:bg-[var(--brand-secondary-hover)]">Marcar pagado</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "coupons" && (
        <>
          <div className="mb-5 rounded-2xl border border-[#e6e4ef] bg-white p-3 shadow-sm">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9aa5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input value={couponSearch} onChange={(e) => setCouponSearch(e.target.value)} placeholder="Buscar cupón por código..." className="h-10 w-full rounded-xl border border-[#e3e3e3] bg-white pl-10 pr-4 text-sm text-[#303030] placeholder:text-[#9a9aa5] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.12)]" />
            </div>
            <p className="mt-2 text-xs text-[#8a8a8a]">{filteredCoupons.length} de {coupons.length} cupones</p>
          </div>

          {filteredCoupons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9d9e2] bg-white p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f4f7] text-[#8a8a8a]"><TabIcon tab="coupons" /></div>
              <p className="text-sm font-semibold text-[#303030]">{coupons.length === 0 ? "Sin cupones todavía" : "No encontramos cupones"}</p>
              <p className="mt-1 text-sm text-[#8a8a8a]">{coupons.length === 0 ? "Crea un código de descuento para incentivar las compras." : "Prueba con otro código."}</p>
              {coupons.length === 0 && <button type="button" onClick={() => setShowCreate(true)} className="mt-5 rounded-full bg-[var(--color-secondary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-on-secondary)] transition hover:bg-[var(--brand-secondary-hover)]">Crear cupón</button>}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCoupons.map((c) => (
                <div key={c.id} className="rounded-2xl border border-[#e6e4ef] bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-lg bg-[rgba(var(--color-primary-rgb),0.07)] px-2.5 py-1 font-mono text-sm font-bold text-[var(--color-primary)]">{c.code}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{c.isActive ? "Activo" : "Inactivo"}</span>
                  </div>
                  <p className="mt-4 text-2xl font-bold text-[#1f1f1f]">{c.type === "percentage" ? `${c.value}%` : formatCurrency(Number(c.value))}</p>
                  <p className="mt-1 text-xs text-[#8a8a8a]">{c.usedCount}/{c.maxUses || "∞"} usos{c.expiresAt && ` · Expira ${formatDate(c.expiresAt)}`}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-[#f1f1f4] pt-3">
                    <span className="text-[11px] text-[#8a8a8a]">{c.type === "percentage" ? "Descuento porcentual" : "Descuento fijo"}</span>
                    <button type="button" onClick={() => deleteCoupon(c.id)} className="rounded-lg px-2 py-1 text-xs font-semibold text-[#c04b4b] hover:bg-red-50">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "payments" && payForm && (
        <div className="max-w-3xl space-y-4">
          <div className="rounded-2xl border border-[#e6e4ef] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-[#1f1f1f]">Pago contra entrega</h3>
                <p className="mt-1 text-sm text-[#616161]">Activado por defecto. El cliente paga en efectivo al recibir el pedido. No requiere credenciales.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Siempre activo</span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e6e4ef] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-[#1f1f1f]">PayPal</h3>
                <p className="mt-1 text-sm text-[#616161]">Acepta pagos con PayPal en el checkout. Usa una aplicación REST Business de PayPal y copia el Client ID y el Secret de tu cuenta.</p>
              </div>
              <label className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-[#303030]">
                <input type="checkbox" checked={payForm.paypalEnabled || false} onChange={(e) => setPayForm({ ...payForm, paypalEnabled: e.target.checked })} className="h-4 w-4" />
                Activar PayPal
              </label>
            </div>
            {!payForm.paypalEnabled && <p className="mt-4 border-t border-[#f1f1f4] pt-4 text-xs text-[#8a8a8a]">PayPal desactivado. El checkout mostrará solo “Pago contra entrega”.</p>}
            {payForm.paypalEnabled && (
              <div className="mt-4 grid gap-4 border-t border-[#f1f1f4] pt-4 sm:grid-cols-2">
                <div><label className="label">Modo</label><select className="input-field" value={payForm.paypalMode} onChange={(e) => setPayForm({ ...payForm, paypalMode: e.target.value })}><option value="sandbox">Sandbox (pruebas)</option><option value="live">Producción (Live)</option></select></div>
                <div><label className="label">Client ID</label><input className="input-field" value={payForm.paypalClientId || ""} onChange={(e) => setPayForm({ ...payForm, paypalClientId: e.target.value })} placeholder="AaB...TuClientId" /></div>
                <div className="sm:col-span-2"><label className="label">Secret</label><input className="input-field" type="password" value={payForm.paypalSecret || ""} onChange={(e) => setPayForm({ ...payForm, paypalSecret: e.target.value })} placeholder={payForm.hasSecret ? "•••••••• (dejar vacío para conservar)" : "Tu secret"} /><p className="mt-1 text-xs text-[#8a8a8a]">{payForm.hasSecret ? "Ya tienes un secret guardado. Déjalo vacío si no quieres cambiarlo." : "El secret no se muestra de nuevo; se guarda en la configuración de tu negocio."}</p></div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#e6e4ef] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-[#1f1f1f]">Payphone</h3>
                <p className="mt-1 text-sm text-[#616161]">Acepta tarjetas y Saldo Payphone en el checkout. Configura tu Token y Store ID según el modo de la aplicación WEB.</p>
                <p className="mt-2 text-xs text-[#8a8a8a]">La URL de respuesta debe apuntar al checkout de tu sitio para confirmar el pago al volver.</p>
              </div>
              <label className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-[#303030]">
                <input type="checkbox" checked={payForm.payphoneEnabled || false} onChange={(e) => setPayForm({ ...payForm, payphoneEnabled: e.target.checked })} className="h-4 w-4" />
                Activar Payphone
              </label>
            </div>
            {!payForm.payphoneEnabled && <p className="mt-4 border-t border-[#f1f1f4] pt-4 text-xs text-[#8a8a8a]">Payphone desactivado. El checkout no mostrará la cajita de pagos.</p>}
            {payForm.payphoneEnabled && (
              <div className="mt-4 grid gap-4 border-t border-[#f1f1f4] pt-4 sm:grid-cols-2">
                <div><label className="label">Modo</label><select className="input-field" value={payForm.payphoneMode} onChange={(e) => setPayForm({ ...payForm, payphoneMode: e.target.value })}><option value="sandbox">Pruebas (Sandbox)</option><option value="live">Producción (Live)</option></select><p className="mt-1 text-xs text-[#8a8a8a]">{payForm.payphoneMode === "live" ? "Usa tus credenciales de producción." : "Usa tus credenciales de pruebas; no se hacen cobros reales."}</p></div>
                <div><label className="label">Token</label><input className="input-field" value={payForm.payphoneToken || ""} onChange={(e) => setPayForm({ ...payForm, payphoneToken: e.target.value })} placeholder="Bearer Token" /></div>
                <div><label className="label">Store ID</label><input className="input-field" value={payForm.payphoneStoreId || ""} onChange={(e) => setPayForm({ ...payForm, payphoneStoreId: e.target.value })} placeholder="Tienda Payphone" /></div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#e6e4ef] bg-white p-6 shadow-sm">
            <label className="label">Método de pago preseleccionado</label>
            <select className="input-field" value={payForm.defaultMethod || "cod"} onChange={(e) => setPayForm({ ...payForm, defaultMethod: e.target.value })}>
              <option value="cod">Pago contra entrega</option>
              {payForm.paypalEnabled && <option value="paypal">PayPal</option>}
              {payForm.payphoneEnabled && <option value="payphone">Payphone (tarjeta / saldo)</option>}
            </select>
            <p className="mt-1 text-xs text-[#8a8a8a]">El cliente siempre puede elegir otro método disponible.</p>
          </div>

          <button type="button" onClick={savePayConfig} className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)]">Guardar cambios</button>
        </div>
      )}

      {tab === "products" && products.length > 0 && filteredProducts.length > 0 && (
        <p className="mt-6 text-center text-xs text-[#9a9aa5]">
          ¿Necesitas imágenes? <Link href="/dashboard/media" className="font-semibold text-[#b36b00] hover:underline">Súbelas en Archivos Media</Link>
        </p>
      )}
    </main>
  );
}
