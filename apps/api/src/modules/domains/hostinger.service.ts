import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";

export interface HostingerAvailability {
  domain: string | null;
  is_available: boolean;
  is_alternative: boolean;
  restriction: string | null;
}

export interface TldPrice {
  tld: string;
  itemId: string;
  /** Lo que cobra Hostinger por el primer año, en centavos. */
  firstYearCents: number;
  /** Precio de renovación anual, en centavos. */
  renewalCents: number;
  currency: string;
}

export interface HostingerPurchaseResult {
  /** 200 = pedido completado; 202 = pago en proceso (el dominio aún NO está registrado). */
  httpStatus: number;
  orderId?: number;
  subscriptionId?: string | null;
  status?: string;
  message?: string;
}

export interface DnsRecordSet {
  name: string;
  type: "A" | "CNAME";
  ttl?: number;
  records: { content: string }[];
}

/**
 * Cliente mínimo de la API de Hostinger (https://developers.hostinger.com).
 * Autenticación con token Bearer creado en hPanel → API.
 */
@Injectable()
export class HostingerService {
  private readonly logger = new Logger(HostingerService.name);
  private catalogCache: { at: number; prices: Map<string, TldPrice> } | null = null;

  private get base(): string {
    return (process.env.HOSTINGER_API_BASE || "https://developers.hostinger.com").replace(/\/$/, "");
  }

  private get token(): string {
    return process.env.HOSTINGER_API_TOKEN || "";
  }

  get isConfigured(): boolean {
    return Boolean(this.token);
  }

  /** Las compras reales solo se hacen si se activan explícitamente. */
  get purchasesEnabled(): boolean {
    return this.isConfigured && process.env.HOSTINGER_PURCHASES_ENABLED === "true";
  }

  private async request<T = any>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T }> {
    if (!this.isConfigured) throw new ServiceUnavailableException("La compra de dominios no está configurada.");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch(`${this.base}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      const data: any = await res.json().catch(() => ({}));

      if (res.status === 429) throw new ServiceUnavailableException("Hay muchas búsquedas en este momento. Inténtalo de nuevo en un minuto.");
      if (res.status === 401 || res.status === 403) {
        this.logger.error(`Hostinger rechazó el token (${res.status}); revisa HOSTINGER_API_TOKEN`);
        throw new ServiceUnavailableException("El servicio de dominios no está disponible. Contacta al administrador.");
      }
      if (res.status === 422 || res.status === 400) {
        throw new BadRequestException(data?.message || "Hostinger rechazó la solicitud.");
      }
      if (res.status >= 500) {
        this.logger.error(`Hostinger ${method} ${path} → ${res.status}`);
        throw new ServiceUnavailableException("Hostinger no responde en este momento. Inténtalo más tarde.");
      }
      return { status: res.status, data };
    } catch (err: any) {
      if (err?.name === "AbortError") throw new ServiceUnavailableException("Hostinger tardó demasiado en responder.");
      if (err instanceof BadRequestException || err instanceof ServiceUnavailableException) throw err;
      this.logger.error(`Hostinger ${method} ${path} falló: ${err?.message}`);
      throw new ServiceUnavailableException("No se pudo conectar con Hostinger.");
    } finally {
      clearTimeout(timer);
    }
  }

  async checkAvailability(name: string, tlds: string[]): Promise<HostingerAvailability[]> {
    const { data } = await this.request<HostingerAvailability[]>("POST", "/api/domains/v1/availability", {
      domain: name,
      tlds,
      with_alternatives: false,
    });
    return Array.isArray(data) ? data : [];
  }

  /** Sugerencias disponibles generadas por Hostinger a partir del nombre buscado. */
  async suggest(name: string, limit = 8): Promise<string[]> {
    const { data } = await this.request<string[]>("POST", "/api/domains/v1/availability/alternatives-from-domain", { domain: name, limit });
    return Array.isArray(data) ? data.filter((d) => typeof d === "string") : [];
  }

  /** Precios por TLD (primer año de registro). Se guarda 10 minutos en memoria. */
  async getTldPrices(): Promise<Map<string, TldPrice>> {
    if (this.catalogCache && Date.now() - this.catalogCache.at < 10 * 60_000) return this.catalogCache.prices;

    const { data } = await this.request<any[]>("GET", "/api/billing/v1/catalog?category=DOMAIN");
    const prices = new Map<string, TldPrice>();
    for (const item of Array.isArray(data) ? data : []) {
      for (const p of item?.prices || []) {
        if (p?.period_unit !== "year" || Number(p?.period) !== 1) continue;
        // Id de precio con la forma "hostingercom-domain-com-usd-1y".
        const m = /domain-(.+?)-([a-z]{3})-1y$/i.exec(String(p.id || ""));
        const tld = (m?.[1] || String(item?.name || "").replace(/^\./, "").split(/\s/)[0]).toLowerCase();
        if (!tld) continue;
        const renewal = Number(p.price);
        const first = Number.isFinite(Number(p.first_period_price)) && Number(p.first_period_price) > 0 ? Number(p.first_period_price) : renewal;
        if (!Number.isFinite(first) || first <= 0) continue;
        prices.set(tld, { tld, itemId: String(p.id), firstYearCents: first, renewalCents: renewal, currency: String(p.currency || "USD").toUpperCase() });
      }
    }
    this.catalogCache = { at: Date.now(), prices };
    return prices;
  }

  async purchase(domain: string, itemId: string, whoisId?: number): Promise<HostingerPurchaseResult> {
    const body: Record<string, unknown> = { domain, item_id: itemId };
    if (whoisId) body.domain_contacts = { owner_id: whoisId, admin_id: whoisId, billing_id: whoisId, tech_id: whoisId };
    const { status, data } = await this.request<any>("POST", "/api/domains/v1/portfolio", body);
    return {
      httpStatus: status,
      orderId: data?.id,
      subscriptionId: data?.subscription_id ?? null,
      status: data?.status,
      message: data?.message,
    };
  }

  async setDnsRecords(domain: string, zone: DnsRecordSet[]): Promise<void> {
    await this.request("PUT", `/api/dns/v1/zones/${encodeURIComponent(domain)}`, { overwrite: true, zone });
  }
}
