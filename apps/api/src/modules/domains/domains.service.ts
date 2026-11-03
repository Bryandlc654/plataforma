import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { PlatformPaypalConfig, PlatformService } from "../platform/platform.service";
import { SitesService } from "../sites/sites.service";
import { HostingerService, TldPrice } from "./hostinger.service";

const DEFAULT_TLDS = "com,net,org,co,io,app,online,store,site,shop";
const DOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z0-9]{2,24}$/;

export interface DomainSearchResult {
  domain: string;
  tld: string;
  available: boolean;
  restriction: string | null;
  isSuggestion: boolean;
  /** Precio al cliente por el primer año, en centavos (incluye el margen configurado). */
  priceCents: number | null;
  renewalCents: number | null;
  currency: string | null;
}

@Injectable()
export class DomainsService {
  private readonly logger = new Logger(DomainsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private hostinger: HostingerService,
    private platform: PlatformService,
    private sites: SitesService,
  ) {}

  // ───────────────────────── Utilidades ─────────────────────────

  private frontendUrl(): string {
    return this.config.get<string>("FRONTEND_URL") || this.config.get<string>("NEXT_PUBLIC_APP_URL") || "https://build.icebergup.com";
  }

  /** Precio al cliente: costo de Hostinger + margen opcional (DOMAIN_MARKUP_PERCENT). */
  private customerPrice(cents: number): number {
    const markup = Number(process.env.DOMAIN_MARKUP_PERCENT || 0);
    return Math.ceil(cents * (1 + (Number.isFinite(markup) && markup > 0 ? markup : 0) / 100));
  }

  private priceFields(info?: TldPrice) {
    return info
      ? { priceCents: this.customerPrice(info.firstYearCents), renewalCents: this.customerPrice(info.renewalCents), currency: info.currency }
      : { priceCents: null, renewalCents: null, currency: null };
  }

  /** Acepta "mi marca", "mimarca.com", "https://www.mimarca.com/" y devuelve nombre + TLD opcional. */
  private parseQuery(raw: string): { name: string; tld: string | null } {
    let q = String(raw || "").toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
    let tld: string | null = null;
    const dot = q.indexOf(".");
    if (dot > 0) { tld = q.slice(dot + 1).replace(/[^a-z0-9.]/g, "") || null; q = q.slice(0, dot); }
    const name = q.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
    if (name.length < 2 || name.length > 63) throw new BadRequestException("Escribe un nombre de entre 2 y 63 letras o números.");
    return { name, tld };
  }

  private async assertOwner(userId: string, tenantId: string) {
    const link = await this.prisma.userTenant.findFirst({ where: { userId, tenantId, isOwner: true }, select: { id: true } });
    if (!link) throw new ForbiddenException("Solo el propietario de la cuenta puede comprar dominios.");
  }

  private serialize(order: any) {
    return {
      id: order.id,
      siteId: order.siteId,
      domain: order.domain,
      years: order.years,
      priceCents: order.priceCents,
      currency: order.currency,
      status: order.status,
      dnsConnected: order.dnsConnected,
      errorMessage: order.errorMessage,
      createdAt: order.createdAt,
      registeredAt: order.registeredAt,
    };
  }

  // ───────────────────────── Búsqueda ─────────────────────────

  async status() {
    let paypalEnabled = false;
    try {
      const p = await this.platform.getPaypalCredentials();
      paypalEnabled = Boolean(p.enabled && p.clientId && p.secret);
    } catch { /* sin PayPal */ }
    return {
      configured: this.hostinger.isConfigured,
      purchasesEnabled: this.hostinger.purchasesEnabled && paypalEnabled,
      paypalEnabled,
    };
  }

  async search(rawQuery: string): Promise<{ query: string; results: DomainSearchResult[]; suggestions: DomainSearchResult[] }> {
    const { name, tld: preferred } = this.parseQuery(rawQuery);
    const prices = await this.hostinger.getTldPrices();

    const configured = (process.env.DOMAIN_TLDS || DEFAULT_TLDS).split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    let tlds = configured.filter((t) => prices.has(t));
    if (preferred && prices.has(preferred)) tlds = [preferred, ...tlds.filter((t) => t !== preferred)];
    if (tlds.length === 0) throw new ServiceUnavailableException("No hay extensiones de dominio disponibles por ahora.");

    const availability = await this.hostinger.checkAvailability(name, tlds);
    const results: DomainSearchResult[] = availability
      .filter((a) => a.domain)
      .map((a) => {
        const domain = String(a.domain).toLowerCase();
        const tld = domain.slice(domain.indexOf(".") + 1);
        return { domain, tld, available: !!a.is_available, restriction: a.restriction ?? null, isSuggestion: false, ...this.priceFields(prices.get(tld)) };
      });

    // Si lo principal está ocupado, se ofrecen alternativas cercanas.
    let suggestions: DomainSearchResult[] = [];
    if (!results.slice(0, 3).some((r) => r.available)) {
      try {
        const alt = await this.hostinger.suggest(name, 8);
        suggestions = alt
          .map((d) => d.toLowerCase())
          .filter((d) => DOMAIN_RE.test(d) && !results.some((r) => r.domain === d))
          .map((domain) => {
            const tld = domain.slice(domain.indexOf(".") + 1);
            return { domain, tld, available: true, restriction: null, isSuggestion: true, ...this.priceFields(prices.get(tld)) };
          })
          .filter((s) => s.priceCents !== null);
      } catch (err: any) {
        this.logger.warn(`Sugerencias no disponibles: ${err?.message}`);
      }
    }
    return { query: name, results, suggestions };
  }

  // ───────────────────────── PayPal ─────────────────────────

  private paypalBase(mode: string) {
    return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  }

  private async paypalAuth(): Promise<{ paypal: PlatformPaypalConfig; token: string }> {
    const paypal = await this.platform.getPaypalCredentials();
    if (!paypal.enabled || !paypal.clientId || !paypal.secret) throw new ServiceUnavailableException("PayPal no está configurado para la plataforma.");
    const basic = Buffer.from(`${paypal.clientId}:${paypal.secret}`).toString("base64");
    const res = await fetch(`${this.paypalBase(paypal.mode)}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data?.access_token) throw new ServiceUnavailableException("No se pudo autenticar con PayPal.");
    return { paypal, token: data.access_token };
  }

  private async refundCapture(captureId: string): Promise<boolean> {
    try {
      const { paypal, token } = await this.paypalAuth();
      const res = await fetch(`${this.paypalBase(paypal.mode)}/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ note_to_payer: "No se pudo registrar el dominio; reembolso automático." }),
      });
      return res.ok;
    } catch (err: any) {
      this.logger.error(`Reembolso PayPal falló (${captureId}): ${err?.message}`);
      return false;
    }
  }

  // ───────────────────────── Pedido ─────────────────────────

  async createOrder(user: any, dto: { domain: string; siteId: string }) {
    const tenantId: string = user.tenantId;
    await this.assertOwner(user.id, tenantId);

    if (!this.hostinger.purchasesEnabled) throw new ServiceUnavailableException("La compra de dominios aún no está habilitada.");

    const domain = String(dto.domain || "").toLowerCase().trim();
    if (!DOMAIN_RE.test(domain)) throw new BadRequestException("El dominio no es válido.");
    const [label, tld] = [domain.slice(0, domain.indexOf(".")), domain.slice(domain.indexOf(".") + 1)];

    const site = await this.prisma.site.findFirst({ where: { id: dto.siteId, tenantId, deletedAt: null }, select: { id: true, domain: true } });
    if (!site) throw new NotFoundException("Sitio no encontrado.");
    if (await this.prisma.site.findUnique({ where: { domain }, select: { id: true } })) throw new ConflictException("Este dominio ya está en uso en la plataforma.");

    // Se vuelve a consultar disponibilidad y precio: nunca se confía en lo que envía el navegador.
    const prices = await this.hostinger.getTldPrices();
    const info = prices.get(tld);
    if (!info) throw new BadRequestException("Esta extensión de dominio no está disponible.");
    const [avail] = await this.hostinger.checkAvailability(label, [tld]);
    if (!avail?.is_available) throw new ConflictException("Este dominio ya no está disponible.");
    if (avail.restriction) throw new BadRequestException("Este dominio tiene restricciones de registro y no se puede comprar aquí.");

    const priceCents = this.customerPrice(info.firstYearCents);
    const { paypal, token } = await this.paypalAuth();

    const order = await this.prisma.domainOrder.create({
      data: { tenantId, siteId: site.id, domain, hostingerItemId: info.itemId, years: 1, priceCents, currency: info.currency, createdByUserId: user.id },
    });

    try {
      const frontend = this.frontendUrl();
      const res = await fetch(`${this.paypalBase(paypal.mode)}/v2/checkout/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            reference_id: order.id,
            description: `Dominio ${domain} (1 año)`,
            amount: { currency_code: info.currency, value: (priceCents / 100).toFixed(2) },
          }],
          application_context: {
            brand_name: "Plataforma",
            user_action: "PAY_NOW",
            return_url: `${frontend}/dashboard/domains/success?order=${order.id}`,
            cancel_url: `${frontend}/dashboard/domains/cancel?order=${order.id}`,
          },
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      const approveUrl = (data?.links || []).find((l: any) => l?.rel === "approve" || l?.rel === "payer-action")?.href;
      if (!res.ok || !data?.id || !approveUrl) throw new Error(data?.message || `PayPal ${res.status}`);

      await this.prisma.domainOrder.update({ where: { id: order.id }, data: { paypalOrderId: String(data.id) } });
      return { orderId: order.id, paymentUrl: approveUrl as string, domain, priceCents, currency: info.currency };
    } catch (err: any) {
      await this.prisma.domainOrder.update({ where: { id: order.id }, data: { status: "failed", errorMessage: String(err?.message || err).slice(0, 500) } });
      this.logger.error(`Orden PayPal de dominio falló: ${err?.message}`);
      throw new BadRequestException("No se pudo iniciar el pago con PayPal.");
    }
  }

  /** Confirma el pago en PayPal y, solo si se cobró, registra el dominio en Hostinger. */
  async captureOrder(user: any, orderId: string, paypalOrderId: string) {
    const tenantId: string = user.tenantId;
    await this.assertOwner(user.id, tenantId);

    const order = await this.prisma.domainOrder.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException("Pedido no encontrado.");
    if (order.paypalOrderId !== paypalOrderId) throw new BadRequestException("El pago no coincide con el pedido.");
    if (order.status !== "pending_payment") return this.serialize(order); // idempotente: no se cobra ni compra dos veces

    // Reserva el pedido para que dos peticiones simultáneas no capturen dos veces.
    const claimed = await this.prisma.domainOrder.updateMany({ where: { id: order.id, status: "pending_payment" }, data: { status: "capturing" } });
    if (claimed.count !== 1) return this.serialize(await this.prisma.domainOrder.findUniqueOrThrow({ where: { id: order.id } }));

    let captureId: string | null = null;
    try {
      const { paypal, token } = await this.paypalAuth();
      const res = await fetch(`${this.paypalBase(paypal.mode)}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data: any = await res.json().catch(() => ({}));
      const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
      const paid = Math.round(Number(capture?.amount?.value) * 100);
      if (!res.ok || data?.status !== "COMPLETED" || capture?.status !== "COMPLETED") throw new Error(data?.message || "El pago no se completó.");
      captureId = String(capture.id);
      if (!Number.isFinite(paid) || paid < order.priceCents || capture?.amount?.currency_code !== order.currency) {
        await this.refundCapture(captureId);
        throw new Error("El monto cobrado no coincide con el precio del dominio; se reembolsó.");
      }
    } catch (err: any) {
      await this.prisma.domainOrder.update({ where: { id: order.id }, data: { status: "failed", errorMessage: String(err?.message || err).slice(0, 500) } });
      throw new BadRequestException(err?.message || "No se pudo confirmar el pago con PayPal.");
    }

    await this.prisma.domainOrder.update({ where: { id: order.id }, data: { status: "paid", paypalCaptureId: captureId } });
    return this.register(order.id);
  }

  /** Registra el dominio en Hostinger (el cliente ya pagó) y lo conecta al sitio. */
  private async register(orderId: string) {
    const claimed = await this.prisma.domainOrder.updateMany({ where: { id: orderId, status: "paid" }, data: { status: "registering" } });
    const order = await this.prisma.domainOrder.findUniqueOrThrow({ where: { id: orderId } });
    if (claimed.count !== 1) return this.serialize(order);

    const whoisId = Number(process.env.HOSTINGER_WHOIS_ID) || undefined;
    try {
      const result = await this.hostinger.purchase(order.domain, order.hostingerItemId, whoisId);

      // 202: el pago de Hostinger sigue en proceso y el dominio todavía NO está registrado.
      if (result.httpStatus === 202 || result.status !== "completed") {
        const updated = await this.prisma.domainOrder.update({
          where: { id: order.id },
          data: {
            status: "pending_registration",
            hostingerOrderId: result.orderId ? String(result.orderId) : null,
            hostingerSubscriptionId: result.subscriptionId || null,
            errorMessage: result.message || "Hostinger todavía está procesando el pedido; un administrador debe confirmarlo en hPanel.",
          },
        });
        this.logger.warn(`Dominio ${order.domain} quedó pendiente en Hostinger (orden ${result.orderId})`);
        return this.serialize(updated);
      }

      await this.prisma.domainOrder.update({
        where: { id: order.id },
        data: { status: "registered", registeredAt: new Date(), hostingerOrderId: result.orderId ? String(result.orderId) : null, hostingerSubscriptionId: result.subscriptionId || null, errorMessage: null },
      });
    } catch (err: any) {
      // El cliente ya pagó pero no se pudo registrar: se le devuelve el dinero.
      const refunded = order.paypalCaptureId ? await this.refundCapture(order.paypalCaptureId) : false;
      const updated = await this.prisma.domainOrder.update({
        where: { id: order.id },
        data: {
          status: refunded ? "refunded" : "failed",
          errorMessage: `${String(err?.message || err).slice(0, 400)}${refunded ? " (pago reembolsado)" : " (REEMBOLSO PENDIENTE: revisar manualmente)"}`,
        },
      });
      this.logger.error(`Registro de ${order.domain} falló; reembolso=${refunded}: ${err?.message}`);
      return this.serialize(updated);
    }

    return this.connect(order.id);
  }

  /** Guarda el dominio en el sitio (y en Vercel) y apunta el DNS de Hostinger hacia la plataforma. */
  private async connect(orderId: string) {
    const order = await this.prisma.domainOrder.findUniqueOrThrow({ where: { id: orderId } });
    const notes: string[] = [];

    if (order.siteId) {
      try {
        await this.sites.update(order.siteId, order.tenantId, { domain: order.domain });
      } catch (err: any) {
        notes.push(`No se pudo asignar el dominio al sitio: ${err?.message}`);
      }
    }

    let dnsConnected = false;
    try {
      const a = process.env.DOMAIN_DNS_A || "76.76.21.21";
      const cname = process.env.DOMAIN_DNS_CNAME || "cname.vercel-dns.com.";
      await this.hostinger.setDnsRecords(order.domain, [
        { name: "@", type: "A", ttl: 3600, records: [{ content: a }] },
        { name: "www", type: "CNAME", ttl: 3600, records: [{ content: cname }] },
      ]);
      dnsConnected = true;
    } catch (err: any) {
      notes.push(`No se pudo configurar el DNS automáticamente: ${err?.message}`);
    }

    const updated = await this.prisma.domainOrder.update({
      where: { id: order.id },
      data: { dnsConnected, errorMessage: notes.length ? notes.join(" | ").slice(0, 500) : null },
    });
    return this.serialize(updated);
  }

  /**
   * Avance de la conexión del dominio, para mostrarlo al cliente:
   * registrando → verificando (el DNS aún no responde) → listo.
   */
  async connection(tenantId: string, id: string) {
    const order = await this.prisma.domainOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException("Pedido no encontrado.");
    const base = { domain: order.domain, siteId: order.siteId, orderStatus: order.status };

    if (order.status === "registered") {
      if (!order.dnsConnected || !order.siteId) {
        return { ...base, step: "attention" as const, message: order.errorMessage || "El dominio está registrado, pero falta conectarlo a tu sitio." };
      }
      try {
        const check: any = await this.sites.checkDomainDns(order.siteId, tenantId, order.domain);
        // Con Vercel configurado manda su verificación; si no, el dominio debe resolver a la IP que configuramos.
        const expectedA = process.env.DOMAIN_DNS_A || "76.76.21.21";
        const verified = check.vercelConfigured && check.vercel
          ? check.pointsToServer
          : (check.resolvedIps || []).includes(expectedA);
        return { ...base, step: verified ? ("ready" as const) : ("verifying" as const), resolvedIps: check.resolvedIps };
      } catch {
        return { ...base, step: "verifying" as const, resolvedIps: [] as string[] };
      }
    }
    if (["pending_registration", "paid", "registering", "capturing"].includes(order.status)) return { ...base, step: "registering" as const };
    return { ...base, step: "failed" as const, message: order.errorMessage };
  }

  async listOrders(tenantId: string) {
    const orders = await this.prisma.domainOrder.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 50 });
    return orders.map((o) => this.serialize(o));
  }

  async getOrder(tenantId: string, id: string) {
    const order = await this.prisma.domainOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException("Pedido no encontrado.");
    return this.serialize(order);
  }
}
