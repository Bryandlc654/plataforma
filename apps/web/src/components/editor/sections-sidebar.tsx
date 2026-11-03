"use client";

import { HiOutlineArrowDown, HiOutlineArrowUp, HiOutlinePlus, HiOutlineTrash, HiOutlineViewGrid } from "react-icons/hi";
import { BLOCK_META } from "@/components/blocks";

interface BlockLite { id: string; type: string; }

interface Props {
  pageName?: string;
  blocks: BlockLite[];
  activeBlockId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function SectionsSidebar({ pageName, blocks, activeBlockId, onSelect, onMove, onDelete, onAdd }: Props) {
  return (
    <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Página</p>
        <p className="truncate text-sm font-semibold text-slate-800">{pageName || "—"}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {blocks.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-slate-400">Esta página aún no tiene secciones.</p>
        )}
        <ul className="space-y-0.5">
          {blocks.map((b, i) => {
            const active = b.id === activeBlockId;
            return (
              <li key={b.id} className="group relative">
                <button
                  onClick={() => onSelect(b.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${active ? "bg-[#201b51]/10 font-semibold text-[#201b51]" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  <HiOutlineViewGrid className={`h-4 w-4 flex-shrink-0 ${active ? "text-[#201b51]" : "text-slate-400"}`} />
                  <span className="truncate">{BLOCK_META[b.type]?.label || b.type}</span>
                </button>
                <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-md bg-white/95 opacity-0 shadow-sm ring-1 ring-slate-200 group-hover:opacity-100">
                  {i > 0 && (
                    <button onClick={() => onMove(b.id, "up")} className="p-1 text-slate-400 hover:text-slate-700" title="Subir"><HiOutlineArrowUp className="h-3.5 w-3.5" /></button>
                  )}
                  {i < blocks.length - 1 && (
                    <button onClick={() => onMove(b.id, "down")} className="p-1 text-slate-400 hover:text-slate-700" title="Bajar"><HiOutlineArrowDown className="h-3.5 w-3.5" /></button>
                  )}
                  <button onClick={() => onDelete(b.id)} className="p-1 text-slate-400 hover:text-red-600" title="Eliminar"><HiOutlineTrash className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          onClick={onAdd}
          className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#201b51] hover:bg-[#201b51]/5"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#201b51] text-white"><HiOutlinePlus className="h-3 w-3" /></span>
          Agregar sección
        </button>
      </div>
    </aside>
  );
}
