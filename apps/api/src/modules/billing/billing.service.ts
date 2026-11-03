import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { PlatformPaypalConfig, PlatformService } from "../platform/platform.service";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private paypalTokenCache = new Map<string, { accessToken: string; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService,
    private platformService: PlatformService
  ) {}

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>("FRONTEND_URL") ||
      this.configService.get<string>("NEXT_PUBLIC_APP_URL") ||
      "https://build.icebergup.com"
    );
  }

  async createInvoice(tenantId: string, subscriptionId: string, amount: number, currency = "USD") {
    return this.prisma.invoice.create({
      data: {
        tenantId,
        subscriptionId,
        amount,
        currency,
      },
    });
  }

  async getInvoices(tenantId: string) {
    if (!tenantId) throw new BadRequestException("Tenant ID is required");
    return this.prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async getInvoicesForTenantAdmin(tenantId: string) {
    if (!tenantId) throw new BadRequestException("Tenant ID is required");
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId, deletedAt: null } });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return this.getInvoices(tenantId);
  }

  async getInvoiceById(id: string, requester?: any) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });
    if (!invoice) throw new BadRequestException("Invoice not found");

    const isSystemUser =
      requester?.roles?.includes("super_admin") ||
      requester?.roles?.includes("platform_admin") ||
      requester?.roles?.includes("support");
    if (!isSystemUser) {
      if (!requester?.tenantId) throw new ForbiddenException("Tenant context is required");
      if (invoice.tenantId !== requester.tenantId) {
        throw new ForbiddenException("You do not have access to this invoice");
      }
    }
    return invoice;
  }

  async generatePaymentLink(tenantId: string, planSlug: string) {
    const plan = await this.prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) throw new BadRequestException("Plan not found");
    if (!plan.isActive) throw new BadRequestException("Plan is not available");
    if (Number(plan.price) === 0) throw new BadRequestException("Free plan doesn't require payment");

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId, deletedAt: null } });
    if (!tenant) throw new BadRequestException("Tenant not found");

    const payphoneToken = this.configService.get<string>("payphone.token");
    if (!payphoneToken) {
      // Sin pasarela configurada NO se simula el pago.
      throw new ServiceUnavailableException(
        "La pasarela de pago no está configurada. Contacta al administrador."
      );
    }

    // Suscripción pendiente + factura pendiente que el webhook activará.
    const now = new Date();
    const { invoice } = await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          tenantId,
          planId: plan.id,
          status: "pending",
          currentPeriodStart: now,
          currentPeriodEnd: now,
        },
      });
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          subscriptionId: subscription.id,
          amount: plan.price,
          currency: plan.currency || "USD",
          status: "pending",
          metadata: { planId: plan.id, planSlug: plan.slug } as any,
        },
      });
      return { subscription, invoice };
    });

    // Payphone maneja montos en centavos.
    const amountCents = Math.round(Number(plan.price) * 100);
    const frontend = this.getFrontendUrl();

    try {
      const response = await fetch("https://pay.payphonetodoespos.com/api/button/Prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payphoneToken}`,
        },
        body: JSON.stringify({
          amount: amountCents,
          amountWithoutTax: amountCents,
          tax: 0,
          service: 0,
          tip: 0,
          clientTransactionId: invoice.id,
          reference: `Plan ${plan.name}`,
          responseUrl: `${frontend}/dashboard/billing/success?invoice=${invoice.id}`,
          cancellationUrl: `${frontend}/dashboard/billing/cancel?invoice=${invoice.id}`,
        }),
      });

      const data: any = await response.json().catch(() => ({}));
      if (!response.ok || (!data.paymentUrl && !data.payWithCard)) {
        throw new BadRequestException(
          data?.message || "No se pudo generar el enlace de pago"
        );
      }

      if (data.transactionId) {
        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { externalId: String(data.transactionId) },
        });
      }

      return {
        paymentUrl: data.paymentUrl || data.payWithCard,
        amount: Number(plan.price),
        currency: plan.currency || "USD",
        plan: plan.name,
        invoiceId: invoice.id,
        transactionId: data.transactionId,
      };
    } catch (error: any) {
      this.logger.error(`Payment link generation failed: ${error?.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("Payment service temporarily unavailable");
    }
  }

  async getPaymentMethods() {
    let paypal: PlatformPaypalConfig = {
      enabled: false,
      mode: "sandbox",
      clientId: "",
      secret: "",
    };
    try {
      paypal = await this.platformService.getPaypalCredentials();
    } catch {
      // Si la configuración de plataforma no está disponible, Payphone sigue operativo.
    }
    const payphoneToken = this.configService.get<string>("payphone.token");
    return {
      paypal: {
        enabled: Boolean(paypal.enabled && paypal.clientId && paypal.secret),
        mode: paypal.mode,
      },
      payphone: { enabled: Boolean(payphoneToken) },
    };
  }

  private paypalApiBase(mode: string): string {
    return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  }

  private async getPaypalAccessToken(paypal: PlatformPaypalConfig): Promise<string> {
    if (!paypal.clientId || !paypal.secret) {
      throw new ServiceUnavailableException("PayPal no está configurado");
    }
    const cacheKey = `${paypal.mode}:${paypal.clientId}`;
    const cached = this.paypalTokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.accessToken;

    const basic = Buffer.from(`${paypal.clientId}:${paypal.secret}`).toString("base64");
    const res = await fetch(`${this.paypalApiBase(paypal.mode)}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || !json.access_token) {
      throw new BadRequestException("No se pudo autenticar con PayPal. Verifica las credenciales.");
    }
    const ttl = Number(json.expires_in || 3600) - 60;
    this.paypalTokenCache.set(cacheKey, {
      accessToken: json.access_token,
      expiresAt: Date.now() + ttl * 1000,
    });
    return json.access_token;
  }

  private async createPendingPlanInvoice(tenantId: string, plan: any, provider: "paypal" | "payphone") {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          tenantId,
          planId: plan.id,
          status: "pending",
          currentPeriodStart: now,
          currentPeriodEnd: now,
        },
      });
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          subscriptionId: subscription.id,
          amount: plan.price,
          currency: plan.currency || "USD",
          status: "pending",
          metadata: { planId: plan.id, planSlug: plan.slug, provider } as any,
        },
      });
      return { subscription, invoice };
    });
  }

  async createPaypalPlanOrder(tenantId: string, planSlug: string) {
    const plan = await this.prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) throw new BadRequestException("Plan not found");
    if (!plan.isActive) throw new BadRequestException("Plan is not available");
    if (Number(plan.price) === 0) throw new BadRequestException("Free plan doesn't require payment");

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId, deletedAt: null } });
    if (!tenant) throw new BadRequestException("Tenant not found");

    const paypal = await this.platformService.getPaypalCredentials();
    if (!paypal.enabled || !paypal.clientId || !paypal.secret) {
      throw new ServiceUnavailableException("PayPal no está configurado para la plataforma");
    }

    const accessToken = await this.getPaypalAccessToken(paypal);
    const { invoice } = await this.createPendingPlanInvoice(tenantId, plan, "paypal");
    const frontend = this.getFrontendUrl();

    try {
      const response = await fetch(`${this.paypalApiBase(paypal.mode)}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: invoice.id,
              description: `Plan ${plan.name}`,
              amount: {
                currency_code: plan.currency || "USD",
                value: Number(plan.price).toFixed(2),
              },
            },
          ],
          application_context: {
            brand_name: "Plataforma",
            user_action: "PAY_NOW",
            return_url: `${frontend}/dashboard/billing/success?provider=paypal&invoice=${invoice.id}`,
            cancel_url: `${frontend}/dashboard/billing/cancel?invoice=${invoice.id}`,
          },
        }),
      });

      const data: any = await response.json().catch(() => ({}));
      const orderId = data?.id;
      const approveUrl = (data?.links || []).find(
        (link: any) => link?.rel === "approve" || link?.rel === "payer-action"
      )?.href;

      if (!response.ok || !orderId || !approveUrl) {
        this.logger.error(`PayPal order creation failed: ${data?.message || response.status}`);
        throw new BadRequestException(data?.message || "No se pudo crear la orden de PayPal");
      }

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          externalId: String(orderId),
          metadata: {
            planId: plan.id,
            planSlug: plan.slug,
            provider: "paypal",
            paypalOrderId: orderId,
          } as any,
        },
      });

      return {
        paymentUrl: approveUrl,
        orderId,
        invoiceId: invoice.id,
        amount: Number(plan.price),
        currency: plan.currency || "USD",
        plan: plan.name,
      };
    } catch (error: any) {
      this.logger.error(`PayPal payment link generation failed: ${error?.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("El servicio de PayPal no está disponible");
    }
  }

  async capturePaypalPlanOrder(tenantId: string, invoiceId: string, orderId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.tenantId !== tenantId) {
      throw new ForbiddenException("No tienes acceso a esta factura");
    }
    if (invoice.status === "paid") {
      return { processed: true, action: "already_processed", invoiceId: invoice.id };
    }
    if (invoice.externalId && invoice.externalId !== orderId) {
      throw new BadRequestException("La orden de PayPal no coincide con la factura");
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: invoice.subscriptionId },
    });
    if (!subscription) throw new NotFoundException("Subscription not found");

    const paypal = await this.platformService.getPaypalCredentials();
    if (!paypal.enabled || !paypal.clientId || !paypal.secret) {
      throw new ServiceUnavailableException("PayPal no está configurado para la plataforma");
    }

    const accessToken = await this.getPaypalAccessToken(paypal);
    const response = await fetch(
      `${this.paypalApiBase(paypal.mode)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data: any = await response.json().catch(() => ({}));
    const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];

    if (!response.ok || data?.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
      this.logger.error(`PayPal capture failed: ${data?.message || response.status}`);
      throw new BadRequestException(data?.message || "No se pudo confirmar el pago con PayPal");
    }

    const paidAmount = Number(capture?.amount?.value || 0);
    const expectedAmount = Number(invoice.amount);
    const paidCurrency = String(capture?.amount?.currency_code || "");
    const expectedCurrency = String(invoice.currency || "USD");
    if (Math.abs(paidAmount - expectedAmount) > 0.01 || paidCurrency !== expectedCurrency) {
      throw new BadRequestException("El monto pagado no coincide con la factura");
    }

    const claimed = await this.prisma.invoice.updateMany({
      where: { id: invoice.id, status: { not: "paid" } },
      data: {
        status: "paid",
        paidAt: new Date(),
        externalId: String(capture?.id || orderId),
        metadata: {
          ...(invoice.metadata as any),
          provider: "paypal",
          paypalOrderId: orderId,
          paypalCaptureId: capture?.id || null,
        } as any,
      },
    });
    if (claimed.count === 0) {
      return { processed: true, action: "already_processed", invoiceId: invoice.id };
    }

    await this.subscriptionsService.activatePaidSubscription(
      invoice.tenantId,
      subscription.planId,
      { subscriptionId: subscription.id, invoiceId: invoice.id, paymentMethod: "paypal" }
    );

    return { processed: true, action: "activated", invoiceId: invoice.id };
  }

  private verifyWebhookSignature(rawBody: Buffer | undefined, signature?: string): void {
    const secret = this.configService.get<string>("billing.webhookSecret");
    if (!secret) {
      throw new ServiceUnavailableException("Billing webhook is not configured");
    }
    if (!rawBody || !signature) {
      throw new ForbiddenException("Missing webhook signature");
    }

    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const provided = String(signature).trim().toLowerCase();
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new ForbiddenException("Invalid webhook signature");
    }
  }

  async processWebhook(
    payload: any,
    opts: { rawBody?: Buffer; signature?: string } = {}
  ) {
    this.verifyWebhookSignature(opts.rawBody, opts.signature);

    const { transactionId, clientTransactionId, status, amount } = payload || {};
    this.logger.log(`Billing webhook: invoice=${clientTransactionId} status=${status}`);

    if (status !== "approved" && status !== "success") {
      return { processed: false, reason: `Status: ${status}` };
    }
    if (!clientTransactionId) {
      return { processed: false, reason: "No client transaction id" };
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: String(clientTransactionId) },
    });
    if (!invoice) return { processed: false, reason: "Invoice not found" };

    // Idempotencia: si ya está pagada, no repetir.
    if (invoice.status === "paid") {
      return { processed: true, action: "already_processed" };
    }

    const expectedCents = Math.round(Number(invoice.amount) * 100);
    const paidCents = Number(amount) || 0;
    if (paidCents !== expectedCents) {
      this.logger.warn(
        `Billing webhook amount mismatch for invoice ${invoice.id}: expected ${expectedCents} got ${paidCents}`
      );
      throw new BadRequestException("El monto pagado no coincide con la factura");
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: invoice.subscriptionId },
    });
    if (!subscription) throw new NotFoundException("Subscription not found");

    // Actualización atómica: evita doble procesamiento concurrente.
    const claimed = await this.prisma.invoice.updateMany({
      where: { id: invoice.id, status: { not: "paid" } },
      data: {
        status: "paid",
        paidAt: new Date(),
        externalId: transactionId ? String(transactionId) : invoice.externalId,
        metadata: { ...(invoice.metadata as any), webhook: payload } as any,
      },
    });
    if (claimed.count === 0) {
      return { processed: true, action: "already_processed" };
    }

    await this.subscriptionsService.activatePaidSubscription(
      invoice.tenantId,
      subscription.planId,
      { subscriptionId: subscription.id, invoiceId: invoice.id, paymentMethod: "payphone" }
    );

    return { processed: true, action: "activated", invoiceId: invoice.id };
  }

  async markInvoiceAsPaid(invoiceId: string, externalId?: string, requester?: any) {
    const isSystemUser =
      requester?.roles?.includes("super_admin") ||
      requester?.roles?.includes("platform_admin") ||
      requester?.roles?.includes("support");
    if (!isSystemUser) {
      throw new ForbiddenException("Not allowed");
    }

    const existing = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!existing) throw new BadRequestException("Invoice not found");
    if (existing.status === "paid") {
      return existing;
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "paid",
        paidAt: new Date(),
        externalId,
      },
    });

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: existing.subscriptionId },
    });
    if (subscription && Number(existing.amount) > 0) {
      await this.subscriptionsService.activatePaidSubscription(
        existing.tenantId,
        subscription.planId,
        { subscriptionId: subscription.id, invoiceId: existing.id, paymentMethod: "manual" }
      );
    }

    return updated;
  }
}
