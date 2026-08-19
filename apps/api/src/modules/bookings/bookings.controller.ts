import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { BookingsService } from "./bookings.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("bookings")
@Controller("bookings")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post("services") @ApiOperation({ summary: "Create booking service" }) async createService(@CurrentUser() user: any, @Body() body: any) { return this.bookingsService.createService(user.tenantId, body); }
  @Get("services") @ApiOperation({ summary: "List services" }) async getServices(@CurrentUser() user: any) { return this.bookingsService.getServices(user.tenantId); }
  @Put("services/:id") @ApiOperation({ summary: "Update service" }) async updateService(@Param("id") id: string, @Body() body: any) { return this.bookingsService.updateService(id, body); }
  @Delete("services/:id") @ApiOperation({ summary: "Delete service" }) async removeService(@Param("id") id: string) { return this.bookingsService.removeService(id); }

  @Post() @ApiOperation({ summary: "Create booking" }) async create(@CurrentUser() user: any, @Body() body: any) { return this.bookingsService.createBooking(user.tenantId, body); }

  @Get() @ApiOperation({ summary: "List bookings" })
  async getBookings(@CurrentUser() user: any, @Query("from") from?: string, @Query("to") to?: string, @Query("serviceId") serviceId?: string, @Query("status") status?: string) {
    return this.bookingsService.getBookings(user.tenantId, from, to, serviceId, status);
  }

  @Put(":id/status") @ApiOperation({ summary: "Update booking status" }) async updateStatus(@Param("id") id: string, @Body("status") status: string) { return this.bookingsService.updateBookingStatus(id, status); }
  @Get("availability/:serviceId") @ApiOperation({ summary: "Get availability" }) async getAvailability(@Param("serviceId") serviceId: string, @Query("date") date: string) { return this.bookingsService.getAvailability(serviceId, date); }
}
