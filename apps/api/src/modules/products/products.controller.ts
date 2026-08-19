import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("products")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post("products")
  @ApiOperation({ summary: "Create product" })
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.productsService.create(user.tenantId, body);
  }

  @Get("products")
  @ApiOperation({ summary: "List products" })
  async findAll(@CurrentUser() user: any, @Query("categoryId") categoryId?: string) {
    return this.productsService.findAll(user.tenantId, categoryId);
  }

  @Get("products/:id")
  @ApiOperation({ summary: "Get product" })
  async findById(@Param("id") id: string) { return this.productsService.findById(id); }

  @Put("products/:id")
  @ApiOperation({ summary: "Update product" })
  async update(@Param("id") id: string, @Body() body: any) { return this.productsService.update(id, body); }

  @Delete("products/:id")
  @ApiOperation({ summary: "Delete product" })
  async remove(@Param("id") id: string) { return this.productsService.remove(id); }

  @Get("product-categories")
  @ApiOperation({ summary: "List categories" })
  async getCategories(@CurrentUser() user: any) { return this.productsService.getCategories(user.tenantId); }

  @Post("product-categories")
  @ApiOperation({ summary: "Create category" })
  async createCategory(@CurrentUser() user: any, @Body() body: any) { return this.productsService.createCategory(user.tenantId, body); }
}
