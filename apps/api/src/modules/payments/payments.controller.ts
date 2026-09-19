import { Controller, Get, Put, Body, Param, Post, UseGuards, NotFoundException, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { PublishingService } from "../publishing/publishing.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("payments")
@Controller()
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private publishingService: PublishingService,
  ) {}

  @Get("payments/config")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get payment gateway config (without secrets)" })
  async getConfig(@CurrentUser() user: any) {
    return this.paymentsService.getConfig(user.tenantId);
  }

  @Put("payments/config")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update payment gateway config (owner only)" })
  async updateConfig(@CurrentUser() user: any, @Body() body: any) {
    return this.paymentsService.updateConfig(user.tenantId, user.id, body);
  }

  @Public()
  @Post("p/:subdomain/paypal/create-order")
  @ApiOperation({ summary: "Public PayPal create order - creates local order + PayPal order" })
  async createPaypalOrder(@Param("subdomain") subdomain: string, @Body() body: any) {
    const tenantId = await this.publishingService.resolveTenantBySubdomain(subdomain);
    if (!tenantId) throw new NotFoundException("Sitio no encontrado");
    return this.paymentsService.createPaypalOrder(tenantId, body);
  }

  @Public()
  @Post("p/:subdomain/paypal/capture-order")
  @ApiOperation({ summary: "Public PayPal capture - confirms payment and marks order paid" })
  async capturePaypalOrder(
    @Param("subdomain") subdomain: string,
    @Body() body: any,
  ) {
    const tenantId = await this.publishingService.resolveTenantBySubdomain(subdomain);
    if (!tenantId) throw new NotFoundException("Sitio no encontrado");
    const paypalOrderId = String(body?.paypalOrderId || "");
    const orderId = String(body?.orderId || "");
    if (!paypalOrderId || !orderId) throw new BadRequestException("Faltan datos del pago");
    return this.paymentsService.capturePaypalOrder(tenantId, paypalOrderId, orderId);
  }

  @Public()
  @Post("p/:subdomain/payphone/create-order")
  @ApiOperation({ summary: "Public Payphone create order - creates local order + transaction id" })
  async createPayphoneOrder(@Param("subdomain") subdomain: string, @Body() body: any) {
    const tenantId = await this.publishingService.resolveTenantBySubdomain(subdomain);
    if (!tenantId) throw new NotFoundException("Sitio no encontrado");
    return this.paymentsService.createPayphoneOrder(tenantId, body);
  }

  @Public()
  @Post("p/:subdomain/payphone/confirm")
  @ApiOperation({ summary: "Public Payphone confirm - verifies payment with Payphone and marks order paid" })
  async confirmPayphone(
    @Param("subdomain") subdomain: string,
    @Body() body: any,
  ) {
    const tenantId = await this.publishingService.resolveTenantBySubdomain(subdomain);
    if (!tenantId) throw new NotFoundException("Sitio no encontrado");
    const id = String(body?.id || "");
    const clientTransactionId = String(body?.clientTransactionId || "");
    if (!id || !clientTransactionId) throw new BadRequestException("Faltan datos del pago");
    return this.paymentsService.confirmPayphone(tenantId, id, clientTransactionId);
  }
}