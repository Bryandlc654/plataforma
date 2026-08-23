import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";

const DEFAULT_SETTINGS = {
  enabled: false,
  phoneNumber: "",
  message: "Hola, quisiera más información.",
  buttonColor: "#25D366",
  buttonPosition: "right",
};

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
      return { sent: false, reason: "WhatsApp not configured" };
    }

    const cleanTo = to.replace(/[^0-9]/g, "");
    if (cleanTo.length < 7 || cleanTo.length > 15) {
      throw new BadRequestException("Invalid phone number format");
    }

    if (!message || message.trim().length === 0) {
      throw new BadRequestException("Message cannot be empty");
    }

    try {
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanTo,
          type: "text",
          text: { body: message.trim().slice(0, 4096) },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        this.logger.error(`WhatsApp API error: ${response.status}`);
        return { sent: false, reason: `API error: ${response.status}`, data };
      }

      this.logger.log(`WhatsApp message sent to ${cleanTo}`);
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
    return { ...DEFAULT_SETTINGS, ...ws };
  }

  async updateSettings(tenantId: string, settings: { enabled?: boolean; phoneNumber?: string; message?: string; buttonColor?: string; buttonPosition?: string }) {
    const current = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const all = (current?.settings as any) || {};
    const merged = { ...all, whatsapp: { ...(all.whatsapp || {}), ...settings } };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: merged },
    });

    return merged.whatsapp;
  }

  async trackClick(tenantId: string, siteId?: string) {
    await this.prisma.analyticsEvent.create({
      data: {
        tenantId,
        siteId: siteId || undefined,
        type: "whatsapp_click",
        metadata: { source: "whatsapp_button" } as any,
      },
    });
    return { tracked: true };
  }
}
