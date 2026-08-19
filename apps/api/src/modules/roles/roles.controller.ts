import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { RolesService } from "./roles.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("roles")
@Controller("roles")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: "List all available roles" })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get("my-permissions/:tenantId")
  @ApiOperation({ summary: "Get my permissions for a tenant" })
  async getMyPermissions(
    @CurrentUser() user: any,
    @Param("tenantId") tenantId: string
  ) {
    return this.rolesService.getPermissionsByUser(user.id, tenantId);
  }

  @Post("assign")
  @RequirePermissions("role.manage")
  @ApiOperation({ summary: "Assign a role to a user" })
  async assignRole(
    @CurrentUser() user: any,
    @Body("userTenantId") userTenantId: string,
    @Body("roleId") roleId: string
  ) {
    return this.rolesService.assignRole(userTenantId, roleId, user.id, user.tenantId);
  }

  @Delete("remove/:userTenantId/:roleId")
  @RequirePermissions("role.manage")
  @ApiOperation({ summary: "Remove a role from a user" })
  async removeRole(
    @CurrentUser() user: any,
    @Param("userTenantId") userTenantId: string,
    @Param("roleId") roleId: string
  ) {
    return this.rolesService.removeRole(userTenantId, roleId, user.tenantId);
  }
}
