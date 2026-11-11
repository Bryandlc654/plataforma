import React, { useEffect, useMemo, useRef } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import {
  applyPaletteToVariantHtml,
  isTemplateVariant,
  renderGenericBlockHtml,
  renderTemplateVariantHtml,
  sanitizeTemplateContent,
  type SitePalette,
} from "@/lib/templates";
import { API_ORIGIN } from "@/lib/api-config";

function resolveMediaUrl(value: any): any {
  if (typeof value === "string") {
    if (value.startsWith("/uploads/")) return `${API_ORIGIN}${value}`;
    return value;
  }
  if (Array.isArray(value)) return value.map(resolveMediaUrl);
  if (value && typeof value === "object") {
    const out: any = {};
    for (const k of Object.keys(value)) out[k] = resolveMediaUrl(value[k]);
    return out;
  }
  return value;
}

/**
 * En el lienzo el header fijo/absoluto taparía la barra del editor y la primera sección:
 * se dibuja en el flujo normal de la página.
 */
const EDITOR_HEADER_FIXES: Record<string, [string, string]> = {
  rodriplast: ['class="fixed top-0 inset-x-0 z-50', 'class="relative top-0 inset-x-0 z-50'],
  indigo: ['class="fixed w-full z-50 top-0 left-0 p-6 flex', 'class="relative w-full z-50 top-0 left-0 p-6 flex'],
  "urban-noir": ['class="fixed w-full z-50', 'class="relative w-full z-50'],
  graduate: ['<header class="absolute top-0 left-0 w-full z-50">', '<header class="relative z-50">'],
};

function staticEditorHeader(html: string, variant: string): string {
  const fix = EDITOR_HEADER_FIXES[variant];
  return fix ? html.replace(fix[0], fix[1]) : html;
}

/** Envío de formularios dentro del HTML de una plantilla (vista previa y editor). */
async function submitTemplateForm(e: React.FormEvent<HTMLDivElement>) {
  const form = e.target as HTMLFormElement;
  if (!form || form.tagName !== "FORM") return;
  e.preventDefault();
  const data: Record<string, any> = {};
  new FormData(form).forEach((v, k) => { data[k] = v; });
  const tenantId = useAuthStore.getState().tenantId;
  const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  if (btn) btn.disabled = true;
  try {
    // Los formularios del HTML publicado traen su destino (leads, reseñas, sorteos) en `action`.
    const action = form.getAttribute("action") || "";
    if (/\/api\/v1\//.test(action)) {
      const res = await fetch(action, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(String(res.status));
    } else if (tenantId) await api.post(`/leads/submit/${tenantId}`, data);
    else await new Promise((res) => setTimeout(res, 1000));
    form.innerHTML = `<div class="text-center p-8"><h3 class="font-bold text-xl text-green-600 mb-2">¡Enviado!</h3><p>Gracias por tu mensaje.</p></div>`;
  } catch {
    if (btn) btn.disabled = false;
    alert("Error al enviar el formulario");
  }
}

/**
 * Dibuja un bloque con el mismo HTML que el sitio publicado (`@/lib/templates`, copia de
 * packages/shared): las variantes de plantilla y los bloques genéricos. Así lo que se ve
 * en el editor y en las vistas previas es lo que se publica.
 */
export function BlockRenderer({ type, content, palette }: { type: string; content: any; palette?: SitePalette }) {
  const c = useMemo(() => resolveMediaUrl(content || {}), [content]);
  const primary = palette?.primary || c.primaryColor || "#2563EB";
  const secondary = palette?.secondary || c.secondaryColor || "#1e40af";
  const accent = palette?.accent || "#f59e0b";
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (c.variant !== "raw-html" || (type !== "header" && type !== "footer")) return;
    const root = revealRef.current;
    if (!root) return;
    root.querySelectorAll("*").forEach((el) => {
      const elm = el as HTMLElement;
      const pos = (elm.ownerDocument.defaultView || window).getComputedStyle(elm).position;
      if (pos === "fixed" || pos === "sticky") elm.style.position = "relative";
    });
  }, [c.variant, type, c]);

  useEffect(() => {
    if (c.variant !== "rodriplast") return;
    const root = revealRef.current;
    if (!root) return;
    root.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-1, .reveal-2, .reveal-3").forEach((el) => el.classList.add("in-view"));
  }, [c.variant, c]);

  useEffect(() => {
    if (c.variant !== "rodriplast" || type !== "hero") return;
    const root = revealRef.current;
    if (!root) return;
    const slider = root.querySelector("#heroSlider");
    if (!slider) return;
    const slides = Array.from(slider.children) as HTMLElement[];
    if (slides.length <= 1) return;
    const dotsContainer = root.querySelector("#heroDots");
    if (!dotsContainer) return;
    let idx = 0;
    const dots: HTMLButtonElement[] = [];
    slides.forEach((_, i) => {
      const dot = root.ownerDocument.createElement("button");
      dot.className = "w-2.5 h-2.5 rounded-full bg-white/30 transition-all duration-300 hover:bg-white/60";
      if (i === 0) { dot.classList.remove("bg-white/30"); dot.classList.add("bg-white", "scale-125"); }
      dot.addEventListener("click", () => {
        slides[idx].classList.remove("opacity-100");
        slides[idx].classList.add("opacity-0");
        idx = i;
        slides[idx].classList.remove("opacity-0");
        slides[idx].classList.add("opacity-100");
        updateDots();
      });
      dotsContainer.appendChild(dot);
      dots.push(dot);
    });
    function updateDots() {
      dots.forEach((dot, i) => {
        dot.classList.remove("bg-white", "scale-125");
        dot.classList.add("bg-white/30");
        if (i === idx) { dot.classList.remove("bg-white/30"); dot.classList.add("bg-white", "scale-125"); }
      });
    }
    const interval = setInterval(() => {
      slides[idx].classList.remove("opacity-100");
      slides[idx].classList.add("opacity-0");
      idx = (idx + 1) % slides.length;
      slides[idx].classList.remove("opacity-0");
      slides[idx].classList.add("opacity-100");
      updateDots();
    }, 5000);
    return () => { clearInterval(interval); dots.forEach(d => d.remove()); };
  }, [c.variant, type, c]);

  const isVariant = isTemplateVariant(c.variant);
  const isRaw = c.variant === "raw-html";
  const html = useMemo(() => {
    if (isVariant) {
      let out = renderTemplateVariantHtml(type, c, API_ORIGIN);
      if (out && !isRaw) out = applyPaletteToVariantHtml(out, c.variant, palette);
      if (out && type === "header") out = staticEditorHeader(out, c.variant);
      if (out) return out;
    }
    const tenantId = useAuthStore.getState().tenantId;
    return renderGenericBlockHtml(type, sanitizeTemplateContent(c), { apiBaseUrl: API_ORIGIN, site: tenantId ? { tenantId } : undefined }) || "";
  }, [type, c, isVariant, isRaw, palette]);

  if (!html) return null;
  // Variables que la página publicada define en :root y usan los bloques genéricos.
  const vars = { "--primary": primary, "--secondary": secondary, "--accent": accent } as React.CSSProperties;
  return (
    <div
      ref={revealRef}
      style={isVariant ? undefined : vars}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={isRaw ? (e) => {
        const anchor = (e.target as HTMLElement)?.closest?.("a");
        const href = anchor?.getAttribute("href") || "";
        if (href.startsWith("/") && !href.startsWith("//")) e.preventDefault();
      } : undefined}
      onSubmit={submitTemplateForm}
    />
  );
}
