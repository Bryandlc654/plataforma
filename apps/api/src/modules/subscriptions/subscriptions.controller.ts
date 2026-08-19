import {
  Controller, Get, Post, Param, Body, UseGuards, Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SubscriptionsService } from "./subscriptions.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@ApiTags("subscriptions")
@Controller("subscriptions")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get("current")
  @ApiOperation({ summary: "Get current subscription" })
  async getCurrent(@CurrentUser() user: any) {
    return this.subscriptionsService.getCurrent(user.tenantId);
  }

  @Get("current/:tenantId")
  @RequirePermissions("subscription.read")
  @ApiOperation({ summary: "Get subscription for a tenant (admin)" })
  async getCurrentForTenant(@Param("tenantId") tenantId: string) {
    return this.subscriptionsService.getCurrent(tenantId);
  }

  @Post("upgrade")
  @ApiOperation({ summary: "Upgrade to a plan" })
  async upgrade(
    @CurrentUser() user: any,
    @Body("planId") planId: string
  ) {
    return this.subscriptionsService.upgrade(user.tenantId, planId);
  }

  @Post("downgrade")
  @ApiOperation({ summary: "Downgrade to a plan" })
  async downgrade(
    @CurrentUser() user: any,
    @Body("planId") planId: string
  ) {
    return this.subscriptionsService.downgrade(user.tenantId, planId);
  }

  @Post("cancel")
  @ApiOperation({ summary: "Cancel subscription" })
  async cancel(@CurrentUser() user: any) {
    return this.subscriptionsService.cancel(user.tenantId);
  }

  @Get("history")
  @ApiOperation({ summary: "Get subscription history" })
  async getHistory(@CurrentUser() user: any) {
    return this.subscriptionsService.getHistory(user.tenantId);
  }

  @Post("check-expired")
  @RequirePermissions("plan.manage")
  @ApiOperation({ summary: "Check and suspend expired subscriptions" })
  async checkExpired() {
    return this.subscriptionsService.checkAndSuspendExpired();
  }
}
