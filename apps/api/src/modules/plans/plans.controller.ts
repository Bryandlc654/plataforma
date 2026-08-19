import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PlansService } from "./plans.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PERMISSIONS } from "../../shared/index";

@ApiTags("plans")
@Controller("plans")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: "List all available plans" })
  async findAll() {
    return this.plansService.findAll();
  }

  @Get("tenant/:tenantId")
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: "Get current plan for a tenant" })
  async getCurrentPlan(@Param("tenantId") tenantId: string) {
    return this.plansService.getCurrentPlan(tenantId);
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Get("admin/all")
  @ApiOperation({ summary: "Admin: list all plans (including inactive)" })
  async adminFindAll() {
    return this.plansService.adminFindAll();
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get plan details by slug" })
  async findBySlug(@Param("slug") slug: string) {
    return this.plansService.findBySlug(slug);
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post()
  @ApiOperation({ summary: "Create a new plan (admin)" })
  async create(@Body() body: any) { return this.plansService.create(body); }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Put(":id")
  @ApiOperation({ summary: "Update a plan (admin)" })
  async update(@Param("id") id: string, @Body() body: any) { return this.plansService.update(id, body); }
}
