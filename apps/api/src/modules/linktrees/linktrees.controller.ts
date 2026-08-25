import {
  Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { LinktreesService } from "./linktrees.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("linktrees")
@Controller("linktrees")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LinktreesController {
  constructor(private linktreesService: LinktreesService) {}

  @Get()
  @ApiOperation({ summary: "List linktrees" })
  async findAll(
    @CurrentUser() user: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.linktreesService.findAll(user.tenantId, parseInt(page || "1"), parseInt(limit || "20"));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get linktree by ID" })
  async findById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.linktreesService.findById(id, user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: "Create linktree" })
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.linktreesService.create(user.tenantId, body);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update linktree" })
  async update(@Param("id") id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.linktreesService.update(id, user.tenantId, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete linktree" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.linktreesService.remove(id, user.tenantId);
  }
}
