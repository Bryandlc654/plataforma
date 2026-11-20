"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useConfirm } from "@/components/providers/confirm-provider";
import {
  FULFILLMENT_LABELS,
  FoodOrder,
  OrderStatus,
  PAYMENT_LABELS,
  STATUS_META,
  money,
  nextStatus,
  timeAgo,
  unwrap,
} from "@/lib/food";

const card = "rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)]";
const COLUMNS: Array<{ status: OrderStatus; title: string }> = [
  { status: "pending", title: "Nuevos" },
  { status: "preparing", title: "En preparación" },
  { status: "ready", title: "Listos" },
  { status: "on_the_way", title: "En camino" },
];

let audioCtx: AudioContext | null = null;
function getAudio(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtx = Ctx ? new Ctx() : null;
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Aviso sonoro corto cuando entra un pedido nuevo (sin archivos de audio). */
function beep() {
  try {
    const ctx = getAudio();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    [0, 0.18].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.15);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.16);
    });
  } catch {}
}

function OrderCard({ o, sym, onOpen, onAdvance, busy }: { o: FoodOrder; sym: string; onOpen: () => void; onAdvance: () => void; busy: boolean }) {
  const next = nextStatus(o);
  const units = o.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className={`${card} p-3`}>
      <button onClick={onOpen} className="block w-full text-left">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold text-[#303030]">#{o.number}</span>
          <span className="text-[12px] text-[#8a8a8a]">{timeAgo(o.createdAt)}</span>
        </div>
        <p className="mt-0.5 truncate text-[13px] font-medium text-[#303030]">{o.customerName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="badge">{o.fulfillment ? FULFILLMENT_LABELS[o.fulfillment] : "—"}</span>
          {o.paid && <span className="badge badge-success">Pagado</span>}
        </div>
        <ul className="mt-2 space-y-0.5 text-[12px] text-[#616161]">
          {o.items.slice(0, 3).map((i) => (
            <li key={i.id} className="truncate">
              <span className="font-semibold text-[#303030]">{i.quantity}×</span> {i.name}
            </li>
          ))}
          {o.items.length > 3 && <li className="text-[#8a8a8a]">+{o.items.length - 3} más</li>}
        </ul>
        <div className="mt-2 flex items-center justify-between border-t border-[#ebebeb] pt-2 text-[12px]">
          <span className="text-[#8a8a8a]">{units} {units === 1 ? "producto" : "productos"}</span>
          <span className="text-[13px] font-semibold text-[#303030]">{money(o.total, sym)}</span>
        </div>
      </button>
      {next && (
        <button onClick={onAdvance} disabled={busy} className="btn-primary mt-2 w-full">
          {next.label}
        </button>
      )}
    </div>
  );
}

function printTicket(o: FoodOrder, sym: string, restaurant: string) {
  const w = window.open("", "_blank", "width=380,height=640");
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const rows = o.items
    .map(
      (i) =>
        `<tr><td>${i.quantity}× ${esc(i.name)}${i.options.map((op) => `<div class="op">+ ${esc(op.name)}</div>`).join("")}${
          i.notes ? `<div class="op"><i>${esc(i.notes)}</i></div>` : ""
        }</td><td class="r">${money(i.total, sym)}</td></tr>`
    )
    .join("");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Pedido #${o.number}</title>
<style>body{font:13px/1.4 ui-monospace,Menlo,monospace;margin:16px;color:#000}h1{font-size:18px;margin:0}table{width:100%;border-collapse:collapse;margin:10px 0}td{padding:4px 0;vertical-align:top;border-bottom:1px dashed #999}.r{text-align:right;white-space:nowrap}.op{font-size:12px;color:#333;padding-left:12px}.t{font-size:16px;font-weight:bold}</style>
</head><body><h1>${esc(restaurant)}</h1><p>Pedido <b>#${o.number}</b> · ${new Date(o.createdAt).toLocaleString("es")}</p>
<p>${esc(o.customerName || "")} · ${esc(o.customerPhone || "")}<br>${o.fulfillment ? FULFILLMENT_LABELS[o.fulfillment] : ""}${
    o.deliveryAddress ? `: ${esc(o.deliveryAddress)}` : ""
  }</p><table>${rows}</table>
<p>Subtotal: ${money(o.subtotal, sym)}${o.deliveryFee ? `<br>Envío: ${money(o.deliveryFee, sym)}` : ""}<br><span class="t">Total: ${money(o.total, sym)}</span><br>Pago: ${
    o.paymentMethod ? PAYMENT_LABELS[o.paymentMethod] : ""
  }${o.paid ? " (pagado)" : ""}</p>${o.notes ? `<p><b>Notas:</b> ${esc(o.notes)}</p>` : ""}
<script>window.onload=()=>{window.print()}</script></body></html>`);
  w.document.close();
}

function OrderDrawer({
  o,
  sym,
  restaurant,
  onClose,
  onUpdate,
  busy,
}: {
  o: FoodOrder;
  sym: string;
  restaurant: string;
  onClose: () => void;
  onUpdate: (body: { status?: OrderStatus; paid?: boolean }) => void;
  busy: boolean;
}) {
  const { confirm } = useConfirm();
  const next = nextStatus(o);
  const phone = (o.customerPhone || "").replace(/\D/g, "");
  const meta = STATUS_META[o.status];
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-[#ebebeb] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#303030]">Pedido #{o.number}</h2>
            <p className="text-[12px] text-[#8a8a8a]">{new Date(o.createdAt).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
          <button onClick={onClose} className="btn-ghost !px-2" aria-label="Cerrar">✕</button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap gap-1.5">
            <span className={`badge ${meta?.badge || ""}`}>{meta?.label || o.status}</span>
            <span className="badge">{o.fulfillment ? FULFILLMENT_LABELS[o.fulfillment] : "—"}</span>
            <span className={`badge ${o.paid ? "badge-success" : ""}`}>{o.paid ? "Pagado" : "Pago pendiente"}</span>
          </div>

          <section>
            <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Cliente</h3>
            <p className="text-[14px] font-medium text-[#303030]">{o.customerName}</p>
            <p className="text-[13px] text-[#616161]">{o.customerPhone}</p>
            {o.deliveryAddress && <p className="mt-1 text-[13px] text-[#303030]">📍 {o.deliveryAddress}</p>}
            {phone && (
              <div className="mt-2 flex gap-2">
                <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="btn-secondary">WhatsApp</a>
                <a href={`tel:${o.customerPhone}`} className="btn-secondary">Llamar</a>
                {o.deliveryAddress && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.deliveryAddress)}`} target="_blank" rel="noreferrer" className="btn-secondary">Mapa</a>
                )}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Productos</h3>
            <ul className="divide-y divide-[#ebebeb]">
              {o.items.map((i) => (
                <li key={i.id} className="flex gap-3 py-2.5">
                  {i.image ? <img src={i.image} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <span className="h-11 w-11 rounded-lg bg-[#f1f1f1]" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[#303030]">
                      <span className="font-bold">{i.quantity}×</span> {i.name}
                    </p>
                    {i.options.map((op, k) => (
                      <p key={k} className="text-[12px] text-[#616161]">
                        + {op.name} {op.price ? `(${money(op.price, sym)})` : ""}
                      </p>
                    ))}
                    {i.notes && <p className="mt-0.5 rounded bg-[#fff5ea] px-1.5 py-0.5 text-[12px] text-[#5e4200]">“{i.notes}”</p>}
                  </div>
                  <span className="text-[13px] font-semibold text-[#303030]">{money(i.total, sym)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1 border-t border-[#ebebeb] pt-2 text-[13px]">
              <div className="flex justify-between text-[#616161]"><dt>Subtotal</dt><dd>{money(o.subtotal, sym)}</dd></div>
              {o.fulfillment === "delivery" && (
                <div className="flex justify-between text-[#616161]"><dt>Envío</dt><dd>{o.deliveryFee ? money(o.deliveryFee, sym) : "Por confirmar"}</dd></div>
              )}
              <div className="flex justify-between text-[15px] font-bold text-[#303030]"><dt>Total</dt><dd>{money(o.total, sym)}</dd></div>
              <div className="flex justify-between text-[#616161]"><dt>Pago</dt><dd>{o.paymentMethod ? PAYMENT_LABELS[o.paymentMethod] : "—"}</dd></div>
            </dl>
          </section>

          {o.notes && (
            <section>
              <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Notas del cliente</h3>
              <p className="rounded-lg bg-[#f7f7f7] p-3 text-[13px] text-[#303030]">{o.notes}</p>
            </section>
          )}
        </div>

        <footer className="space-y-2 border-t border-[#ebebeb] px-5 py-4">
          {next && (
            <button onClick={() => onUpdate({ status: next.status })} disabled={busy} className="btn-primary w-full !py-2.5">
              {next.label}
            </button>
          )}
          <div className="flex gap-2">
            <button onClick={() => onUpdate({ paid: !o.paid })} disabled={busy} className="btn-secondary flex-1">
              {o.paid ? "Marcar no pagado" : "Marcar pagado"}
            </button>
            <button onClick={() => printTicket(o, sym, restaurant)} className="btn-secondary flex-1">Imprimir</button>
          </div>
          {o.status !== "cancelled" && o.status !== "delivered" && (
            <button
              onClick={async () => {
                if (await confirm({ title: `Cancelar pedido #${o.number}`, message: "El pedido pasará al historial como cancelado.", confirmText: "Cancelar pedido", cancelText: "Volver" }))
                  onUpdate({ status: "cancelled" });
              }}
              disabled={busy}
              className="w-full py-1 text-[13px] font-medium text-[#c70a24] hover:underline"
            >
              Cancelar pedido
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}

export default function FoodOrdersPage() {
  const { tenantId, tenant } = useAuthStore();
  const [tab, setTab] = useState<"active" | "history">("active");
  const [active, setActive] = useState<FoodOrder[]>([]);
  const [history, setHistory] = useState<FoodOrder[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sym, setSym] = useState("$");
  const [sound, setSound] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifyPerm, setNotifyPerm] = useState<NotificationPermission | "unsupported">("default");
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    setNotifyPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  // Activa los avisos: permiso de notificaciones + desbloqueo del sonido (requiere un clic).
  const enableAlerts = async () => {
    getAudio()?.resume().catch(() => {});
    beep();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      try { setNotifyPerm(await Notification.requestPermission()); } catch {}
    }
  };

  useEffect(() => {
    setOpenId(new URLSearchParams(window.location.search).get("id"));
    try { setSound(localStorage.getItem("food:sound") !== "off"); } catch {}
    api.get("/food/settings").then((r) => setSym(unwrap<any>(r)?.settings?.currencySymbol || "$")).catch(() => {});
  }, []);

  const loadActive = useCallback(async () => {
    try {
      const list = unwrap<FoodOrder[]>(await api.get("/food/orders", { params: { scope: "active" } }));
      const ids = new Set(list.map((o) => o.id));
      const fresh = seen.current ? list.filter((o) => o.status === "pending" && !seen.current!.has(o.id)) : [];
      if (fresh.length) {
        if (sound) beep();
        // Notificación del sistema: avisa aunque la pestaña esté en segundo plano.
        if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
          for (const o of fresh.slice(0, 3)) {
            try {
              const n = new Notification(`Nuevo pedido #${o.number}`, { body: `${o.customerName || "Cliente"} · ${o.items.length} ${o.items.length === 1 ? "producto" : "productos"}`, tag: o.id });
              n.onclick = () => { window.focus(); setOpenId(o.id); n.close(); };
            } catch {}
          }
        }
      }
      seen.current = ids;
      setActive(list);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "No pudimos cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }, [sound]);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(unwrap<FoodOrder[]>(await api.get("/food/orders", { params: { scope: search ? undefined : "history", search: search || undefined } })));
    } catch {}
  }, [search]);

  useEffect(() => {
    if (!tenantId) return;
    loadActive();
    const t = setInterval(loadActive, 10000);
    return () => clearInterval(t);
  }, [tenantId, loadActive]);

  useEffect(() => {
    if (tab !== "history" || !tenantId) return;
    const t = setTimeout(loadHistory, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [tab, tenantId, loadHistory, search]);

  // El título de la pestaña muestra cuántos pedidos nuevos esperan.
  const pendingCount = active.filter((o) => o.status === "pending").length;
  useEffect(() => {
    const prev = document.title;
    document.title = pendingCount ? `(${pendingCount}) Pedidos nuevos` : "Pedidos";
    return () => { document.title = prev; };
  }, [pendingCount]);

  const all = useMemo(() => [...active, ...history], [active, history]);
  const [fetched, setFetched] = useState<FoodOrder | null>(null);
  const open = all.find((o) => o.id === openId) || (fetched?.id === openId ? fetched : null);

  // Pedido abierto desde un enlace (?id=) que no está en las listas cargadas.
  useEffect(() => {
    if (!openId || loading || all.some((o) => o.id === openId)) return;
    api.get(`/food/orders/${openId}`).then((r) => setFetched(unwrap<FoodOrder>(r))).catch(() => setOpenId(null));
  }, [openId, loading, all]);

  const update = async (id: string, body: { status?: OrderStatus; paid?: boolean }) => {
    setBusyId(id);
    try {
      const updated = unwrap<FoodOrder>(await api.put(`/food/orders/${id}`, body));
      const isActive = ["pending", "preparing", "ready", "on_the_way"].includes(updated.status);
      setActive((list) => (isActive ? (list.some((o) => o.id === id) ? list.map((o) => (o.id === id ? updated : o)) : [...list, updated]) : list.filter((o) => o.id !== id)));
      setHistory((list) => (isActive ? list.filter((o) => o.id !== id) : list.some((o) => o.id === id) ? list.map((o) => (o.id === id ? updated : o)) : [updated, ...list]));
      if (fetched?.id === id) setFetched(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo actualizar el pedido.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleSound = () => {
    setSound((v) => {
      try { localStorage.setItem("food:sound", v ? "off" : "on"); } catch {}
      return !v;
    });
  };

  return (
    <main className="mx-auto w-full max-w-[1400px] p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">Se actualiza solo cada 10 segundos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {notifyPerm === "default" && (
            <button onClick={enableAlerts} className="btn-primary" title="Avisos con sonido y notificación aunque estés en otra pestaña">
              🔔 Activar avisos de pedidos
            </button>
          )}
          {notifyPerm === "denied" && <span className="text-[12px] text-[#8a8a8a]">Notificaciones bloqueadas en el navegador</span>}
          <button onClick={() => { toggleSound(); getAudio()?.resume().catch(() => {}); }} className="btn-secondary" title="Sonido al llegar un pedido nuevo">
            {sound ? "🔊 Sonido activado" : "🔇 Sonido apagado"}
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-1 rounded-xl bg-[#e3e3e3] p-1 sm:w-fit">
        {(["active", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-4 py-1.5 text-[13px] font-semibold sm:flex-none ${tab === t ? "bg-white text-[#303030] shadow-sm" : "text-[#616161]"}`}
          >
            {t === "active" ? `En curso (${active.length})` : "Historial"}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 rounded-lg bg-[#fedad9] px-3 py-2 text-[13px] text-[#8e0b21]">{error}</p>}

      {tab === "active" ? (
        loading ? (
          <div className="grid animate-pulse gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((c) => <div key={c.status} className="h-64 rounded-xl bg-[#e3e3e3]" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((c) => {
              const list = active.filter((o) => o.status === c.status);
              return (
                <section key={c.status} className="rounded-xl bg-[#e8e8e8] p-2.5">
                  <h2 className="mb-2 flex items-center gap-2 px-1 text-[13px] font-semibold text-[#303030]">
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_META[c.status].dot }} />
                    {c.title}
                    <span className="ml-auto rounded-md bg-white px-1.5 text-[12px] text-[#616161]">{list.length}</span>
                  </h2>
                  <div className="space-y-2">
                    {list.length === 0 && <p className="px-1 py-6 text-center text-[12px] text-[#8a8a8a]">Sin pedidos</p>}
                    {list.map((o) => {
                      const next = nextStatus(o);
                      return (
                        <OrderCard
                          key={o.id}
                          o={o}
                          sym={sym}
                          busy={busyId === o.id}
                          onOpen={() => setOpenId(o.id)}
                          onAdvance={() => next && update(o.id, { status: next.status })}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )
      ) : (
        <section className={`${card} overflow-hidden`}>
          <div className="border-b border-[#ebebeb] p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, cliente o teléfono"
              className="input-field max-w-sm"
            />
          </div>
          {history.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-[#8a8a8a]">No hay pedidos para mostrar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead className="bg-[#f7f7f7] text-left text-[12px] text-[#616161]">
                  <tr>
                    <th className="px-4 py-2 font-medium">Pedido</th>
                    <th className="px-4 py-2 font-medium">Fecha</th>
                    <th className="px-4 py-2 font-medium">Cliente</th>
                    <th className="px-4 py-2 font-medium">Entrega</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                    <th className="px-4 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebebeb]">
                  {history.map((o) => (
                    <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer hover:bg-[#f7f7f7]">
                      <td className="px-4 py-2.5 font-semibold text-[#303030]">#{o.number}</td>
                      <td className="px-4 py-2.5 text-[#616161]">{new Date(o.createdAt).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}</td>
                      <td className="px-4 py-2.5 text-[#303030]">{o.customerName}</td>
                      <td className="px-4 py-2.5 text-[#616161]">{o.fulfillment ? FULFILLMENT_LABELS[o.fulfillment] : "—"}</td>
                      <td className="px-4 py-2.5"><span className={`badge ${STATUS_META[o.status]?.badge || ""}`}>{STATUS_META[o.status]?.label}</span></td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[#303030]">{money(o.total, sym)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {open && (
        <OrderDrawer
          o={open}
          sym={sym}
          restaurant={tenant?.name || ""}
          busy={busyId === open.id}
          onClose={() => setOpenId(null)}
          onUpdate={(body) => update(open.id, body)}
        />
      )}
    </main>
  );
}
