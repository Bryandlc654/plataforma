"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api-config";
import {
  DAY_LABELS,
  FULFILLMENT_LABELS,
  FoodOptionGroup,
  FoodProduct,
  FoodSettings,
  Fulfillment,
  PAYMENT_LABELS,
  PaymentMethod,
} from "@/lib/food";

export interface PublicMenu {
  restaurant: Omit<FoodSettings, "timezone"> & {
    name: string;
    slug: string;
    logoUrl: string | null;
    isOpen: boolean;
    statusLabel: string;
    canOrder: boolean;
  };
  categories: Array<{ id: string; name: string; products: FoodProduct[] }>;
}

interface CartLine {
  key: string;
  productId: string;
  name: string;
  image: string;
  unit: number;
  quantity: number;
  options: Array<{ groupId: string; optionIds: string[] }>;
  optionNames: string[];
  notes: string;
}

interface Customer {
  name: string;
  phone: string;
  address: string;
  fulfillment: Fulfillment | "";
  payment: PaymentMethod | "";
  notes: string;
}

const STATUS_STEPS = [
  { id: "pending", label: "Recibido" },
  { id: "preparing", label: "Preparando" },
  { id: "ready", label: "Listo" },
  { id: "delivered", label: "Entregado" },
];

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const m = json?.message;
    throw new Error(Array.isArray(m) ? m[0] : m || "No pudimos enviar tu pedido. Inténtalo de nuevo.");
  }
  return (json?.data ?? json) as T;
}

function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    loaded.current = true;
  }, [key]);
  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: React.ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={label}>
      <div className="jf-fade absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="jf-up relative flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[28px] bg-[var(--jf-sheet)] text-[var(--jf-ink)] sm:rounded-[28px]">
        {children}
      </div>
    </div>
  );
}

function Stepper({ value, onChange, min = 1 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-[var(--jf-line)] p-1">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-[var(--jf-soft)]" aria-label="Quitar uno">−</button>
      <span className="w-6 text-center text-[15px] font-bold tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(99, value + 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-[var(--jf-soft)]" aria-label="Agregar uno">+</button>
    </div>
  );
}

export function MenuApp({ slug, initial }: { slug: string; initial: PublicMenu }) {
  const [menu, setMenu] = useState(initial);
  const r = menu.restaurant;
  const sym = r.currencySymbol || "$";
  const fmt = (n: number) => `${sym}${n.toFixed(2)}`;

  const [cart, setCart] = useLocal<CartLine[]>(`jf:cart:${slug}`, []);
  const [customer, setCustomer] = useLocal<Customer>(`jf:customer:${slug}`, { name: "", phone: "", address: "", fulfillment: "", payment: "", notes: "" });
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [infoOpen, setInfoOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState(menu.categories[0]?.id || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useLocal<{ id: string; number: number; total: number; whatsappUrl: string | null } | null>(`jf:last:${slug}`, null);
  const [tracking, setTracking] = useState<{ status: string } | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Mantiene el menú al día (precios, agotados, horario) mientras la página está abierta.
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/food/public/${encodeURIComponent(slug)}`);
        if (res.ok) {
          const json = await res.json();
          setMenu(json?.data ?? json);
        }
      } catch {}
    }, 60000);
    return () => clearInterval(t);
  }, [slug]);

  // Estado del último pedido.
  useEffect(() => {
    if (!placed) return;
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/food/public/${encodeURIComponent(slug)}/orders/${placed.id}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!stop) setTracking(json?.data ?? json);
      } catch {}
    };
    load();
    const t = setInterval(load, 15000);
    return () => { stop = true; clearInterval(t); };
  }, [placed, slug]);

  const allProducts = useMemo(() => menu.categories.flatMap((c) => c.products), [menu]);
  const featured = useMemo(() => allProducts.filter((p) => p.isFeatured && !p.soldOut).slice(0, 8), [allProducts]);
  const q = search.trim().toLowerCase();
  const sections = useMemo(
    () =>
      menu.categories
        .map((c) => ({ ...c, products: q ? c.products.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q)) : c.products }))
        .filter((c) => c.products.length),
    [menu, q]
  );

  // Pestaña activa según la sección visible.
  useEffect(() => {
    if (q) return;
    const els = menu.categories.map((c) => document.getElementById(`sec-${c.id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActiveCat(vis.target.id.replace("sec-", ""));
      },
      { rootMargin: "-130px 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [menu, q]);

  useEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLElement>(`[data-cat="${activeCat}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeCat]);

  // Quita del carrito lo que ya no está en el menú.
  useEffect(() => {
    const ids = new Set(allProducts.filter((p) => !p.soldOut).map((p) => p.id));
    setCart((c) => (c.some((l) => !ids.has(l.productId)) ? c.filter((l) => ids.has(l.productId)) : c));
  }, [allProducts, setCart]);

  const count = cart.reduce((s, l) => s + l.quantity, 0);
  const subtotal = Math.round(cart.reduce((s, l) => s + l.unit * l.quantity, 0) * 100) / 100;

  const fulfillments = (["delivery", "pickup", "dine_in"] as Fulfillment[]).filter(
    (f) => (f === "delivery" && r.delivery.enabled) || (f === "pickup" && r.pickup.enabled) || (f === "dine_in" && r.dineIn.enabled)
  );
  const fulfillment: Fulfillment | "" = fulfillments.includes(customer.fulfillment as Fulfillment) ? customer.fulfillment : fulfillments[0] || "";
  const payment: PaymentMethod | "" = r.paymentMethods.includes(customer.payment as PaymentMethod) ? customer.payment : r.paymentMethods[0] || "";
  const deliveryFee = fulfillment === "delivery" ? r.delivery.fee : 0;
  const belowMin = fulfillment === "delivery" && r.delivery.minOrder > 0 && subtotal < r.delivery.minOrder;

  const scrollTo = (id: string) => {
    setSearch("");
    const el = document.getElementById(`sec-${id}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 118, behavior: "smooth" });
  };

  const addToCart = (line: Omit<CartLine, "key">) => {
    const key = `${line.productId}|${JSON.stringify(line.options)}|${line.notes}`;
    setCart((c) => (c.some((l) => l.key === key) ? c.map((l) => (l.key === key ? { ...l, quantity: Math.min(99, l.quantity + line.quantity) } : l)) : [...c, { ...line, key }]));
  };

  const submit = async () => {
    setError(null);
    if (!customer.name.trim()) return setError("Escribe tu nombre");
    if (customer.phone.replace(/\D/g, "").length < 7) return setError("Escribe un teléfono válido");
    if (fulfillment === "delivery" && customer.address.trim().length < 5) return setError("Escribe la dirección de entrega");
    setSending(true);
    // La pestaña se abre antes de esperar la respuesta para que el navegador no la bloquee.
    const wa = r.whatsapp ? window.open("", "_blank") : null;
    try {
      const res = await post<{ id: string; number: number; total: number; whatsappUrl: string | null }>(
        `${API_BASE_URL}/food/public/${encodeURIComponent(slug)}/orders`,
        {
          customerName: customer.name,
          customerPhone: customer.phone,
          address: customer.address,
          fulfillment,
          paymentMethod: payment,
          notes: customer.notes,
          items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, options: l.options, notes: l.notes })),
        }
      );
      if (wa && res.whatsappUrl) wa.location.href = res.whatsappUrl;
      else wa?.close();
      setPlaced(res);
      setTracking({ status: "pending" });
      setCart([]);
      setCustomer((c) => ({ ...c, notes: "" }));
      setCartOpen(false);
      setStep("cart");
      window.scrollTo({ top: 0 });
    } catch (e: any) {
      wa?.close();
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const light = r.theme === "light";
  const vars = {
    "--jf-accent": r.accentColor || "#F97316",
    "--jf-bg": light ? "#faf7f2" : "#111111",
    "--jf-card": light ? "#ffffff" : "#1b1b1b",
    "--jf-sheet": light ? "#ffffff" : "#181818",
    "--jf-soft": light ? "#f1ece4" : "#262626",
    "--jf-line": light ? "#e7e0d5" : "#2c2c2c",
    "--jf-ink": light ? "#1c1917" : "#f6f1e9",
    "--jf-muted": light ? "#6b625a" : "#a8a29e",
  } as React.CSSProperties;

  return (
    <div style={vars} className="min-h-screen bg-[var(--jf-bg)] pb-28 text-[var(--jf-ink)] antialiased">
      <style>{`
        .jf-display{font-family:var(--font-menu),system-ui,sans-serif;letter-spacing:-.02em}
        .jf-fade{animation:jfFade .2s ease-out}
        .jf-up{animation:jfUp .28s cubic-bezier(.2,.8,.2,1)}
        .jf-marquee{animation:jfMarquee 22s linear infinite}
        .jf-noscroll::-webkit-scrollbar{display:none}.jf-noscroll{scrollbar-width:none}
        @keyframes jfFade{from{opacity:0}}
        @keyframes jfUp{from{transform:translateY(40px);opacity:0}}
        @keyframes jfMarquee{to{transform:translateX(-50%)}}
        @media (prefers-reduced-motion:reduce){.jf-marquee,.jf-up,.jf-fade{animation:none}}
      `}</style>

      {/* Portada */}
      <header className="relative">
        <div className="relative h-[230px] overflow-hidden sm:h-[300px]">
          {r.coverUrl ? (
            <img src={r.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ background: "radial-gradient(120% 90% at 20% 10%, var(--jf-accent), transparent 60%), var(--jf-soft)" }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--jf-bg)] via-black/30 to-black/20" />
          <button onClick={() => setInfoOpen(true)} className="absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur hover:bg-black/60">
            Info
          </button>
        </div>
        <div className="relative mx-auto -mt-20 max-w-[720px] px-4">
          <div className="flex items-end gap-4">
            {r.logoUrl ? (
              <img src={r.logoUrl} alt={`Logo de ${r.name}`} className="h-20 w-20 rounded-2xl bg-[var(--jf-card)] object-contain p-1.5 shadow-xl ring-1 ring-[var(--jf-line)]" />
            ) : (
              <div className="jf-display flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--jf-accent)] text-3xl font-extrabold text-white shadow-xl">{r.name.charAt(0)}</div>
            )}
            <div className="min-w-0 pb-1">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${r.isOpen && r.acceptingOrders ? "bg-emerald-500/15 text-emerald-500" : "bg-[var(--jf-soft)] text-[var(--jf-muted)]"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${r.isOpen && r.acceptingOrders ? "bg-emerald-500" : "bg-[var(--jf-muted)]"}`} />
                {r.acceptingOrders ? r.statusLabel : "Pedidos en pausa"}
              </span>
            </div>
          </div>
          <h1 className="jf-display mt-3 text-[34px] font-extrabold leading-[1.02] sm:text-[44px]">{r.name}</h1>
          {r.tagline && <p className="mt-1.5 text-[15px] text-[var(--jf-muted)]">{r.tagline}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-[var(--jf-muted)]">
            {r.delivery.enabled && <span className="rounded-full border border-[var(--jf-line)] px-2.5 py-1">🛵 Delivery{r.delivery.fee ? ` · ${fmt(r.delivery.fee)}` : ""}</span>}
            {r.pickup.enabled && <span className="rounded-full border border-[var(--jf-line)] px-2.5 py-1">🛍️ Retiro en local</span>}
            {r.dineIn.enabled && <span className="rounded-full border border-[var(--jf-line)] px-2.5 py-1">🍽️ En el local</span>}
            {r.address && <button onClick={() => setInfoOpen(true)} className="max-w-full truncate rounded-full border border-[var(--jf-line)] px-2.5 py-1">📍 {r.address}</button>}
          </div>
        </div>
      </header>

      {r.announcement && (
        <div className="mt-6 -rotate-1 overflow-hidden bg-[var(--jf-accent)] py-2 text-white shadow-lg">
          <div className="jf-marquee flex w-max whitespace-nowrap">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="jf-display px-6 text-[14px] font-bold uppercase tracking-wide">✦ {r.announcement}</span>
            ))}
          </div>
        </div>
      )}

      {/* Seguimiento del último pedido */}
      {placed && (
        <div className="mx-auto mt-6 max-w-[720px] px-4">
          <div className="rounded-2xl border border-[var(--jf-line)] bg-[var(--jf-card)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--jf-muted)]">Tu pedido</p>
                <p className="jf-display text-[22px] font-extrabold">#{placed.number} · {fmt(placed.total)}</p>
              </div>
              <button onClick={() => { setPlaced(null); setTracking(null); }} className="text-[13px] text-[var(--jf-muted)] underline">Cerrar</button>
            </div>
            {tracking?.status === "cancelled" ? (
              <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-500">El restaurante canceló este pedido. Escríbeles si tienes dudas.</p>
            ) : (
              <ol className="mt-4 grid grid-cols-4 gap-1.5">
                {STATUS_STEPS.map((s) => {
                  const order = ["pending", "preparing", "ready", "on_the_way", "delivered"];
                  const cur = order.indexOf(tracking?.status || "pending");
                  const idx = order.indexOf(s.id);
                  const done = cur >= idx;
                  return (
                    <li key={s.id} className="text-center">
                      <span className={`block h-1.5 rounded-full ${done ? "bg-[var(--jf-accent)]" : "bg-[var(--jf-soft)]"}`} />
                      <span className={`mt-1.5 block text-[11px] ${done ? "font-semibold" : "text-[var(--jf-muted)]"}`}>
                        {s.id === "ready" && tracking?.status === "on_the_way" ? "En camino" : s.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
            {placed.whatsappUrl && (
              <a href={placed.whatsappUrl} target="_blank" rel="noreferrer" className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] text-[14px] font-bold text-[#0b2e17]">
                Enviar pedido por WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      {/* Categorías + búsqueda */}
      <nav className="sticky top-0 z-30 mt-6 border-b border-[var(--jf-line)] bg-[var(--jf-bg)]/90 backdrop-blur-md">
        <div className="mx-auto max-w-[720px] px-4 pt-3">
          <label className="relative block">
            <span className="sr-only">Buscar en el menú</span>
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--jf-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" /></svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="¿Qué se te antoja?"
              className="h-11 w-full rounded-full border border-[var(--jf-line)] bg-[var(--jf-card)] pl-10 pr-4 text-[15px] text-[var(--jf-ink)] placeholder:text-[var(--jf-muted)] focus:border-[var(--jf-accent)] focus:outline-none"
            />
          </label>
          <div ref={tabsRef} className="jf-noscroll -mx-4 flex gap-2 overflow-x-auto px-4 py-3">
            {menu.categories.map((c) => (
              <button
                key={c.id}
                data-cat={c.id}
                onClick={() => scrollTo(c.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
                  activeCat === c.id && !q ? "bg-[var(--jf-accent)] text-white" : "border border-[var(--jf-line)] bg-[var(--jf-card)] text-[var(--jf-muted)] hover:text-[var(--jf-ink)]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[720px] px-4">
        {featured.length > 0 && !q && (
          <section className="pt-6">
            <h2 className="jf-display text-[22px] font-extrabold">Los favoritos</h2>
            <div className="jf-noscroll -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
              {featured.map((p) => (
                <button key={p.id} onClick={() => setProduct(p)} className="w-[200px] flex-shrink-0 overflow-hidden rounded-2xl border border-[var(--jf-line)] bg-[var(--jf-card)] text-left">
                  {p.image ? (
                    <div className="aspect-[4/3] bg-[var(--jf-soft)]"><img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" /></div>
                  ) : (
                    <div className="jf-display flex aspect-[4/3] items-center justify-center text-[44px] font-extrabold text-white/90" style={{ background: "linear-gradient(135deg, var(--jf-accent), color-mix(in srgb, var(--jf-accent) 45%, #000))" }}>
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <div className="p-3">
                    <p className="line-clamp-1 text-[15px] font-bold">{p.name}</p>
                    <p className="mt-0.5 text-[15px] font-bold text-[var(--jf-accent)]">{fmt(p.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {sections.length === 0 && (
          <p className="py-16 text-center text-[15px] text-[var(--jf-muted)]">{q ? `No encontramos “${search}” en el menú.` : "El menú se está preparando. Vuelve pronto."}</p>
        )}

        {sections.map((c) => (
          <section key={c.id} id={`sec-${c.id}`} className="scroll-mt-32 pt-8">
            <h2 className="jf-display text-[26px] font-extrabold">{c.name}</h2>
            <div className="mt-3 space-y-3">
              {c.products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => !p.soldOut && setProduct(p)}
                  disabled={p.soldOut}
                  className="flex w-full gap-3 rounded-2xl border border-[var(--jf-line)] bg-[var(--jf-card)] p-3 text-left transition-colors hover:border-[var(--jf-accent)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-[var(--jf-line)]"
                >
                  <div className="min-w-0 flex-1 py-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.tags.map((t) => (
                        <span key={t} className="rounded-full bg-[var(--jf-soft)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--jf-accent)]">{t}</span>
                      ))}
                      {p.soldOut && <span className="rounded-full bg-[var(--jf-soft)] px-2 py-0.5 text-[11px] font-bold uppercase text-[var(--jf-muted)]">Agotado</span>}
                    </div>
                    <p className="mt-1 text-[16px] font-bold leading-snug">{p.name}</p>
                    {p.description && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--jf-muted)]">{p.description}</p>}
                    <p className="mt-2 flex items-baseline gap-2">
                      <span className="text-[16px] font-extrabold text-[var(--jf-accent)]">{fmt(p.price)}</span>
                      {p.comparePrice ? <span className="text-[13px] text-[var(--jf-muted)] line-through">{fmt(p.comparePrice)}</span> : null}
                    </p>
                  </div>
                  {p.image ? (
                    <div className="relative h-[104px] w-[104px] flex-shrink-0 overflow-hidden rounded-xl bg-[var(--jf-soft)]">
                      <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                      {!p.soldOut && (
                        <span className="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--jf-accent)] text-xl font-bold leading-none text-white shadow-lg" aria-hidden>+</span>
                      )}
                    </div>
                  ) : (
                    // Sin foto: solo el botón, sin recuadro vacío.
                    !p.soldOut && (
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center self-end rounded-full bg-[var(--jf-accent)] text-xl font-bold leading-none text-white" aria-hidden>+</span>
                    )
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}

        <footer className="mt-14 border-t border-[var(--jf-line)] py-8 text-center text-[12px] text-[var(--jf-muted)]">
          <p className="jf-display text-[18px] font-bold text-[var(--jf-ink)]">{r.name}</p>
          {r.address && <p className="mt-1">{r.address}</p>}
          <p className="mt-4">Menú digital con Jeaz Food</p>
        </footer>
      </main>

      {/* Barra del carrito */}
      {count > 0 && !cartOpen && !product && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => { setStep("cart"); setCartOpen(true); setError(null); }}
            className="jf-up mx-auto flex h-14 w-full max-w-[520px] items-center justify-between rounded-full bg-[var(--jf-accent)] pl-2 pr-5 text-white shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
          >
            <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-black/25 px-2 text-[15px] font-extrabold">{count}</span>
            <span className="text-[16px] font-bold">Ver mi pedido</span>
            <span className="text-[16px] font-extrabold tabular-nums">{fmt(subtotal)}</span>
          </button>
        </div>
      )}

      {product && <ProductSheet product={product} fmt={fmt} canOrder={r.canOrder} onClose={() => setProduct(null)} onAdd={(l) => { addToCart(l); setProduct(null); }} />}

      <Sheet open={cartOpen} onClose={() => setCartOpen(false)} label="Tu pedido">
        <div className="flex items-center justify-between border-b border-[var(--jf-line)] px-5 py-4">
          {step === "checkout" ? (
            <button onClick={() => setStep("cart")} className="text-[14px] font-semibold text-[var(--jf-muted)]">← Volver</button>
          ) : (
            <h2 className="jf-display text-[24px] font-extrabold">Tu pedido</h2>
          )}
          <button onClick={() => setCartOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--jf-soft)]" aria-label="Cerrar">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "cart" ? (
            cart.length === 0 ? (
              <p className="py-10 text-center text-[var(--jf-muted)]">Tu pedido está vacío.</p>
            ) : (
              <ul className="divide-y divide-[var(--jf-line)]">
                {cart.map((l) => (
                  <li key={l.key} className="flex gap-3 py-3">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--jf-soft)]">{l.image && <img src={l.image} alt="" className="h-full w-full object-cover" />}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold leading-snug">{l.name}</p>
                      {l.optionNames.length > 0 && <p className="text-[12px] text-[var(--jf-muted)]">{l.optionNames.join(" · ")}</p>}
                      {l.notes && <p className="text-[12px] italic text-[var(--jf-muted)]">“{l.notes}”</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <Stepper
                          value={l.quantity}
                          min={0}
                          onChange={(v) => setCart((c) => (v === 0 ? c.filter((x) => x.key !== l.key) : c.map((x) => (x.key === l.key ? { ...x, quantity: v } : x))))}
                        />
                        <span className="text-[15px] font-bold tabular-nums">{fmt(l.unit * l.quantity)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="space-y-5">
              {fulfillments.length > 1 && (
                <div>
                  <p className="mb-2 text-[13px] font-semibold text-[var(--jf-muted)]">¿Cómo lo quieres?</p>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${fulfillments.length}, minmax(0,1fr))` }}>
                    {fulfillments.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setCustomer({ ...customer, fulfillment: f })}
                        className={`rounded-xl border px-2 py-3 text-[14px] font-semibold ${fulfillment === f ? "border-[var(--jf-accent)] bg-[var(--jf-accent)]/15" : "border-[var(--jf-line)] text-[var(--jf-muted)]"}`}
                      >
                        {FULFILLMENT_LABELS[f]}
                      </button>
                    ))}
                  </div>
                  {fulfillment === "delivery" && r.delivery.note && <p className="mt-2 text-[12px] text-[var(--jf-muted)]">{r.delivery.note}</p>}
                  {fulfillment === "pickup" && r.pickup.note && <p className="mt-2 text-[12px] text-[var(--jf-muted)]">{r.pickup.note}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Field label="Tu nombre" value={customer.name} onChange={(v) => setCustomer({ ...customer, name: v })} autoComplete="name" />
                <Field label="Teléfono" value={customer.phone} onChange={(v) => setCustomer({ ...customer, phone: v })} type="tel" autoComplete="tel" />
              </div>
              {fulfillment === "delivery" && (
                <Field label="Dirección de entrega y referencia" value={customer.address} onChange={(v) => setCustomer({ ...customer, address: v })} autoComplete="street-address" multiline />
              )}

              <div>
                <p className="mb-2 text-[13px] font-semibold text-[var(--jf-muted)]">Pago</p>
                <div className="flex flex-wrap gap-2">
                  {r.paymentMethods.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCustomer({ ...customer, payment: m })}
                      className={`rounded-full border px-4 py-2 text-[14px] font-semibold ${payment === m ? "border-[var(--jf-accent)] bg-[var(--jf-accent)]/15" : "border-[var(--jf-line)] text-[var(--jf-muted)]"}`}
                    >
                      {PAYMENT_LABELS[m]}
                    </button>
                  ))}
                </div>
                {(payment === "transfer" || payment === "deuna") && r.transferInfo && (
                  <p className="mt-2 whitespace-pre-line rounded-xl bg-[var(--jf-soft)] p-3 text-[13px]">{r.transferInfo}</p>
                )}
              </div>

              <Field label="Notas para la cocina (opcional)" value={customer.notes} onChange={(v) => setCustomer({ ...customer, notes: v })} multiline placeholder="Ej. sin cebolla, salsas aparte..." />
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-[var(--jf-line)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <dl className="mb-3 space-y-1 text-[14px]">
              <div className="flex justify-between text-[var(--jf-muted)]"><dt>Subtotal</dt><dd className="tabular-nums">{fmt(subtotal)}</dd></div>
              {step === "checkout" && fulfillment === "delivery" && (
                <div className="flex justify-between text-[var(--jf-muted)]"><dt>Envío</dt><dd className="tabular-nums">{deliveryFee ? fmt(deliveryFee) : "Por confirmar"}</dd></div>
              )}
              <div className="flex justify-between text-[18px] font-extrabold"><dt>Total</dt><dd className="tabular-nums">{fmt(subtotal + (step === "checkout" ? deliveryFee : 0))}</dd></div>
            </dl>
            {error && <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-500">{error}</p>}
            {!r.canOrder ? (
              <p className="rounded-xl bg-[var(--jf-soft)] px-3 py-3 text-center text-[14px] font-semibold text-[var(--jf-muted)]">
                {r.acceptingOrders ? `${r.statusLabel}. Puedes armar tu pedido y enviarlo cuando abramos.` : "El restaurante no está recibiendo pedidos ahora."}
              </p>
            ) : step === "cart" ? (
              <button onClick={() => { setStep("checkout"); setError(null); }} className="w-full rounded-full bg-[var(--jf-accent)] py-3.5 text-[16px] font-bold text-white">
                Continuar
              </button>
            ) : (
              <>
                {belowMin && <p className="mb-2 text-center text-[13px] text-[var(--jf-muted)]">El pedido mínimo para delivery es {fmt(r.delivery.minOrder)}.</p>}
                <button onClick={submit} disabled={sending || belowMin || !fulfillment || !payment} className="w-full rounded-full bg-[var(--jf-accent)] py-3.5 text-[16px] font-bold text-white disabled:opacity-50">
                  {sending ? "Enviando..." : r.whatsapp ? "Confirmar y enviar por WhatsApp" : "Confirmar pedido"}
                </button>
              </>
            )}
          </div>
        )}
      </Sheet>

      <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} label="Información">
        <div className="flex items-center justify-between border-b border-[var(--jf-line)] px-5 py-4">
          <h2 className="jf-display text-[24px] font-extrabold">{r.name}</h2>
          <button onClick={() => setInfoOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--jf-soft)]" aria-label="Cerrar">✕</button>
        </div>
        <div className="space-y-5 overflow-y-auto px-5 py-4 text-[14px]">
          {r.description && <p className="leading-relaxed text-[var(--jf-muted)]">{r.description}</p>}
          <div>
            <p className="mb-2 font-bold">Horario</p>
            <ul className="space-y-1">
              {r.hours.map((h, i) => (
                <li key={i} className="flex justify-between text-[var(--jf-muted)]">
                  <span>{DAY_LABELS[i]}</span>
                  <span className="tabular-nums">{h.open ? `${h.from} – ${h.to}` : "Cerrado"}</span>
                </li>
              ))}
            </ul>
          </div>
          {r.address && (
            <div>
              <p className="mb-1 font-bold">Dirección</p>
              <p className="text-[var(--jf-muted)]">{r.address}</p>
              <a href={r.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}`} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-[var(--jf-accent)]">
                Cómo llegar →
              </a>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pb-2">
            {r.whatsapp && <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] px-4 py-2 font-bold text-[#0b2e17]">WhatsApp</a>}
            {r.phone && <a href={`tel:${r.phone}`} className="rounded-full border border-[var(--jf-line)] px-4 py-2 font-semibold">Llamar</a>}
            {r.instagram && <a href={`https://instagram.com/${r.instagram}`} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--jf-line)] px-4 py-2 font-semibold">@{r.instagram}</a>}
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const cls = "w-full rounded-xl border border-[var(--jf-line)] bg-[var(--jf-soft)] px-3 pb-2 pt-6 text-[15px] text-[var(--jf-ink)] placeholder:text-[var(--jf-muted)]/60 focus:border-[var(--jf-accent)] focus:outline-none";
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute left-3 top-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--jf-muted)]">{label}</span>
      {multiline ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} placeholder={placeholder} maxLength={300} className={cls} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} placeholder={placeholder} maxLength={80} className={cls} />
      )}
    </label>
  );
}

function ProductSheet({
  product: p,
  fmt,
  canOrder,
  onClose,
  onAdd,
}: {
  product: FoodProduct;
  fmt: (n: number) => string;
  canOrder: boolean;
  onClose: () => void;
  onAdd: (line: Omit<CartLine, "key">) => void;
}) {
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);

  const toggle = (g: FoodOptionGroup, id: string) =>
    setPicked((cur) => {
      const list = cur[g.id] || [];
      if (g.max === 1) return { ...cur, [g.id]: list[0] === id && !g.required ? [] : [id] };
      if (list.includes(id)) return { ...cur, [g.id]: list.filter((x) => x !== id) };
      if (list.length >= g.max) return cur;
      return { ...cur, [g.id]: [...list, id] };
    });

  const missing = p.optionGroups.filter((g) => g.required && !(picked[g.id] || []).length);
  const extra = p.optionGroups.reduce((s, g) => s + g.options.filter((o) => (picked[g.id] || []).includes(o.id)).reduce((a, o) => a + o.price, 0), 0);
  const unit = Math.round((p.price + extra) * 100) / 100;

  const add = () => {
    setTried(true);
    if (missing.length) {
      document.getElementById(`grp-${missing[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onAdd({
      productId: p.id,
      name: p.name,
      image: p.image,
      unit,
      quantity: qty,
      options: p.optionGroups.filter((g) => (picked[g.id] || []).length).map((g) => ({ groupId: g.id, optionIds: picked[g.id] })),
      optionNames: p.optionGroups.flatMap((g) => g.options.filter((o) => (picked[g.id] || []).includes(o.id)).map((o) => o.name)),
      notes: notes.trim(),
    });
  };

  return (
    <Sheet open onClose={onClose} label={p.name}>
      <div className="flex-1 overflow-y-auto">
        {p.image ? (
          <div className="relative aspect-[16/10] bg-[var(--jf-soft)]">
            <img src={p.image} alt="" className="h-full w-full object-cover" />
            <button onClick={onClose} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur" aria-label="Cerrar">✕</button>
          </div>
        ) : (
          // Sin foto: cabecera compacta en vez de un recuadro gris vacío.
          <div className="flex justify-end px-3 pt-3">
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--jf-soft)]" aria-label="Cerrar">✕</button>
          </div>
        )}
        <div className="px-5 pb-4 pt-4">
          <h2 className="jf-display text-[28px] font-extrabold leading-tight">{p.name}</h2>
          {p.description && <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--jf-muted)]">{p.description}</p>}
          <p className="mt-2 text-[18px] font-extrabold text-[var(--jf-accent)]">{fmt(p.price)}</p>

          {p.optionGroups.map((g) => {
            const sel = picked[g.id] || [];
            const warn = tried && g.required && !sel.length;
            return (
              <fieldset key={g.id} id={`grp-${g.id}`} className="mt-6">
                <legend className="flex w-full items-center justify-between">
                  <span className="text-[16px] font-bold">{g.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${warn ? "bg-red-500/15 text-red-500" : "bg-[var(--jf-soft)] text-[var(--jf-muted)]"}`}>
                    {g.required ? "Obligatorio" : "Opcional"}
                  </span>
                </legend>
                <p className="text-[12px] text-[var(--jf-muted)]">{g.max === 1 ? "Elige 1" : `Elige hasta ${g.max}`}</p>
                <div className="mt-2 divide-y divide-[var(--jf-line)] rounded-2xl border border-[var(--jf-line)]">
                  {g.options.map((o) => {
                    const on = sel.includes(o.id);
                    return (
                      <button key={o.id} type="button" onClick={() => toggle(g, o.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 ${g.max === 1 ? "rounded-full" : "rounded-md"} ${on ? "border-[var(--jf-accent)] bg-[var(--jf-accent)] text-white" : "border-[var(--jf-muted)]"}`}>
                          {on && <span className="text-[11px] font-black">✓</span>}
                        </span>
                        <span className="flex-1 text-[15px]">{o.name}</span>
                        {o.price > 0 && <span className="text-[14px] text-[var(--jf-muted)]">+{fmt(o.price)}</span>}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <label className="mt-6 block">
            <span className="text-[16px] font-bold">¿Algo que debamos saber?</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={180}
              rows={2}
              placeholder="Ej. sin cebolla, término medio..."
              className="mt-2 w-full rounded-xl border border-[var(--jf-line)] bg-[var(--jf-soft)] px-3 py-2.5 text-[15px] text-[var(--jf-ink)] placeholder:text-[var(--jf-muted)]/70 focus:border-[var(--jf-accent)] focus:outline-none"
            />
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-[var(--jf-line)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <Stepper value={qty} onChange={setQty} />
        <button onClick={add} className="flex-1 rounded-full bg-[var(--jf-accent)] py-3.5 text-[16px] font-bold text-white">
          {canOrder ? "Agregar" : "Agregar al pedido"} · {fmt(unit * qty)}
        </button>
      </div>
    </Sheet>
  );
}
