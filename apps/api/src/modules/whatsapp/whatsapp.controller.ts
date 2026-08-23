import {
  Controller, Get, Put, Post, Body, UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { WhatsAppService } from "./whatsapp.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("whatsapp")
@Controller("whatsapp")
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Get("settings")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get WhatsApp settings" })
  async getSettings(@CurrentUser() user: any) {
    return this.whatsappService.getSettings(user.tenantId);
  }

  @Put("settings")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update WhatsApp settings" })
  async updateSettings(
    @CurrentUser() user: any,
    @Body() body: any
  ) {
    return this.whatsappService.updateSettings(user.tenantId, body);
  }

  @Post("send")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Send WhatsApp message" })
  async sendMessage(
    @Body("to") to: string,
    @Body("message") message: string
  ) {
    return this.whatsappService.sendMessage(to, message);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Public()
  @Post("track-click")
  @ApiOperation({ summary: "Track WhatsApp click (public)" })
  async trackClick(
    @Body("tenantId") tenantId: string,
    @Body("siteId") siteId?: string
  ) {
    return this.whatsappService.trackClick(tenantId, siteId);
  }
}
