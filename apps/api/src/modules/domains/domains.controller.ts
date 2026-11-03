import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { DomainsService } from "./domains.service";

@ApiTags("domains")
@Controller("domains")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DomainsController {
  constructor(private domains: DomainsService) {}

  @Get("status")
  @ApiOperation({ summary: "Indica si la búsqueda y la compra de dominios están disponibles" })
  status() {
    return this.domains.status();
  }

  @Get("search")
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: "Busca dominios disponibles con su precio" })
  search(@Query("q") q?: string) {
    if (!q || !q.trim()) throw new BadRequestException("Escribe el nombre que quieres buscar.");
    return this.domains.search(q);
  }

  @Get("orders")
  @ApiOperation({ summary: "Pedidos de dominio del negocio" })
  orders(@CurrentUser() user: any) {
    return this.domains.listOrders(user.tenantId);
  }

  @Get("orders/:id/connection")
  @ApiOperation({ summary: "Avance de la conexión automática del dominio" })
  connection(@CurrentUser() user: any, @Param("id") id: string) {
    return this.domains.connection(user.tenantId, id);
  }

  @Get("orders/:id")
  @ApiOperation({ summary: "Estado de un pedido de dominio" })
  order(@CurrentUser() user: any, @Param("id") id: string) {
    return this.domains.getOrder(user.tenantId, id);
  }

  @Post("orders")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Crea el pedido y la orden de pago en PayPal" })
  createOrder(@CurrentUser() user: any, @Body() body: { domain: string; siteId: string }) {
    return this.domains.createOrder(user, body);
  }

  @Post("orders/:id/capture")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirma el pago de PayPal y registra el dominio" })
  capture(@CurrentUser() user: any, @Param("id") id: string, @Body() body: { paypalOrderId: string }) {
    if (!body?.paypalOrderId) throw new BadRequestException("Falta el identificador del pago.");
    return this.domains.captureOrder(user, id, body.paypalOrderId);
  }
}
