import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Patch,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UpdateUserDto, PERMISSIONS } from "../../shared/index";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("profile")
  @ApiOperation({ summary: "Get current user profile" })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Put("profile")
  @ApiOperation({ summary: "Update current user profile" })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateUserDto
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch("password")
  @ApiOperation({ summary: "Change password" })
  async changePassword(
    @CurrentUser() user: any,
    @Body("currentPassword") currentPassword: string,
    @Body("newPassword") newPassword: string
  ) {
    return this.usersService.changePassword(user.id, currentPassword, newPassword);
  }

  @Get("tenants")
  @ApiOperation({ summary: "Get user's tenants" })
  async getTenants(@CurrentUser() user: any) {
    return this.usersService.getTenantsByUser(user.id);
  }

  @Get("admin/all")
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiOperation({ summary: "Admin: list all users with filters" })
  async adminFindAll(
    @Query("role") role?: string,
    @Query("tenantId") tenantId?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) { return this.usersService.adminFindAll({
    role, tenantId, search,
    page: parseInt(page || "1", 10) || 1,
    limit: parseInt(limit || "50", 10) || 50,
  }); }

  @Put("admin/:id/toggle-block")
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiOperation({ summary: "Admin: toggle user block" })
  async adminToggleBlock(@CurrentUser() user: any, @Param("id") id: string) {
    return this.usersService.adminToggleBlock(id, user.id);
  }

  @Post("admin/assign-tenant")
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiOperation({ summary: "Admin: assign user to a tenant" })
  async adminAssignTenant(
    @CurrentUser() user: any,
    @Body("userId") userId: string,
    @Body("tenantId") tenantId: string,
    @Body("roleId") roleId?: string
  ) {
    return this.usersService.adminAssignTenant(userId, tenantId, roleId, user.id);
  }

  @Delete("admin/:userId/tenant/:tenantId")
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiOperation({ summary: "Admin: remove user from tenant" })
  async adminRemoveTenant(
    @Param("userId") userId: string,
    @Param("tenantId") tenantId: string
  ) { return this.usersService.adminRemoveTenant(userId, tenantId); }
}
