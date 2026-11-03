"use client";

import { HiOutlinePlus } from "react-icons/hi";
import { BLOCK_META } from "@/components/blocks";
import { BlockRenderer } from "@/components/blocks/renderers/block-renderer";
import type { SitePalette } from "@/lib/site-palette";

interface Props {
  block: { id: string; type: string; content: any };
  active: boolean;
  hidden?: boolean;
  onSelect: (id: string) => void;
  onInsertAfter: (id: string) => void;
  palette?: SitePalette;
}

/** Sección del lienzo: sin tarjeta; se resalta al pasar el cursor o al seleccionarla. */
export function CanvasBlock({ block, active, hidden, onSelect, onInsertAfter, palette }: Props) {
  return (
    <div id={`block-${block.id}`} onClick={() => onSelect(block.id)} className="group/block relative cursor-pointer">
      <div
        className={`pointer-events-none absolute inset-0 z-10 transition-colors ${active ? "ring-2 ring-inset ring-[#201b51]" : "ring-0 ring-inset ring-[#201b51]/40 group-hover/block:ring-2"}`}
      />
      <span
        className={`pointer-events-none absolute left-2 top-2 z-20 rounded-md bg-[#201b51] px-2 py-0.5 text-[11px] font-medium text-white shadow transition-opacity ${active || hidden ? "opacity-100" : "opacity-0 group-hover/block:opacity-100"}`}
      >
        {BLOCK_META[block.type]?.label || block.type}{hidden ? " · Oculta" : ""}
      </span>
      <div className={hidden ? "opacity-40 grayscale" : ""}>
        <BlockRenderer type={block.type} content={block.content} palette={palette} />
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onInsertAfter(block.id); }}
        title="Agregar sección aquí"
        className="absolute -bottom-3.5 left-1/2 z-30 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-[#201b51] text-white opacity-0 shadow-lg ring-2 ring-white transition-opacity hover:scale-110 group-hover/block:opacity-100"
      >
        <HiOutlinePlus className="h-4 w-4" />
      </button>
    </div>
  );
}
