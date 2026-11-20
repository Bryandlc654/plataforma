/**
 * Configuración de un restaurante de Jeaz Food. Vive en tenant.settings.food
 * (JSON), así no hace falta una tabla aparte y se edita de una sola vez.
 */

export type Fulfillment = "delivery" | "pickup" | "dine_in";
export const FULFILLMENTS: Fulfillment[] = ["delivery", "pickup", "dine_in"];

export const PAYMENT_METHODS = ["cash", "transfer", "card", "deuna"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Plantillas del menú público (cómo se ve, no qué contiene). */
export const MENU_TEMPLATES = ["street", "gallery", "bistro", "cafe"] as const;
export type MenuTemplate = (typeof MENU_TEMPLATES)[number];

export interface DayHours {
  open: boolean;
  from: string; // "HH:mm"
  to: string; // "HH:mm" (si es menor que from, cierra pasada la medianoche)
}

export interface FoodSettings {
  tagline: string;
  description: string;
  coverUrl: string;
  template: MenuTemplate;
  accentColor: string;
  theme: "dark" | "light";
  announcement: string;
  whatsapp: string;
  phone: string;
  address: string;
  mapsUrl: string;
  instagram: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  acceptingOrders: boolean;
  /** Si es false, fuera de horario el menú se ve pero no recibe pedidos. */
  ordersWhenClosed: boolean;
  delivery: { enabled: boolean; fee: number; minOrder: number; note: string };
  pickup: { enabled: boolean; note: string };
  dineIn: { enabled: boolean };
  paymentMethods: PaymentMethod[];
  transferInfo: string;
  /** 0 = domingo ... 6 = sábado */
  hours: DayHours[];
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Nuevo",
  preparing: "En preparación",
  ready: "Listo",
  on_the_way: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};
export const FOOD_STATUSES = Object.keys(STATUS_LABELS);
export const ACTIVE_STATUSES = ["pending", "preparing", "ready", "on_the_way"];

export const FULFILLMENT_LABELS: Record<Fulfillment, string> = {
  delivery: "Delivery",
  pickup: "Retiro en local",
  dine_in: "Comer en el local",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta (al recibir)",
  deuna: "DeUna",
};

export function defaultFoodSettings(): FoodSettings {
  const day = (open: boolean): DayHours => ({ open, from: "12:00", to: "22:00" });
  return {
    tagline: "",
    description: "",
    coverUrl: "",
    template: "street",
    accentColor: "#F97316",
    theme: "dark",
    announcement: "",
    whatsapp: "",
    phone: "",
    address: "",
    mapsUrl: "",
    instagram: "",
    currency: "USD",
    currencySymbol: "$",
    timezone: "America/Guayaquil",
    acceptingOrders: true,
    ordersWhenClosed: false,
    delivery: { enabled: true, fee: 0, minOrder: 0, note: "El costo de envío se confirma según tu sector." },
    pickup: { enabled: true, note: "" },
    dineIn: { enabled: false },
    paymentMethods: ["cash", "transfer"],
    transferInfo: "",
    hours: [day(true), day(false), day(true), day(true), day(true), day(true), day(true)],
  };
}

const str = (v: unknown, max: number, fallback = "") =>
  typeof v === "string" ? v.trim().slice(0, max) : fallback;
const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback;
};
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
const time = (v: unknown, fallback: string) =>
  typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : fallback;
const safeUrl = (v: unknown, max = 500) => {
  const s = str(v, max);
  return !s || /^https?:\/\//i.test(s) || s.startsWith("/") ? s : "";
};

/** Mezcla lo guardado con los valores por defecto y descarta lo que no es válido. */
export function normalizeFoodSettings(raw: any): FoodSettings {
  const d = defaultFoodSettings();
  const r = raw && typeof raw === "object" ? raw : {};
  const tz = str(r.timezone, 60, d.timezone);
  let timezone = d.timezone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    timezone = tz;
  } catch {}
  const methods = Array.isArray(r.paymentMethods)
    ? (r.paymentMethods.filter((m: any) => (PAYMENT_METHODS as readonly string[]).includes(m)) as PaymentMethod[])
    : d.paymentMethods;
  const hours = Array.from({ length: 7 }, (_, i) => {
    const h = Array.isArray(r.hours) ? r.hours[i] : null;
    return {
      open: bool(h?.open, d.hours[i].open),
      from: time(h?.from, d.hours[i].from),
      to: time(h?.to, d.hours[i].to),
    };
  });
  return {
    tagline: str(r.tagline, 120, d.tagline),
    description: str(r.description, 600, d.description),
    coverUrl: safeUrl(r.coverUrl),
    template: (MENU_TEMPLATES as readonly string[]).includes(r.template) ? r.template : d.template,
    accentColor: /^#[0-9a-fA-F]{6}$/.test(r.accentColor || "") ? r.accentColor : d.accentColor,
    theme: r.theme === "light" ? "light" : "dark",
    announcement: str(r.announcement, 160, d.announcement),
    whatsapp: str(r.whatsapp, 20).replace(/[^\d]/g, ""),
    phone: str(r.phone, 30),
    address: str(r.address, 200),
    mapsUrl: safeUrl(r.mapsUrl),
    instagram: str(r.instagram, 60).replace(/^@/, ""),
    currency: /^[A-Z]{3}$/.test(r.currency || "") ? r.currency : d.currency,
    currencySymbol: str(r.currencySymbol, 4, d.currencySymbol) || d.currencySymbol,
    timezone,
    acceptingOrders: bool(r.acceptingOrders, d.acceptingOrders),
    ordersWhenClosed: bool(r.ordersWhenClosed, d.ordersWhenClosed),
    delivery: {
      enabled: bool(r.delivery?.enabled, d.delivery.enabled),
      fee: num(r.delivery?.fee, d.delivery.fee),
      minOrder: num(r.delivery?.minOrder, d.delivery.minOrder),
      note: str(r.delivery?.note, 160, d.delivery.note),
    },
    pickup: { enabled: bool(r.pickup?.enabled, d.pickup.enabled), note: str(r.pickup?.note, 160) },
    dineIn: { enabled: bool(r.dineIn?.enabled, d.dineIn.enabled) },
    paymentMethods: methods.length ? methods : d.paymentMethods,
    transferInfo: str(r.transferInfo, 400),
    hours,
  };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Día de la semana (0-6) y minutos desde medianoche en la zona horaria del local. */
function localNow(timezone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** ¿Está abierto ahora? Considera turnos que cruzan la medianoche. */
export function openStatus(settings: FoodSettings, now = new Date()): { isOpen: boolean; label: string } {
  const { day, minutes } = localNow(settings.timezone, now);
  const today = settings.hours[day];
  const yesterday = settings.hours[(day + 6) % 7];

  // Turno de ayer que sigue abierto pasada la medianoche.
  if (yesterday.open && toMinutes(yesterday.to) < toMinutes(yesterday.from) && minutes < toMinutes(yesterday.to)) {
    return { isOpen: true, label: `Abierto · cierra ${yesterday.to}` };
  }
  if (today.open) {
    const from = toMinutes(today.from);
    const to = toMinutes(today.to);
    const crosses = to < from;
    if (minutes >= from && (crosses || minutes < to)) return { isOpen: true, label: `Abierto · cierra ${today.to}` };
    if (minutes < from) return { isOpen: false, label: `Cerrado · abrimos hoy ${today.from}` };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    if (settings.hours[d].open) {
      const when = i === 1 ? "mañana" : `el ${DAY_NAMES[d]}`;
      return { isOpen: false, label: `Cerrado · abrimos ${when} ${settings.hours[d].from}` };
    }
  }
  return { isOpen: false, label: "Cerrado" };
}

/* ---------- Platos: opciones (extras, salsas, tamaños) guardadas en product.variants ---------- */

export interface FoodOption {
  id: string;
  name: string;
  price: number;
}
export interface FoodOptionGroup {
  id: string;
  name: string;
  required: boolean;
  /** Cuántas opciones se pueden elegir como máximo (1 = elige una). */
  max: number;
  options: FoodOption[];
}
export interface FoodProductExtras {
  optionGroups: FoodOptionGroup[];
  tags: string[];
  soldOut: boolean;
}

const shortId = () => Math.random().toString(36).slice(2, 10);

export function normalizeProductExtras(raw: any): FoodProductExtras {
  const r = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const groups = Array.isArray(r.optionGroups) ? r.optionGroups.slice(0, 12) : [];
  return {
    optionGroups: groups
      .map((g: any) => {
        const options = (Array.isArray(g?.options) ? g.options.slice(0, 30) : [])
          .map((o: any) => ({ id: str(o?.id, 20) || shortId(), name: str(o?.name, 60), price: num(o?.price) }))
          .filter((o: FoodOption) => o.name);
        const max = Math.floor(Number(g?.max) || 1);
        return {
          id: str(g?.id, 20) || shortId(),
          name: str(g?.name, 60),
          required: bool(g?.required, false),
          max: Math.min(Math.max(max, 1), Math.max(options.length, 1)),
          options,
        };
      })
      .filter((g: FoodOptionGroup) => g.name && g.options.length),
    tags: (Array.isArray(r.tags) ? r.tags : [])
      .map((t: any) => str(t, 24))
      .filter(Boolean)
      .slice(0, 4),
    soldOut: bool(r.soldOut, false),
  };
}

export function firstImage(images: any): string {
  if (typeof images === "string") return images;
  if (Array.isArray(images) && images.length) {
    const f = images[0];
    return typeof f === "string" ? f : f?.url || f?.src || "";
  }
  if (images && typeof images === "object") return images.url || images.src || "";
  return "";
}
