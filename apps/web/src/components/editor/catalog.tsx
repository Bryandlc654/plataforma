"use client";

import { createContext, useEffect, useState } from "react";
import api from "@/lib/api";
import { CATALOG_SECTIONS, type CatalogProduct } from "@/lib/templates";

export interface CatalogCategory { id: string; name: string; }
export interface CatalogData { products: CatalogProduct[]; categories: CatalogCategory[]; loaded: boolean; }

const EMPTY: CatalogData = { products: [], categories: [], loaded: false };

/** Categorías de la tienda para el selector "Categoría" de las secciones de productos. */
export const CatalogContext = createContext<CatalogData>(EMPTY);

/** ¿Alguna página usa una sección que puede mostrar productos en vivo? */
export function usesCatalog(pages: { blocks: { type: string; content: any }[] }[] | undefined): boolean {
  return (pages || []).some((pg) => pg.blocks.some((b) => CATALOG_SECTIONS.has(`${b.content?.variant || "generic"}/${b.type}`)));
}

/**
 * Catálogo de la tienda (productos y categorías) para mostrar en el editor y en la vista
 * previa exactamente lo que verá el sitio publicado. Solo se pide si hace falta.
 */
export function useCatalog(enabled: boolean): CatalogData {
  const [data, setData] = useState<CatalogData>(EMPTY);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    Promise.all([
      api.get("/products").then((r: any) => (r?.data ?? r) || []).catch(() => []),
      api.get("/product-categories").then((r: any) => (r?.data ?? r) || []).catch(() => []),
    ]).then(([products, categories]) => {
      if (alive) setData({ products: Array.isArray(products) ? products : [], categories: Array.isArray(categories) ? categories : [], loaded: true });
    });
    return () => { alive = false; };
  }, [enabled]);
  return data;
}
