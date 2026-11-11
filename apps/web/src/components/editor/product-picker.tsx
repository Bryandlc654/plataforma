"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HiOutlineSearch, HiOutlineX } from "react-icons/hi";
import api from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: string | number;
  comparePrice?: string | number | null;
  images?: unknown;
  description?: string | null;
  isActive?: boolean;
  stock?: number;
}

function firstImage(images: unknown): string {
  if (typeof images === "string") return images;
  if (Array.isArray(images) && images.length) {
    const f = images[0] as any;
    return typeof f === "string" ? f : f?.url || f?.src || "";
  }
  return "";
}

const money = (v: unknown) => (v == null || v === "" ? "" : Number(v).toFixed(2));

/** Convierte un producto de la tienda en un elemento de la plantilla (mismo id: el carrito funciona). */
export function productToItem(p: Product, previous?: Record<string, any>) {
  const compare = p.comparePrice != null && Number(p.comparePrice) > Number(p.price) ? money(p.comparePrice) : "";
  return {
    ...(previous || {}),
    id: p.id,
    title: p.name,
    price: money(p.price),
    compareAt: compare,
    image: firstImage(p.images) || previous?.image || "",
    desc: previous?.desc ?? "",
  };
}

/**
 * Elegir productos del módulo E-commerce para una sección de productos. Así el id coincide
 * con el producto real y el carrito y el checkout funcionan sin escribir códigos a mano.
 */
export function ProductPicker({ selectedIds, onAdd, onClose }: { selectedIds: string[]; onAdd: (products: Product[]) => void; onClose: () => void }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    api.get("/products")
      .then((res: any) => setProducts(((res?.data ?? res) || []) as Product[]))
      .catch(() => setError(true));
  }, []);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (products || []).filter((p) => p.isActive !== false && (!term || p.name.toLowerCase().includes(term)));
  }, [products, q]);

  const toggle = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.25)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#ebebeb] px-4 py-3">
          <h3 className="text-[14px] font-semibold text-[#303030]">Agregar productos de tu tienda</h3>
          <button onClick={onClose} className="rounded-md p-1 text-[#616161] hover:bg-[#f1f1f1]" aria-label="Cerrar"><HiOutlineX className="h-4 w-4" /></button>
        </div>
        <div className="border-b border-[#ebebeb] p-3">
          <div className="relative">
            <HiOutlineSearch className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a8a]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar productos" autoFocus className="input-field !pl-8" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {error && <p className="p-4 text-[13px] text-[#8e0b21]">No se pudieron cargar los productos.</p>}
          {!error && products === null && <p className="p-4 text-[13px] text-[#616161]">Cargando productos…</p>}
          {products !== null && list.length === 0 && (
            <div className="p-6 text-center text-[13px] text-[#616161]">
              {products.length === 0 ? <>Aún no tienes productos. <Link href="/dashboard/ecommerce" target="_blank" className="font-medium text-[color:var(--color-primary)] hover:underline">Crear productos</Link></> : "Ningún producto coincide con la búsqueda."}
            </div>
          )}
          <ul className="divide-y divide-[#ebebeb]">
            {list.map((p) => {
              const already = selectedIds.includes(p.id);
              const checked = picked.includes(p.id);
              const img = firstImage(p.images);
              return (
                <li key={p.id}>
                  <label className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${already ? "opacity-50" : "hover:bg-[#f7f7f7]"}`}>
                    <input type="checkbox" disabled={already} checked={checked || already} onChange={() => toggle(p.id)} className="h-4 w-4 rounded border-[#8a8a8a]" />
                    {img ? <img src={img} alt="" className="h-10 w-10 flex-shrink-0 rounded-md object-cover" /> : <span className="h-10 w-10 flex-shrink-0 rounded-md bg-[#f1f1f1]" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[#303030]">{p.name}</span>
                      <span className="block text-[12px] text-[#616161]">${money(p.price)}{already ? " · ya está en la sección" : ""}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#ebebeb] p-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button
            disabled={picked.length === 0}
            onClick={() => { onAdd((products || []).filter((p) => picked.includes(p.id))); onClose(); }}
            className="btn-primary"
          >
            Agregar {picked.length > 0 ? picked.length : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
