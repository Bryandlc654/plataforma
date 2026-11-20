/** Tipos y utilidades compartidas de Jeaz Food (panel y menú público). */

export type Fulfillment = "delivery" | "pickup" | "dine_in";
export type PaymentMethod = "cash" | "transfer" | "card" | "deuna";

export interface FoodOption {
  id: string;
  name: string;
  price: number;
}

export interface FoodOptionGroup {
  id: string;
  name: string;
  required: boolean;
  max: number;
  options: FoodOption[];
}

export interface FoodProduct {
  id: string;
  categoryId: string | null;
  name: string;
  description: string;
  price: number;
  comparePrice: number | null;
  image: string;
  isActive?: boolean;
  isFeatured: boolean;
  optionGroups: FoodOptionGroup[];
  tags: string[];
  soldOut: boolean;
}

export interface FoodCategory {
  id: string;
  name: string;
  sortOrder?: number;
}

export interface DayHours {
  open: boolean;
  from: string;
  to: string;
}

export interface FoodSettings {
  tagline: string;
  description: string;
  coverUrl: string;
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
  ordersWhenClosed: boolean;
  delivery: { enabled: boolean; fee: number; minOrder: number; note: string };
  pickup: { enabled: boolean; note: string };
  dineIn: { enabled: boolean };
  paymentMethods: PaymentMethod[];
  transferInfo: string;
  hours: DayHours[];
}

export interface FoodOrderItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  total: number;
  options: Array<{ group: string; name: string; price: number }>;
  notes: string;
}

export interface FoodOrder {
  id: string;
  number: number | null;
  status: OrderStatus;
  fulfillment: Fulfillment | null;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  paymentMethod: PaymentMethod | null;
  paid: boolean;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: FoodOrderItem[];
}

export type OrderStatus = "pending" | "preparing" | "ready" | "on_the_way" | "delivered" | "cancelled";

export const STATUS_META: Record<OrderStatus, { label: string; badge: string; dot: string }> = {
  pending: { label: "Nuevo", badge: "badge-attention", dot: "#e8590c" },
  preparing: { label: "En preparación", badge: "badge-warning", dot: "#c79a00" },
  ready: { label: "Listo", badge: "badge-info", dot: "#0b7bb5" },
  on_the_way: { label: "En camino", badge: "badge-info", dot: "#5b3cc4" },
  delivered: { label: "Entregado", badge: "badge-success", dot: "#13804a" },
  cancelled: { label: "Cancelado", badge: "badge-critical", dot: "#c70a24" },
};

/** Siguiente paso natural de un pedido, según cómo se entrega. */
export function nextStatus(o: Pick<FoodOrder, "status" | "fulfillment">): { status: OrderStatus; label: string } | null {
  switch (o.status) {
    case "pending":
      return { status: "preparing", label: "Aceptar y preparar" };
    case "preparing":
      return { status: "ready", label: "Marcar listo" };
    case "ready":
      return o.fulfillment === "delivery"
        ? { status: "on_the_way", label: "Enviar" }
        : { status: "delivered", label: "Entregar" };
    case "on_the_way":
      return { status: "delivered", label: "Marcar entregado" };
    default:
      return null;
  }
}

export const FULFILLMENT_LABELS: Record<Fulfillment, string> = {
  delivery: "Delivery",
  pickup: "Retiro en local",
  dine_in: "En el local",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta (al recibir)",
  deuna: "DeUna",
};

export const DAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const money = (n: number, symbol = "$") => `${symbol}${(Number(n) || 0).toFixed(2)}`;

/** Enlace público del menú de un restaurante. */
export function menuUrl(slug: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/menu/${slug}`;
}

export function timeAgo(date: string | Date) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (s < 60) return "ahora";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(date).toLocaleDateString("es", { day: "numeric", month: "short" });
}

export const unwrap = <T,>(res: any): T => (res?.data ?? res) as T;
