import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    this.apiUrl = this.configService.get<string>("whatsapp.apiUrl") || "";
    this.accessToken = this.configService.get<string>("whatsapp.accessToken") || "";
    this.phoneNumberId = this.configService.get<string>("whatsapp.phoneNumberId") || "";
  }

  async sendMessage(to: string, message: string) {
    if (!this.accessToken || !this.phoneNumberId) {
      this.logger.warn("WhatsApp not configured");
      return { sent: false, reason: "WhatsApp not configured" };
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: message },
          }),
        }
      );

      const data = await response.json();
      this.logger.log(`WhatsApp message sent to ${to}`);
      return { sent: true, data };
    } catch (error) {
      this.logger.error(`WhatsApp send failed: ${error.message}`);
      return { sent: false, reason: error.message };
    }
  }

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const ws = (tenant?.settings as any)?.whatsapp || {};
    return {
      enabled: ws.enabled ?? false,
      phoneNumber: ws.phoneNumber || "",
      message: ws.message || "Hola, quisiera más información.",
      buttonColor: ws.buttonColor || "#25D366",
      buttonPosition: ws.buttonPosition || "right",
    };
  }

  async updateSettings(tenantId: string, settings: { enabled?: boolean; phoneNumber?: string; message?: string; buttonColor?: string; buttonPosition?: string }) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const current = (tenant?.settings as any) || {};
    const whatsapp = { ...(current.whatsapp || {}), ...settings };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: { ...current, whatsapp } },
    });

    return whatsapp;
  }

  async trackClick(tenantId: string, siteId?: string) {
    await this.prisma.analyticsEvent.create({
      data: {
        tenantId,
        siteId,
        type: "whatsapp_click",
        metadata: { source: "whatsapp_button" } as any,
      },
    });
    return { tracked: true };
  }
}
