import {
  Controller, Get, Put, Post, Param, Query, Body, UseGuards, Req, Res,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { LeadsService } from "./leads.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("leads")
@Controller("leads")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: "List leads with filters (paginated)" })
  async findAll(
    @CurrentUser() user: any,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("siteId") siteId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    const p = Math.max(1, parseInt(page || "1", 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize || "25", 10) || 25));
    return this.leadsService.findAll(user.tenantId, { status, search, siteId, from, to }, p, ps);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get lead statistics" })
  async getStats(@CurrentUser() user: any) {
    return this.leadsService.getStats(user.tenantId);
  }

  @Get("export")
  @ApiOperation({ summary: "Export leads to CSV" })
  async exportCsv(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
    @Query("status") status?: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    const csv = await this.leadsService.exportCsv(user.tenantId, { status, from, to });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=leads.csv");
    return csv;
  }

  @Get(":id")
  @ApiOperation({ summary: "Get lead by ID" })
  async findById(@Param("id") id: string) {
    return this.leadsService.findById(id);
  }

  @Put(":id/status")
  @ApiOperation({ summary: "Update lead status" })
  async updateStatus(
    @Param("id") id: string,
    @Body("status") status: string
  ) {
    return this.leadsService.updateStatus(id, status);
  }

  @Put("bulk-status")
  @ApiOperation({ summary: "Update status for multiple leads" })
  async updateManyStatus(
    @CurrentUser() user: any,
    @Body() body: { ids: string[]; status: string }
  ) {
    return this.leadsService.updateManyStatus(user.tenantId, body.ids, body.status);
  }

  @Public()
  @Post("submit/:tenantId")
  @ApiOperation({ summary: "Submit a public lead directly to CRM" })
  async submitPublicLead(
    @Param("tenantId") tenantId: string,
    @Body() body: any
  ) {
    // We optionally extract siteId if it's sent in the body
    const siteId = body.siteId || null;
    return this.leadsService.submitPublicLead(tenantId, siteId, body);
  }
}
