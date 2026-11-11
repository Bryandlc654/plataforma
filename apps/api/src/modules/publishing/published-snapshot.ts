/**
 * Copia publicada de un sitio.
 *
 * El editor guarda automáticamente en las tablas de páginas y bloques (el borrador). El
 * sitio público NO lee ese borrador: lee la copia que se guarda al pulsar "Publicar"
 * (`site.publishedSnapshot`). Así los cambios a medio hacer no llegan a los visitantes.
 */

export interface SnapshotBlock {
  id: string;
  type: string;
  content: any;
  styles: any;
  sortOrder: number;
}

export interface SnapshotPage {
  id: string;
  name: string;
  slug: string;
  path: string;
  isDefault: boolean;
  seoTitle: string | null;
  seoDesc: string | null;
  sortOrder: number;
  isPublished: boolean;
  blocks: SnapshotBlock[];
}

export interface PublishedSnapshot {
  version: 1;
  publishedAt: string;
  pages: SnapshotPage[];
}

const byOrder = (a: { sortOrder: number }, b: { sortOrder: number }) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
const clone = <T>(v: T): T => (v == null ? v : JSON.parse(JSON.stringify(v)));

/** Arma la copia a partir de las páginas y bloques actuales (el borrador). */
export function buildSnapshot(pages: any[], publishedAt = new Date()): PublishedSnapshot {
  return {
    version: 1,
    publishedAt: publishedAt.toISOString(),
    pages: [...(pages || [])].sort(byOrder).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      path: p.path,
      isDefault: !!p.isDefault,
      seoTitle: p.seoTitle ?? null,
      seoDesc: p.seoDesc ?? null,
      sortOrder: p.sortOrder ?? 0,
      isPublished: !!p.isPublished,
      blocks: [...(p.blocks || [])].sort(byOrder).map((b: any) => ({
        id: b.id,
        type: b.type,
        content: clone(b.content ?? {}),
        styles: clone(b.styles ?? null),
        sortOrder: b.sortOrder ?? 0,
      })),
    })),
  };
}

export function isSnapshot(value: unknown): value is PublishedSnapshot {
  return !!value && typeof value === "object" && Array.isArray((value as any).pages);
}

/** Páginas de la copia, listas para dibujar (copias independientes: se pueden modificar). */
export function snapshotPages(snapshot: PublishedSnapshot): any[] {
  return clone(snapshot.pages);
}

/** JSON con claves ordenadas: MySQL reordena las claves de las columnas JSON. */
function stableStringify(value: any): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().filter((k) => value[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/** Forma comparable (sin fechas ni orden de propiedades) para detectar cambios sin publicar. */
function comparable(pages: any[]): string {
  return stableStringify(buildSnapshot(pages, new Date(0)).pages);
}

/** ¿El borrador tiene cambios que aún no se publicaron? */
export function hasUnpublishedChanges(snapshot: unknown, livePages: any[]): boolean {
  if (!isSnapshot(snapshot)) return true;
  return comparable(snapshot.pages) !== comparable(livePages);
}
