"use client";

/**
 * Plantillas del menú público. Toda la lógica (carrito, checkout, seguimiento) vive en
 * menu-app.tsx; aquí solo cambia cómo se ve: paleta, tipografía, cabecera, navegación,
 * destacados y la forma de mostrar los platos.
 */

import type { CSSProperties, ReactNode, RefObject } from "react";
import type { FoodProduct, MenuTemplate } from "@/lib/food";
import type { PublicMenu } from "./menu-app";

type R = PublicMenu["restaurant"];
type Fmt = (n: number) => string;

/* ------------------------------------------------------------------ */
/* Paletas y tipografías                                               */
/* ------------------------------------------------------------------ */

const PALETTES: Record<MenuTemplate, { light: Record<string, string>; dark: Record<string, string>; font: string; body: string }> = {
  street: {
    font: "var(--font-bricolage)",
    body: "var(--font-inter), system-ui, sans-serif",
    light: { bg: "#faf7f2", card: "#ffffff", sheet: "#ffffff", soft: "#f1ece4", line: "#e7e0d5", ink: "#1c1917", muted: "#6b625a" },
    dark: { bg: "#111111", card: "#1b1b1b", sheet: "#181818", soft: "#262626", line: "#2c2c2c", ink: "#f6f1e9", muted: "#a8a29e" },
  },
  gallery: {
    font: "var(--font-bricolage)",
    body: "var(--font-inter), system-ui, sans-serif",
    light: { bg: "#ffffff", card: "#f5f5f4", sheet: "#ffffff", soft: "#efefee", line: "#e7e5e4", ink: "#0c0a09", muted: "#78716c" },
    dark: { bg: "#0b0b0c", card: "#161618", sheet: "#141416", soft: "#222225", line: "#2a2a2e", ink: "#fafaf9", muted: "#a1a1aa" },
  },
  bistro: {
    font: "var(--font-playfair), Georgia, serif",
    body: "var(--font-inter), system-ui, sans-serif",
    light: { bg: "#f6f0e6", card: "#fbf7f0", sheet: "#fbf7f0", soft: "#ece3d4", line: "#d9ccb6", ink: "#2a2017", muted: "#7a6a58" },
    dark: { bg: "#17130f", card: "#1f1a15", sheet: "#1f1a15", soft: "#2a231c", line: "#3a3127", ink: "#efe6d8", muted: "#a8998a" },
  },
  cafe: {
    font: "var(--font-nunito), system-ui, sans-serif",
    body: "var(--font-nunito), system-ui, sans-serif",
    light: { bg: "#fff8f1", card: "#ffffff", sheet: "#ffffff", soft: "#fbeee2", line: "#f1e2d3", ink: "#3b2a20", muted: "#8a7566" },
    dark: { bg: "#1c1714", card: "#251f1b", sheet: "#231d19", soft: "#2f2722", line: "#3a302a", ink: "#f6ebe1", muted: "#b3a194" },
  },
};

export function templateVars(template: MenuTemplate, theme: "dark" | "light", accent: string): CSSProperties {
  const t = PALETTES[template] || PALETTES.street;
  const c = theme === "light" ? t.light : t.dark;
  return {
    "--jf-accent": accent || "#F97316",
    "--jf-bg": c.bg,
    "--jf-card": c.card,
    "--jf-sheet": c.sheet,
    "--jf-soft": c.soft,
    "--jf-line": c.line,
    "--jf-ink": c.ink,
    "--jf-muted": c.muted,
    "--jf-font": t.font,
    fontFamily: t.body,
  } as CSSProperties;
}

/* ------------------------------------------------------------------ */
/* Piezas comunes                                                      */
/* ------------------------------------------------------------------ */

function StatusPill({ r, className = "" }: { r: R; className?: string }) {
  const open = r.isOpen && r.acceptingOrders;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${open ? "bg-emerald-500/15 text-emerald-600" : "bg-[var(--jf-soft)] text-[var(--jf-muted)]"} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-[var(--jf-muted)]"}`} />
      {r.acceptingOrders ? r.statusLabel : "Pedidos en pausa"}
    </span>
  );
}

function ServiceChips({ r, fmt, onInfo, center = false }: { r: R; fmt: Fmt; onInfo: () => void; center?: boolean }) {
  return (
    <div className={`mt-3 flex flex-wrap gap-2 text-[12px] text-[var(--jf-muted)] ${center ? "justify-center" : ""}`}>
      {r.delivery.enabled && <span className="rounded-full border border-[var(--jf-line)] px-2.5 py-1">🛵 Delivery{r.delivery.fee ? ` · ${fmt(r.delivery.fee)}` : ""}</span>}
      {r.pickup.enabled && <span className="rounded-full border border-[var(--jf-line)] px-2.5 py-1">🛍️ Retiro en local</span>}
      {r.dineIn.enabled && <span className="rounded-full border border-[var(--jf-line)] px-2.5 py-1">🍽️ En el local</span>}
      {r.address && (
        <button onClick={onInfo} className="max-w-full truncate rounded-full border border-[var(--jf-line)] px-2.5 py-1">📍 {r.address}</button>
      )}
    </div>
  );
}

function Logo({ r, className }: { r: R; className: string }) {
  return r.logoUrl ? (
    <img src={r.logoUrl} alt={`Logo de ${r.name}`} className={`bg-[var(--jf-card)] object-contain ${className}`} />
  ) : (
    <div className={`jf-display flex items-center justify-center bg-[var(--jf-accent)] font-extrabold text-white ${className}`}>{r.name.charAt(0)}</div>
  );
}

/** Plato sin foto: fondo suave con la inicial en el color de acento (no un bloque de color fuerte). */
function Initial({ p, className = "" }: { p: FoodProduct; className?: string }) {
  return (
    <div
      className={`jf-display flex items-center justify-center font-extrabold text-[var(--jf-accent)] ${className}`}
      style={{ background: "color-mix(in srgb, var(--jf-accent) 14%, var(--jf-soft))" }}
    >
      {p.name.charAt(0)}
    </div>
  );
}

function Tags({ p }: { p: FoodProduct }) {
  if (!p.tags.length && !p.soldOut) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {p.tags.map((t) => (
        <span key={t} className="rounded-full bg-[var(--jf-soft)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--jf-accent)]">{t}</span>
      ))}
      {p.soldOut && <span className="rounded-full bg-[var(--jf-soft)] px-2 py-0.5 text-[11px] font-bold uppercase text-[var(--jf-muted)]">Agotado</span>}
    </div>
  );
}

function Plus({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-full bg-[var(--jf-accent)] font-bold leading-none text-white ${className}`} aria-hidden>
      +
    </span>
  );
}

const Price = ({ p, fmt, className = "" }: { p: FoodProduct; fmt: Fmt; className?: string }) => (
  <span className={`flex items-baseline gap-2 ${className}`}>
    <span className="font-extrabold text-[var(--jf-accent)]">{fmt(p.price)}</span>
    {p.comparePrice ? <span className="text-[13px] font-normal text-[var(--jf-muted)] line-through">{fmt(p.comparePrice)}</span> : null}
  </span>
);

/* ------------------------------------------------------------------ */
/* Cabecera                                                            */
/* ------------------------------------------------------------------ */

export function MenuHeader({ template, r, fmt, onInfo }: { template: MenuTemplate; r: R; fmt: Fmt; onInfo: () => void }) {
  const infoBtn = (
    <button onClick={onInfo} className="absolute right-4 top-4 z-10 rounded-full bg-black/45 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur hover:bg-black/60">
      Info
    </button>
  );
  const cover = r.coverUrl ? (
    <img src={r.coverUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    <div className="h-full w-full" style={{ background: "radial-gradient(120% 90% at 20% 10%, var(--jf-accent), transparent 60%), var(--jf-soft)" }} />
  );

  if (template === "gallery") {
    return (
      <header>
        <div className="relative h-[340px] overflow-hidden sm:h-[400px]">
          {cover}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
          {infoBtn}
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[960px] px-4 pb-6 text-white">
            <div className="flex items-center gap-3">
              <Logo r={r} className="h-12 w-12 rounded-full text-xl ring-2 ring-white/80" />
              <StatusPill r={r} className="!bg-white/15 !text-white backdrop-blur" />
            </div>
            <h1 className="jf-display mt-3 text-[40px] font-extrabold leading-[1] sm:text-[56px]">{r.name}</h1>
            {r.tagline && <p className="mt-2 max-w-[520px] text-[15px] text-white/80">{r.tagline}</p>}
          </div>
        </div>
        <div className="mx-auto max-w-[960px] px-4">
          <ServiceChips r={r} fmt={fmt} onInfo={onInfo} />
        </div>
      </header>
    );
  }

  if (template === "bistro") {
    return (
      <header className="relative mx-auto max-w-[720px] px-6 pb-2 pt-10 text-center">
        <button onClick={onInfo} className="absolute right-4 top-4 rounded-full border border-[var(--jf-line)] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.15em] text-[var(--jf-muted)]">
          Info
        </button>
        <Logo r={r} className="mx-auto h-20 w-20 rounded-full p-1 text-3xl ring-1 ring-[var(--jf-line)]" />
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--jf-muted)]">Carta</p>
        <h1 className="jf-display mt-1 text-[42px] font-bold leading-[1.05] sm:text-[54px]">{r.name}</h1>
        {r.tagline && <p className="jf-display mt-2 text-[17px] italic text-[var(--jf-muted)]">{r.tagline}</p>}
        <div className="mx-auto mt-5 flex max-w-[280px] items-center gap-3 text-[var(--jf-accent)]" aria-hidden>
          <span className="h-px flex-1 bg-[var(--jf-line)]" />✦<span className="h-px flex-1 bg-[var(--jf-line)]" />
        </div>
        <div className="mt-4">
          <StatusPill r={r} />
        </div>
        <ServiceChips r={r} fmt={fmt} onInfo={onInfo} center />
        {r.coverUrl && (
          <div className="mt-7 overflow-hidden rounded-sm ring-1 ring-[var(--jf-line)]">
            <img src={r.coverUrl} alt="" className="aspect-[16/7] w-full object-cover" />
          </div>
        )}
      </header>
    );
  }

  if (template === "cafe") {
    return (
      <header className="mx-auto max-w-[720px] px-4 pt-4">
        <div className="relative h-[190px] overflow-hidden rounded-[28px]">
          {cover}
          <div className="absolute inset-0 bg-black/10" />
          {infoBtn}
        </div>
        <div className="-mt-11 text-center">
          <Logo r={r} className="relative mx-auto h-[88px] w-[88px] rounded-full p-1 text-3xl ring-4 ring-[var(--jf-bg)]" />
          <h1 className="jf-display mt-3 text-[32px] font-extrabold leading-tight">{r.name}</h1>
          {r.tagline && <p className="mt-1 text-[15px] text-[var(--jf-muted)]">{r.tagline}</p>}
          <div className="mt-3">
            <StatusPill r={r} />
          </div>
          <ServiceChips r={r} fmt={fmt} onInfo={onInfo} center />
        </div>
      </header>
    );
  }

  // street
  return (
    <header className="relative">
      <div className="relative h-[230px] overflow-hidden sm:h-[300px]">
        {cover}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--jf-bg)] via-black/30 to-black/20" />
        {infoBtn}
      </div>
      <div className="relative mx-auto -mt-20 max-w-[720px] px-4">
        <div className="flex items-end gap-4">
          <Logo r={r} className="h-20 w-20 rounded-2xl p-1.5 text-3xl shadow-xl ring-1 ring-[var(--jf-line)]" />
          <div className="min-w-0 pb-1">
            <StatusPill r={r} />
          </div>
        </div>
        <h1 className="jf-display mt-3 text-[34px] font-extrabold leading-[1.02] sm:text-[44px]">{r.name}</h1>
        {r.tagline && <p className="mt-1.5 text-[15px] text-[var(--jf-muted)]">{r.tagline}</p>}
        <ServiceChips r={r} fmt={fmt} onInfo={onInfo} />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Navegación de categorías                                            */
/* ------------------------------------------------------------------ */

export function CategoryTabs({
  template,
  categories,
  active,
  searching,
  onPick,
  tabsRef,
  search,
  onSearch,
}: {
  template: MenuTemplate;
  categories: Array<{ id: string; name: string }>;
  active: string;
  searching: boolean;
  onPick: (id: string) => void;
  tabsRef: RefObject<HTMLDivElement | null>;
  search: string;
  onSearch: (v: string) => void;
}) {
  const width = template === "gallery" ? "max-w-[960px]" : "max-w-[720px]";
  const radius = template === "bistro" ? "rounded-none border-x-0 border-t-0 bg-transparent" : "rounded-full";
  const tab = (on: boolean) => {
    if (template === "gallery")
      return `border-b-2 px-1 pb-2 pt-1 text-[15px] font-semibold ${on ? "border-[var(--jf-ink)] text-[var(--jf-ink)]" : "border-transparent text-[var(--jf-muted)]"}`;
    if (template === "bistro")
      return `px-1 py-1 text-[12px] font-semibold uppercase tracking-[0.2em] ${on ? "text-[var(--jf-accent)] underline decoration-1 underline-offset-[6px]" : "text-[var(--jf-muted)]"}`;
    if (template === "cafe")
      return `rounded-full px-4 py-2 text-[14px] font-bold ${on ? "bg-[var(--jf-accent)] text-white" : "bg-[var(--jf-soft)] text-[var(--jf-muted)]"}`;
    return `rounded-full px-4 py-2 text-[14px] font-semibold ${on ? "bg-[var(--jf-accent)] text-white" : "border border-[var(--jf-line)] bg-[var(--jf-card)] text-[var(--jf-muted)] hover:text-[var(--jf-ink)]"}`;
  };
  return (
    <nav className="sticky top-0 z-30 mt-6 border-b border-[var(--jf-line)] bg-[var(--jf-bg)]/90 backdrop-blur-md">
      <div className={`mx-auto ${width} px-4 pt-3`}>
        <label className="relative block">
          <span className="sr-only">Buscar en el menú</span>
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--jf-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={template === "bistro" ? "Buscar en la carta" : "¿Qué se te antoja?"}
            className={`h-11 w-full border border-[var(--jf-line)] bg-[var(--jf-card)] pl-10 pr-4 text-[15px] text-[var(--jf-ink)] placeholder:text-[var(--jf-muted)] focus:border-[var(--jf-accent)] focus:outline-none ${radius}`}
          />
        </label>
        <div ref={tabsRef} className={`jf-noscroll -mx-4 flex overflow-x-auto px-4 py-3 ${template === "gallery" ? "gap-5" : template === "bistro" ? "justify-start gap-5 sm:justify-center" : "gap-2"}`}>
          {categories.map((c) => (
            <button key={c.id} data-cat={c.id} onClick={() => onPick(c.id)} className={`whitespace-nowrap transition-colors ${tab(active === c.id && !searching)}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Destacados                                                          */
/* ------------------------------------------------------------------ */

export function Featured({ template, products, fmt, onSelect }: { template: MenuTemplate; products: FoodProduct[]; fmt: Fmt; onSelect: (p: FoodProduct) => void }) {
  if (!products.length) return null;

  if (template === "bistro") {
    return (
      <section className="mt-8 border border-[var(--jf-line)] px-5 py-5 text-center">
        <h2 className="jf-display text-[22px] italic">Sugerencias de la casa</h2>
        <ul className="mt-3 space-y-2 text-left">
          {products.map((p) => (
            <li key={p.id}>
              <button onClick={() => onSelect(p)} className="flex w-full items-baseline gap-2 text-left">
                <span className="jf-display text-[17px] font-semibold">{p.name}</span>
                <span className="mb-1 flex-1 border-b border-dotted border-[var(--jf-muted)]/60" />
                <span className="text-[15px] font-semibold tabular-nums">{fmt(p.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const wide = template === "gallery";
  const title = template === "cafe" ? "Recomendados" : wide ? "Destacados" : "Los favoritos";
  return (
    <section className="pt-6">
      <h2 className={`jf-display font-extrabold ${wide ? "text-[26px]" : "text-[22px]"}`}>{title}</h2>
      <div className="jf-noscroll -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
        {products.map((p) =>
          wide ? (
            <button key={p.id} onClick={() => onSelect(p)} className="relative w-[280px] flex-shrink-0 overflow-hidden rounded-3xl text-left">
              {p.image ? <img src={p.image} alt="" className="aspect-[16/11] w-full object-cover" loading="lazy" /> : <Initial p={p} className="aspect-[16/11] w-full text-[64px]" />}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                <p className="line-clamp-1 text-[17px] font-bold">{p.name}</p>
                <p className="text-[15px] font-bold">{fmt(p.price)}</p>
              </div>
            </button>
          ) : (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`flex-shrink-0 overflow-hidden border border-[var(--jf-line)] bg-[var(--jf-card)] text-left ${template === "cafe" ? "w-[160px] rounded-[22px]" : "w-[200px] rounded-2xl"}`}
            >
              {p.image ? <img src={p.image} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" /> : <Initial p={p} className="aspect-[4/3] w-full text-[44px]" />}
              <div className="p-3">
                <p className="line-clamp-1 text-[15px] font-bold">{p.name}</p>
                <p className="mt-0.5 text-[15px] font-bold text-[var(--jf-accent)]">{fmt(p.price)}</p>
              </div>
            </button>
          )
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Secciones y platos                                                  */
/* ------------------------------------------------------------------ */

export function MenuSection({
  template,
  id,
  name,
  products,
  fmt,
  onSelect,
}: {
  template: MenuTemplate;
  id: string;
  name: string;
  products: FoodProduct[];
  fmt: Fmt;
  onSelect: (p: FoodProduct) => void;
}) {
  const pick = (p: FoodProduct) => !p.soldOut && onSelect(p);
  let heading: ReactNode;
  let body: ReactNode;

  if (template === "gallery") {
    heading = (
      <h2 className="jf-display flex items-baseline gap-2 text-[28px] font-extrabold">
        {name} <span className="text-[14px] font-medium text-[var(--jf-muted)]">{products.length}</span>
      </h2>
    );
    body = (
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {products.map((p) => (
          <button key={p.id} onClick={() => pick(p)} disabled={p.soldOut} className="group text-left disabled:cursor-not-allowed disabled:opacity-55">
            <div className="relative overflow-hidden rounded-2xl bg-[var(--jf-soft)]">
              {p.image ? (
                <img src={p.image} alt="" className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
              ) : (
                <Initial p={p} className="aspect-square w-full text-[52px]" />
              )}
              {!p.soldOut && <Plus className="absolute bottom-2 right-2 h-9 w-9 text-xl shadow-lg" />}
            </div>
            <div className="mt-2 px-0.5">
              <Tags p={p} />
              <p className="mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug">{p.name}</p>
              <Price p={p} fmt={fmt} className="mt-0.5 text-[15px]" />
            </div>
          </button>
        ))}
      </div>
    );
  } else if (template === "bistro") {
    heading = (
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-[var(--jf-line)]" />
        <h2 className="jf-display text-center text-[26px] font-semibold">{name}</h2>
        <span className="h-px flex-1 bg-[var(--jf-line)]" />
      </div>
    );
    body = (
      <ul className="mt-5 space-y-5">
        {products.map((p) => (
          <li key={p.id}>
            <button onClick={() => pick(p)} disabled={p.soldOut} className="flex w-full gap-4 text-left disabled:cursor-not-allowed disabled:opacity-50">
              {p.image && <img src={p.image} alt="" className="h-16 w-16 flex-shrink-0 rounded-full object-cover ring-1 ring-[var(--jf-line)]" loading="lazy" />}
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="jf-display text-[19px] font-semibold leading-snug">{p.name}</span>
                  <span className="mb-1.5 min-w-[24px] flex-1 border-b border-dotted border-[var(--jf-muted)]/60" />
                  <span className="text-[16px] font-semibold tabular-nums">{fmt(p.price)}</span>
                </span>
                {p.description && <span className="mt-0.5 block text-[14px] italic leading-snug text-[var(--jf-muted)]">{p.description}</span>}
                {(p.tags.length > 0 || p.soldOut) && (
                  <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--jf-accent)]">
                    {[...p.tags, ...(p.soldOut ? ["Agotado"] : [])].join(" · ")}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  } else if (template === "cafe") {
    heading = <h2 className="jf-display text-[24px] font-extrabold">{name}</h2>;
    body = (
      <div className="mt-3 overflow-hidden rounded-[24px] bg-[var(--jf-card)] shadow-[0_2px_14px_rgba(80,50,20,0.06)]">
        {products.map((p, i) => (
          <button
            key={p.id}
            onClick={() => pick(p)}
            disabled={p.soldOut}
            className={`flex w-full items-center gap-3 p-3 text-left disabled:cursor-not-allowed disabled:opacity-55 ${i > 0 ? "border-t border-[var(--jf-line)]" : ""}`}
          >
            {p.image ? (
              <img src={p.image} alt="" className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover" loading="lazy" />
            ) : (
              <Initial p={p} className="h-16 w-16 flex-shrink-0 rounded-2xl text-[26px]" />
            )}
            <span className="min-w-0 flex-1">
              <Tags p={p} />
              <span className="block truncate text-[16px] font-bold">{p.name}</span>
              {p.description && <span className="block truncate text-[13px] text-[var(--jf-muted)]">{p.description}</span>}
            </span>
            <span className="flex flex-col items-end gap-1.5">
              <span className="rounded-full bg-[var(--jf-soft)] px-2.5 py-1 text-[14px] font-extrabold text-[var(--jf-accent)]">{fmt(p.price)}</span>
              {!p.soldOut && <Plus className="h-7 w-7 text-lg" />}
            </span>
          </button>
        ))}
      </div>
    );
  } else {
    heading = <h2 className="jf-display text-[26px] font-extrabold">{name}</h2>;
    body = (
      <div className="mt-3 space-y-3">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => pick(p)}
            disabled={p.soldOut}
            className="flex w-full gap-3 rounded-2xl border border-[var(--jf-line)] bg-[var(--jf-card)] p-3 text-left transition-colors hover:border-[var(--jf-accent)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-[var(--jf-line)]"
          >
            <div className="min-w-0 flex-1 py-0.5">
              <Tags p={p} />
              <p className="mt-1 text-[16px] font-bold leading-snug">{p.name}</p>
              {p.description && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--jf-muted)]">{p.description}</p>}
              <Price p={p} fmt={fmt} className="mt-2 text-[16px]" />
            </div>
            {p.image ? (
              <div className="relative h-[104px] w-[104px] flex-shrink-0 overflow-hidden rounded-xl bg-[var(--jf-soft)]">
                <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                {!p.soldOut && <Plus className="absolute bottom-1.5 right-1.5 h-8 w-8 text-xl shadow-lg" />}
              </div>
            ) : (
              !p.soldOut && <Plus className="h-9 w-9 flex-shrink-0 self-end text-xl" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <section id={`sec-${id}`} className={`scroll-mt-32 ${template === "bistro" ? "pt-10" : "pt-8"}`}>
      {heading}
      {body}
    </section>
  );
}

export function containerWidth(template: MenuTemplate) {
  return template === "gallery" ? "max-w-[960px]" : "max-w-[720px]";
}
