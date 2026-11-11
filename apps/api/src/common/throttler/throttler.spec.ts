import { RedisThrottlerStorage } from "./redis-throttler.storage";
import { clientIpOf } from "./client-ip";

describe("RedisThrottlerStorage", () => {
  it("traduce la respuesta de Redis (ms) al registro del throttler (s)", async () => {
    const redis: any = { eval: jest.fn().mockResolvedValue([6, 42_000, 60_000]) };
    const rec = await new RedisThrottlerStorage(redis).increment("1.2.3.4", 60_000, 5, 60_000, "default");
    expect(rec).toEqual({ totalHits: 6, timeToExpire: 42, isBlocked: true, timeToBlockExpire: 60 });
    const [, keys, hitsKey, blockKey, ttl, limit] = redis.eval.mock.calls[0];
    expect(keys).toBe(2);
    expect(hitsKey).toBe("throttle:default:1.2.3.4:hits");
    expect(blockKey).toBe("throttle:default:1.2.3.4:block");
    expect([ttl, limit]).toEqual(["60000", "5"]);
  });

  it("si Redis falla, sigue limitando con el conteo en memoria (no deja pasar todo)", async () => {
    const redis: any = { eval: jest.fn().mockRejectedValue(new Error("ECONNREFUSED")) };
    const storage = new RedisThrottlerStorage(redis);
    let rec: any;
    for (let i = 0; i < 6; i++) rec = await storage.increment("k", 60_000, 5, 60_000, "default");
    expect(rec.totalHits).toBe(6);
    expect(rec.isBlocked).toBe(true);
  });
});

describe("clientIpOf", () => {
  const env = process.env.SESSION_PROXY_KEY;
  afterEach(() => { process.env.SESSION_PROXY_KEY = env; });

  it("usa la IP informada por el proxy solo con la clave correcta", () => {
    process.env.SESSION_PROXY_KEY = "secreto";
    expect(clientIpOf({ ip: "10.0.0.1", headers: { "x-session-proxy-key": "secreto", "x-session-client-ip": "200.1.2.3" } })).toBe("200.1.2.3");
    expect(clientIpOf({ ip: "10.0.0.1", headers: { "x-session-proxy-key": "otro", "x-session-client-ip": "200.1.2.3" } })).toBe("10.0.0.1");
    expect(clientIpOf({ ip: "10.0.0.1", headers: { "x-session-proxy-key": "secreto", "x-session-client-ip": "no-es-ip<script>" } })).toBe("10.0.0.1");
  });

  it("sin clave configurada ignora el encabezado (no se puede falsificar la IP)", () => {
    delete process.env.SESSION_PROXY_KEY;
    expect(clientIpOf({ ip: "10.0.0.1", headers: { "x-session-proxy-key": "", "x-session-client-ip": "200.1.2.3" } })).toBe("10.0.0.1");
  });
});
