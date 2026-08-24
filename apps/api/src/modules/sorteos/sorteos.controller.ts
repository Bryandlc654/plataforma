import {
  Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { SorteosService } from "./sorteos.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Request } from "express";

@ApiTags("sorteos")
@Controller("sorteos")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SorteosController {
  constructor(private sorteosService: SorteosService) {}

  @Get()
  @ApiOperation({ summary: "List sorteos" })
  async findAll(
    @CurrentUser() user: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.sorteosService.findAll(user.tenantId, parseInt(page || "1"), parseInt(limit || "20"));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get sorteo by ID" })
  async findById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.sorteosService.findById(id, user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: "Create sorteo" })
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.sorteosService.create(user.tenantId, body);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update sorteo" })
  async update(@Param("id") id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.sorteosService.update(id, user.tenantId, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete sorteo" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.sorteosService.remove(id, user.tenantId);
  }

  @Get(":id/participants")
  @ApiOperation({ summary: "List sorteo participants" })
  async getParticipants(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.sorteosService.getParticipants(id, user.tenantId, parseInt(page || "1"), parseInt(limit || "50"));
  }

  @Delete(":id/participants/:pid")
  @ApiOperation({ summary: "Remove participant" })
  async removeParticipant(
    @Param("id") id: string,
    @Param("pid") pid: string,
    @CurrentUser() user: any,
  ) {
    return this.sorteosService.removeParticipant(pid, user.tenantId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Public()
  @Get("public/:tenantId/:slug")
  @ApiOperation({ summary: "Get public sorteo config" })
  async findPublic(@Param("tenantId") tenantId: string, @Param("slug") slug: string) {
    return this.sorteosService.findPublic(tenantId, slug);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Public()
  @Post("public/:tenantId/:slug/participate")
  @ApiOperation({ summary: "Submit participation" })
  async participate(
    @Param("tenantId") tenantId: string,
    @Param("slug") slug: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    return this.sorteosService.participate(tenantId, slug, body, req.ip, req.headers["user-agent"]);
  }
}
