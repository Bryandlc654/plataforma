import {
  Controller, Get, Post, Put, Param, Query, Body, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { TemplatesService } from "./templates.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PERMISSIONS } from "../../shared/index";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("templates")
@Controller("templates")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: "List templates" })
  async findAll(@CurrentUser() user: any, @Query("categoryId") categoryId?: string) {
    return this.templatesService.findAllForTenant(user.tenantId, categoryId);
  }

  @Get("categories")
  @ApiOperation({ summary: "List template categories" })
  async getCategories() {
    return this.templatesService.getCategories();
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Get("admin/all")
  @ApiOperation({ summary: "Admin: list templates" })
  async adminFindAll(@Query("categoryId") categoryId?: string) {
    return this.templatesService.adminFindAll(categoryId);
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Get("admin/:id")
  @ApiOperation({ summary: "Admin: get template by ID" })
  async adminFindById(@Param("id") id: string) {
    return this.templatesService.adminFindById(id);
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin/diversify")
  @ApiOperation({ summary: "Admin: make templates visually distinct" })
  async diversifyAll() {
    return this.templatesService.diversifyAllTemplates();
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin/:id/diversify")
  @ApiOperation({ summary: "Admin: make a template visually distinct" })
  async diversifyOne(@Param("id") id: string) {
    return this.templatesService.diversifyTemplate(id);
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin/:id/presets/portfolio-creativo")
  @ApiOperation({ summary: "Admin: apply Portafolio Creativo preset" })
  async applyPortfolioCreativo(@Param("id") id: string) {
    return this.templatesService.applyPortfolioCreativoPreset(id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get template by ID" })
  async findById(@CurrentUser() user: any, @Param("id") id: string) {
    return this.templatesService.findByIdForTenant(id, user.tenantId);
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("from-site/:siteId")
  @ApiOperation({ summary: "Save site as template" })
  async createFromSite(
    @Param("siteId") siteId: string,
    @Body() body: { name: string; description?: string }
  ) {
    return this.templatesService.createFromSite(siteId, body.name, body.description);
  }

  @Put(":id")
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiOperation({ summary: "Update template" })
  async update(@Param("id") id: string, @Body() body: any) {
    return this.templatesService.update(id, body);
  }

  @Post("categories")
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiOperation({ summary: "Create template category" })
  async createCategory(@Body() body: { name: string; slug?: string }) {
    return this.templatesService.createCategory(body);
  }
}
