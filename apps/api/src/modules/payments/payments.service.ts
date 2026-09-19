import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OrdersService } from "../orders/orders.service";

interface PaypalProvider {
  enabled: boolean;
  mode: "sandbox" | "live";
  clientId: string;
  secret: string;
}

interface PayphoneProvider {
  enabled: boolean;
  mode: "sandbox" | "live";
  token: string;
  storeId: string;
}

const PAYPAL_CURRENCY = "USD";
const PAYPHONE_CURRENCY = "USD";
const PAYPHONE_CONFIRM_URL = "https://paymentbox.payphonetodoesposible.com/api/confirm";

@Injectable()
export class PaymentsService {
  private paypalTokenCache = new Map<string, { accessToken: string; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  private async loadPaymentGateway(tenantId: string): Promise<any> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");
    const pgw = (tenant.settings as any)?.paymentGateway || {};
    return {
      defaultMethod: pgw.defaultMethod === "paypal" ? "paypal" : pgw.defaultMethod === "payphone" ? "payphone" : "cod",
      providers: {
        paypal: {
          enabled: pgw.providers?.paypal?.enabled === true,
          mode: pgw.providers?.paypal?.mode === "live" ? "live" : "sandbox",
          clientId: String(pgw.providers?.paypal?.clientId || "").trim(),
          secret: String(pgw.providers?.paypal?.secret || "").trim(),
        },
        payphone: {
          enabled: pgw.providers?.payphone?.enabled === true,
          mode: pgw.providers?.payphone?.mode === "live" ? "live" : "sandbox",
          token: String(pgw.providers?.payphone?.token || "").trim(),
          storeId: String(pgw.providers?.payphone?.storeId || "").trim(),
        },
      },
    };
  }

  async getConfig(tenantId: string) {
    const pgw = await this.loadPaymentGateway(tenantId);
    const paypal = pgw.providers.paypal;
    const payphone = pgw.providers.payphone;
    return {
      defaultMethod: pgw.defaultMethod,
      providers: {
        paypal: {
          enabled: paypal.enabled,
          mode: paypal.mode,
          clientId: paypal.clientId,
          hasSecret: !!paypal.secret,
        },
        payphone: {
          enabled: payphone.enabled,
          mode: payphone.mode,
          token: payphone.token,
          storeId: payphone.storeId,
        },
      },
    };
  }

  async updateConfig(tenantId: string, userId: string, dto: any) {
    const membership = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });
    if (!membership || !membership.isOwner) {
      throw new ForbiddenException("Only tenant owner can update payment settings");
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const current = (tenant.settings as any) || {};
    const pgw = current.paymentGateway || {};
    const currentPaypal = pgw.providers?.paypal || {};
    const currentPayphone = pgw.providers?.payphone || {};

    const incomingPaypal = dto?.providers?.paypal || {};
    const paypal: PaypalProvider = {
      enabled: incomingPaypal.enabled === true,
      mode: incomingPaypal.mode === "live" ? "live" : "sandbox",
      clientId: String(incomingPaypal.clientId || currentPaypal.clientId || "").trim(),
      secret: incomingPaypal.secret ? String(incomingPaypal.secret).trim() : String(currentPaypal.secret || "").trim(),
    };

    const incomingPayphone = dto?.providers?.payphone || {};
    const payphone: PayphoneProvider = {
      enabled: incomingPayphone.enabled === true,
      mode: incomingPayphone.mode === "live" ? "live" : "sandbox",
      token: String(incomingPayphone.token || currentPayphone.token || "").trim(),
      storeId: String(incomingPayphone.storeId || currentPayphone.storeId || "").trim(),
    };

    const defaultMethod =
      dto?.defaultMethod === "paypal" ? "paypal" : dto?.defaultMethod === "payphone" ? "payphone" : "cod";

    const merged = {
      ...current,
      paymentGateway: {
        defaultMethod,
        providers: { paypal, payphone },
      },
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: merged },
    });

    return this.getConfig(tenantId);
  }

  private async paypalCredentials(paypal: PaypalProvider) {
    if (!paypal.clientId || !paypal.secret) {
      throw new BadRequestException("PayPal no está configurado. Agrega tus credenciales en E-commerce > Pagos.");
    }
    return paypal;
  }

  private paypalApiBase(mode: string): string {
    return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  }

  private async getAccessToken(paypal: PaypalProvider): Promise<string> {
    const cacheKey = `${paypal.mode}:${paypal.clientId}`;
    const cached = this.paypalTokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.accessToken;

    const base = this.paypalApiBase(paypal.mode);
    const basic = Buffer.from(`${paypal.clientId}:${paypal.secret}`).toString("base64");
    const res = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const json: any = await res.json();
    if (!res.ok || !json.access_token) {
      throw new BadRequestException("No se pudo autenticar con PayPal. Verifica tus credenciales (Client ID y Secret).");
    }
    const ttl = Number(json.expires_in || 3600) - 60;
    this.paypalTokenCache.set(cacheKey, { accessToken: json.access_token, expiresAt: Date.now() + ttl * 1000 });
    return json.access_token;
  }

  async createPaypalOrder(tenantId: string, body: any): Promise<{ paypalOrderId: string; orderId: string; totalAmount: string; currency: string }> {
    const pgw = await this.loadPaymentGateway(tenantId);
    const paypal = pgw.providers.paypal;
    if (!paypal.enabled) throw new BadRequestException("Pago con PayPal no está activo para este sitio");
    await this.paypalCredentials(paypal);
    const accessToken = await this.getAccessToken(paypal);

    const itemsRaw = Array.isArray(body?.items) ? body.items : [];
    if (itemsRaw.length === 0 || itemsRaw.length > 50) {
      throw new BadRequestException("Carrito vacío o demasiados ítems");
    }
    const items = itemsRaw.map((i: any) => ({
      productId: String(i?.productId || ""),
      quantity: Math.floor(Number(i?.quantity) || 0),
    }));
    if (items.some((i: any) => !i.productId || i.quantity < 1 || i.quantity > 999)) {
      throw new BadRequestException("Ítems inválidos");
    }

    const str = (v: any, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const address = str(body?.address, 300);

    const order = await this.ordersService.create(tenantId, {
      items,
      customerName: str(body?.customerName, 120) || undefined,
      customerEmail: str(body?.customerEmail, 120) || undefined,
      customerPhone: str(body?.customerPhone, 40) || undefined,
      notes: address ? `${address}${body?.notes ? `\n${str(body?.notes, 300)}` : ""}` : str(body?.notes, 300),
      paymentMethod: "paypal",
    });

    const totalAmount = Number(order.totalAmount).toFixed(2);
    const base = this.paypalApiBase(paypal.mode);

    const createRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.id,
            description: `Pedido ${String(order.id).slice(0, 8).toUpperCase()}`,
            amount: { currency_code: PAYPAL_CURRENCY, value: totalAmount },
          },
        ],
        application_context: {
          brand_name: "Tienda online",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      }),
    });
    const createJson: any = await createRes.json();
    if (!createRes.ok || !createJson.id) {
      throw new BadRequestException(
        `PayPal no pudo crear el pedido: ${createJson?.message || createJson?.error_description || "error desconocido"}`
      );
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentReference: createJson.id },
    });

    return { paypalOrderId: createJson.id, orderId: order.id, totalAmount, currency: PAYPAL_CURRENCY };
  }

  async capturePaypalOrder(tenantId: string, paypalOrderId: string, orderId: string) {
    const pgw = await this.loadPaymentGateway(tenantId);
    const paypal = pgw.providers.paypal;
    if (!paypal.enabled) throw new BadRequestException("Pago con PayPal no está activo para este sitio");
    await this.paypalCredentials(paypal);

    const order = await this.prisma.order.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    if (order.status === "paid") {
      return { orderId, status: "paid", paypalOrderId, captureId: order.paymentReference || null, alreadyPaid: true };
    }
    if (order.paymentReference && order.paymentReference !== paypalOrderId) {
      throw new BadRequestException("La referencia de pago no coincide con el pedido");
    }

    const accessToken = await this.getAccessToken(paypal);
    const base = this.paypalApiBase(paypal.mode);

    const capRes = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const capJson: any = await capRes.json();
    if (!capRes.ok) {
      throw new BadRequestException(
        `PayPal rechazó el cobro: ${capJson?.message || capJson?.details?.[0]?.description || "error desconocido"}`
      );
    }

    const status = capJson?.status || "";
    if (status !== "COMPLETED") {
      throw new BadRequestException(`El pago no fue completado (estado: ${status || "desconocido"})`);
    }

    const captureId =
      capJson?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
      capJson?.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id ||
      null;

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: "paid", paidAt: new Date(), paymentReference: capJson?.id || paypalOrderId },
    });

    return {
      orderId: order.id,
      status: "paid",
      paypalOrderId,
      captureId,
      totalAmount: String(order.totalAmount),
      currency: order.currency || PAYPAL_CURRENCY,
    };
  }

  private async payphoneCredentials(payphone: PayphoneProvider) {
    if (!payphone.token || !payphone.storeId) {
      throw new BadRequestException("Payphone no está configurado. Agrega tu Token y Store ID en E-commerce > Pagos.");
    }
    return payphone;
  }

  async createPayphoneOrder(tenantId: string, body: any): Promise<{
    orderId: string;
    clientTransactionId: string;
    totalAmount: string;
    amount: number;
    currency: string;
    provider: { token: string; storeId: string; mode: string; defaultMethod: string };
  }> {
    const pgw = await this.loadPaymentGateway(tenantId);
    const payphone = pgw.providers.payphone;
    if (!payphone.enabled) throw new BadRequestException("Pago con Payphone no está activo para este sitio");
    await this.payphoneCredentials(payphone);

    const itemsRaw = Array.isArray(body?.items) ? body.items : [];
    if (itemsRaw.length === 0 || itemsRaw.length > 50) {
      throw new BadRequestException("Carrito vacío o demasiados ítems");
    }
    const items = itemsRaw.map((i: any) => ({
      productId: String(i?.productId || ""),
      quantity: Math.floor(Number(i?.quantity) || 0),
    }));
    if (items.some((i: any) => !i.productId || i.quantity < 1 || i.quantity > 999)) {
      throw new BadRequestException("Ítems inválidos");
    }

    const str = (v: any, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const address = str(body?.address, 300);

    const order = await this.ordersService.create(tenantId, {
      items,
      customerName: str(body?.customerName, 120) || undefined,
      customerEmail: str(body?.customerEmail, 120) || undefined,
      customerPhone: str(body?.customerPhone, 40) || undefined,
      notes: address ? `${address}${body?.notes ? `\n${str(body?.notes, 300)}` : ""}` : str(body?.notes, 300),
      paymentMethod: "payphone",
    });

    // El clientTransactionId de Payphone (máx 50 chars) se mapea al pedido vía paymentReference.
    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentReference: order.id },
    });

    const totalAmount = Number(order.totalAmount).toFixed(2);
    const amountCents = Math.round(Number(order.totalAmount) * 100);

    return {
      orderId: order.id,
      clientTransactionId: order.id,
      totalAmount,
      amount: amountCents,
      currency: PAYPHONE_CURRENCY,
      provider: {
        token: payphone.token,
        storeId: payphone.storeId,
        mode: payphone.mode,
        defaultMethod: "card",
      },
    };
  }

  async confirmPayphone(tenantId: string, id: string | number, clientTransactionId: string) {
    const pgw = await this.loadPaymentGateway(tenantId);
    const payphone = pgw.providers.payphone;
    if (!payphone.enabled) throw new BadRequestException("Pago con Payphone no está activo para este sitio");
    await this.payphoneCredentials(payphone);

    const txId = Number(id);
    const clientTxId = String(clientTransactionId || "").trim();
    if (!txId || !clientTxId) throw new BadRequestException("Faltan datos del pago");

    const order = await this.prisma.order.findFirst({
      where: { tenantId, paymentReference: clientTxId, paymentMethod: "payphone" },
    });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    if (order.status === "paid") {
      return { orderId: order.id, status: "paid", payphoneTransactionId: order.paymentReference, alreadyPaid: true };
    }

    const res = await fetch(PAYPHONE_CONFIRM_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${payphone.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: txId, clientTxId }),
    });
    const json: any = await res.json().catch(() => ({}));

    if (!res.ok || json?.errorCode !== undefined) {
      throw new BadRequestException(json?.message || "Payphone no pudo confirmar la transacción");
    }

    const statusCode = Number(json?.statusCode);
    const transactionStatus = String(json?.transactionStatus || "");
    if (statusCode !== 3 || transactionStatus !== "Approved") {
      throw new BadRequestException(
        `El pago no fue aprobado (estado: ${transactionStatus || statusCode || "desconocido"})`
      );
    }

    const expected = Math.round(Number(order.totalAmount) * 100);
    const paidAmount = Number(json?.amount) || 0;
    if (paidAmount !== expected) {
      throw new BadRequestException("El monto confirmado por Payphone no coincide con el pedido");
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: "paid", paidAt: new Date(), paymentReference: String(json?.transactionId ?? txId) },
    });

    return {
      orderId: order.id,
      status: "paid",
      payphoneTransactionId: json?.transactionId ?? txId,
      authorizationCode: json?.authorizationCode || null,
      transactionStatus,
      amount: String(order.totalAmount),
      currency: order.currency || PAYPHONE_CURRENCY,
    };
  }
}