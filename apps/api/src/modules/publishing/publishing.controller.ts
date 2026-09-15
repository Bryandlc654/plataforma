import {
  Controller, Post, Get, Param, UseGuards, Res, Header, Query, Body, BadRequestException, NotFoundException,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PublishingService } from "./publishing.service";
import { OrdersService } from "../orders/orders.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("publishing")
@Controller()
export class PublishingController {
  constructor(
    private publishingService: PublishingService,
    private ordersService: OrdersService,
  ) {}

  @Post("sites/:id/publish")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Publish a site" })
  async publish(@Param("id") id: string) {
    return this.publishingService.publish(id);
  }

  @Post("sites/:id/unpublish")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Unpublish a site" })
  async unpublish(@Param("id") id: string) {
    return this.publishingService.unpublish(id);
  }

  @Get("sites/:id/preview")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get site preview data" })
  async preview(@Param("id") id: string) {
    return this.publishingService.preview(id);
  }

  @Public()
  @Get("p/:subdomain")
  @Header("Content-Type", "text/html; charset=utf-8")
  @ApiOperation({ summary: "Public site - renders full HTML" })
  async getPublicSite(
    @Param("subdomain") subdomain: string,
    @Query("path") path: string,
    @Res() res: Response
  ) {
    const html = await this.publishingService.getPublicHtml(subdomain, path);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  }

  @Public()
  @Get("p/:subdomain/sitemap.xml")
  @ApiOperation({ summary: "Public sitemap.xml" })
  async getSitemap(@Param("subdomain") subdomain: string, @Res() res: Response) {
    const xml = await this.publishingService.getPublicSitemap(subdomain);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  }

  @Public()
  @Get("p/:subdomain/robots.txt")
  @ApiOperation({ summary: "Public robots.txt" })
  async getRobots(@Param("subdomain") subdomain: string, @Res() res: Response) {
    const txt = await this.publishingService.getPublicRobots(subdomain);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(txt);
  }

  @Public()
  @Post("p/:subdomain/orders")
  @ApiOperation({ summary: "Public checkout - creates order (cash on delivery)" })
  async checkout(
    @Param("subdomain") subdomain: string,
    @Body() body: any,
  ) {
    const tenantId = await this.publishingService.resolveTenantBySubdomain(subdomain);
    if (!tenantId) throw new NotFoundException("Sitio no encontrado");

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
      paymentMethod: body?.paymentMethod === "cod" ? "cod" : "cod",
    });

    return { id: order.id, status: order.status, totalAmount: String(order.totalAmount), paymentMethod: order.paymentMethod };
  }
}
