import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ForbiddenException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { TicketsService } from "./tickets.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("tickets")
@Controller("tickets")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  private isStaff(user: any): boolean {
    return user?.roles?.includes("super_admin") || user?.roles?.includes("support");
  }

  private assertStaff(user: any): void {
    if (!this.isStaff(user)) throw new ForbiddenException("Requiere rol de soporte o super admin");
  }

  private async assertTicketAccess(ticket: any, user: any): Promise<void> {
    if (!this.isStaff(user) && ticket.tenantId !== user.tenantId) {
      throw new ForbiddenException("No tienes acceso a este ticket");
    }
  }

  @Post()
  @ApiOperation({ summary: "Create ticket" })
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.ticketsService.create({ tenantId: user.tenantId, userId: user.id, ...body });
  }

  @Get()
  @ApiOperation({ summary: "List tickets (filtered by role)" })
  async findAll(
    @CurrentUser() user: any,
    @Query("status") status?: string,
    @Query("priority") priority?: string,
    @Query("tenantId") tenantId?: string
  ) {
    const isAdmin = this.isStaff(user);
    const filters: any = { status, priority };
    if (!isAdmin) filters.tenantId = user.tenantId;
    else if (tenantId) filters.tenantId = tenantId;
    return this.ticketsService.findAll(filters);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get ticket statistics (scoped by tenant for non-staff)" })
  async getStats(@CurrentUser() user: any) {
    const where = this.isStaff(user) ? {} : { tenantId: user.tenantId };
    return this.ticketsService.getStats(where);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get ticket by ID" })
  async findById(@Param("id") id: string, @CurrentUser() user: any) {
    const ticket = await this.ticketsService.findById(id);
    await this.assertTicketAccess(ticket, user);
    return ticket;
  }

  @Post(":id/reply")
  @ApiOperation({ summary: "Add reply to ticket" })
  async addReply(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body("message") message: string,
    @Body("images") images?: any
  ) {
    const isAdmin = this.isStaff(user);
    const ticket = await this.ticketsService.findById(id);
    await this.assertTicketAccess(ticket, user);
    return this.ticketsService.addReply(id, user.id, message, isAdmin, images);
  }

  @Put(":id/status")
  @ApiOperation({ summary: "Update ticket status (staff only)" })
  async updateStatus(@Param("id") id: string, @CurrentUser() user: any, @Body("status") status: string) {
    this.assertStaff(user);
    return this.ticketsService.updateStatus(id, status);
  }

  @Put(":id/priority")
  @ApiOperation({ summary: "Update ticket priority (staff only)" })
  async updatePriority(@Param("id") id: string, @CurrentUser() user: any, @Body("priority") priority: string) {
    this.assertStaff(user);
    return this.ticketsService.updatePriority(id, priority);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete ticket (staff only)" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    this.assertStaff(user);
    return this.ticketsService.remove(id);
  }
}
