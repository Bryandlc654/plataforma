import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.coupon.create({ data: { ...dto, tenantId } });
  }

  async findAll(tenantId: string) {
    return this.prisma.coupon.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }

  async validate(tenantId: string, code: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { tenantId_code: { tenantId, code } } });
    if (!coupon) throw new NotFoundException("Cupón no encontrado");
    if (!coupon.isActive) throw new BadRequestException("Cupón inactivo");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException("Cupón expirado");
    if (coupon.startsAt && coupon.startsAt > new Date()) throw new BadRequestException("Cupón aún no válido");
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException("Cupón agotado");
    return coupon;
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Coupon not found");
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Coupon not found");
    await this.prisma.coupon.delete({ where: { id } });
    return { deleted: true };
  }
}
