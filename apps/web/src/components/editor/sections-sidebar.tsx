"use client";

import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HiOutlineDuplicate, HiOutlineEye, HiOutlineEyeOff, HiOutlinePlus, HiOutlineTrash, HiOutlineViewGrid } from "react-icons/hi";
import { BLOCK_META } from "@/components/blocks";

export interface SidebarBlock { id: string; type: string; hidden?: boolean; }

interface Props {
  pageName?: string;
  blocks: SidebarBlock[];
  activeBlockId: string | null;
  onSelect: (id: string) => void;
  onReorder: (ids: string[]) => void;
  onDuplicate: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

function Row({ block, active, onSelect, onDuplicate, onToggleHidden, onDelete }: {
  block: SidebarBlock; active: boolean;
  onSelect: (id: string) => void; onDuplicate: (id: string) => void; onToggleHidden: (id: string) => void; onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const act = "p-1 text-slate-400 hover:text-slate-700";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative ${isDragging ? "z-10 opacity-80 shadow-lg" : ""}`}
    >
      <div className={`flex items-center rounded-lg ${active ? "bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)]" : "hover:bg-slate-50"}`}>
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab touch-none px-1.5 py-2 text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          title="Arrastrar para reordenar"
          aria-label="Arrastrar para reordenar"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a1.2 1.2 0 100 2.4A1.2 1.2 0 007 4zm6 0a1.2 1.2 0 100 2.4A1.2 1.2 0 0013 4zM7 8.8a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zm6 0a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zM7 13.6a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zm6 0a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" /></svg>
        </button>
        <button
          onClick={() => onSelect(block.id)}
          className={`flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left text-[13px] ${active ? "font-semibold text-[color:var(--color-primary)]" : "text-slate-700"} ${block.hidden ? "opacity-50" : ""}`}
        >
          <HiOutlineViewGrid className={`h-4 w-4 flex-shrink-0 ${active ? "text-[color:var(--color-primary)]" : "text-slate-400"}`} />
          <span className="truncate">{BLOCK_META[block.type]?.label || block.type}</span>
        </button>
        <div className={`mr-1 items-center rounded-md bg-white/95 ring-1 ring-slate-200 ${block.hidden ? "flex" : "hidden group-hover:flex"}`}>
          <button onClick={() => onToggleHidden(block.id)} className={act} title={block.hidden ? "Mostrar sección" : "Ocultar sección"}>
            {block.hidden ? <HiOutlineEyeOff className="h-3.5 w-3.5" /> : <HiOutlineEye className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => onDuplicate(block.id)} className={`${act} ${block.hidden ? "hidden group-hover:block" : ""}`} title="Duplicar"><HiOutlineDuplicate className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDelete(block.id)} className={`${act} hover:!text-red-600 ${block.hidden ? "hidden group-hover:block" : ""}`} title="Eliminar"><HiOutlineTrash className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </li>
  );
}

export function SectionsSidebar({ pageName, blocks, activeBlockId, onSelect, onReorder, onDuplicate, onToggleHidden, onDelete, onAdd }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = blocks.map((b) => b.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  };

  return (
    <aside data-tour="sections" className="flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Página</p>
        <p className="truncate text-sm font-semibold text-slate-800">{pageName || "—"}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {blocks.length === 0 && <p className="px-2 py-6 text-center text-xs text-slate-400">Esta página aún no tiene secciones.</p>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-0.5">
              {blocks.map((b) => (
                <Row key={b.id} block={b} active={b.id === activeBlockId} onSelect={onSelect} onDuplicate={onDuplicate} onToggleHidden={onToggleHidden} onDelete={onDelete} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        <button onClick={onAdd} className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[color:var(--color-primary)] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_5%,transparent)]">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-white"><HiOutlinePlus className="h-3 w-3" /></span>
          Agregar sección
        </button>
      </div>
      <p className="border-t border-slate-100 px-4 py-3 text-[11px] leading-snug text-slate-400">Haz clic en cualquier texto o imagen de la página para editarlo directamente.</p>
    </aside>
  );
}
