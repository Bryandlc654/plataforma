import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuditService } from "./audit.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@ApiTags("audit")
@Controller("audit")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: "Get audit logs for current tenant" })
  async findAll(
    @CurrentUser() user: any,
    @Query("action") action?: string,
    @Query("userId") userId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limit?: number
  ) {
    return this.auditService.findAll(user.tenantId, { action, userId, from, to, limit });
  }

  @Get("actions")
  @ApiOperation({ summary: "Get available action types" })
  async getActions(@CurrentUser() user: any) {
    return this.auditService.getActions(user.tenantId);
  }

  @Get("global")
  @RequirePermissions("audit.view")
  @ApiOperation({ summary: "Get global audit logs (admin)" })
  async getGlobal(
    @Query("action") action?: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.auditService.getGlobal({ action, from, to });
  }
}
