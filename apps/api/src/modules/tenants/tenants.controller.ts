import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { TenantsService } from "./tenants.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CreateTenantDto, PERMISSIONS } from "../../shared/index";

@ApiTags("tenants")
@Controller("tenants")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new tenant" })
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateTenantDto
  ) {
    return this.tenantsService.create(user.id, dto);
  }

  @Get(":tenantId")
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: "Get tenant details" })
  async getTenant(
    @Param("tenantId") tenantId: string,
    @CurrentUser() user: any
  ) {
    return this.tenantsService.findById(tenantId, user.id);
  }

  @Put(":tenantId")
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: "Update tenant settings" })
  async update(
    @Param("tenantId") tenantId: string,
    @CurrentUser() user: any,
    @Body() data: { name?: string; customDomain?: string; primaryColor?: string }
  ) {
    return this.tenantsService.update(tenantId, user.id, data);
  }

  @Get(":tenantId/stats")
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: "Get tenant stats" })
  async getStats(@Param("tenantId") tenantId: string) {
    return this.tenantsService.getStats(tenantId);
  }

  @Get(":tenantId/users")
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: "Get tenant users" })
  async getUsers(@Param("tenantId") tenantId: string) {
    return this.tenantsService.getUsers(tenantId);
  }

  @Delete(":tenantId/members/:userTenantId")
  @UseGuards(TenantGuard)
  @RequirePermissions(PERMISSIONS.ROLE_MANAGE)
  @ApiOperation({ summary: "Remove a member from the tenant" })
  async removeMember(
    @Param("tenantId") tenantId: string,
    @Param("userTenantId") userTenantId: string,
    @CurrentUser() user: any
  ) {
    return this.tenantsService.removeMember(tenantId, userTenantId, user.id);
  }

  @Get(":tenantId/settings")
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: "Get tenant advanced settings" })
  async getSettings(
    @Param("tenantId") tenantId: string,
    @CurrentUser() user: any
  ) {
    return this.tenantsService.getSettings(tenantId, user.id);
  }

  @Put(":tenantId/settings")
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: "Update tenant advanced settings" })
  async updateSettings(
    @Param("tenantId") tenantId: string,
    @CurrentUser() user: any,
    @Body() settings: any
  ) {
    return this.tenantsService.updateSettings(tenantId, user.id, settings);
  }

  // Admin endpoints
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Get("admin/all")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Admin: list all tenants" })
  async adminFindAll() { return this.tenantsService.adminFindAll(); }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Admin: create tenant" })
  async adminCreate(@Body() body: any) { return this.tenantsService.adminCreate(body); }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Put("admin/:id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Admin: update tenant" })
  async adminUpdate(@Param("id") id: string, @Body() body: any) {
    return this.tenantsService.adminUpdate(id, body);
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin/:id/suspend")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Admin: suspend tenant" })
  async adminSuspend(@Param("id") id: string) { return this.tenantsService.adminSuspend(id); }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin/:id/reactivate")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Admin: reactivate tenant" })
  async adminReactivate(@Param("id") id: string) { return this.tenantsService.adminReactivate(id); }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin/:id/change-plan")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Admin: change tenant plan" })
  async adminChangePlan(@Param("id") id: string, @Body("planId") planId?: string) {
    return this.tenantsService.adminChangePlan(id, planId || "");
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Delete("admin/:id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Admin: delete tenant" })
  async adminDelete(@Param("id") id: string) { return this.tenantsService.adminDelete(id); }
}
