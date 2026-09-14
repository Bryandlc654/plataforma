import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
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
import { CreateRoleDto, UpdateRoleDto, SetRolePermissionsDto } from "../../shared";

@ApiTags("roles")
@Controller("roles")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: "List system + tenant roles" })
  async findAll(@CurrentUser() user: any) {
    return this.rolesService.findAll(user.tenantId);
  }

  @Get("permissions")
  @RequirePermissions("role.manage")
  @ApiOperation({ summary: "List all available permissions" })
  async listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Get("my-permissions/:tenantId")
  @ApiOperation({ summary: "Get my permissions for a tenant" })
  async getMyPermissions(
    @CurrentUser() user: any,
    @Param("tenantId") tenantId: string
  ) {
    return this.rolesService.getPermissionsByUser(user.id, tenantId);
  }

  @Post()
  @RequirePermissions("role.manage")
  @ApiOperation({ summary: "Create a custom role for the tenant" })
  async create(@CurrentUser() user: any, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(user.tenantId, dto);
  }

  @Patch(":id")
  @RequirePermissions("role.manage")
  @ApiOperation({ summary: "Update a custom role" })
  async update(@CurrentUser() user: any, @Param("id") id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, user.tenantId, dto);
  }

  @Delete(":id")
  @RequirePermissions("role.manage")
  @ApiOperation({ summary: "Delete a custom role" })
  async delete(@CurrentUser() user: any, @Param("id") id: string) {
    return this.rolesService.delete(id, user.tenantId);
  }

  @Put(":id/permissions")
  @RequirePermissions("role.manage")
  @ApiOperation({ summary: "Set the permissions of a custom role" })
  async setPermissions(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: SetRolePermissionsDto
  ) {
    return this.rolesService.setPermissions(id, user.tenantId, dto);
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