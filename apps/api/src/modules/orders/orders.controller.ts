import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("orders")
@Controller("orders")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: "Create order" })
  async create(@CurrentUser() user: any, @Body() body: any) { return this.ordersService.create(user.tenantId, body); }

  @Get()
  @ApiOperation({ summary: "List orders" })
  async findAll(@CurrentUser() user: any, @Query("status") status?: string) { return this.ordersService.findAll(user.tenantId, status); }

  @Get(":id")
  @ApiOperation({ summary: "Get order by ID" })
  async findById(@Param("id") id: string) { return this.ordersService.findById(id); }

  @Put(":id/status")
  @ApiOperation({ summary: "Update order status" })
  async updateStatus(@Param("id") id: string, @Body("status") status: string) { return this.ordersService.updateStatus(id, status); }

  @Put(":id/pay")
  @ApiOperation({ summary: "Mark order as paid" })
  async markPaid(@Param("id") id: string) { return this.ordersService.markPaid(id); }

  @Delete(":id")
  @ApiOperation({ summary: "Delete order" })
  async remove(@Param("id") id: string) { return this.ordersService.remove(id); }
}
