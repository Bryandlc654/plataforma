/**
 * Edición en línea genérica: relaciona un elemento del lienzo con el valor (string) del
 * `content` del bloque que lo originó, sin tener que tocar cada renderer.
 */

export type Path = (string | number)[];
export interface Leaf { path: Path; value: string; }

export const norm = (s: string) => s.replace(/\s+/g, " ").trim();

export function collectStrings(node: any, path: Path = [], out: Leaf[] = []): Leaf[] {
  if (typeof node === "string") {
    if (node.trim()) out.push({ path, value: node });
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => collectStrings(v, [...path, i], out));
  } else if (node && typeof node === "object") {
    Object.keys(node).forEach((k) => collectStrings(node[k], [...path, k], out));
  }
  return out;
}

export function setIn(node: any, path: Path, value: any): any {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const copy: any = Array.isArray(node) ? [...node] : { ...node };
  copy[head as any] = setIn(node?.[head as any], rest, value);
  return copy;
}

/**
 * ¿Es un elemento HTML? No usa `instanceof HTMLElement` porque el lienzo vive en un
 * iframe y sus nodos pertenecen a otro `window`.
 */
export function isHtmlElement(node: unknown): node is HTMLElement {
  return !!node && (node as Node).nodeType === 1 && typeof (node as HTMLElement).tagName === "string" && "style" in (node as object);
}

/** Elemento "hoja" con texto propio: sin elementos hijos (salvo <br>). */
export function isTextLeaf(el: Element): boolean {
  if (!isHtmlElement(el)) return false;
  if (["IMG", "SVG", "VIDEO", "IFRAME", "INPUT", "TEXTAREA", "SELECT", "SCRIPT", "STYLE"].includes(el.tagName.toUpperCase())) return false;
  if (Array.from(el.children).some((c) => c.tagName !== "BR")) return false;
  return !!norm(el.textContent || "");
}

/** Hoja de texto que corresponde al elemento (resuelve valores repetidos por orden de aparición). */
export function matchTextLeaf(root: HTMLElement, el: HTMLElement, leaves: Leaf[]): Leaf | null {
  const text = norm(el.textContent || "");
  if (!text) return null;
  const candidates = leaves.filter((l) => !/[<>]/.test(l.value) && norm(l.value) === text);
  if (candidates.length === 0) return null;
  const sameText = Array.from(root.querySelectorAll<HTMLElement>("*")).filter((n) => isTextLeaf(n) && norm(n.textContent || "") === text);
  const k = Math.max(0, sameText.indexOf(el));
  return candidates[Math.min(k, candidates.length - 1)];
}

function bgUrl(el: HTMLElement): string {
  const view = el.ownerDocument?.defaultView || window;
  const bg = view.getComputedStyle(el).backgroundImage;
  const m = /url\(["']?(.*?)["']?\)/.exec(bg || "");
  return m ? m[1] : "";
}

/** Hoja de imagen (src o background-image) que corresponde al elemento. */
export function matchImageLeaf(el: HTMLElement, leaves: Leaf[]): Leaf | null {
  const src = el.tagName === "IMG" ? (el.getAttribute("src") || "") : bgUrl(el);
  if (!src) return null;
  let decoded = src;
  try { decoded = decodeURIComponent(src); } catch { /* sin decodificar */ }
  return (
    leaves.find((l) => l.value && /^(https?:|\/|data:)/.test(l.value) && (src === l.value || src.includes(l.value) || decoded.includes(l.value))) || null
  );
}

/**
 * Texto marcado en la plantilla con `data-ed="clave"` (o `clave::0::sub` para rutas):
 * se edita aunque el valor aún no exista en el contenido (usa el texto por defecto).
 */
export function matchMarkedLeaf(el: HTMLElement, root: HTMLElement): Leaf | null {
  const marked = el.closest<HTMLElement>("[data-ed]");
  if (!marked || !root.contains(marked) || !isTextLeaf(marked)) return null;
  const key = marked.getAttribute("data-ed") || "";
  if (!key) return null;
  const path: Path = key.split("::").map((k) => (/^\d+$/.test(k) ? Number(k) : k));
  return { path, value: marked.innerText ?? marked.textContent ?? "" };
}

