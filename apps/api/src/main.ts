// Fix BigInt JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { WinstonModule } from "nest-winston";
import { winstonConfig } from "./config/winston.config";
import * as express from "express";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
    rawBody: true,
  });

  app.set("trust proxy", 1);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3001);

  // Fail fast en producción si faltan secretos críticos (evita defaults débiles).
  if (configService.get<string>("nodeEnv") === "production") {
    const jwtSecret = configService.get<string>("jwt.secret");
    const refreshSecret = configService.get<string>("jwt.refreshSecret");
    if (!jwtSecret || jwtSecret === "dev-secret-change-me") {
      throw new Error("JWT_SECRET no configurado en producción");
    }
    if (!refreshSecret || refreshSecret === "dev-refresh-secret-change-me") {
      throw new Error("JWT_REFRESH_SECRET no configurado en producción");
    }
  }

  // CORS con whitelist real (admite entradas exactas y comodines *.dominio).
  const configuredOrigins = String(configService.get<string>("cors.origin") || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const extraDevOrigins = ["http://localhost:3000", "http://localhost:3001"];
  const corsAllowlist = Array.from(new Set([...configuredOrigins, ...extraDevOrigins]));

  const isOriginAllowed = (origin: string | undefined): boolean => {
    if (!origin) return true; // peticiones server-to-server / curl
    if (corsAllowlist.includes("*")) return true;
    if (corsAllowlist.includes(origin)) return true;
    try {
      const host = new URL(origin).hostname;
      return corsAllowlist.some((entry) => {
        if (entry.startsWith("*.")) {
          const base = entry.slice(2);
          return host === base || host.endsWith(`.${base}`);
        }
        return false;
      });
    } catch {
      return false;
    }
  };

  // CORS must be the first middleware.
  // Orígenes de plataforma (allowlist) obtienen credenciales; los dominios de
  // sitios de clientes pueden consumir endpoints públicos cross-origin, pero
  // SIN credenciales. Esto evita el patrón peligroso "cualquier origen + credenciales".
  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    if (origin) {
      const allowed = isOriginAllowed(origin);
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      if (allowed) res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Tenant-Id, X-CSRF-Token, X-Billing-Signature"
      );
      res.setHeader("Access-Control-Max-Age", "86400");
    }
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://www.paypal.com", "https://www.sandbox.paypal.com", "https://cdn.payphonetodoesposible.com", "https://pay.payphonetodoesposible.com", "https://songbird.cardinalcommerce.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.payphonetodoesposible.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "https://www.paypal.com", "https://www.sandbox.paypal.com", "https://cdn.payphonetodoesposible.com"],
        connectSrc: ["'self'", "https:", "https://www.paypal.com", "https://www.sandbox.paypal.com", "https://api-m.paypal.com", "https://api-m.sandbox.paypal.com", "https://paymentbox.payphonetodoesposible.com", "https://cdn.payphonetodoesposible.com", "https://api.payphonetodoesposible.com", "https://pay.payphonetodoesposible.com"],
        frameSrc: ["'self'", "https://www.paypal.com", "https://www.sandbox.paypal.com", "https://paymentbox.payphonetodoesposible.com", "https://pay.payphonetodoesposible.com", "https://songbird.cardinalcommerce.com", "https://payments.cardinalcommerce.com"],
        objectSrc: ["'none'"],
      },
    },
  }));

  app.setGlobalPrefix("api");

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // Serve uploaded files statically
  const uploadsPath = join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsPath, {
    maxAge: "7d",
    setHeaders: (res) => { res.setHeader("Access-Control-Allow-Origin", "*"); },
  }));

  app.use(compression());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor()
  );

  const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];
  for (const signal of signals) {
    process.on(signal, async () => {
      await app.close();
      process.exit(0);
    });
  }

  await app.listen(port);
}

void bootstrap();
