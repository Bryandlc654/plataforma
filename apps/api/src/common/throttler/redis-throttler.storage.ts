import { Logger } from "@nestjs/common";
import { ThrottlerStorageService, type ThrottlerStorage } from "@nestjs/throttler";
import type { ThrottlerStorageRecord } from "@nestjs/throttler/dist/throttler-storage-record.interface";
import Redis from "ioredis";

/**
 * Contador atómico en Redis: suma el hit, fija la ventana la primera vez y bloquea al pasar
 * el límite. Devuelve [hits, ms hasta que vence la ventana, ms hasta que vence el bloqueo].
 */
const INCREMENT_SCRIPT = `
local hitsKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

local blockTtl = redis.call('PTTL', blockKey)
if blockTtl > 0 then
  local hits = tonumber(redis.call('GET', hitsKey) or '0')
  return { hits, redis.call('PTTL', hitsKey), blockTtl }
end

local hits = redis.call('INCR', hitsKey)
if hits == 1 or redis.call('PTTL', hitsKey) < 0 then
  redis.call('PEXPIRE', hitsKey, ttl)
end
local hitsTtl = redis.call('PTTL', hitsKey)

if hits > limit then
  redis.call('SET', blockKey, '1', 'PX', blockDuration)
  return { hits, hitsTtl, blockDuration }
end
return { hits, hitsTtl, 0 }
`;

/**
 * Almacén del rate limit compartido entre instancias (Cloud Run escala a varias).
 * Si Redis falla, cuenta en memoria de la instancia (como antes) en vez de dejar pasar todo;
 * los controles críticos (código de verificación, bloqueo de login) están en la base de datos.
 */
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private lastErrorLog = 0;
  private readonly fallback = new ThrottlerStorageService();

  constructor(private readonly redis: Redis, private readonly prefix = "throttle") {}

  async increment(key: string, ttl: number, limit: number, blockDuration: number, throttlerName: string): Promise<ThrottlerStorageRecord> {
    const base = `${this.prefix}:${throttlerName}:${key}`;
    try {
      const [hits, hitsTtl, blockTtl] = (await this.redis.eval(
        INCREMENT_SCRIPT, 2, `${base}:hits`, `${base}:block`, String(ttl), String(limit), String(blockDuration),
      )) as [number, number, number];
      return {
        totalHits: Number(hits),
        timeToExpire: Math.max(0, Math.ceil(Number(hitsTtl) / 1000)),
        isBlocked: Number(blockTtl) > 0,
        timeToBlockExpire: Math.max(0, Math.ceil(Number(blockTtl) / 1000)),
      };
    } catch (err: any) {
      if (Date.now() - this.lastErrorLog > 60_000) {
        this.lastErrorLog = Date.now();
        this.logger.error(`Redis no disponible para el rate limit; se cuenta en memoria: ${err?.message}`);
      }
      return this.fallback.increment(key, ttl, limit, blockDuration, throttlerName);
    }
  }
}

/** Crea el cliente Redis si hay configuración (REDIS_URL o REDIS_HOST); si no, null. */
export function createRedisFromEnv(): Redis | null {
  const url = process.env.REDIS_URL;
  const host = process.env.REDIS_HOST;
  if (!url && !host) return null;
  const options = { maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: false } as const;
  const client = url
    ? new Redis(url, options)
    : new Redis({ ...options, host, port: Number(process.env.REDIS_PORT || 6379), password: process.env.REDIS_PASSWORD || undefined });
  client.on("error", () => { /* se registra en increment, con límite de frecuencia */ });
  return client;
}
