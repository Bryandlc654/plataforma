import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SitesService } from "./sites.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("sites")
@Controller("sites")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SitesController {
  constructor(private sitesService: SitesService) {}

  @Post()
  @ApiOperation({ summary: "Create new site" })
  async create(
    @CurrentUser() user: any,
    @Body() body: { name: string; templateId: string; subdomain?: string }
  ) {
    return this.sitesService.create(user.tenantId, body);
  }

  @Get()
  @ApiOperation({ summary: "List tenant sites" })
  async findAll(@CurrentUser() user: any) {
    return this.sitesService.findAll(user.tenantId);
  }

  @Get("capabilities")
  @ApiOperation({ summary: "Tenant module capabilities based on template choices" })
  async getCapabilities(@CurrentUser() user: any) {
    return this.sitesService.getCapabilities(user.tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get site by ID" })
  async findById(@Param("id") id: string) {
    return this.sitesService.findById(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update site" })
  async update(
    @Param("id") id: string,
    @Body() body: any
  ) {
    return this.sitesService.update(id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete site" })
  async remove(@Param("id") id: string) {
    return this.sitesService.remove(id);
  }

  @Get(":id/check-domain")
  @ApiOperation({ summary: "Check if custom domain DNS points to server" })
  async checkDomain(@Param("id") id: string, @Query("domain") domain: string) {
    return this.sitesService.checkDomainDns(id, domain);
  }
}
