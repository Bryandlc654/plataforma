"use client";

import { useMemo, useRef, useState } from "react";
import { HiOutlineAdjustments, HiOutlinePlus, HiOutlineX } from "react-icons/hi";
import { BLOCK_META } from "@/components/blocks";
import { BlockRenderer } from "@/components/blocks/renderers/block-renderer";
import { ImageField } from "@/components/blocks/editors/image-field";
import type { SitePalette } from "@/lib/site-palette";
import { collectStrings, isTextLeaf, matchImageLeaf, matchTextLeaf, setIn, type Path } from "./inline-edit";

interface Props {
  /** Bloque tal como se dibuja (puede incluir enlaces inyectados). */
  block: { id: string; type: string; content: any };
  /** Contenido guardado: es la base de las ediciones en línea. */
  sourceContent: any;
  active: boolean;
  hidden?: boolean;
  onSelect: (id: string) => void;
  onInsertAfter: (id: string) => void;
  onContentChange: (id: string, content: any) => void;
  onOpenSettings: () => void;
  palette?: SitePalette;
}

/** Sección del lienzo: edición directa de textos e imágenes; sin tarjeta ni formularios. */
export function CanvasBlock({ block, sourceContent, active, hidden, onSelect, onInsertAfter, onContentChange, onOpenSettings, palette }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [imagePath, setImagePath] = useState<Path | null>(null);
  /** Al editar texto el navegador reemplaza los nodos que React conoce; se vuelve a montar el bloque para mantenerlos sincronizados. */
  const [epoch, setEpoch] = useState(0);
  const leaves = useMemo(() => collectStrings(sourceContent), [sourceContent]);

  const startTextEdit = (el: HTMLElement, path: Path, original: string) => {
    const multiline = original.includes("\n");
    const prev = { outline: el.style.outline, offset: el.style.outlineOffset, cursor: el.style.cursor };
    el.contentEditable = "true";
    el.style.outline = "2px solid var(--color-secondary, #f29200)";
    el.style.outlineOffset = "2px";
    el.style.cursor = "text";
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    let cancelled = false;
    const finish = () => {
      el.removeEventListener("blur", finish);
      el.removeEventListener("keydown", onKey);
      el.removeAttribute("contenteditable");
      el.style.outline = prev.outline;
      el.style.outlineOffset = prev.offset;
      el.style.cursor = prev.cursor;
      const next = multiline ? el.innerText : (el.textContent || "").replace(/\s*\n\s*/g, " ");
      if (!cancelled && next !== original) onContentChange(block.id, setIn(sourceContent, path, next));
      setEpoch((n) => n + 1);
    };
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") { cancelled = true; el.blur(); }
      else if (e.key === "Enter" && !(multiline && e.shiftKey)) { e.preventDefault(); el.blur(); }
    };
    el.addEventListener("blur", finish);
    el.addEventListener("keydown", onKey);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    const root = rootRef.current;
    if (!root) return;
    const target = e.target as HTMLElement;
    if (target.isContentEditable) return; // ya se está escribiendo
    if (target.closest("[data-inline-dialog], [data-editor-ui]")) return; // diálogo de imagen y controles del editor
    // En el editor los enlaces y botones no navegan.
    if (target.closest("a, button, form")) e.preventDefault();

    const stack = document.elementsFromPoint(e.clientX, e.clientY).filter((n): n is HTMLElement => n instanceof HTMLElement && root.contains(n) && n !== root);
    for (const el of stack) {
      if (isTextLeaf(el)) {
        const leaf = matchTextLeaf(root, el, leaves);
        if (leaf) { e.stopPropagation(); onSelect(block.id); startTextEdit(el, leaf.path, leaf.value); return; }
      }
      const img = matchImageLeaf(el, leaves);
      if (img) { e.stopPropagation(); onSelect(block.id); setImagePath(img.path); return; }
    }
    onSelect(block.id);
  };

  const imageValue = imagePath ? imagePath.reduce<any>((n, k) => n?.[k as any], sourceContent) : "";

  return (
    <div id={`block-${block.id}`} ref={rootRef} onClickCapture={onClickCapture} className="inline-edit-root group/block relative cursor-pointer">
      <div
        className={`pointer-events-none absolute inset-0 z-10 transition-colors ${active ? "ring-2 ring-inset ring-[color:var(--color-primary)]" : "ring-0 ring-inset ring-[color:color-mix(in_srgb,var(--color-primary)_40%,transparent)] group-hover/block:ring-2"}`}
      />
      <div data-editor-ui className={`absolute left-2 top-2 z-20 flex items-center gap-1 transition-opacity ${active || hidden ? "opacity-100" : "pointer-events-none opacity-0 group-hover/block:opacity-100"}`}>
        <span className="rounded-md bg-[color:var(--color-primary)] px-2 py-0.5 text-[11px] font-medium text-white shadow">
          {BLOCK_META[block.type]?.label || block.type}{hidden ? " · Oculta" : ""}
        </span>
        {active && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
            className="flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-primary)] shadow ring-1 ring-slate-200 hover:bg-slate-50"
            title="Más opciones de esta sección"
          >
            <HiOutlineAdjustments className="h-3.5 w-3.5" />Ajustes
          </button>
        )}
      </div>
      <div key={epoch} className={hidden ? "opacity-40 grayscale" : ""}>
        <BlockRenderer type={block.type} content={block.content} palette={palette} />
      </div>
      <button
        data-editor-ui
        onClick={(e) => { e.stopPropagation(); onInsertAfter(block.id); }}
        title="Agregar sección aquí"
        className="absolute -bottom-3.5 left-1/2 z-30 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-white opacity-0 shadow-lg ring-2 ring-white transition-opacity hover:scale-110 group-hover/block:opacity-100"
      >
        <HiOutlinePlus className="h-4 w-4" />
      </button>

      {imagePath && (
        <div data-inline-dialog className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4" onKeyDown={(e) => e.key === "Escape" && setImagePath(null)} onClick={(e) => { e.stopPropagation(); setImagePath(null); }}>
          <div className="w-full max-w-sm cursor-default rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Cambiar imagen</h3>
              <button onClick={() => setImagePath(null)} className="text-slate-400 hover:text-slate-600"><HiOutlineX className="h-4 w-4" /></button>
            </div>
            <ImageField
              label="Imagen"
              value={imageValue}
              onChange={(v) => { onContentChange(block.id, setIn(sourceContent, imagePath, v)); if (v) setImagePath(null); }}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .inline-edit-root :is(h1,h2,h3,h4,h5,h6,p,span,a,button,li,label,small,strong,em,blockquote,td,th):not(:has(*)):hover {
          outline: 1px dashed color-mix(in srgb, var(--color-secondary, #f29200) 90%, transparent);
          outline-offset: 2px;
          cursor: text;
        }
      `}</style>
    </div>
  );
}
