import { Injectable, Logger } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { timingSafeEqual } from "crypto";

const IP_RE = /^[0-9a-fA-F:.]{3,45}$/;
let warned = false;

function sameSecret(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * IP real del cliente. Las peticiones del proxy de sesión del panel (Vercel) llegan desde
 * IPs de Vercel; solo si traen la clave compartida SESSION_PROXY_KEY se confía en la IP
 * que informan. Sin la clave, el encabezado se ignora (no se puede falsificar la IP).
 */
export function clientIpOf(req: any): string {
  if (req.__clientIp) return req.__clientIp;
  let ip: string = req.ip || req.socket?.remoteAddress || "";
  const expected = process.env.SESSION_PROXY_KEY;
  const provided = req.headers?.["x-session-proxy-key"];
  const forwarded = req.headers?.["x-session-client-ip"];
  if (typeof provided === "string" && typeof forwarded === "string") {
    if (expected && sameSecret(provided, expected) && IP_RE.test(forwarded)) ip = forwarded;
    else if (!expected && !warned) {
      warned = true;
      new Logger("ClientIp").warn("Llegan peticiones del proxy de sesión pero SESSION_PROXY_KEY no está configurada: el rate limit usará la IP del proxy.");
    }
  }
  req.__clientIp = ip;
  return ip;
}

/** Rate limit por IP real del cliente (ver clientIpOf). */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return clientIpOf(req);
  }
}
