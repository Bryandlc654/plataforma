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

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService
  ) {}

  private getFrontendUrl(): string {
    return this.configService.get<string>("FRONTEND_URL", "https://build.icebergup.com");
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
      requester?.roles?.includes("super_admin") || requester?.roles?.includes("support");
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
      requester?.roles?.includes("super_admin") || requester?.roles?.includes("support");
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
