import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "./email.service";

type TrialStage = "day1" | "day2" | "expired" | "expired3" | "expired7";

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class EmailCampaignService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailCampaignService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  onModuleInit() {
    const enabled =
      process.env.EMAIL_CAMPAIGNS_ENABLED === "true" ||
      (process.env.EMAIL_CAMPAIGNS_ENABLED !== "false" &&
        process.env.NODE_ENV === "production");
    if (!enabled) {
      this.logger.log("Email campaigns disabled");
      return;
    }

    this.timer = setInterval(() => {
      this.run().catch((err) => this.logger.error(`Campaign run failed: ${err.message}`));
    }, 60 * 60 * 1000);

    setTimeout(() => {
      this.run().catch((err) => this.logger.error(`Campaign initial run failed: ${err.message}`));
    }, 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run() {
    if (this.running) return;
    this.running = true;
    try {
      const now = new Date();
      const activeSubs = await this.prisma.subscription.findMany({
        where: {
          status: "active",
          currentPeriodEnd: { gt: now },
        },
        select: { tenantId: true, plan: { select: { price: true } } },
      });
      const paidTenants = new Set(
        activeSubs
          .filter((sub) => Number(sub.plan?.price || 0) > 0)
          .map((sub) => sub.tenantId)
      );

      const tenants = await this.prisma.tenant.findMany({
        where: { deletedAt: null, isActive: true },
        select: {
          id: true,
          name: true,
          settings: true,
          userTenants: {
            where: { isOwner: true },
            take: 1,
            select: {
              user: { select: { email: true, firstName: true } },
            },
          },
        },
      });

      for (const tenant of tenants) {
        if (paidTenants.has(tenant.id)) continue;

        const settings = (tenant.settings as any) || {};
        const trial = settings.trial;
        if (!trial?.startedAt || !trial?.endsAt) continue;

        const start = new Date(trial.startedAt).getTime();
        const end = new Date(trial.endsAt).getTime();
        if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
        if (now.getTime() < start) continue;
        if (now.getTime() > end + 14 * DAY_MS) continue;

        const markers = settings.marketingEmails || {};
        const lastSentAt = markers.lastSentAt ? new Date(markers.lastSentAt).getTime() : 0;
        if (lastSentAt && now.getTime() - lastSentAt < 20 * 60 * 60 * 1000) continue;

        const stage = this.stageFor(now.getTime(), start, end);
        if (!stage || markers[stage]) continue;

        const owner = tenant.userTenants[0]?.user;
        if (!owner?.email) continue;

        try {
          await this.emailService.sendTrialCampaignEmail({
            to: owner.email,
            name: owner.firstName || "",
            tenantName: tenant.name,
            stage,
          });

          const nextMarkers = { ...markers, lastSentAt: now.toISOString() };
          for (const key of this.stagesUpTo(stage)) {
            nextMarkers[key] = now.toISOString();
          }

          await this.prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              settings: {
                ...settings,
                marketingEmails: nextMarkers,
              } as any,
            },
          });

          this.logger.log(`Campaign ${stage} sent to ${owner.email} (tenant ${tenant.id})`);
        } catch (err: any) {
          this.logger.warn(
            `Campaign ${stage} failed for ${owner.email}: ${err?.message || err}`
          );
        }
      }
    } finally {
      this.running = false;
    }
  }

  private stageFor(now: number, start: number, end: number): TrialStage | null {
    if (now < start) return null;
    if (now >= end) {
      if (now >= end + 7 * DAY_MS) return "expired7";
      if (now >= end + 3 * DAY_MS) return "expired3";
      return "expired";
    }
    if (now >= start + 2 * DAY_MS) return "day2";
    if (now >= start + DAY_MS) return "day1";
    return null;
  }

  private stagesUpTo(stage: TrialStage): TrialStage[] {
    const stages: TrialStage[] = ["day1", "day2", "expired", "expired3", "expired7"];
    return stages.slice(0, stages.indexOf(stage) + 1);
  }
}
