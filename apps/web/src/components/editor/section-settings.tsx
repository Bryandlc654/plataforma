"use client";

import { useMemo, useState } from "react";
import {
  HiOutlineChevronDown, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineDuplicate, HiOutlineEye, HiOutlineEyeOff,
  HiOutlineArrowDown, HiOutlineArrowUp, HiOutlinePlus, HiOutlineTrash, HiOutlineX,
} from "react-icons/hi";
import { BLOCK_META } from "@/components/blocks";
import { ImageField } from "@/components/blocks/editors/image-field";
import { IconPicker } from "./icon-picker";
import { LinkField } from "./link-field";
import { blankItem, fieldsFor, type FieldDef } from "./template-fields";

interface Props {
  block: { id: string; type: string; content: any };
  hidden?: boolean;
  onChange: (content: any) => void;
  onBack: () => void;
  onToggleHidden: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const BR = /<br\s*\/?>/gi;
/** Los saltos de línea de la plantilla (<br/>) se muestran como saltos reales en el campo. */
const toInput = (v: unknown) => (v == null ? "" : String(v).replace(BR, "\n"));
/** Y al guardar, los saltos vuelven a ser <br/> (la plantilla los dibuja así). */
const fromInput = (s: string) => s.replace(/\r?\n/g, "<br/>");

const inputCls =
  "block w-full rounded-lg border border-[#8a8a8a]/50 bg-white px-2.5 py-1.5 text-[13px] text-[#303030] shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] outline-none transition placeholder:text-[#8a8a8a] focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary)_25%,transparent)]";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[13px] font-medium text-[#303030]">{children}</span>;
}

function FieldControl(props: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  const { field } = props;
  if (!field.hint || field.kind === "url") return <FieldInput {...props} />;
  return (
    <div>
      <FieldInput {...props} />
      <p className="mt-1 text-[12px] text-[#616161]">{field.hint}</p>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  switch (field.kind) {
    case "image":
      return <ImageField label={field.label} value={value || ""} onChange={onChange} />;
    case "icon": {
      // Cada plantilla usa su propia familia de íconos: Bootstrap (bi-…), Font Awesome (fa-…)
      // o nombres de Material Symbols / emojis (texto libre).
      const v = String(value || "");
      const family = /^bi-/.test(v) ? "bi" : /^fa[a-z-]*\s|^fa-/.test(v) ? "fa" : v ? "text" : "fa";
      return (
        <div className="block">
          <Label>{field.label}</Label>
          {family === "text"
            ? <input className={inputCls} value={v} onChange={(e) => onChange(e.target.value)} placeholder="Nombre del ícono" />
            : <IconPicker value={v} onChange={onChange} bi={family === "bi"} brand={/facebook|instagram|whatsapp|tiktok|twitter|youtube|linkedin|telegram/i.test(field.key + v)} />}
        </div>
      );
    }
    case "group":
      return (
        <fieldset className="rounded-lg border border-[#e3e3e3] p-3">
          <legend className="px-1 text-[12px] font-semibold text-[#616161]">{field.label}</legend>
          <div className="space-y-3">
            {(field.itemFields || []).map((f) =>
              f.kind === "list" || f.kind === "stringList"
                ? <ListControl key={f.key} field={f} value={value?.[f.key] || []} onChange={(v) => onChange({ ...(value || {}), [f.key]: v })} />
                : <FieldControl key={f.key} field={f} value={value?.[f.key] ?? ""} onChange={(v) => onChange({ ...(value || {}), [f.key]: v })} />,
            )}
          </div>
        </fieldset>
      );
    case "boolean":
      return (
        <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
          <span className="text-[13px] font-medium text-[#303030]">{field.label}</span>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-[#8a8a8a] text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)]" />
        </label>
      );
    case "number":
      return (
        <label className="block">
          <Label>{field.label}</Label>
          <input type="number" className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
        </label>
      );
    case "color":
      return (
        <label className="block">
          <Label>{field.label}</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded-md border border-[#8a8a8a]/50 bg-white p-0.5" />
            <input className={inputCls} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
          </div>
        </label>
      );
    case "select":
      return (
        <label className="block">
          <Label>{field.label}</Label>
          <select className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
            {(field.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      );
    case "url":
      return <LinkField label={field.label} hint={field.hint} value={value || ""} onChange={onChange} />;
    case "textarea":
      return (
        <label className="block">
          <Label>{field.label}</Label>
          <textarea className={`${inputCls} min-h-[72px] resize-y`} rows={3} value={toInput(value)} onChange={(e) => onChange(fromInput(e.target.value))} />
        </label>
      );
    default:
      return (
        <label className="block">
          <Label>{field.label}</Label>
          <input className={inputCls} value={toInput(value)} onChange={(e) => onChange(fromInput(e.target.value))} />
        </label>
      );
  }
}

function itemTitle(item: any, field: FieldDef, index: number): string {
  if (typeof item === "string") return item.replace(BR, " ") || `Elemento ${index + 1}`;
  const textField = (field.itemFields || []).find((f) => (f.kind === "text" || f.kind === "textarea") && item?.[f.key]);
  const raw = textField ? String(item[textField.key]) : "";
  return raw.replace(BR, " ").replace(/<[^>]+>/g, "").slice(0, 60) || `Elemento ${index + 1}`;
}

/** Lista editable: agregar, quitar, reordenar y editar cada elemento (como los "bloques" de Shopify). */
function ListControl({ field, value, onChange }: { field: FieldDef; value: any[]; onChange: (v: any[]) => void }) {
  const list = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState<number | null>(null);
  const isStrings = field.kind === "stringList";

  const update = (i: number, item: any) => onChange(list.map((it, j) => (j === i ? item : it)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(j);
  };
  const remove = (i: number) => { onChange(list.filter((_, j) => j !== i)); setOpen(null); };
  const add = () => { onChange([...list, isStrings ? "" : blankItem(field, list)]); setOpen(list.length); };

  return (
    <div>
      <Label>{field.label}</Label>
      {field.hint && <p className="-mt-0.5 mb-1.5 text-[12px] text-[#616161]">{field.hint}</p>}
      <ul className="overflow-hidden rounded-lg border border-[#e3e3e3] bg-white">
        {list.map((item, i) => (
          <li key={i} className="border-b border-[#ebebeb] last:border-b-0">
            {isStrings ? (
              <div className="flex items-center gap-1 p-1.5">
                <input className={inputCls} value={toInput(item)} onChange={(e) => update(i, fromInput(e.target.value))} />
                <button onClick={() => remove(i)} className="rounded p-1 text-[#8a8a8a] hover:bg-[#f1f1f1] hover:text-red-600" title="Quitar"><HiOutlineX className="h-4 w-4" /></button>
              </div>
            ) : (
              <>
                <div className="group flex items-center">
                  <button onClick={() => setOpen(open === i ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-[13px] text-[#303030] hover:bg-[#f7f7f7]">
                    <HiOutlineChevronRight className={`h-3.5 w-3.5 flex-shrink-0 text-[#8a8a8a] transition-transform ${open === i ? "rotate-90" : ""}`} />
                    <span className="truncate">{itemTitle(item, field, i)}</span>
                  </button>
                  <div className="flex items-center pr-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-[#8a8a8a] hover:bg-[#f1f1f1] disabled:opacity-30" title="Subir"><HiOutlineArrowUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => move(i, 1)} disabled={i === list.length - 1} className="rounded p-1 text-[#8a8a8a] hover:bg-[#f1f1f1] disabled:opacity-30" title="Bajar"><HiOutlineArrowDown className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(i)} className="rounded p-1 text-[#8a8a8a] hover:bg-[#f1f1f1] hover:text-red-600" title="Eliminar"><HiOutlineTrash className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {open === i && (
                  <div className="space-y-3 border-t border-[#ebebeb] bg-[#fafafa] p-3">
                    {(field.itemFields || []).map((f) =>
                      f.kind === "list" || f.kind === "stringList"
                        ? <ListControl key={f.key} field={f} value={item?.[f.key] || []} onChange={(v) => update(i, { ...(item || {}), [f.key]: v })} />
                        : <FieldControl key={f.key} field={f} value={item?.[f.key] ?? f.default ?? ""} onChange={(v) => update(i, { ...(item || {}), [f.key]: v })} />,
                    )}
                  </div>
                )}
              </>
            )}
          </li>
        ))}
        <li>
          <button onClick={add} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-[color:var(--color-primary)] hover:bg-[#f7f7f7]">
            <HiOutlinePlus className="h-3.5 w-3.5" /> Agregar {field.label.toLowerCase().replace(/^más /, "").replace(/«.*»/, "").replace(/s$/, "").replace(/(ione)$/, "ión")}
          </button>
        </li>
      </ul>
    </div>
  );
}

/**
 * Ajustes de una sección en la barra izquierda (como el personalizador de temas de Shopify).
 * El formulario sale del esquema de la plantilla: todo lo que la sección muestra es editable.
 */
export function SectionSettings({ block, hidden, onChange, onBack, onToggleHidden, onDuplicate, onDelete }: Props) {
  const fields = useMemo(() => fieldsFor(block.type, block.content), [block.type, block.content]);
  const content = block.content || {};
  const set = (key: string, v: any) => onChange({ ...content, [key]: v });
  const [showAll, setShowAll] = useState(false);

  // Primero lo esencial (textos e imágenes); las listas y el resto, debajo.
  const simple = fields.filter((f) => f.kind !== "list" && f.kind !== "stringList");
  const lists = fields.filter((f) => f.kind === "list" || f.kind === "stringList");
  const LIMIT = 14;
  const visibleSimple = showAll ? simple : simple.slice(0, LIMIT);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-[#ebebeb] px-2 py-2.5">
        <button onClick={onBack} className="rounded-md p-1.5 text-[#616161] hover:bg-[#f1f1f1]" title="Volver a las secciones"><HiOutlineChevronLeft className="h-4 w-4" /></button>
        <h2 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#303030]">{BLOCK_META[block.type]?.label || block.type}</h2>
        <button onClick={onToggleHidden} className="rounded-md p-1.5 text-[#616161] hover:bg-[#f1f1f1]" title={hidden ? "Mostrar sección" : "Ocultar sección"}>
          {hidden ? <HiOutlineEyeOff className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {fields.length === 0 && <p className="text-[13px] text-[#616161]">Esta sección no tiene contenido editable.</p>}
        {visibleSimple.map((f) => (
          <FieldControl key={f.key} field={f} value={content[f.key] ?? f.default ?? ""} onChange={(v) => set(f.key, v)} />
        ))}
        {simple.length > LIMIT && (
          <button onClick={() => setShowAll((s) => !s)} className="flex items-center gap-1 text-[13px] font-medium text-[color:var(--color-primary)] hover:underline">
            <HiOutlineChevronDown className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
            {showAll ? "Mostrar menos" : `Mostrar ${simple.length - LIMIT} campos más`}
          </button>
        )}
        {lists.map((f) => (
          <ListControl key={f.key} field={f} value={(content[f.key] ?? f.default ?? []) as any[]} onChange={(v) => set(f.key, v)} />
        ))}
      </div>

      <div className="flex gap-2 border-t border-[#ebebeb] p-3">
        <button onClick={onDuplicate} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#e3e3e3] bg-white py-1.5 text-[13px] font-medium text-[#303030] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#f7f7f7]"><HiOutlineDuplicate className="h-4 w-4" />Duplicar</button>
        <button onClick={onDelete} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#e3e3e3] bg-white py-1.5 text-[13px] font-medium text-[#c70a24] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#fff1f0]"><HiOutlineTrash className="h-4 w-4" />Eliminar sección</button>
      </div>
    </div>
  );
}
