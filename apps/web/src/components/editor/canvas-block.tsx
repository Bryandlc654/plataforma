"use client";

import { BLOCK_META } from "@/components/blocks";
import { BlockRenderer } from "@/components/blocks/renderers/block-renderer";
import type { SitePalette } from "@/lib/site-palette";

interface Props {
  block: { id: string; type: string; content: any };
  active: boolean;
  onSelect: (id: string) => void;
  palette?: SitePalette;
}

/** Sección del lienzo: sin tarjeta; solo se resalta al pasar el cursor o al seleccionarla. */
export function CanvasBlock({ block, active, onSelect, palette }: Props) {
  return (
    <div
      id={`block-${block.id}`}
      onClick={() => onSelect(block.id)}
      className="group/block relative cursor-pointer"
    >
      <div
        className={`pointer-events-none absolute inset-0 z-10 transition-colors ${active ? "ring-2 ring-inset ring-[#201b51]" : "ring-0 ring-inset ring-[#201b51]/40 group-hover/block:ring-2"}`}
      />
      <span
        className={`pointer-events-none absolute left-2 top-2 z-20 rounded-md bg-[#201b51] px-2 py-0.5 text-[11px] font-medium text-white shadow transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover/block:opacity-100"}`}
      >
        {BLOCK_META[block.type]?.label || block.type}
      </span>
      <BlockRenderer type={block.type} content={block.content} palette={palette} />
    </div>
  );
}
