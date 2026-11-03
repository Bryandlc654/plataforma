import { ForbiddenException, Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MediaService } from "../media/media.service";

export interface PlatformBranding {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export interface PlatformPaypalConfig {
  enabled: boolean;
  mode: "sandbox" | "live";
  clientId: string;
  secret: string;
}

export interface PlatformPaymentsConfig {
  paypal: PlatformPaypalConfig;
}

const BRANDING_KEY = "branding";
const PAYMENTS_KEY = "payments";

const DEFAULT_BRANDING: PlatformBranding = {
  logoUrl: null,
  primaryColor: "#201b51",
  secondaryColor: "#f29200",
};

const DEFAULT_PAYMENTS: PlatformPaymentsConfig = {
  paypal: {
    enabled: false,
    mode: "sandbox",
    clientId: "",
    secret: "",
  },
};


const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

@Injectable()
export class PlatformService {
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService
  ) {}

  async getBranding(): Promise<PlatformBranding> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key: BRANDING_KEY } });
    const value = (row?.value as Partial<PlatformBranding> | null) || {};
    return {
      logoUrl: typeof value.logoUrl === "string" && value.logoUrl.trim() ? value.logoUrl : null,
      primaryColor: this.normalizeColor(value.primaryColor, DEFAULT_BRANDING.primaryColor),
      secondaryColor: this.normalizeColor(value.secondaryColor, DEFAULT_BRANDING.secondaryColor),
    };
  }

  async updateBranding(user: any, input: Partial<PlatformBranding>): Promise<PlatformBranding> {
    this.assertEditor(user);
    const current = await this.getBranding();
    const next: PlatformBranding = {
      logoUrl:
        input.logoUrl === null
          ? null
          : typeof input.logoUrl === "string" && input.logoUrl.trim()
            ? input.logoUrl.trim()
            : current.logoUrl,
      primaryColor: this.normalizeColor(input.primaryColor, current.primaryColor),
      secondaryColor: this.normalizeColor(input.secondaryColor, current.secondaryColor),
    };

    if (input.primaryColor && !HEX_COLOR.test(input.primaryColor)) {
      throw new BadRequestException("El color primario debe tener formato hexadecimal (#RRGGBB)");
    }
    if (input.secondaryColor && !HEX_COLOR.test(input.secondaryColor)) {
      throw new BadRequestException("El color secundario debe tener formato hexadecimal (#RRGGBB)");
    }

    await this.prisma.platformSetting.upsert({
      where: { key: BRANDING_KEY },
      update: { value: next as any },
      create: { key: BRANDING_KEY, value: next as any },
    });

    return next;
  }

  async uploadLogo(user: any, file: Express.Multer.File): Promise<PlatformBranding> {
    this.assertEditor(user);
    if (!file) throw new BadRequestException("Selecciona una imagen para el logo");
    const { url } = await this.mediaService.uploadPlatformAsset(file);
    return this.updateBranding(user, { logoUrl: url });
  }

  async getPaymentsConfig(): Promise<PlatformPaymentsConfig> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key: PAYMENTS_KEY } });
    const value = (row?.value as any)?.paypal || {};
    return {
      paypal: {
        enabled: value.enabled === true,
        mode: value.mode === "live" ? "live" : "sandbox",
        clientId: typeof value.clientId === "string" ? value.clientId.trim() : "",
        secret: typeof value.secret === "string" ? value.secret.trim() : "",
      },
    };
  }

  async getPaymentsPublic(user: any) {
    this.assertEditor(user);
    const config = await this.getPaymentsConfig();
    return {
      paypal: {
        enabled: config.paypal.enabled,
        mode: config.paypal.mode,
        clientId: config.paypal.clientId,
        hasSecret: !!config.paypal.secret,
      },
    };
  }

  async updatePayments(user: any, input: any) {
    this.assertEditor(user);
    const current = await this.getPaymentsConfig();
    const incoming = input?.paypal || {};
    const next: PlatformPaymentsConfig = {
      paypal: {
        enabled: incoming.enabled === true,
        mode: incoming.mode === "live" ? "live" : "sandbox",
        clientId:
          typeof incoming.clientId === "string" && incoming.clientId.trim()
            ? incoming.clientId.trim()
            : current.paypal.clientId,
        secret:
          typeof incoming.secret === "string" && incoming.secret.trim()
            ? incoming.secret.trim()
            : current.paypal.secret,
      },
    };

    if (next.paypal.enabled && (!next.paypal.clientId || !next.paypal.secret)) {
      throw new BadRequestException("Para activar PayPal necesitas Client ID y Secret");
    }

    await this.prisma.platformSetting.upsert({
      where: { key: PAYMENTS_KEY },
      update: { value: next as any },
      create: { key: PAYMENTS_KEY, value: next as any },
    });

    return {
      paypal: {
        enabled: next.paypal.enabled,
        mode: next.paypal.mode,
        clientId: next.paypal.clientId,
        hasSecret: !!next.paypal.secret,
      },
    };
  }

  async getPaypalCredentials(): Promise<PlatformPaypalConfig> {
    const config = await this.getPaymentsConfig();
    return config.paypal;
  }

  private assertEditor(user: any) {
    const roles: string[] = user?.roles || [];
    if (!roles.includes("super_admin") && !roles.includes("platform_admin")) {
      throw new ForbiddenException("Solo el superadmin o el admin de plataforma pueden realizar esta acción");
    }
  }

  private normalizeColor(value: unknown, fallback: string): string {
    return typeof value === "string" && HEX_COLOR.test(value) ? value.toLowerCase() : fallback;
  }
}
