import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CouponsService } from "./coupons.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("coupons")
@Controller("coupons")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @Post() @ApiOperation({ summary: "Create coupon" }) async create(@CurrentUser() user: any, @Body() body: any) { return this.couponsService.create(user.tenantId, body); }
  @Get() @ApiOperation({ summary: "List coupons" }) async findAll(@CurrentUser() user: any) { return this.couponsService.findAll(user.tenantId); }
  @Get("validate/:code") @ApiOperation({ summary: "Validate coupon" }) async validate(@CurrentUser() user: any, @Param("code") code: string) { return this.couponsService.validate(user.tenantId, code); }
  @Put(":id") @ApiOperation({ summary: "Update coupon" }) async update(@Param("id") id: string, @Body() body: any) { return this.couponsService.update(id, body); }
  @Delete(":id") @ApiOperation({ summary: "Delete coupon" }) async remove(@Param("id") id: string) { return this.couponsService.remove(id); }
}
