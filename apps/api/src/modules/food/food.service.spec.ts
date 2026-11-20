import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { FoodService } from "./food.service";
import { defaultFoodSettings, normalizeFoodSettings, normalizeProductExtras, openStatus } from "./food-settings";

const allDay = () => {
  const s = defaultFoodSettings();
  s.timezone = "UTC";
  s.hours = Array.from({ length: 7 }, () => ({ open: true, from: "00:00", to: "23:59" }));
  return s;
};

function makePrisma(settings = allDay(), products: any[] = []) {
  const prisma: any = {
    tenant: {
      findFirst: jest.fn().mockResolvedValue({ id: "t1", name: "Brasa", slug: "brasa", logoUrl: null, product: "food", settings: { food: settings } }),
    },
    product: { findMany: jest.fn().mockResolvedValue(products) },
    order: {
      aggregate: jest.fn().mockResolvedValue({ _max: { orderNumber: 41 } }),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: "o1", ...data })),
    },
  };
  prisma.$transaction = jest.fn((fn: any) => fn(prisma));
  return prisma;
}

const notifications = { sendPushNotificationToTenant: jest.fn().mockResolvedValue(undefined) };
const service = (prisma: any) => new FoodService(prisma, notifications as any);

const burger = {
  id: "p1",
  name: "Burger",
  price: 8,
  isActive: true,
  images: [],
  variants: {
    optionGroups: [
      { id: "pan", name: "¿Con o sin pan?", required: true, max: 1, options: [{ id: "con", name: "Con pan", price: 0 }, { id: "sin", name: "Sin pan", price: 0 }] },
      { id: "extra", name: "Extras", required: false, max: 2, options: [{ id: "bacon", name: "Tocino", price: 1.5 }, { id: "huevo", name: "Huevo", price: 1 }] },
    ],
  },
};

const order = (over: any = {}) => ({
  customerName: "Ana",
  customerPhone: "0991234567",
  fulfillment: "pickup",
  paymentMethod: "cash",
  items: [{ productId: "p1", quantity: 2, options: [{ groupId: "pan", optionIds: ["con"] }, { groupId: "extra", optionIds: ["bacon"] }] }],
  ...over,
});

describe("openStatus", () => {
  const s = defaultFoodSettings();
  s.timezone = "UTC";
  s.hours = Array.from({ length: 7 }, () => ({ open: true, from: "12:00", to: "22:00" }));

  it("abierto dentro del horario y cerrado antes de abrir", () => {
    expect(openStatus(s, new Date("2026-11-20T15:00:00Z")).isOpen).toBe(true);
    const early = openStatus(s, new Date("2026-11-20T09:00:00Z"));
    expect(early.isOpen).toBe(false);
    expect(early.label).toContain("12:00");
  });

  it("considera turnos que cruzan la medianoche", () => {
    const late = { ...s, hours: s.hours.map(() => ({ open: true, from: "18:00", to: "02:00" })) };
    expect(openStatus(late, new Date("2026-11-20T01:00:00Z")).isOpen).toBe(true);
    expect(openStatus(late, new Date("2026-11-20T03:00:00Z")).isOpen).toBe(false);
  });
});

describe("normalización", () => {
  it("descarta valores inválidos de la configuración", () => {
    const n = normalizeFoodSettings({ whatsapp: "+593 99-123", accentColor: "red", paymentMethods: ["cash", "bitcoin"], coverUrl: "javascript:alert(1)" });
    expect(n.whatsapp).toBe("59399123");
    expect(n.accentColor).toBe("#F97316");
    expect(n.paymentMethods).toEqual(["cash"]);
    expect(n.coverUrl).toBe("");
  });

  it("limita el máximo de un grupo a sus opciones y quita grupos vacíos", () => {
    const e = normalizeProductExtras({ optionGroups: [{ name: "Salsa", max: 9, options: [{ name: "BBQ" }] }, { name: "Vacío", options: [] }] });
    expect(e.optionGroups).toHaveLength(1);
    expect(e.optionGroups[0].max).toBe(1);
  });
});

describe("FoodService.createPublicOrder", () => {
  beforeEach(() => notifications.sendPushNotificationToTenant.mockClear());

  it("calcula el precio en el servidor con las opciones y numera el pedido", async () => {
    const prisma = makePrisma(allDay(), [burger]);
    const res = await service(prisma).createPublicOrder("brasa", order({ items: [{ ...order().items[0], price: 0.01 }] }));
    const data = prisma.order.create.mock.calls[0][0].data;
    expect(data.orderNumber).toBe(42);
    expect(data.source).toBe("food");
    expect(data.items.create[0]).toMatchObject({ price: 9.5, total: 19, quantity: 2 });
    expect(data.totalAmount).toBe(19);
    expect(res.number).toBe(42);
    expect(notifications.sendPushNotificationToTenant).toHaveBeenCalled();
  });

  it("suma el envío en delivery y exige dirección", async () => {
    const s = allDay();
    s.delivery = { enabled: true, fee: 2, minOrder: 0, note: "" };
    s.whatsapp = "593991234567";
    const prisma = makePrisma(s, [burger]);
    await expect(service(prisma).createPublicOrder("brasa", order({ fulfillment: "delivery" }))).rejects.toThrow(BadRequestException);
    const res = await service(prisma).createPublicOrder("brasa", order({ fulfillment: "delivery", address: "Av. Siempre Viva 123" }));
    expect(prisma.order.create.mock.calls[0][0].data.totalAmount).toBe(21);
    expect(res.whatsappUrl).toContain("wa.me/593991234567");
  });

  it("rechaza si falta una opción obligatoria o se pasa del máximo", async () => {
    const prisma = makePrisma(allDay(), [burger]);
    await expect(service(prisma).createPublicOrder("brasa", order({ items: [{ productId: "p1", quantity: 1, options: [] }] }))).rejects.toThrow(/pan/);
    await expect(
      service(prisma).createPublicOrder("brasa", order({ items: [{ productId: "p1", quantity: 1, options: [{ groupId: "pan", optionIds: ["con", "sin"] }] }] }))
    ).rejects.toThrow(/hasta 1/);
  });

  it("no recibe pedidos fuera de horario salvo que se permita", async () => {
    const s = allDay();
    s.hours = s.hours.map(() => ({ open: false, from: "12:00", to: "22:00" }));
    await expect(service(makePrisma(s, [burger])).createPublicOrder("brasa", order())).rejects.toThrow(/Cerrado/);
    s.ordersWhenClosed = true;
    await expect(service(makePrisma(s, [burger])).createPublicOrder("brasa", order())).resolves.toMatchObject({ number: 42 });
  });

  it("rechaza platos agotados", async () => {
    const prisma = makePrisma(allDay(), [{ ...burger, variants: { ...burger.variants, soldOut: true } }]);
    await expect(service(prisma).createPublicOrder("brasa", order())).rejects.toThrow(/agotado/);
  });
});

describe("FoodService.assertFood", () => {
  it("bloquea el panel de Food a empresas de Jeaz Shop", async () => {
    const prisma = makePrisma();
    prisma.tenant.findFirst.mockResolvedValue({ id: "t1", product: "shop", settings: {} });
    await expect(service(prisma).getMenu("t1")).rejects.toThrow(ForbiddenException);
  });
});
