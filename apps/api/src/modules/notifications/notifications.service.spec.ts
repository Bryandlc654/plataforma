import { NotificationsService } from "./notifications.service";
import { sent } from "../../test-utils/expo-server-sdk.mock";

function makePrisma() {
  return {
    userTenant: { findMany: jest.fn().mockResolvedValue([{ userId: "u1" }, { userId: "u2" }]) },
    pushToken: {
      findMany: jest.fn().mockResolvedValue([
        { userId: "u1", token: "ExponentPushToken[abc]" },
        { userId: "u2", token: "token-invalido" },
      ]),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  } as any;
}

describe("NotificationsService.sendPushNotificationToTenant", () => {
  beforeEach(() => sent.splice(0));

  it("envía solo a los tokens válidos de los miembros de la empresa", async () => {
    const prisma = makePrisma();
    await new NotificationsService(prisma).sendPushNotificationToTenant("t1", "Nuevo pedido #1", "Ana · $10.00", { orderId: "o1" });

    expect(prisma.userTenant.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "t1" } }));
    expect(prisma.pushToken.findMany).toHaveBeenCalledWith({ where: { userId: { in: ["u1", "u2"] } } });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toEqual([
      expect.objectContaining({ to: "ExponentPushToken[abc]", title: "Nuevo pedido #1", body: "Ana · $10.00", data: { orderId: "o1" } }),
    ]);
  });

  it("no envía nada si la empresa no tiene miembros", async () => {
    const prisma = makePrisma();
    prisma.userTenant.findMany.mockResolvedValue([]);
    await new NotificationsService(prisma).sendPushNotificationToTenant("t1", "x", "y");
    expect(prisma.pushToken.findMany).not.toHaveBeenCalled();
    expect(sent).toHaveLength(0);
  });
});
