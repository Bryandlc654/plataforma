import {
  Controller, Get, Post, Param, Body, UseGuards, Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { BillingService } from "./billing.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PERMISSIONS } from "../../shared/index";

@ApiTags("billing")
@Controller("billing")
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get("invoices")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get invoices for current tenant" })
  async getInvoices(@CurrentUser() user: any) {
    return this.billingService.getInvoices(user.tenantId);
  }

  @Get("invoices/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get invoice by ID" })
  async getInvoice(@CurrentUser() user: any, @Param("id") id: string) {
    return this.billingService.getInvoiceById(id, user);
  }

  @Get("invoices/:tenantId/all")
  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all invoices for a tenant (admin)" })
  async getTenantInvoices(@Param("tenantId") tenantId: string) {
    return this.billingService.getInvoicesForTenantAdmin(tenantId);
  }

  @Post("payment-link")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Generate a payment link for a plan" })
  async generatePaymentLink(
    @CurrentUser() user: any,
    @Body("planSlug") planSlug: string
  ) {
    return this.billingService.generatePaymentLink(user.tenantId, planSlug);
  }

  @Post("invoices/:id/pay")
  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mark invoice as paid" })
  async payInvoice(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body("externalId") externalId?: string
  ) {
    return this.billingService.markInvoiceAsPaid(id, externalId, user);
  }

  @Public()
  @Post("webhook")
  @ApiOperation({ summary: "Payment gateway webhook" })
  async webhook(@Body() payload: any) {
    return this.billingService.processWebhook(payload);
  }
}
