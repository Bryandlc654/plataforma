import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  private pickService(data: any) {
    const out: any = {};
    for (const key of ["name", "description", "duration", "price", "color", "isActive"]) {
      if (data && data[key] !== undefined) out[key] = data[key];
    }
    return out;
  }

  private async assertServiceOwned(id: string, tenantId: string) {
    const service = await this.prisma.bookingService.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!service) throw new NotFoundException("Service not found");
    return service;
  }

  async createService(tenantId: string, dto: any) {
    const data = this.pickService(dto);
    if (!data.name) throw new BadRequestException("El nombre del servicio es obligatorio");
    return this.prisma.bookingService.create({ data: { ...data, tenantId } });
  }

  async getServices(tenantId: string) {
    return this.prisma.bookingService.findMany({ where: { tenantId, isActive: true }, orderBy: { name: "asc" } });
  }

  async updateService(id: string, tenantId: string, data: any) {
    await this.assertServiceOwned(id, tenantId);
    return this.prisma.bookingService.update({ where: { id }, data: this.pickService(data) });
  }

  async removeService(id: string, tenantId: string) {
    await this.assertServiceOwned(id, tenantId);
    await this.prisma.bookingService.delete({ where: { id } });
    return { deleted: true };
  }

  async createBooking(tenantId: string, dto: { serviceId: string; customerName: string; customerEmail?: string; customerPhone?: string; startTime: string; notes?: string }) {
    const service = await this.prisma.bookingService.findFirst({ where: { id: dto.serviceId, tenantId } });
    if (!service) throw new NotFoundException("Service not found");

    const startTime = new Date(dto.startTime);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    // Check availability
    const conflict = await this.prisma.booking.findFirst({
      where: {
        serviceId: dto.serviceId,
        status: { not: "cancelled" },
        OR: [
          { startTime: { lte: endTime, gte: startTime } },
          { endTime: { lte: endTime, gte: startTime } },
        ],
      },
    });

    if (conflict) throw new BadRequestException("Horario no disponible");

    return this.prisma.booking.create({
      data: {
        tenantId,
        serviceId: dto.serviceId,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        startTime,
        endTime,
        notes: dto.notes,
      },
      include: { service: true },
    });
  }

  async getBookings(tenantId: string, from?: string, to?: string, serviceId?: string, status?: string) {
    const where: any = { tenantId };
    if (serviceId) where.serviceId = serviceId;
    if (status) where.status = status;
    if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = new Date(from);
      if (to) where.startTime.lte = new Date(to);
    }

    return this.prisma.booking.findMany({
      where,
      include: { service: true },
      orderBy: { startTime: "asc" },
      take: 200,
    });
  }

  async updateBookingStatus(id: string, tenantId: string, status: string) {
    const booking = await this.prisma.booking.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!booking) throw new NotFoundException("Booking not found");
    return this.prisma.booking.update({ where: { id }, data: { status } });
  }

  async getAvailability(serviceId: string, tenantId: string, date: string) {
    const service = await this.prisma.bookingService.findFirst({ where: { id: serviceId, tenantId } });
    if (!service) throw new NotFoundException("Service not found");

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const bookings = await this.prisma.booking.findMany({
      where: {
        serviceId,
        status: { not: "cancelled" },
        startTime: { gte: dayStart, lt: dayEnd },
      },
      orderBy: { startTime: "asc" },
    });

    // Generate time slots
    const slots: { time: string; available: boolean }[] = [];
    const slotDuration = service.duration;
    const workStart = 8; // 8 AM
    const workEnd = 18; // 6 PM

    for (let hour = workStart; hour < workEnd; hour++) {
      for (let min = 0; min < 60; min += slotDuration) {
        const slotStart = new Date(dayStart.getTime() + hour * 3600000 + min * 60000);
        if (slotStart <= new Date()) continue; // Skip past slots

        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
        const isBooked = bookings.some((b) => b.startTime < slotEnd && b.endTime > slotStart);

        slots.push({
          time: slotStart.toISOString(),
          available: !isBooked,
        });
      }
    }

    return { service: { name: service.name, duration: service.duration, price: Number(service.price) }, date, slots };
  }
}
