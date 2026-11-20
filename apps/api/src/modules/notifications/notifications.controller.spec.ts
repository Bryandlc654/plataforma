import { NotificationsController } from "./notifications.controller";

describe("NotificationsController", () => {
  const service = {
    registerToken: jest.fn().mockResolvedValue({ success: true }),
    unregisterToken: jest.fn().mockResolvedValue({ success: true }),
  };
  const controller = new NotificationsController(service as any);

  it("registra el token a nombre del usuario de la sesión", async () => {
    await controller.registerToken({ id: "u1" }, "ExponentPushToken[abc]", "ios");
    expect(service.registerToken).toHaveBeenCalledWith("u1", "ExponentPushToken[abc]", "ios");
  });

  it("solo borra tokens del usuario de la sesión", async () => {
    await controller.unregisterToken({ id: "u1" }, "ExponentPushToken[abc]");
    expect(service.unregisterToken).toHaveBeenCalledWith("u1", "ExponentPushToken[abc]");
  });
});
