import { Controller, Post, Body, UseGuards, Delete, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post("push-token")
  @ApiOperation({ summary: "Register a push notification token for the current user" })
  async registerToken(
    @CurrentUser() user: any,
    @Body("token") token: string,
    @Body("device") device?: string
  ) {
    return this.notificationsService.registerToken(user.id, token, device);
  }

  @Delete("push-token/:token")
  @ApiOperation({ summary: "Unregister a push notification token" })
  async unregisterToken(
    @CurrentUser() user: any,
    @Param("token") token: string
  ) {
    return this.notificationsService.unregisterToken(user.id, token);
  }
}
