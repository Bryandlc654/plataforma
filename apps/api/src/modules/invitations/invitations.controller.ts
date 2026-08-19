import {
  Controller, Get, Post, Delete, Param, Body, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { InvitationsService } from "./invitations.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PERMISSIONS } from "../../shared/index";

@ApiTags("invitations")
@Controller("invitations")
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermissions(PERMISSIONS.ROLE_MANAGE)
  @ApiOperation({ summary: "Create an invitation" })
  async create(
    @CurrentUser() user: any,
    @Body() body: { email: string; roleId: string }
  ) {
    return this.invitationsService.create(user.tenantId, user.id, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List invitations for current tenant" })
  async findAll(@CurrentUser() user: any) {
    return this.invitationsService.findAll(user.tenantId);
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my pending invitations" })
  async getMine(@CurrentUser() user: any) {
    return this.invitationsService.getUserInvitations(user.id);
  }

  @Public()
  @Post(":token/accept")
  @ApiOperation({ summary: "Accept invitation by token" })
  async accept(
    @Param("token") token: string,
    @Body("userId") userId: string
  ) {
    return this.invitationsService.accept(token, userId);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermissions(PERMISSIONS.ROLE_MANAGE)
  @ApiOperation({ summary: "Revoke/delete invitation" })
  async revoke(@CurrentUser() user: any, @Param("id") id: string) {
    return this.invitationsService.revoke(id, user.tenantId);
  }
}
