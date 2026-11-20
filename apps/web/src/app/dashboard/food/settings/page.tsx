"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import api from "@/lib/api";
import MediaPicker from "@/components/media-picker";
import { useAuthStore } from "@/stores/auth-store";
import { DAY_LABELS, FoodSettings, PAYMENT_LABELS, PaymentMethod, menuUrl, unwrap } from "@/lib/food";

const card = "rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)]";

const TIMEZONES = [
  "America/Guayaquil", "America/Bogota", "America/Lima", "America/Mexico_City", "America/Santiago",
  "America/Argentina/Buenos_Aires", "America/Caracas", "America/Santo_Domingo", "America/Panama",
  "America/Costa_Rica", "America/Montevideo", "America/La_Paz", "America/Asuncion", "America/New_York", "Europe/Madrid",
];

interface Data {
  name: string;
  slug: string;
  logoUrl: string | null;
  settings: FoodSettings;
  status: { isOpen: boolean; label: string };
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-[#e3e3e3] py-6 last:border-0 md:grid-cols-[260px_1fr]">
      <div>
        <h2 className="text-[14px] font-semibold text-[#303030]">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-[#616161]">{description}</p>}
      </div>
      <div className={`${card} space-y-4`}>{children}</div>
    </section>
  );
}

function Check({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#303030]" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-[13px] font-medium text-[#303030]">{label}</span>
        {hint && <span className="block text-[12px] text-[#8a8a8a]">{hint}</span>}
      </span>
    </label>
  );
}

export default function FoodSettingsPage() {
  const { tenantId } = useAuthStore();
  const [data, setData] = useState<Data | null>(null);
  const [initial, setInitial] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [picker, setPicker] = useState<"logo" | "cover" | null>(null);
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!tenantId) return;
    api
      .get("/food/settings")
      .then((r) => {
        const d = unwrap<Data>(r);
        setData(d);
        setInitial(JSON.stringify(d));
      })
      .catch((err) => setMsg({ type: "error", text: err.response?.data?.message || "No pudimos cargar la configuración." }));
  }, [tenantId]);

  useEffect(() => {
    if (!data?.slug) return;
    QRCode.toDataURL(menuUrl(data.slug), { width: 512, margin: 2 }).then(setQr).catch(() => setQr(""));
  }, [data?.slug]);

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-[1000px] p-4 sm:p-6">
        {msg ? <p className="rounded-lg bg-[#fedad9] px-3 py-2 text-[13px] text-[#8e0b21]">{msg.text}</p> : <div className="h-96 animate-pulse rounded-xl bg-[#e3e3e3]" />}
      </main>
    );
  }

  const s = data.settings;
  const dirty = JSON.stringify(data) !== initial;
  const set = (patch: Partial<FoodSettings>) => setData({ ...data, settings: { ...s, ...patch } });
  const setDay = (i: number, patch: Partial<FoodSettings["hours"][number]>) =>
    set({ hours: s.hours.map((h, k) => (k === i ? { ...h, ...patch } : h)) });
  const togglePayment = (m: PaymentMethod) =>
    set({ paymentMethods: s.paymentMethods.includes(m) ? s.paymentMethods.filter((x) => x !== m) : [...s.paymentMethods, m] });

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const d = unwrap<Data>(await api.put("/food/settings", { name: data.name, slug: data.slug, logoUrl: data.logoUrl || "", settings: data.settings }));
      setData(d);
      setInitial(JSON.stringify(d));
      useAuthStore.setState((st: any) => ({ tenant: st.tenant ? { ...st.tenant, name: d.name, slug: d.slug } : st.tenant }));
      setMsg({ type: "ok", text: "Cambios guardados" });
      setTimeout(() => setMsg(null), 2500);
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message || "No se pudieron guardar los cambios." });
    } finally {
      setSaving(false);
    }
  };

  const noFulfillment = !s.delivery.enabled && !s.pickup.enabled && !s.dineIn.enabled;

  return (
    <main className="mx-auto w-full max-w-[1000px] p-4 pb-28 sm:p-6 sm:pb-28">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Mi restaurante</h1>
          <p className="page-subtitle">Lo que ven tus clientes en el menú y cómo recibes los pedidos.</p>
        </div>
        <a href={menuUrl(data.slug)} target="_blank" rel="noreferrer" className="btn-secondary">Ver mi menú ↗</a>
      </div>

      <Section title="Recepción de pedidos" description="Pausa los pedidos cuando tengas mucha demanda o cierres antes.">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-[#303030]">{s.acceptingOrders ? "Recibiendo pedidos" : "Pedidos pausados"}</p>
            <p className="text-[12px] text-[#8a8a8a]">Según tu horario ahora: {data.status.label}</p>
          </div>
          <button onClick={() => set({ acceptingOrders: !s.acceptingOrders })} className={s.acceptingOrders ? "btn-secondary" : "btn-primary"}>
            {s.acceptingOrders ? "Pausar pedidos" : "Reanudar pedidos"}
          </button>
        </div>
        <Check
          on={s.ordersWhenClosed}
          onChange={(v) => set({ ordersWhenClosed: v })}
          label="Aceptar pedidos fuera de horario"
          hint="Útil para pedidos programados. Si está apagado, fuera de horario el menú se ve pero no se puede pedir."
        />
      </Section>

      <Section title="Datos del restaurante" description="Nombre, logo y portada que aparecen arriba del menú.">
        <div>
          <label className="label">Nombre</label>
          <input className="input-field" value={data.name} maxLength={80} onChange={(e) => setData({ ...data, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Frase corta</label>
          <input className="input-field" value={s.tagline} maxLength={120} onChange={(e) => set({ tagline: e.target.value })} placeholder="Ej. Smash burgers y cócteles de la casa" />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input-field" rows={3} value={s.description} maxLength={600} onChange={(e) => set({ description: e.target.value })} placeholder="Cuéntale a tus clientes qué te hace especial." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Logo</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setPicker("logo")} className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#8a8a8a]/60 bg-[#f7f7f7] text-[12px] text-[#616161]">
                {data.logoUrl ? <img src={data.logoUrl} alt="" className="h-full w-full object-contain" /> : "+ Logo"}
              </button>
              {data.logoUrl && <button className="text-[12px] text-[#c70a24] hover:underline" onClick={() => setData({ ...data, logoUrl: null })}>Quitar</button>}
            </div>
          </div>
          <div>
            <label className="label">Foto de portada</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setPicker("cover")} className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#8a8a8a]/60 bg-[#f7f7f7] text-[12px] text-[#616161]">
                {s.coverUrl ? <img src={s.coverUrl} alt="" className="h-full w-full object-cover" /> : "+ Portada"}
              </button>
              {s.coverUrl && <button className="text-[12px] text-[#c70a24] hover:underline" onClick={() => set({ coverUrl: "" })}>Quitar</button>}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Enlace y código QR" description="Comparte el enlace en redes o imprime el QR para tus mesas y empaques.">
        <div>
          <label className="label">Enlace del menú</label>
          <div className="flex items-center overflow-hidden rounded-lg border border-[#8a8a8a]/60 focus-within:ring-2">
            <span className="whitespace-nowrap bg-[#f7f7f7] px-3 py-1.5 text-[13px] text-[#616161]">{menuUrl("").replace(/^https?:\/\//, "")}</span>
            <input
              className="w-full px-2 py-1.5 text-[13px] text-[#303030] outline-none"
              value={data.slug}
              maxLength={60}
              onChange={(e) => setData({ ...data, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            />
          </div>
          <p className="mt-1 text-[12px] text-[#8a8a8a]">Si lo cambias, el enlace y el QR anteriores dejarán de funcionar.</p>
        </div>
        {qr && (
          <div className="flex items-center gap-4">
            <img src={qr} alt="Código QR del menú" className="h-32 w-32 rounded-lg border border-[#e3e3e3]" />
            <div className="space-y-2">
              <a href={qr} download={`menu-${data.slug}-qr.png`} className="btn-secondary">Descargar QR</a>
              <p className="max-w-[260px] text-[12px] text-[#8a8a8a]">Imprímelo en tamaño mínimo de 3 cm para que se lea bien con el celular.</p>
            </div>
          </div>
        )}
      </Section>

      <Section title="Contacto y ubicación" description="Tu WhatsApp recibe cada pedido con el detalle completo.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">WhatsApp para pedidos</label>
            <input className="input-field" value={s.whatsapp} inputMode="numeric" onChange={(e) => set({ whatsapp: e.target.value.replace(/\D/g, "") })} placeholder="593991234567" />
            <p className="mt-1 text-[12px] text-[#8a8a8a]">Con código de país, sin + ni espacios.</p>
          </div>
          <div>
            <label className="label">Teléfono (opcional)</label>
            <input className="input-field" value={s.phone} maxLength={30} onChange={(e) => set({ phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Dirección</label>
          <input className="input-field" value={s.address} maxLength={200} onChange={(e) => set({ address: e.target.value })} placeholder="Av. Principal y Calle 2, local 5" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Enlace de Google Maps (opcional)</label>
            <input className="input-field" value={s.mapsUrl} onChange={(e) => set({ mapsUrl: e.target.value })} placeholder="https://maps.app.goo.gl/..." />
          </div>
          <div>
            <label className="label">Instagram (opcional)</label>
            <input className="input-field" value={s.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="@turestaurante" />
          </div>
        </div>
      </Section>

      <Section title="Entrega" description="Elige cómo pueden recibir sus pedidos tus clientes.">
        <Check on={s.delivery.enabled} onChange={(v) => set({ delivery: { ...s.delivery, enabled: v } })} label="Delivery" hint="El cliente escribe su dirección." />
        {s.delivery.enabled && (
          <div className="ml-6 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Costo de envío ({s.currencySymbol})</label>
              <input className="input-field" type="number" min="0" step="0.01" value={s.delivery.fee} onChange={(e) => set({ delivery: { ...s.delivery, fee: Number(e.target.value) || 0 } })} />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">Déjalo en 0 si lo confirmas según el sector.</p>
            </div>
            <div>
              <label className="label">Pedido mínimo ({s.currencySymbol})</label>
              <input className="input-field" type="number" min="0" step="0.01" value={s.delivery.minOrder} onChange={(e) => set({ delivery: { ...s.delivery, minOrder: Number(e.target.value) || 0 } })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Nota para el cliente</label>
              <input className="input-field" maxLength={160} value={s.delivery.note} onChange={(e) => set({ delivery: { ...s.delivery, note: e.target.value } })} />
            </div>
          </div>
        )}
        <Check on={s.pickup.enabled} onChange={(v) => set({ pickup: { ...s.pickup, enabled: v } })} label="Retiro en el local" />
        <Check on={s.dineIn.enabled} onChange={(v) => set({ dineIn: { enabled: v } })} label="Pedir para comer en el local" hint="Útil con el QR en las mesas." />
        {noFulfillment && <p className="text-[12px] text-[#8e0b21]">Activa al menos una forma de entrega o nadie podrá pedir.</p>}
      </Section>

      <Section title="Pagos" description="Los pedidos se pagan al recibir o por transferencia; tú confirmas el pago en el panel.">
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
            <Check key={m} on={s.paymentMethods.includes(m)} onChange={() => togglePayment(m)} label={PAYMENT_LABELS[m]} />
          ))}
        </div>
        {(s.paymentMethods.includes("transfer") || s.paymentMethods.includes("deuna")) && (
          <div>
            <label className="label">Datos para transferir</label>
            <textarea className="input-field" rows={3} maxLength={400} value={s.transferInfo} onChange={(e) => set({ transferInfo: e.target.value })} placeholder="Banco, tipo y número de cuenta, titular, cédula/RUC" />
          </div>
        )}
      </Section>

      <Section title="Horario de atención" description="Fuera de horario el menú muestra cuándo vuelves a abrir.">
        <div className="space-y-2">
          {s.hours.map((h, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3">
              <label className="flex w-32 items-center gap-2 text-[13px] text-[#303030]">
                <input type="checkbox" className="h-4 w-4 accent-[#303030]" checked={h.open} onChange={(e) => setDay(i, { open: e.target.checked })} />
                {DAY_LABELS[i]}
              </label>
              {h.open ? (
                <div className="flex items-center gap-2">
                  <input type="time" className="input-field !w-28" value={h.from} onChange={(e) => setDay(i, { from: e.target.value })} />
                  <span className="text-[13px] text-[#8a8a8a]">a</span>
                  <input type="time" className="input-field !w-28" value={h.to} onChange={(e) => setDay(i, { to: e.target.value })} />
                </div>
              ) : (
                <span className="text-[13px] text-[#8a8a8a]">Cerrado</span>
              )}
            </div>
          ))}
        </div>
        <div className="grid gap-4 border-t border-[#ebebeb] pt-4 sm:grid-cols-3">
          <div>
            <label className="label">Zona horaria</label>
            <select className="input-field" value={s.timezone} onChange={(e) => set({ timezone: e.target.value })}>
              {[...new Set([s.timezone, ...TIMEZONES])].map((tz) => <option key={tz} value={tz}>{tz.split("/").pop()?.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Símbolo de moneda</label>
            <input className="input-field" maxLength={4} value={s.currencySymbol} onChange={(e) => set({ currencySymbol: e.target.value })} />
          </div>
          <div>
            <label className="label">Moneda (código)</label>
            <input className="input-field" maxLength={3} value={s.currency} onChange={(e) => set({ currency: e.target.value.toUpperCase() })} />
          </div>
        </div>
      </Section>

      <Section title="Apariencia del menú" description="El color de acento se usa en botones, precios y categorías.">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Color de acento</label>
            <div className="flex items-center gap-2">
              <input type="color" value={s.accentColor} onChange={(e) => set({ accentColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-[#c9cccf]" />
              <input className="input-field !w-28" value={s.accentColor} onChange={(e) => set({ accentColor: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Fondo</label>
            <div className="flex rounded-lg bg-[#ebebeb] p-0.5">
              {(["dark", "light"] as const).map((t) => (
                <button key={t} onClick={() => set({ theme: t })} className={`rounded-md px-3 py-1 text-[13px] font-medium ${s.theme === t ? "bg-white text-[#303030] shadow-sm" : "text-[#616161]"}`}>
                  {t === "dark" ? "Oscuro" : "Claro"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="label">Anuncio (opcional)</label>
          <input className="input-field" maxLength={160} value={s.announcement} onChange={(e) => set({ announcement: e.target.value })} placeholder="Ej. Jueves de alitas 2x1 · Envío gratis desde $20" />
          <p className="mt-1 text-[12px] text-[#8a8a8a]">Se muestra en una franja animada arriba del menú.</p>
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e3e3e3] bg-white/95 backdrop-blur lg:left-[240px]">
        <div className="mx-auto flex max-w-[1000px] items-center justify-end gap-3 px-4 py-3 sm:px-6">
          {msg && <p className={`mr-auto text-[13px] ${msg.type === "ok" ? "text-[#0c5132]" : "text-[#8e0b21]"}`}>{msg.text}</p>}
          {dirty && !msg && <p className="mr-auto text-[13px] text-[#616161]">Tienes cambios sin guardar</p>}
          <button onClick={() => { setData(JSON.parse(initial)); setMsg(null); }} disabled={!dirty || saving} className="btn-secondary">Descartar</button>
          <button onClick={save} disabled={!dirty || saving} className="btn-primary">{saving ? "Guardando..." : "Guardar"}</button>
        </div>
      </div>

      <MediaPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        onSelect={(url) => {
          if (picker === "logo") setData({ ...data, logoUrl: url });
          else set({ coverUrl: url });
          setPicker(null);
        }}
      />
    </main>
  );
}
