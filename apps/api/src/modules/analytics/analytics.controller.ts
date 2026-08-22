import {
  Controller, Get, Post, Param, Query, Body, UseGuards, Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Public()
  @Post("track")
  @ApiOperation({ summary: "Track analytics event (public)" })
  async track(
    @Body() body: { tenantId: string; type: string; siteId?: string; path?: string; referrer?: string; metadata?: any },
    @Req() req: any
  ) {
    return this.analyticsService.track(body.tenantId, body, req.ip, req.headers["user-agent"]);
  }

  @Get("overview")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get analytics overview" })
  async getOverview(
    @CurrentUser() user: any,
    @Query("siteId") siteId?: string,
    @Query("period") period?: string
  ) {
    return this.analyticsService.getOverview(user.tenantId, siteId, period);
  }

  @Get("sites/:siteId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get analytics for a specific site" })
  async getSiteAnalytics(
    @CurrentUser() user: any,
    @Param("siteId") siteId: string,
    @Query("period") period?: string
  ) {
    return this.analyticsService.getOverview(user.tenantId, siteId, period);
  }
}
