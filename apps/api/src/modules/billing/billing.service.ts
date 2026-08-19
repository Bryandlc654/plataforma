import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

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

    const payphoneAppId = this.configService.get<string>("payphone.appId");
    const payphoneToken = this.configService.get<string>("payphone.token");

    if (!payphoneAppId || !payphoneToken) {
      // Payphone not configured - generate a mock payment link
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId, deletedAt: null } });
      if (!tenant) throw new BadRequestException("Tenant not found");

      this.logger.warn("Payphone not configured, using mock payment");

      return {
        paymentUrl: `http://localhost:3000/dashboard/billing/pay?plan=${planSlug}&tenant=${tenantId}`,
        amount: Number(plan.price),
        currency: "USD",
        plan: plan.name,
      };
    }

    // Real Payphone integration
    try {
      const response = await fetch("https://pay.payphonetodoespos.com/api/button/Prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payphoneToken}`,
        },
        body: JSON.stringify({
          amount: Number(plan.price),
          amountWithoutTax: Number(plan.price),
          clientTransactionId: `${tenantId}_${Date.now()}`,
          reference: `Plan ${plan.name} - Monthly`,
          responseUrl: `http://localhost:3000/dashboard/billing/success`,
          cancellationUrl: `http://localhost:3000/dashboard/billing/cancel`,
        }),
      });

      const data = await response.json();
      return {
        paymentUrl: data.paymentUrl || data.payWithCard,
        amount: Number(plan.price),
        currency: "USD",
        plan: plan.name,
        transactionId: data.transactionId,
      };
    } catch (error) {
      this.logger.error(`Payment link generation failed: ${error.message}`);
      throw new BadRequestException("Payment service temporarily unavailable");
    }
  }

  async processWebhook(payload: any) {
    const { transactionId, clientTransactionId, status, amount } = payload;

    this.logger.log(`Payment webhook received: ${transactionId} - ${status}`);

    if (status !== "approved" && status !== "success") {
      return { processed: false, reason: `Status: ${status}` };
    }

    const tenantId = clientTransactionId?.split("_")[0];
    if (!tenantId) return { processed: false, reason: "No tenant ID in transaction" };

    const currentSub = await this.prisma.subscription.findFirst({
      where: { tenantId, status: "active" },
      include: { plan: true },
    });

    if (currentSub) {
      // Extend subscription period
      const newEnd = new Date(currentSub.currentPeriodEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
      await this.prisma.subscription.update({
        where: { id: currentSub.id },
        data: { currentPeriodEnd: newEnd },
      });

      // Create invoice
      await this.prisma.invoice.create({
        data: {
          tenantId,
          subscriptionId: currentSub.id,
          amount: currentSub.plan.price,
          status: "paid",
          paidAt: new Date(),
          externalId: transactionId,
          metadata: payload as any,
        },
      });

      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { subscriptionEndsAt: newEnd },
      });

      return { processed: true, action: "extended", newEnd };
    }

    return { processed: false, reason: "No active subscription found" };
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

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "paid",
        paidAt: new Date(),
        externalId,
      },
    });
  }
}
