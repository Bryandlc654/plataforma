"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { FULFILLMENT_LABELS, FoodOrder, STATUS_META, menuUrl, money, timeAgo, unwrap } from "@/lib/food";

interface Overview {
  restaurant: { name: string; slug: string; logoUrl: string | null; status: { isOpen: boolean; label: string }; acceptingOrders: boolean };
  currencySymbol: string;
  today: { orders: number; revenue: number; avgTicket: number };
  week: { orders: number; revenue: number; prevRevenue: number; prevOrders: number };
  activeOrders: number;
  days: Array<{ date: string; orders: number; revenue: number }>;
  topProducts: Array<{ name: string; image: string; quantity: number; revenue: number }>;
  byFulfillment: Record<string, number>;
  recentOrders: FoodOrder[];
  setup: { hasCategories: boolean; hasProducts: boolean; hasWhatsapp: boolean; hasLogo: boolean; hasAddress: boolean };
}

const card = "rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)]";

function Stat({ label, value, hint, href }: { label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="text-[13px] font-medium text-[#616161]">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-[#303030]">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-[#8a8a8a]">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className={`${card} block p-4 transition-shadow hover:shadow-md`}>{body}</Link>
  ) : (
    <div className={`${card} p-4`}>{body}</div>
  );
}

/** Ventas de los últimos 7 días: una sola serie, barras finas con tooltip. */
function RevenueChart({ days, symbol }: { days: Overview["days"]; symbol: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...days.map((d) => d.revenue), 1);
  const label = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("es", { weekday: "short" }).replace(".", "");
  return (
    <div>
      <div className="relative flex h-44 items-end gap-2 border-b border-[#e3e3e3] sm:gap-4" role="img" aria-label="Ventas de los últimos 7 días">
        {days.map((d, i) => {
          const h = d.revenue > 0 ? Math.max((d.revenue / max) * 100, 3) : 0;
          return (
            <div
              key={d.date}
              className="relative flex h-full flex-1 cursor-default items-end justify-center"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                className="w-full max-w-[34px] rounded-t-[4px] transition-opacity"
                style={{ height: `${h}%`, background: "var(--color-primary)", opacity: hover === null || hover === i ? 1 : 0.45 }}
              />
              {hover === i && (
                <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-[#1a1a1a] px-2.5 py-1.5 text-[12px] text-white shadow-lg">
                  <p className="font-semibold">{money(d.revenue, symbol)}</p>
                  <p className="text-white/70">{d.orders} {d.orders === 1 ? "pedido" : "pedidos"} · {label(d.date)}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-2 sm:gap-4">
        {days.map((d) => (
          <span key={d.date} className="flex-1 text-center text-[11px] capitalize text-[#8a8a8a]">{label(d.date)}</span>
        ))}
      </div>
    </div>
  );
}

export default function FoodHomePage() {
  const { tenantId } = useAuthStore();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    setWelcome(new URLSearchParams(window.location.search).get("welcome") === "1");
  }, []);

  const load = useCallback(async () => {
    try {
      setData(unwrap<Overview>(await api.get("/food/overview")));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "No pudimos cargar el resumen.");
    }
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [tenantId, load]);

  const copy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(menuUrl(data.restaurant.slug));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  if (error && !data) {
    return (
      <main className="mx-auto w-full max-w-[1200px] p-4 sm:p-6">
        <div className={`${card} p-6 text-[13px] text-[#8e0b21]`}>{error}</div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-[1200px] animate-pulse p-4 sm:p-6">
        <div className="mb-6 h-8 w-64 rounded-lg bg-[#e3e3e3]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`${card} h-24`} />)}
        </div>
        <div className={`${card} mt-4 h-64`} />
      </main>
    );
  }

  const sym = data.currencySymbol;
  const steps = [
    { done: data.setup.hasCategories, label: "Crea las categorías de tu menú", hint: "Ej. Hamburguesas, Bebidas, Postres", href: "/dashboard/food/menu" },
    { done: data.setup.hasProducts, label: "Agrega tus platos con foto y precio", hint: "Puedes sumar extras, salsas y tamaños", href: "/dashboard/food/menu" },
    { done: data.setup.hasWhatsapp, label: "Conecta tu WhatsApp", hint: "Ahí te llegará cada pedido", href: "/dashboard/food/settings" },
    { done: data.setup.hasLogo, label: "Sube tu logo", hint: "Se ve en la parte superior del menú", href: "/dashboard/food/settings" },
    { done: data.setup.hasAddress, label: "Agrega tu dirección y horarios", hint: "Tus clientes sabrán cuándo pedir", href: "/dashboard/food/settings" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const weekDelta = data.week.prevRevenue > 0 ? Math.round(((data.week.revenue - data.week.prevRevenue) / data.week.prevRevenue) * 100) : null;
  const status = data.restaurant.status;

  return (
    <main className="mx-auto w-full max-w-[1200px] p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">{welcome ? `¡Bienvenido a Jeaz Food, ${data.restaurant.name}!` : data.restaurant.name}</h1>
          <p className="page-subtitle flex flex-wrap items-center gap-2">
            <span className={`badge ${!data.restaurant.acceptingOrders ? "badge-critical" : status.isOpen ? "badge-success" : ""}`}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: !data.restaurant.acceptingOrders ? "#c70a24" : status.isOpen ? "#13804a" : "#8a8a8a" }} />
              {!data.restaurant.acceptingOrders ? "Pedidos pausados" : status.label}
            </span>
            <span className="truncate text-[#8a8a8a]">{menuUrl(data.restaurant.slug).replace(/^https?:\/\//, "")}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Mira nuestro menú y haz tu pedido aquí: ${menuUrl(data.restaurant.slug)}`)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            Compartir por WhatsApp
          </a>
          <button onClick={copy} className="btn-secondary">{copied ? "¡Enlace copiado!" : "Copiar enlace"}</button>
          <a href={menuUrl(data.restaurant.slug)} target="_blank" rel="noreferrer" className="btn-primary">Ver mi menú ↗</a>
        </div>
      </div>

      {doneCount < steps.length && (
        <section className={`${card} mb-4 p-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-[#303030]">Prepara tu menú digital</h2>
              <p className="text-[13px] text-[#616161]">{doneCount} de {steps.length} pasos completados</p>
            </div>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#ebebeb]">
              <div className="h-full rounded-full" style={{ width: `${(doneCount / steps.length) * 100}%`, background: "var(--color-primary)" }} />
            </div>
          </div>
          <ul className="mt-4 divide-y divide-[#ebebeb]">
            {steps.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                  <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 text-[11px] ${s.done ? "border-[#13804a] bg-[#13804a] text-white" : "border-dashed border-[#8a8a8a]"}`}>
                    {s.done ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13px] font-medium ${s.done ? "text-[#8a8a8a] line-through" : "text-[#303030]"}`}>{s.label}</span>
                    {!s.done && <span className="block text-[12px] text-[#8a8a8a]">{s.hint}</span>}
                  </span>
                  {!s.done && <span className="text-[13px] text-[#616161]">→</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pedidos hoy" value={String(data.today.orders)} hint="Sin contar cancelados" />
        <Stat label="Ventas hoy" value={money(data.today.revenue, sym)} />
        <Stat label="Ticket promedio" value={money(data.today.avgTicket, sym)} hint="Hoy" />
        <Stat label="Pedidos en curso" value={String(data.activeOrders)} hint="Ver tablero de pedidos →" href="/dashboard/food/orders" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className={`${card} p-5 lg:col-span-2`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-[#303030]">Ventas de los últimos 7 días</h2>
              <p className="text-[13px] text-[#616161]">
                {money(data.week.revenue, sym)} · {data.week.orders} {data.week.orders === 1 ? "pedido" : "pedidos"}
                {weekDelta !== null && (
                  <span className={weekDelta >= 0 ? "text-[#0c5132]" : "text-[#8e0b21]"}> · {weekDelta >= 0 ? "▲" : "▼"} {Math.abs(weekDelta)}% vs. semana anterior</span>
                )}
              </p>
            </div>
          </div>
          <RevenueChart days={data.days} symbol={sym} />
        </section>

        <section className={`${card} p-5`}>
          <h2 className="text-[15px] font-semibold text-[#303030]">Lo más pedido</h2>
          <p className="text-[13px] text-[#616161]">Últimos 7 días</p>
          {data.topProducts.length === 0 ? (
            <p className="mt-6 text-center text-[13px] text-[#8a8a8a]">Aún no hay pedidos esta semana.</p>
          ) : (
            <ol className="mt-3 space-y-2.5">
              {data.topProducts.map((p, i) => (
                <li key={p.name + i} className="flex items-center gap-3">
                  <span className="w-4 text-[12px] font-semibold text-[#8a8a8a]">{i + 1}</span>
                  {p.image ? (
                    <img src={p.image} alt="" className="h-9 w-9 rounded-lg object-cover" />
                  ) : (
                    <span className="h-9 w-9 rounded-lg bg-[#f1f1f1]" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-[#303030]">{p.name}</span>
                    <span className="block text-[12px] text-[#8a8a8a]">{p.quantity} vendidos</span>
                  </span>
                  <span className="text-[13px] font-semibold text-[#303030]">{money(p.revenue, sym)}</span>
                </li>
              ))}
            </ol>
          )}
          {Object.keys(data.byFulfillment).length > 0 && (
            <div className="mt-5 border-t border-[#ebebeb] pt-4">
              <p className="mb-2 text-[12px] font-medium text-[#616161]">Cómo pidieron</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.byFulfillment).map(([k, v]) => (
                  <span key={k} className="badge">{FULFILLMENT_LABELS[k as keyof typeof FULFILLMENT_LABELS] || k}: {v}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className={`${card} mt-4 overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#303030]">Pedidos recientes</h2>
          <Link href="/dashboard/food/orders" className="text-[13px] font-medium text-[#005bd3] hover:underline">Ver todos</Link>
        </div>
        {data.recentOrders.length === 0 ? (
          <div className="border-t border-[#ebebeb] px-5 py-10 text-center">
            <p className="text-[13px] font-medium text-[#303030]">Todavía no tienes pedidos</p>
            <p className="mt-1 text-[13px] text-[#8a8a8a]">Comparte el enlace de tu menú en redes, WhatsApp o un código QR en tus mesas.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#ebebeb] border-t border-[#ebebeb]">
            {data.recentOrders.map((o) => (
              <li key={o.id}>
                <Link href={`/dashboard/food/orders?id=${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[#f7f7f7]">
                  <span className="w-12 text-[13px] font-semibold text-[#303030]">#{o.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-[#303030]">{o.customerName}</span>
                    <span className="block text-[12px] text-[#8a8a8a]">
                      {o.fulfillment ? FULFILLMENT_LABELS[o.fulfillment] : ""} · {timeAgo(o.createdAt)}
                    </span>
                  </span>
                  <span className={`badge ${STATUS_META[o.status]?.badge || ""}`}>{STATUS_META[o.status]?.label || o.status}</span>
                  <span className="w-20 text-right text-[13px] font-semibold text-[#303030]">{money(o.total, sym)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
