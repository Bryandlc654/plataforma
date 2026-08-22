import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  private getCookie(req: Request, name: string): string | null {
    const raw = req.headers.cookie;
    if (!raw) return null;
    const parts = raw.split(";").map((p) => p.trim());
    for (const part of parts) {
      if (!part) continue;
      const idx = part.indexOf("=");
      if (idx < 0) continue;
      const k = part.slice(0, idx).trim();
      if (k !== name) continue;
      const v = part.slice(idx + 1);
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    }
    return null;
  }

  private base64Url(input: Buffer): string {
    return input.toString("base64url");
  }

  private signCsrf(payload: string, secret: string): string {
    const sig = crypto.createHmac("sha256", secret).update(payload).digest();
    return this.base64Url(sig);
  }

  private getCsrfSecret(): string {
    return (
      process.env.CSRF_SECRET ||
      process.env.JWT_SECRET ||
      "dev-secret-change-me"
    );
  }

  private createCsrfToken(): string {
    const ts = Date.now().toString();
    const nonce = this.base64Url(crypto.randomBytes(16));
    const payload = `${ts}.${nonce}`;
    const sig = this.signCsrf(payload, this.getCsrfSecret());
    return `${payload}.${sig}`;
  }

  private isValidCsrfToken(token: string): boolean {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [tsRaw, nonce, sig] = parts;
    const ts = Number(tsRaw);
    if (!Number.isFinite(ts) || ts <= 0) return false;
    if (!nonce || !sig) return false;

    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - ts > maxAgeMs) return false;

    const payload = `${tsRaw}.${nonce}`;
    const expected = this.signCsrf(payload, this.getCsrfSecret());
    if (expected.length !== sig.length) return false;

    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
    } catch {
      return false;
    }
  }

  private isCsrfExempt(req: Request): boolean {
    const url = (req.originalUrl || req.url || "").toString();
    if (!url.startsWith("/api/")) return true;
    // All auth endpoints are exempt (they handle their own security via credentials)
    if (url.startsWith("/api/v1/auth/")) return true;
    // Public analytics tracking
    if (url.startsWith("/api/v1/analytics/track")) return true;
    // Requests with Bearer token are inherently CSRF-safe (token in header, not cookie)
    const auth = req.headers["authorization"];
    const hasBearer = auth && String(auth).startsWith("Bearer ");
    if (hasBearer) return true;
    return false;
  }

  private extractBearer(req: Request): string | null {
    const auth = req.headers["authorization"];
    if (!auth) return null;
    const s = Array.isArray(auth) ? auth[0] : String(auth);
    if (!s.startsWith("Bearer ")) return null;
    return s.slice(7);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers["origin"];
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization,X-Tenant-Id,X-CSRF-Token"
      );
    }

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    const tenantId = req.headers["x-tenant-id"];

    if (tenantId) {
      req["tenantId"] = tenantId;
    }

    const csrfCookieName = "csrf_token";
    const csrfHeaderName = "x-csrf-token";
    const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

    let csrfToken = this.getCookie(req, csrfCookieName);
    if (!csrfToken || !this.isValidCsrfToken(csrfToken)) {
      csrfToken = this.createCsrfToken();
      const isProd = process.env.NODE_ENV === "production";
      res.cookie(csrfCookieName, csrfToken, {
        httpOnly: false,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    if (!safeMethods.has(req.method) && !this.isCsrfExempt(req)) {
      const bearerToken = this.extractBearer(req);
      // If request has a Bearer token (authenticated API call), CSRF is not a concern
      if (bearerToken) {
        return next();
      }
      // If request has no session cookie either, let the JWT guard return 401
      const hasSessionCookie = this.getCookie(req, "access_token") || this.getCookie(req, "refresh_token");
      if (!hasSessionCookie) {
        return next();
      }

      const headerRaw = req.headers[csrfHeaderName] as any;
      const headerToken = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw;

      if (
        !headerToken ||
        typeof headerToken !== "string" ||
        headerToken !== csrfToken ||
        !this.isValidCsrfToken(headerToken)
      ) {
        res.setHeader("Access-Control-Allow-Origin", req.headers["origin"] || "*");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.status(403).json({ message: "CSRF token invalid or missing" });
        return;
      }
    }

    next();
  }
}
