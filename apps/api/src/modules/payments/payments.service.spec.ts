import { BadRequestException } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

/** Respuesta mínima de fetch. */
const res = (ok: boolean, json: any) => ({ ok, status: ok ? 200 : 400, json: async () => json }) as any;

const paypal = { enabled: true, mode: "sandbox", clientId: "id", secret: "s" };
const payphone = { enabled: true, mode: "sandbox", token: "t", storeId: "st" };

function setup(order: any) {
  const prisma: any = {
    order: {
      findFirst: jest.fn().mockResolvedValue(order),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const service = new PaymentsService(prisma, {} as any);
  const s = service as any;
  s.loadPaymentGateway = jest.fn().mockResolvedValue({ providers: { paypal, payphone } });
  s.paypalCredentials = jest.fn().mockResolvedValue(undefined);
  s.payphoneCredentials = jest.fn().mockResolvedValue(undefined);
  s.getAccessToken = jest.fn().mockResolvedValue("token");
  return { service, prisma };
}

const capture = (value: string, opts: { reference?: string; currency?: string; status?: string } = {}) => ({
  id: "PP-1",
  status: "COMPLETED",
  purchase_units: [{
    reference_id: opts.reference ?? "order-1",
    payments: { captures: [{ id: "CAP-1", status: opts.status ?? "COMPLETED", amount: { value, currency_code: opts.currency ?? "USD" } }] },
  }],
});

describe("PaymentsService.capturePaypalOrder", () => {
  const paypalOrder = { id: "order-1", tenantId: "t1", status: "pending", paymentMethod: "paypal", paymentReference: "PP-1", totalAmount: "500.00", currency: "USD" };
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
  });

  it("rechaza capturar contra un pedido contra entrega (sin referencia de PayPal)", async () => {
    const { service, prisma } = setup({ ...paypalOrder, paymentMethod: "cod", paymentReference: null });
    await expect(service.capturePaypalOrder("t1", "PP-BARATO", "order-1")).rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("rechaza una orden de PayPal distinta a la del pedido", async () => {
    const { service, prisma } = setup(paypalOrder);
    await expect(service.capturePaypalOrder("t1", "PP-OTRA", "order-1")).rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("reembolsa y no marca pagado si el monto capturado no coincide", async () => {
    const { service, prisma } = setup(paypalOrder);
    fetchMock.mockResolvedValueOnce(res(true, capture("1.00"))).mockResolvedValueOnce(res(true, {}));
    await expect(service.capturePaypalOrder("t1", "PP-1", "order-1")).rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("/v2/payments/captures/CAP-1/refund");
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("reembolsa si la moneda o la referencia no coinciden", async () => {
    for (const bad of [capture("500.00", { currency: "EUR" }), capture("500.00", { reference: "otro-pedido" })]) {
      const { service, prisma } = setup(paypalOrder);
      fetchMock.mockReset();
      fetchMock.mockResolvedValueOnce(res(true, bad)).mockResolvedValueOnce(res(true, {}));
      await expect(service.capturePaypalOrder("t1", "PP-1", "order-1")).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.order.update).not.toHaveBeenCalled();
    }
  });

  it("marca pagado cuando referencia, monto y moneda coinciden", async () => {
    const { service, prisma } = setup(paypalOrder);
    fetchMock.mockResolvedValueOnce(res(true, capture("500.00")));
    const out = await service.capturePaypalOrder("t1", "PP-1", "order-1");
    expect(out.status).toBe("paid");
    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "paid" }) }));
  });

  it("es idempotente si el pedido ya estaba pagado", async () => {
    const { service, prisma } = setup({ ...paypalOrder, status: "paid" });
    const out: any = await service.capturePaypalOrder("t1", "PP-1", "order-1");
    expect(out.alreadyPaid).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });
});

describe("PaymentsService.confirmPayphone", () => {
  const order = { id: "order-2", tenantId: "t1", status: "pending", paymentMethod: "payphone", paymentReference: "order-2", totalAmount: "20.00" };

  beforeEach(() => { (global as any).fetch = jest.fn(); });

  it("rechaza una transacción aprobada que pertenece a otro pedido", async () => {
    const { service, prisma } = setup(order);
    (global as any).fetch.mockResolvedValueOnce(res(true, { statusCode: 3, transactionStatus: "Approved", amount: 2000, clientTransactionId: "otro" }));
    await expect(service.confirmPayphone("t1", 99, "order-2")).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("rechaza si el monto no coincide", async () => {
    const { service, prisma } = setup(order);
    (global as any).fetch.mockResolvedValueOnce(res(true, { statusCode: 3, transactionStatus: "Approved", amount: 100, clientTransactionId: "order-2" }));
    await expect(service.confirmPayphone("t1", 99, "order-2")).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("marca pagado cuando la transacción y el monto coinciden", async () => {
    const { service, prisma } = setup(order);
    (global as any).fetch.mockResolvedValueOnce(res(true, { statusCode: 3, transactionStatus: "Approved", amount: 2000, clientTransactionId: "order-2", transactionId: 99 }));
    const out: any = await service.confirmPayphone("t1", 99, "order-2");
    expect(out.status).toBe("paid");
    expect(prisma.order.update).toHaveBeenCalled();
  });
});
