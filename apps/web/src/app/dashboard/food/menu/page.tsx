"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import MediaPicker from "@/components/media-picker";
import { useAuthStore } from "@/stores/auth-store";
import { useConfirm } from "@/components/providers/confirm-provider";
import { FoodCategory, FoodOptionGroup, FoodProduct, money, unwrap } from "@/lib/food";

const STARTER_TYPES = [
  { id: "burgers", label: "Hamburguesas" },
  { id: "pizza", label: "Pizzería" },
  { id: "cafe", label: "Cafetería" },
  { id: "fastfood", label: "Comida rápida" },
  { id: "restaurant", label: "Restaurante" },
  { id: "bar", label: "Bar" },
];

const card = "rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)]";
const rid = () => Math.random().toString(36).slice(2, 10);

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  comparePrice: string;
  categoryId: string;
  image: string;
  isActive: boolean;
  isFeatured: boolean;
  soldOut: boolean;
  tags: string;
  optionGroups: Array<Omit<FoodOptionGroup, "options"> & { options: Array<{ id: string; name: string; price: string }> }>;
};

const emptyDraft = (categoryId = ""): Draft => ({
  name: "",
  description: "",
  price: "",
  comparePrice: "",
  categoryId,
  image: "",
  isActive: true,
  isFeatured: false,
  soldOut: false,
  tags: "",
  optionGroups: [],
});

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${on ? "bg-[#303030]" : "bg-[#c9cccf]"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

function ProductModal({
  draft,
  setDraft,
  categories,
  products,
  onClose,
  onSave,
  saving,
  error,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  categories: FoodCategory[];
  products: FoodProduct[];
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [picker, setPicker] = useState(false);
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const setGroup = (gi: number, patch: Partial<Draft["optionGroups"][number]>) =>
    set({ optionGroups: draft.optionGroups.map((g, i) => (i === gi ? { ...g, ...patch } : g)) });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[640px] rounded-2xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-[#ebebeb] px-5 py-4">
          <h2 className="text-[16px] font-semibold text-[#303030]">{draft.id ? "Editar plato" : "Nuevo plato"}</h2>
          <button onClick={onClose} className="btn-ghost !px-2" aria-label="Cerrar">✕</button>
        </header>

        <div className="space-y-4 px-5 py-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setPicker(true)}
              className="flex h-28 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#8a8a8a]/60 bg-[#f7f7f7] text-[12px] text-[#616161] hover:bg-[#f1f1f1]"
            >
              {draft.image ? <img src={draft.image} alt="" className="h-full w-full object-cover" /> : "+ Foto"}
            </button>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <label className="label">Nombre</label>
                <input className="input-field" value={draft.name} maxLength={100} onChange={(e) => set({ name: e.target.value })} placeholder="Ej. Hamburguesa clásica" autoFocus />
              </div>
              <div>
                <label className="label">Categoría</label>
                <select className="input-field" value={draft.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          {draft.image && (
            <button type="button" onClick={() => set({ image: "" })} className="-mt-2 text-[12px] text-[#c70a24] hover:underline">Quitar foto</button>
          )}

          <div>
            <label className="label">Descripción</label>
            <textarea className="input-field" rows={2} maxLength={600} value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Ingredientes, tamaño, acompañantes..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Precio</label>
              <input className="input-field" type="number" min="0" step="0.01" value={draft.price} onChange={(e) => set({ price: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Precio anterior (opcional)</label>
              <input className="input-field" type="number" min="0" step="0.01" value={draft.comparePrice} onChange={(e) => set({ comparePrice: e.target.value })} placeholder="Para mostrar una oferta" />
            </div>
          </div>

          <div>
            <label className="label">Etiquetas (opcional)</label>
            <input className="input-field" value={draft.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="Ej. Nuevo, Picante, Vegano (separadas por coma)" />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {([
              ["isActive", "Visible en el menú"],
              ["isFeatured", "Destacado"],
              ["soldOut", "Agotado hoy"],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-2 rounded-lg border border-[#e3e3e3] px-3 py-2 text-[13px] text-[#303030]">
                {label}
                <Toggle on={draft[k]} onChange={(v) => set({ [k]: v } as any)} label={label} />
              </label>
            ))}
          </div>

          <section className="rounded-xl border border-[#e3e3e3]">
            <div className="flex items-center justify-between px-3 py-2.5">
              <div>
                <p className="text-[13px] font-semibold text-[#303030]">Opciones y extras</p>
                <p className="text-[12px] text-[#8a8a8a]">Ej. “¿Con o sin pan?”, “Elige tu salsa”, “Agrega extras”.</p>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                {products.some((x) => x.id !== draft.id && x.optionGroups.length) && (
                  <select
                    className="input-field !w-auto !py-1"
                    value=""
                    aria-label="Copiar opciones de otro plato"
                    onChange={(e) => {
                      const src = products.find((x) => x.id === e.target.value);
                      if (!src) return;
                      set({
                        optionGroups: [
                          ...draft.optionGroups,
                          ...src.optionGroups.map((g) => ({
                            ...g,
                            id: rid(),
                            options: g.options.map((o) => ({ id: rid(), name: o.name, price: o.price ? String(o.price) : "" })),
                          })),
                        ],
                      });
                    }}
                  >
                    <option value="">Copiar de…</option>
                    {products
                      .filter((x) => x.id !== draft.id && x.optionGroups.length)
                      .map((x) => (
                        <option key={x.id} value={x.id}>{x.name}</option>
                      ))}
                  </select>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => set({ optionGroups: [...draft.optionGroups, { id: rid(), name: "", required: false, max: 1, options: [{ id: rid(), name: "", price: "" }] }] })}
                >
                  + Grupo
                </button>
              </div>
            </div>
            {draft.optionGroups.map((g, gi) => (
              <div key={g.id} className="space-y-2 border-t border-[#ebebeb] px-3 py-3">
                <div className="flex gap-2">
                  <input className="input-field" placeholder="Nombre del grupo (ej. Elige tu salsa)" value={g.name} onChange={(e) => setGroup(gi, { name: e.target.value })} />
                  <button type="button" className="btn-ghost !px-2 text-[#c70a24]" aria-label="Quitar grupo" onClick={() => set({ optionGroups: draft.optionGroups.filter((_, i) => i !== gi) })}>✕</button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#616161]">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={g.required} onChange={(e) => setGroup(gi, { required: e.target.checked })} /> Obligatorio
                  </label>
                  <label className="flex items-center gap-1.5">
                    Puede elegir hasta
                    <input
                      type="number"
                      min={1}
                      max={Math.max(g.options.length, 1)}
                      value={g.max}
                      onChange={(e) => setGroup(gi, { max: Math.max(1, Number(e.target.value) || 1) })}
                      className="input-field !w-14 !py-0.5"
                    />
                  </label>
                </div>
                {g.options.map((o, oi) => (
                  <div key={o.id} className="flex gap-2">
                    <input
                      className="input-field"
                      placeholder="Opción (ej. BBQ)"
                      value={o.name}
                      onChange={(e) => setGroup(gi, { options: g.options.map((x, i) => (i === oi ? { ...x, name: e.target.value } : x)) })}
                    />
                    <input
                      className="input-field !w-28"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="+ $0.00"
                      value={o.price}
                      onChange={(e) => setGroup(gi, { options: g.options.map((x, i) => (i === oi ? { ...x, price: e.target.value } : x)) })}
                    />
                    <button type="button" className="btn-ghost !px-2" aria-label="Quitar opción" onClick={() => setGroup(gi, { options: g.options.filter((_, i) => i !== oi) })}>✕</button>
                  </div>
                ))}
                <button type="button" className="text-[12px] font-medium text-[#005bd3] hover:underline" onClick={() => setGroup(gi, { options: [...g.options, { id: rid(), name: "", price: "" }] })}>
                  + Agregar opción
                </button>
              </div>
            ))}
          </section>
          {error && <p className="rounded-lg bg-[#fedad9] px-3 py-2 text-[13px] text-[#8e0b21]">{error}</p>}
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#ebebeb] px-5 py-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={onSave} disabled={saving || !draft.name.trim() || draft.price === ""} className="btn-primary">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </footer>
      </div>
      <MediaPicker open={picker} onClose={() => setPicker(false)} onSelect={(url) => { set({ image: url }); setPicker(false); }} />
    </div>
  );
}

export default function FoodMenuPage() {
  const { tenantId } = useAuthStore();
  const { confirm } = useConfirm();
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sym, setSym] = useState("$");
  const [newCat, setNewCat] = useState("");
  const [editingCat, setEditingCat] = useState<{ id: string; name: string } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState<Record<string, { name: string; price: string }>>({});
  const [starterBusy, setStarterBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = unwrap<{ categories: FoodCategory[]; products: FoodProduct[] }>(await api.get("/food/menu"));
      setCategories(data.categories);
      setProducts(data.products);
    } catch (err: any) {
      setError(err.response?.data?.message || "No pudimos cargar el menú.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    load();
    api.get("/food/settings").then((r) => setSym(unwrap<any>(r)?.settings?.currencySymbol || "$")).catch(() => {});
  }, [tenantId, load]);

  const fail = (err: any, fallback: string) => setError(err?.response?.data?.message || fallback);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCat.trim();
    if (!name) return;
    try {
      const c = unwrap<FoodCategory>(await api.post("/food/categories", { name }));
      setCategories((l) => [...l, c]);
      setNewCat("");
      setError(null);
    } catch (err) { fail(err, "No se pudo crear la categoría."); }
  };

  const renameCategory = async () => {
    if (!editingCat?.name.trim()) return;
    try {
      const c = unwrap<FoodCategory>(await api.put(`/food/categories/${editingCat.id}`, { name: editingCat.name }));
      setCategories((l) => l.map((x) => (x.id === c.id ? { ...x, name: c.name } : x)));
      setEditingCat(null);
    } catch (err) { fail(err, "No se pudo renombrar."); }
  };

  const removeCategory = async (c: FoodCategory) => {
    const count = products.filter((p) => p.categoryId === c.id).length;
    const ok = await confirm({
      title: `Eliminar “${c.name}”`,
      message: count ? `Sus ${count} platos quedarán sin categoría (no se borran).` : "La categoría está vacía.",
      confirmText: "Eliminar",
    });
    if (!ok) return;
    try {
      await api.delete(`/food/categories/${c.id}`);
      setCategories((l) => l.filter((x) => x.id !== c.id));
      setProducts((l) => l.map((p) => (p.categoryId === c.id ? { ...p, categoryId: null } : p)));
    } catch (err) { fail(err, "No se pudo eliminar."); }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= categories.length) return;
    const next = [...categories];
    [next[index], next[j]] = [next[j], next[index]];
    setCategories(next);
    try { await api.put("/food/categories/reorder", { ids: next.map((c) => c.id) }); } catch (err) { fail(err, "No se pudo reordenar."); load(); }
  };

  const openProduct = (p?: FoodProduct, categoryId = "") => {
    setError(null);
    setDraft(
      p
        ? {
            id: p.id,
            name: p.name,
            description: p.description,
            price: String(p.price),
            comparePrice: p.comparePrice ? String(p.comparePrice) : "",
            categoryId: p.categoryId || "",
            image: p.image,
            isActive: p.isActive !== false,
            isFeatured: p.isFeatured,
            soldOut: p.soldOut,
            tags: p.tags.join(", "),
            optionGroups: p.optionGroups.map((g) => ({ ...g, options: g.options.map((o) => ({ ...o, price: o.price ? String(o.price) : "" })) })),
          }
        : emptyDraft(categoryId)
    );
  };

  const saveProduct = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    const body = {
      name: draft.name,
      description: draft.description,
      price: Number(draft.price),
      comparePrice: draft.comparePrice ? Number(draft.comparePrice) : null,
      categoryId: draft.categoryId || null,
      image: draft.image,
      isActive: draft.isActive,
      isFeatured: draft.isFeatured,
      soldOut: draft.soldOut,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      optionGroups: draft.optionGroups.map((g) => ({
        ...g,
        options: g.options.filter((o) => o.name.trim()).map((o) => ({ ...o, price: Number(o.price) || 0 })),
      })),
    };
    try {
      const saved = unwrap<FoodProduct>(draft.id ? await api.put(`/food/products/${draft.id}`, body) : await api.post("/food/products", body));
      setProducts((l) => (draft.id ? l.map((p) => (p.id === saved.id ? saved : p)) : [...l, saved]));
      setDraft(null);
    } catch (err) {
      fail(err, "No se pudo guardar el plato.");
    } finally {
      setSaving(false);
    }
  };

  /** Alta rápida: nombre + precio y Enter, sin abrir el editor. */
  const quickAdd = async (categoryId: string) => {
    const q = quick[categoryId] || { name: "", price: "" };
    const price = Number(q.price.replace(",", "."));
    if (!q.name.trim() || !Number.isFinite(price) || price < 0 || q.price === "") return;
    try {
      const saved = unwrap<FoodProduct>(await api.post("/food/products", { name: q.name.trim(), price, categoryId: categoryId || null }));
      setProducts((l) => [...l, saved]);
      setQuick((m) => ({ ...m, [categoryId]: { name: "", price: "" } }));
      setError(null);
      setTimeout(() => document.getElementById(`quick-name-${categoryId || "none"}`)?.focus(), 0);
    } catch (err) { fail(err, "No se pudo agregar el plato."); }
  };

  const duplicate = async (p: FoodProduct) => {
    try {
      const copy = unwrap<FoodProduct>(await api.post(`/food/products/${p.id}/duplicate`));
      setProducts((l) => [...l, copy]);
      openProduct(copy);
    } catch (err) { fail(err, "No se pudo duplicar."); }
  };

  const loadStarter = async (type: string) => {
    setStarterBusy(true);
    try {
      const data = unwrap<{ categories: FoodCategory[]; products: FoodProduct[] }>(await api.post("/food/menu/starter", { type }));
      setCategories(data.categories);
      setProducts(data.products);
      setError("Listo: cargamos un menú de ejemplo. Cambia nombres, precios y fotos, o borra lo que no uses.");
    } catch (err) { fail(err, "No se pudo cargar el menú de ejemplo."); }
    finally { setStarterBusy(false); }
  };

  const quickUpdate = async (p: FoodProduct, patch: Partial<Pick<FoodProduct, "isActive" | "soldOut">>) => {
    setProducts((l) => l.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
    try { await api.put(`/food/products/${p.id}`, patch); } catch (err) { fail(err, "No se pudo actualizar."); load(); }
  };

  const removeProduct = async (p: FoodProduct) => {
    if (!(await confirm({ title: `Eliminar “${p.name}”`, message: "Se quitará del menú.", confirmText: "Eliminar" }))) return;
    try {
      const res = unwrap<{ deleted: boolean; hidden?: boolean }>(await api.delete(`/food/products/${p.id}`));
      if (res.hidden) {
        setProducts((l) => l.map((x) => (x.id === p.id ? { ...x, isActive: false } : x)));
        setError(`“${p.name}” tiene pedidos anteriores, así que lo ocultamos del menú en vez de borrarlo.`);
      } else setProducts((l) => l.filter((x) => x.id !== p.id));
    } catch (err) { fail(err, "No se pudo eliminar."); }
  };

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (p: FoodProduct) => !q || p.name.toLowerCase().includes(q);
    const list = categories.map((c) => ({ id: c.id, name: c.name, items: products.filter((p) => p.categoryId === c.id && match(p)) }));
    const loose = products.filter((p) => (!p.categoryId || !categories.some((c) => c.id === p.categoryId)) && match(p));
    if (loose.length) list.push({ id: "", name: "Sin categoría", items: loose });
    return list;
  }, [categories, products, search]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1200px] animate-pulse p-4 sm:p-6">
        <div className="mb-6 h-8 w-48 rounded-lg bg-[#e3e3e3]" />
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"><div className={`${card} h-72`} /><div className={`${card} h-96`} /></div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Menú y productos</h1>
          <p className="page-subtitle">{products.length} platos · {categories.length} categorías</p>
        </div>
        <button onClick={() => openProduct()} className="btn-primary">+ Agregar plato</button>
      </div>

      {error && !draft && (
        <p className="mb-3 flex items-center justify-between rounded-lg bg-[#fff5ea] px-3 py-2 text-[13px] text-[#5e4200]">
          {error}
          <button onClick={() => setError(null)} aria-label="Cerrar aviso">✕</button>
        </p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className={`${card} p-3 lg:sticky lg:top-20`}>
          <h2 className="mb-2 px-1 text-[13px] font-semibold text-[#303030]">Categorías</h2>
          <ul className="space-y-0.5">
            {categories.map((c, i) => (
              <li key={c.id} className="group flex items-center gap-1 rounded-lg px-1 py-1 hover:bg-[#f7f7f7]">
                {editingCat?.id === c.id ? (
                  <input
                    autoFocus
                    className="input-field !py-1"
                    value={editingCat.name}
                    onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                    onBlur={renameCategory}
                    onKeyDown={(e) => { if (e.key === "Enter") renameCategory(); if (e.key === "Escape") setEditingCat(null); }}
                  />
                ) : (
                  <>
                    <a href={`#cat-${c.id}`} className="min-w-0 flex-1 truncate px-1 text-[13px] text-[#303030]">{c.name}</a>
                    <span className="text-[12px] text-[#8a8a8a]">{products.filter((p) => p.categoryId === c.id).length}</span>
                    <span className="flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <button className="px-1 text-[12px] text-[#616161] disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">↑</button>
                      <button className="px-1 text-[12px] text-[#616161] disabled:opacity-30" disabled={i === categories.length - 1} onClick={() => move(i, 1)} aria-label="Bajar">↓</button>
                      <button className="px-1 text-[12px] text-[#616161]" onClick={() => setEditingCat({ id: c.id, name: c.name })} aria-label="Renombrar">✎</button>
                      <button className="px-1 text-[12px] text-[#c70a24]" onClick={() => removeCategory(c)} aria-label="Eliminar">✕</button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={addCategory} className="mt-2 flex gap-1.5 border-t border-[#ebebeb] pt-3">
            <input className="input-field" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nueva categoría" maxLength={60} />
            <button className="btn-secondary" disabled={!newCat.trim()}>Crear</button>
          </form>
        </aside>

        <div className="min-w-0 space-y-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar plato" className="input-field max-w-xs" />
          {products.length === 0 && (
            <div className={`${card} px-6 py-10 text-center`}>
              <p className="text-[16px] font-semibold text-[#303030]">Arma tu menú en 1 minuto</p>
              <p className="mx-auto mt-1 max-w-md text-[13px] text-[#616161]">
                Elige tu tipo de negocio y cargamos un menú de ejemplo con categorías, platos y opciones. Solo cambias nombres y precios.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {STARTER_TYPES.map((t) => (
                  <button key={t.id} onClick={() => loadStarter(t.id)} disabled={starterBusy} className="btn-secondary">
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="mt-5 text-[13px] text-[#8a8a8a]">
                o{" "}
                <button onClick={() => openProduct()} className="font-medium text-[#005bd3] hover:underline">
                  empieza desde cero
                </button>
              </p>
            </div>
          )}
          {groups.map((g) => (
            <section key={g.id || "none"} id={g.id ? `cat-${g.id}` : undefined} className={`${card} scroll-mt-20 overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-[#ebebeb] px-4 py-3">
                <h2 className="text-[14px] font-semibold text-[#303030]">{g.name}</h2>
                <button onClick={() => openProduct(undefined, g.id)} className="text-[13px] font-medium text-[#005bd3] hover:underline">+ Plato</button>
              </div>
              {g.items.length === 0 && !search ? null : g.items.length === 0 ? (
                <p className="px-4 py-5 text-[13px] text-[#8a8a8a]">Sin resultados.</p>
              ) : (
                <ul className="divide-y divide-[#ebebeb]">
                  {g.items.map((p) => (
                    <li key={p.id} className={`flex items-center gap-3 px-4 py-3 ${p.isActive === false ? "opacity-60" : ""}`}>
                      <button onClick={() => openProduct(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        {p.image ? <img src={p.image} alt="" className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" /> : <span className="h-12 w-12 flex-shrink-0 rounded-lg bg-[#f1f1f1]" />}
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-[13px] font-semibold text-[#303030]">{p.name}</span>
                            {p.isFeatured && <span className="badge badge-info">Destacado</span>}
                            {p.soldOut && <span className="badge badge-critical">Agotado</span>}
                            {p.isActive === false && <span className="badge">Oculto</span>}
                          </span>
                          <span className="block truncate text-[12px] text-[#8a8a8a]">
                            {p.description || "Sin descripción"}
                            {p.optionGroups.length > 0 && ` · ${p.optionGroups.length} ${p.optionGroups.length === 1 ? "grupo de opciones" : "grupos de opciones"}`}
                          </span>
                        </span>
                      </button>
                      <span className="text-right text-[13px] font-semibold text-[#303030]">
                        {money(p.price, sym)}
                        {p.comparePrice ? <span className="block text-[11px] font-normal text-[#8a8a8a] line-through">{money(p.comparePrice, sym)}</span> : null}
                      </span>
                      <div className="hidden items-center gap-3 sm:flex">
                        <label className="flex items-center gap-1.5 text-[12px] text-[#616161]" title="Visible en el menú">
                          <Toggle on={p.isActive !== false} onChange={(v) => quickUpdate(p, { isActive: v })} label="Visible" /> Visible
                        </label>
                        <label className="flex items-center gap-1.5 text-[12px] text-[#616161]" title="Marcar agotado por hoy">
                          <Toggle on={p.soldOut} onChange={(v) => quickUpdate(p, { soldOut: v })} label="Agotado" /> Agotado
                        </label>
                      </div>
                      <button onClick={() => duplicate(p)} className="btn-ghost !px-2 text-[#8a8a8a]" title="Duplicar" aria-label={`Duplicar ${p.name}`}>⧉</button>
                      <button onClick={() => removeProduct(p)} className="btn-ghost !px-2 text-[#8a8a8a]" title="Eliminar" aria-label={`Eliminar ${p.name}`}>✕</button>
                    </li>
                  ))}
                </ul>
              )}
              {!search && (
                <form
                  onSubmit={(e) => { e.preventDefault(); quickAdd(g.id); }}
                  className="flex items-center gap-2 border-t border-[#ebebeb] bg-[#fafafa] px-4 py-2.5"
                >
                  <input
                    id={`quick-name-${g.id || "none"}`}
                    className="input-field"
                    placeholder="Agregar plato rápido: nombre"
                    value={quick[g.id]?.name || ""}
                    maxLength={100}
                    onChange={(e) => setQuick((m) => ({ ...m, [g.id]: { name: e.target.value, price: m[g.id]?.price || "" } }))}
                  />
                  <input
                    className="input-field !w-24"
                    placeholder="Precio"
                    inputMode="decimal"
                    value={quick[g.id]?.price || ""}
                    onChange={(e) => setQuick((m) => ({ ...m, [g.id]: { name: m[g.id]?.name || "", price: e.target.value } }))}
                  />
                  <button className="btn-secondary" disabled={!quick[g.id]?.name?.trim() || !quick[g.id]?.price}>Agregar</button>
                </form>
              )}
            </section>
          ))}
        </div>
      </div>

      {draft && (
        <ProductModal
          draft={draft}
          setDraft={setDraft}
          categories={categories}
          products={products}
          onClose={() => setDraft(null)}
          onSave={saveProduct}
          saving={saving}
          error={error}
        />
      )}
    </main>
  );
}
