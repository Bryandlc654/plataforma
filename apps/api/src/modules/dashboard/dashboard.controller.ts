import {
  Controller,
  Get,
  UseGuards,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PERMISSIONS } from "../../shared/index";

@ApiTags("dashboard")
@Controller("dashboard")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get("tenant/:tenantId")
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: "Get tenant dashboard overview" })
  async getTenantOverview(@Param("tenantId") tenantId: string) {
    return this.dashboardService.getTenantOverview(tenantId);
  }

  @Get("admin")
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiOperation({ summary: "Get admin dashboard overview" })
  async getAdminOverview() {
    return this.dashboardService.getAdminOverview();
  }

  @Get("admin/billing")
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiOperation({ summary: "Get global billing overview" })
  async getBillingOverview() {
    return this.dashboardService.getBillingOverview();
  }
}
