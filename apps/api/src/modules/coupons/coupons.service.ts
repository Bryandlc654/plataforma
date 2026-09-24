import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const COUPON_FIELDS = [
  "code", "type", "value", "minAmount", "maxUses", "startsAt", "expiresAt", "isActive",
] as const;

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  private pick(data: any): any {
    const out: any = {};
    for (const key of COUPON_FIELDS) {
      if (data && data[key] !== undefined) out[key] = data[key];
    }
    return out;
  }

  async create(tenantId: string, dto: any) {
    const data = this.pick(dto);
    const code = String(data.code || "").trim().toUpperCase();
    if (!code) throw new BadRequestException("El código es obligatorio");
    data.code = code;
    return this.prisma.coupon.create({ data: { ...data, tenantId } });
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

  private async assertOwned(id: string, tenantId: string) {
    const existing = await this.prisma.coupon.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!existing) throw new NotFoundException("Coupon not found");
  }

  async update(id: string, tenantId: string, data: any) {
    await this.assertOwned(id, tenantId);
    const clean = this.pick(data);
    if (clean.code !== undefined) clean.code = String(clean.code).trim().toUpperCase();
    return this.prisma.coupon.update({ where: { id }, data: clean });
  }

  async remove(id: string, tenantId: string) {
    await this.assertOwned(id, tenantId);
    await this.prisma.coupon.delete({ where: { id } });
    return { deleted: true };
  }
}
