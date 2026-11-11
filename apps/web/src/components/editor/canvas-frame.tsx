"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const SRC_DOC = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;min-height:100%;background:#fff}</style></head><body></body></html>`;

/** Copia las hojas de estilo del panel (Tailwind, fuentes, styled-jsx) al documento del iframe. */
function createHeadSync(doc: Document) {
  const clones = new Map<Element, Element>();
  return () => {
    const sources = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    const alive = new Set(sources);
    for (const [src, clone] of clones) {
      if (!alive.has(src)) { clone.remove(); clones.delete(src); }
    }
    for (const src of sources) {
      const existing = clones.get(src);
      if (!existing) {
        const clone = doc.importNode(src, true) as Element;
        if (src.tagName === "LINK") clone.setAttribute("href", (src as HTMLLinkElement).href);
        doc.head.appendChild(clone);
        clones.set(src, clone);
      } else if (src.tagName === "STYLE" && existing.textContent !== src.textContent) {
        existing.textContent = src.textContent;
      }
    }
  };
}

/** Copia clases, estilos en línea (variables de marca) e idioma de <html> y <body>. */
function syncRootAttributes(doc: Document) {
  const html = doc.documentElement;
  html.className = document.documentElement.className;
  html.setAttribute("style", document.documentElement.getAttribute("style") || "");
  html.lang = document.documentElement.lang;
  const theme = document.documentElement.getAttribute("data-theme");
  if (theme) html.setAttribute("data-theme", theme); else html.removeAttribute("data-theme");
}

interface Props {
  className?: string;
  title?: string;
  children: ReactNode;
  /** Se llama con el documento del iframe al montarlo (y con null al desmontarlo). */
  onDocument?: (doc: Document | null) => void;
}

/**
 * Lienzo aislado en un iframe: los breakpoints de Tailwind (`md:`, `lg:`) responden al
 * ancho del lienzo y no al de la ventana, así la vista móvil es realmente móvil.
 * El contenido se dibuja con un portal, así que sigue en el mismo árbol de React.
 */
export function CanvasFrame({ className, title = "Lienzo del editor", children, onDocument }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  const onDocumentRef = useRef(onDocument);
  onDocumentRef.current = onDocument;

  const attach = useCallback(() => {
    const doc = ref.current?.contentDocument;
    // Ignora el about:blank inicial: se reemplaza cuando carga el srcdoc.
    if (!doc || !doc.body || doc.readyState === "loading" || doc.URL !== "about:srcdoc") return;
    if (body && body.ownerDocument === doc) return;
    setBody(doc.body);
  }, [body]);

  // Algunos navegadores ya tienen el srcdoc cargado antes de enganchar onLoad.
  useEffect(() => { attach(); }, [attach]);

  useEffect(() => {
    if (!body) return;
    const doc = body.ownerDocument;
    const syncHead = createHeadSync(doc);
    syncHead();
    syncRootAttributes(doc);
    const headObserver = new MutationObserver(syncHead);
    headObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
    const rootObserver = new MutationObserver(() => syncRootAttributes(doc));
    rootObserver.observe(document.documentElement, { attributes: true });
    onDocumentRef.current?.(doc);
    return () => {
      headObserver.disconnect();
      rootObserver.disconnect();
      onDocumentRef.current?.(null);
    };
  }, [body]);

  return (
    <>
      <iframe ref={ref} title={title} srcDoc={SRC_DOC} onLoad={attach} className={className} />
      {body ? createPortal(children, body) : null}
    </>
  );
}
