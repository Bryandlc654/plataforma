import { ForbiddenException, Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MediaService } from "../media/media.service";

export interface PlatformBranding {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

const BRANDING_KEY = "branding";

const DEFAULT_BRANDING: PlatformBranding = {
  logoUrl: null,
  primaryColor: "#201b51",
  secondaryColor: "#f29200",
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

  private assertEditor(user: any) {
    const roles: string[] = user?.roles || [];
    if (!roles.includes("super_admin") && !roles.includes("platform_admin")) {
      throw new ForbiddenException("Solo el superadmin o el admin de plataforma pueden cambiar la marca");
    }
  }

  private normalizeColor(value: unknown, fallback: string): string {
    return typeof value === "string" && HEX_COLOR.test(value) ? value.toLowerCase() : fallback;
  }
}
