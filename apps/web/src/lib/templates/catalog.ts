// ARCHIVO GENERADO desde packages/shared/src/templates — no editar aquí.
// Ejecuta `npm run sync:templates -w apps/web` tras cambiar la fuente.

/**
 * Productos en vivo desde el catálogo de la tienda para las secciones de productos.
 * La misma lógica la usan el editor (vista previa) y el API (sitio publicado), así que
 * ambos muestran exactamente los mismos productos.
 *
 * Opciones en el contenido de la sección:
 *   source:          "manual" = lista elegida a mano; "catalog" = siempre de la tienda;
 *                    sin valor = de la tienda si tiene productos, si no la lista a mano.
 *   catalogCategory: "" todas · "featured" destacados · id de una categoría
 *   catalogSort:     "" destacados primero · "newest" · "price-asc" · "price-desc" · "name"
 *   catalogLimit:    cuántos mostrar (1–48, por defecto 12)
 *   hideSoldOut:     "true" para ocultar los agotados (stock 0)
 */

export interface CatalogProduct {
  id: string;
  name: string;
  price: unknown;
  comparePrice?: unknown;
  images?: unknown;
  description?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  stock?: number | null;
  categoryId?: string | null;
  createdAt?: string | Date | null;
}

export interface CatalogItem {
  id: string;
  title: string;
  desc?: string;
  image: string;
  price: string;
  compareAt?: string;
  tag?: string;
  link?: string;
}

export const CATALOG_DEFAULT_LIMIT = 12;

/** Secciones que pueden mostrar productos en vivo: `${variante}/${tipo}`. */
export const CATALOG_SECTIONS = new Set(["urban-noir/portfolio"]);

export function isCatalogSection(type: string, content: any): boolean {
  return CATALOG_SECTIONS.has(`${content?.variant || "generic"}/${type}`) && content?.source !== "manual";
}

const money = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "";
};

export function firstProductImage(images: unknown): string {
  if (typeof images === "string") return images;
  if (Array.isArray(images) && images.length) {
    const f = images[0] as any;
    return typeof f === "string" ? f : f?.url || f?.src || "";
  }
  if (images && typeof images === "object") return (images as any).url || (images as any).src || "";
  return "";
}

/** Productos que se muestran según las opciones de la sección (filtro, orden y cantidad). */
export function selectCatalogProducts(products: CatalogProduct[], c: any): CatalogProduct[] {
  const category = String(c?.catalogCategory || "");
  const hideSoldOut = c?.hideSoldOut === true || c?.hideSoldOut === "true";
  const limit = Math.min(48, Math.max(1, Number(c?.catalogLimit) || CATALOG_DEFAULT_LIMIT));
  const time = (p: CatalogProduct) => (p.createdAt ? new Date(p.createdAt).getTime() : 0);

  let list = (products || []).filter((p) => p && p.isActive !== false);
  if (category === "featured") list = list.filter((p) => p.isFeatured);
  else if (category) list = list.filter((p) => p.categoryId === category);
  if (hideSoldOut) list = list.filter((p) => p.stock == null || Number(p.stock) > 0);

  const sort = String(c?.catalogSort || "");
  list = [...list].sort((a, b) => {
    if (sort === "newest") return time(b) - time(a);
    if (sort === "price-asc") return Number(a.price) - Number(b.price);
    if (sort === "price-desc") return Number(b.price) - Number(a.price);
    if (sort === "name") return String(a.name).localeCompare(String(b.name), "es");
    // Por defecto: destacados primero y luego los más nuevos.
    return Number(!!b.isFeatured) - Number(!!a.isFeatured) || time(b) - time(a);
  });
  return list.slice(0, limit);
}

/** Producto → elemento de la sección (mismo id que el producto: el carrito funciona). */
export function catalogItem(p: CatalogProduct, resolveImage: (url: string) => string = (u) => u): CatalogItem {
  const price = Number(p.price);
  const compare = p.comparePrice != null && p.comparePrice !== "" ? Number(p.comparePrice) : null;
  let tag: string | undefined;
  if (compare != null && compare > price) tag = `-${Math.max(1, Math.round((1 - price / compare) * 100))}%`;
  else if (p.isFeatured) tag = "Nuevo";
  const desc = p.description ? (p.description.length > 60 ? `${p.description.slice(0, 60)}…` : p.description) : undefined;
  const img = firstProductImage(p.images);
  const label = encodeURIComponent(String(p.name || "Producto").replace(/\s+/g, "+"));
  return {
    id: p.id,
    title: p.name,
    desc,
    image: img ? resolveImage(img) : `https://placehold.co/600x800/111827/FFFFFF?text=${label || "Producto"}`,
    price: money(price),
    compareAt: compare != null && compare > price ? money(compare) : undefined,
    tag,
  };
}

/**
 * Contenido de la sección con los productos de la tienda ya puestos en `items`.
 * Si la sección es manual (o la tienda no tiene productos y no se exige el catálogo), no cambia.
 */
export function applyCatalogToContent(type: string, content: any, products: CatalogProduct[], resolveImage?: (url: string) => string): any {
  if (!isCatalogSection(type, content)) return content;
  const selected = selectCatalogProducts(products, content);
  if (selected.length === 0 && content?.source !== "catalog") return content; // sin productos: la lista a mano
  return { ...content, items: selected.map((p) => catalogItem(p, resolveImage)) };
}
