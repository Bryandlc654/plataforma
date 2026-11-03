"use client";

import { Children, Fragment, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { RawHtmlFields } from "./fields/shared";
import { BLOCK_FIELDS } from "./fields";

/** Campos que cambian la apariencia (no el texto ni las imágenes) van a la pestaña "Diseño". */
const DESIGN_RE = /color|fondo|estilo|tamaño|opacidad|alineaci|variante|espaci|columnas|altura|ancho|animaci|oscuro|claro|sombra|borde|radio|fuente|tipograf/i;
const CONTENT_RE = /imagen|image|logo|foto|video|texto|título|titulo|enlace|url/i;

function flatten(node: ReactNode): ReactNode[] {
  return Children.toArray(node).flatMap((c) =>
    isValidElement(c) && c.type === Fragment ? flatten((c as ReactElement<{ children?: ReactNode }>).props.children) : [c],
  );
}

function isDesignField(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  const label = (node as ReactElement<{ label?: unknown }>).props.label;
  return typeof label === "string" && DESIGN_RE.test(label) && !CONTENT_RE.test(label);
}

export function BlockEditor({ type, content, onChange }: { type: string; content: any; onChange: (c: any) => void }) {
  const [tab, setTab] = useState<"content" | "design">("content");
  const set = (key: string, value: any) => onChange({ ...content, [key]: value });

  if (content.variant === "raw-html") {
    return <div className="p-4 pb-20"><RawHtmlFields content={content} set={set} /></div>;
  }

  const Fields = BLOCK_FIELDS[type];
  if (!Fields) return <p className="py-8 text-center text-sm text-slate-400">Editor no disponible</p>;

  // Los formularios de cada bloque no usan hooks, así que se pueden evaluar para repartir sus campos en pestañas.
  const nodes = flatten(Fields({ content, set }));
  const design = nodes.filter(isDesignField);
  const main = nodes.filter((n) => !isDesignField(n));

  if (design.length === 0) return <div className="p-4 pb-20">{main}</div>;

  return (
    <div>
      <div className="sticky top-0 z-10 flex gap-1 border-b border-slate-100 bg-white px-4 pt-2">
        {([["content", "Contenido", main.length], ["design", "Diseño", design.length]] as const).map(([key, label, n]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${tab === key ? "border-[#201b51] text-[#201b51]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            {label} <span className="text-[10px] font-normal opacity-60">{n}</span>
          </button>
        ))}
      </div>
      <div className="p-4 pb-20">{tab === "content" ? main : design}</div>
    </div>
  );
}
