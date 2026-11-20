import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { FoodService } from "./food.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { PERMISSIONS } from "../../shared/index";

/** Panel de Jeaz Food: restaurante, menú y pedidos de la empresa activa. */
@ApiTags("food")
@Controller("food")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FoodController {
  constructor(private food: FoodService) {}

  @RequirePermissions(PERMISSIONS.SITE_READ)
  @Get("overview")
  @ApiOperation({ summary: "Resumen del restaurante para el inicio del panel" })
  overview(@CurrentUser() user: any) {
    return this.food.overview(user.tenantId);
  }

  @RequirePermissions(PERMISSIONS.SITE_READ)
  @Get("settings")
  getSettings(@CurrentUser() user: any) {
    return this.food.getSettings(user.tenantId);
  }

  @RequirePermissions(PERMISSIONS.CONFIG_TENANT)
  @Put("settings")
  updateSettings(@CurrentUser() user: any, @Body() body: any) {
    return this.food.updateSettings(user.tenantId, body);
  }

  @RequirePermissions(PERMISSIONS.SITE_READ)
  @Get("menu")
  getMenu(@CurrentUser() user: any) {
    return this.food.getMenu(user.tenantId);
  }

  @RequirePermissions(PERMISSIONS.SITE_UPDATE)
  @Post("categories")
  createCategory(@CurrentUser() user: any, @Body() body: any) {
    return this.food.createCategory(user.tenantId, body);
  }

  @RequirePermissions(PERMISSIONS.SITE_UPDATE)
  @Put("categories/reorder")
  reorderCategories(@CurrentUser() user: any, @Body("ids") ids: unknown) {
    return this.food.reorderCategories(user.tenantId, ids);
  }

  @RequirePermissions(PERMISSIONS.SITE_UPDATE)
  @Put("categories/:id")
  updateCategory(@CurrentUser() user: any, @Param("id") id: string, @Body() body: any) {
    return this.food.updateCategory(user.tenantId, id, body);
  }

  @RequirePermissions(PERMISSIONS.SITE_UPDATE)
  @Delete("categories/:id")
  deleteCategory(@CurrentUser() user: any, @Param("id") id: string) {
    return this.food.deleteCategory(user.tenantId, id);
  }

  @RequirePermissions(PERMISSIONS.SITE_UPDATE)
  @Post("products")
  createProduct(@CurrentUser() user: any, @Body() body: any) {
    return this.food.createProduct(user.tenantId, body);
  }

  @RequirePermissions(PERMISSIONS.SITE_UPDATE)
  @Put("products/:id")
  updateProduct(@CurrentUser() user: any, @Param("id") id: string, @Body() body: any) {
    return this.food.updateProduct(user.tenantId, id, body);
  }

  @RequirePermissions(PERMISSIONS.SITE_UPDATE)
  @Delete("products/:id")
  deleteProduct(@CurrentUser() user: any, @Param("id") id: string) {
    return this.food.deleteProduct(user.tenantId, id);
  }

  @RequirePermissions(PERMISSIONS.SITE_READ)
  @Get("orders")
  listOrders(
    @CurrentUser() user: any,
    @Query("scope") scope?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    return this.food.listOrders(user.tenantId, { scope, status, search });
  }

  @RequirePermissions(PERMISSIONS.SITE_READ)
  @Get("orders/:id")
  getOrder(@CurrentUser() user: any, @Param("id") id: string) {
    return this.food.getOrder(user.tenantId, id);
  }

  @RequirePermissions(PERMISSIONS.SITE_UPDATE)
  @Put("orders/:id")
  updateOrder(@CurrentUser() user: any, @Param("id") id: string, @Body() body: any) {
    return this.food.updateOrder(user.tenantId, id, body);
  }
}

/** Menú público que ven los clientes del restaurante (sin sesión). */
@ApiTags("food-public")
@Controller("food/public")
export class FoodPublicController {
  constructor(private food: FoodService) {}

  @Public()
  @Get(":slug")
  @ApiOperation({ summary: "Menú público del restaurante" })
  menu(@Param("slug") slug: string) {
    return this.food.publicMenu(slug);
  }

  @Public()
  // Por IP: en "comer en el local" muchos clientes comparten el wifi del restaurante.
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post(":slug/orders")
  @ApiOperation({ summary: "Crear un pedido desde el menú público" })
  createOrder(@Param("slug") slug: string, @Body() body: any) {
    return this.food.createPublicOrder(slug, body);
  }

  @Public()
  @Get(":slug/orders/:id")
  @ApiOperation({ summary: "Estado de un pedido" })
  orderStatus(@Param("slug") slug: string, @Param("id") id: string) {
    return this.food.publicOrderStatus(slug, id);
  }
}
