import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;
  private connectInterval: NodeJS.Timeout | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;

  constructor() {
    let url = process.env.DATABASE_URL || "";
    const params = [
      "connection_limit=5",
      "pool_timeout=10",
      "idle_timeout=10",
    ];
    for (const p of params) {
      const key = p.split("=")[0];
      if (!url.includes(key)) {
        url += url.includes("?") ? `&${p}` : `?${p}`;
      }
    }
    super({
      log: ["error", "warn"],
      datasources: { db: { url } },
      transactionOptions: {
        maxWait: 10_000,
        timeout: 30_000,
      },
    });
  }

  async onModuleInit() {
    await this.tryConnect();

    const retryEnabled =
      (process.env.DATABASE_RETRY_ON_STARTUP ?? "true").toLowerCase() === "true";
    const intervalMs = Number(process.env.DATABASE_RETRY_INTERVAL_MS ?? "5000");

    if (!this.connected && retryEnabled) {
      const every = Number.isFinite(intervalMs) && intervalMs > 500 ? intervalMs : 5000;
      this.connectInterval = setInterval(() => {
        this.tryConnect().catch(() => {});
      }, every);
    }

    // Keep alive: ping DB every 15s to prevent MySQL wait_timeout closure
    this.keepAliveInterval = setInterval(() => {
      this.$queryRaw`SELECT 1`.catch(() => {
        this.connected = false;
        this.tryConnect().catch(() => {});
      });
    }, 15_000);
  }

  async onModuleDestroy() {
    if (this.connectInterval) {
      clearInterval(this.connectInterval);
      this.connectInterval = null;
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    await this.$disconnect();
    this.logger.log("Database connection closed");
  }

  private async tryConnect(): Promise<void> {
    if (this.connected) return;
    try {
      await this.$connect();
      this.connected = true;
      if (this.connectInterval) {
        clearInterval(this.connectInterval);
        this.connectInterval = null;
      }
      this.logger.log("Database connection established");
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Unknown error";
      this.logger.error(`Database connection failed: ${msg}`);
    }
  }

  async softDelete<T extends { deletedAt: Date | null }>(
    model: string,
    id: string,
    tenantId?: string
  ) {
    const where: Record<string, unknown> = { id };
    if (tenantId) where.tenantId = tenantId;

    return (this as any)[model].update({
      where,
      data: { deletedAt: new Date() },
    });
  }
}
