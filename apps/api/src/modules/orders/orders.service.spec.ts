import { BadRequestException } from "@nestjs/common";
import { EXPIRED_ORDER_NOTE, ONLINE_ORDER_TTL_MINUTES, OrdersService } from "./orders.service";

function makePrisma(overrides: any = {}) {
  const prisma: any = {
    order: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockResolvedValue({ id: "new" }),
    },
    product: {
      findMany: jest.fn().mockResolvedValue([{ id: "p1", name: "Camisa", price: 10, stock: 5 }]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    coupon: {
      findUnique: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    ...overrides,
  };
  prisma.$transaction = jest.fn((fn: any) => fn(prisma));
  return prisma;
}

const service = (prisma: any) => new OrdersService(prisma, {} as any, {} as any);

describe("OrdersService.releaseExpiredOnlineOrders", () => {
  it("cancela pedidos en línea vencidos y devuelve stock y uso del cupón", async () => {
    const prisma = makePrisma();
    prisma.order.findMany.mockResolvedValue([{ id: "o1" }]);
    prisma.order.findUnique.mockResolvedValue({ id: "o1", tenantId: "t1", notes: null, couponCode: "DESC10", items: [{ productId: "p1", quantity: 2 }] });

    const now = new Date("2026-11-11T12:00:00Z");
    const released = await service(prisma).releaseExpiredOnlineOrders(now);

    expect(released).toBe(1);
    const where = prisma.order.findMany.mock.calls[0][0].where;
    expect(where.status).toBe("pending");
    expect(where.paymentMethod).toEqual({ in: ["paypal", "payphone"] });
    expect(where.createdAt.lt.getTime()).toBe(now.getTime() - ONLINE_ORDER_TTL_MINUTES * 60_000);
    expect(prisma.order.updateMany).toHaveBeenCalledWith({ where: { id: "o1", status: "pending" }, data: { status: "cancelled", notes: EXPIRED_ORDER_NOTE } });
    expect(prisma.product.updateMany).toHaveBeenCalledWith({ where: { id: "p1", tenantId: "t1" }, data: { stock: { increment: 2 } } });
    expect(prisma.coupon.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { usedCount: { decrement: 1 } } }));
  });

  it("no devuelve stock si otra instancia ya liberó el pedido (o se pagó)", async () => {
    const prisma = makePrisma();
    prisma.order.findMany.mockResolvedValue([{ id: "o1" }]);
    prisma.order.findUnique.mockResolvedValue({ id: "o1", tenantId: "t1", items: [{ productId: "p1", quantity: 2 }] });
    prisma.order.updateMany.mockResolvedValue({ count: 0 });

    expect(await service(prisma).releaseExpiredOnlineOrders()).toBe(0);
    expect(prisma.product.updateMany).not.toHaveBeenCalled();
  });
});

describe("OrdersService.create", () => {
  it("un cupón fijo mayor que el total no deja el pedido en negativo", async () => {
    const prisma = makePrisma();
    prisma.coupon.findUnique.mockResolvedValue({ id: "c1", isActive: true, type: "fixed", value: 100, maxUses: null, usedCount: 0 });
    await service(prisma).create("t1", { items: [{ productId: "p1", quantity: 1 }], couponCode: "GRANDE" });
    expect(prisma.order.create.mock.calls[0][0].data.totalAmount).toBe(0);
  });

  it("rechaza el cupón si se agotó entre la validación y la reserva (carrera)", async () => {
    const prisma = makePrisma();
    prisma.coupon.findUnique.mockResolvedValue({ id: "c1", isActive: true, type: "percentage", value: 10, maxUses: 1, usedCount: 0 });
    prisma.coupon.updateMany.mockResolvedValue({ count: 0 });
    await expect(service(prisma).create("t1", { items: [{ productId: "p1", quantity: 1 }], couponCode: "UNO" })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.coupon.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "c1", usedCount: { lt: 1 } } }));
  });
});
