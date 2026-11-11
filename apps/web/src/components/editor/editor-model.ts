/** Modelo del editor: tipos del sitio y operaciones puras sobre páginas y bloques. */

export interface Block { id: string; type: string; content: any; styles: any; sortOrder: number; }
export interface SitePage { id: string; name: string; slug: string; path: string; isDefault: boolean; sortOrder: number; blocks: Block[]; }
export interface Site { id: string; name: string; subdomain: string; domain?: string; isPublished: boolean; primaryColor: string; secondaryColor?: string; logoUrl?: string; faviconUrl?: string; seoTitle?: string; seoDesc?: string; settings?: any; pages: SitePage[]; hasUnpublishedChanges?: boolean; }

export const SHARED_BLOCK_TYPES = new Set(["header", "footer"]);
export const byOrder = (a: Block, b: Block) => a.sortOrder - b.sortOrder;
export const sameJson = (a: any, b: any) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Aplica un cambio a un bloque. El header y el footer son compartidos: el API copia sus
 * cambios a todas las páginas, así que aquí se reflejan también en las demás páginas.
 */
export function patchBlock(site: Site, blockId: string, patch: Partial<Block>): Site {
  let type: string | undefined;
  for (const pg of site.pages) for (const b of pg.blocks) if (b.id === blockId) type = b.type;
  const shared = !!type && SHARED_BLOCK_TYPES.has(type);
  return {
    ...site,
    pages: site.pages.map((pg) => ({
      ...pg,
      blocks: pg.blocks.map((b) => (b.id === blockId || (shared && b.type === type) ? { ...b, ...patch } : b)),
    })),
  };
}

/** Restaura los bloques de una instantánea del historial sin tocar páginas ni ajustes actuales. */
export function withSnapshotBlocks(current: Site, snapshot: Site): Site {
  return {
    ...current,
    pages: current.pages.map((pg) => {
      const snap = snapshot.pages.find((p) => p.id === pg.id);
      return snap ? { ...pg, blocks: JSON.parse(JSON.stringify(snap.blocks)) } : pg;
    }),
  };
}

export function remapBlockIds(site: Site, ids: Map<string, string>): Site {
  return { ...site, pages: site.pages.map((pg) => ({ ...pg, blocks: pg.blocks.map((b) => (ids.has(b.id) ? { ...b, id: ids.get(b.id)! } : b)) })) };
}

/** Slug libre dentro del sitio: base, base-2, base-3… */
export function uniqueSlug(pages: Pick<SitePage, "slug">[], base: string): string {
  const taken = new Set(pages.map((p) => p.slug));
  const clean = base || "pagina";
  if (!taken.has(clean)) return clean;
  let i = 2;
  while (taken.has(`${clean}-${i}`)) i++;
  return `${clean}-${i}`;
}

export function slugify(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
