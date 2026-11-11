"use client";

import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HiOutlineChevronRight, HiOutlineDuplicate, HiOutlineEye, HiOutlineEyeOff, HiOutlinePlusCircle, HiOutlineTrash, HiOutlineViewGrid } from "react-icons/hi";
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

const SHARED = new Set(["header", "footer"]);

function RowContent({ block, active, onSelect, onDuplicate, onToggleHidden, onDelete, handle }: {
  block: SidebarBlock; active: boolean; handle?: React.ReactNode;
  onSelect: (id: string) => void; onDuplicate: (id: string) => void; onToggleHidden: (id: string) => void; onDelete: (id: string) => void;
}) {
  const act = "rounded p-1 text-[#8a8a8a] hover:bg-[#e3e3e3] hover:text-[#303030]";
  const shared = SHARED.has(block.type);
  return (
    <div className={`group flex items-center rounded-lg ${active ? "bg-[#ebebeb]" : "hover:bg-[#f1f1f1]"}`}>
      {handle ?? <span className="w-6" />}
      <button
        onClick={() => onSelect(block.id)}
        className={`flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-1 text-left text-[13px] ${active ? "font-semibold text-[#303030]" : "text-[#303030]"} ${block.hidden ? "opacity-50" : ""}`}
      >
        <HiOutlineViewGrid className="h-4 w-4 flex-shrink-0 text-[#8a8a8a]" />
        <span className="truncate">{BLOCK_META[block.type]?.label || block.type}</span>
      </button>
      <div className={`mr-1 items-center gap-0.5 ${block.hidden ? "flex" : "hidden group-hover:flex"}`}>
        <button onClick={() => onToggleHidden(block.id)} className={act} title={block.hidden ? "Mostrar sección" : "Ocultar sección"}>
          {block.hidden ? <HiOutlineEyeOff className="h-3.5 w-3.5" /> : <HiOutlineEye className="h-3.5 w-3.5" />}
        </button>
        {!shared && <button onClick={() => onDuplicate(block.id)} className={`${act} ${block.hidden ? "hidden group-hover:block" : ""}`} title="Duplicar"><HiOutlineDuplicate className="h-3.5 w-3.5" /></button>}
        <button onClick={() => onDelete(block.id)} className={`${act} hover:!text-[#c70a24] ${block.hidden ? "hidden group-hover:block" : ""}`} title="Eliminar"><HiOutlineTrash className="h-3.5 w-3.5" /></button>
      </div>
      <HiOutlineChevronRight className="mr-2 h-3.5 w-3.5 flex-shrink-0 text-[#b5b5b5] group-hover:hidden" />
    </div>
  );
}

function SortableRow(props: Omit<Parameters<typeof RowContent>[0], "handle">) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.block.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? "relative z-10 rounded-lg bg-white opacity-90 shadow-lg" : ""}>
      <RowContent
        {...props}
        handle={
          <button {...attributes} {...listeners} className="flex w-6 flex-shrink-0 cursor-grab touch-none justify-center py-2 text-[#b5b5b5] opacity-0 hover:text-[#616161] active:cursor-grabbing group-hover:opacity-100" title="Arrastrar para reordenar" aria-label="Arrastrar para reordenar">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a1.2 1.2 0 100 2.4A1.2 1.2 0 007 4zm6 0a1.2 1.2 0 100 2.4A1.2 1.2 0 0013 4zM7 8.8a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zm6 0a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zM7 13.6a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zm6 0a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" /></svg>
          </button>
        }
      />
    </li>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <p className="px-2 pb-1 pt-3 text-[12px] font-semibold text-[#616161]">{children}</p>;
}

/**
 * Lista de secciones de la página, agrupada como el personalizador de Shopify:
 * Encabezado (compartido), Plantilla (secciones de la página) y Pie de página (compartido).
 */
export function SectionsSidebar({ pageName, blocks, activeBlockId, onSelect, onReorder, onDuplicate, onToggleHidden, onDelete, onAdd }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const headers = blocks.filter((b) => b.type === "header");
  const footers = blocks.filter((b) => b.type === "footer");
  const body = blocks.filter((b) => !SHARED.has(b.type));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = body.map((b) => b.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    // El encabezado queda arriba y el pie abajo; solo se reordena el cuerpo.
    onReorder([...headers.map((b) => b.id), ...arrayMove(ids, from, to), ...footers.map((b) => b.id)]);
  };
  const rowProps = { onSelect, onDuplicate, onToggleHidden, onDelete };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#ebebeb] px-4 py-3">
        <p className="text-[12px] text-[#616161]">Página</p>
        <p className="truncate text-[14px] font-semibold text-[#303030]">{pageName || "—"}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {headers.length > 0 && (
          <>
            <GroupTitle>Encabezado</GroupTitle>
            <ul>{headers.map((b) => <li key={b.id}><RowContent block={b} active={b.id === activeBlockId} {...rowProps} /></li>)}</ul>
          </>
        )}

        <GroupTitle>Plantilla</GroupTitle>
        {body.length === 0 && <p className="px-2 py-3 text-[13px] text-[#8a8a8a]">Esta página aún no tiene secciones.</p>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={body.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ul>{body.map((b) => <SortableRow key={b.id} block={b} active={b.id === activeBlockId} {...rowProps} />)}</ul>
          </SortableContext>
        </DndContext>
        <button onClick={onAdd} className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[color:var(--color-primary)] hover:bg-[#f1f1f1]">
          <HiOutlinePlusCircle className="ml-6 h-4 w-4" />
          Agregar sección
        </button>

        {footers.length > 0 && (
          <>
            <GroupTitle>Pie de página</GroupTitle>
            <ul>{footers.map((b) => <li key={b.id}><RowContent block={b} active={b.id === activeBlockId} {...rowProps} /></li>)}</ul>
          </>
        )}
      </div>
      <p className="border-t border-[#ebebeb] px-4 py-3 text-[12px] leading-snug text-[#616161]">
        Elige una sección para editarla, o haz clic en cualquier texto o imagen de la página.
      </p>
    </div>
  );
}
