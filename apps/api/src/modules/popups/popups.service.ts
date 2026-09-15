import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const KNOWN_TEMPLATES = new Set([
  "modal-center",
  "modal-left",
  "banner-top",
  "banner-bottom",
  "slide-left",
  "slide-right",
]);

export interface PopupTrigger {
  type: "time" | "scroll" | "exit" | "immediate";
  delaySeconds?: number;
  scrollPercent?: number;
}

export interface PopupStyles {
  width?: string;
  bg?: string;
  textColor?: string;
  buttonColor?: string;
  overlayColor?: string;
  rounded?: string;
}

export interface Popup {
  id: string;
  name: string;
  enabled: boolean;
  template: string;
  trigger: PopupTrigger;
  mode: "text" | "image" | "both";
  content: {
    title?: string;
    description?: string;
    buttonText?: string;
    buttonUrl?: string;
    imageUrl?: string;
    imagePosition?: string;
  };
  styles: PopupStyles;
  closable: boolean;
  frequency: "session" | "always";
  pages: string[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PopupsService {
  constructor(private prisma: PrismaService) {}

  private genId(): string {
    return (
      typeof crypto !== "undefined" && crypto?.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    );
  }

  private async findSite(siteId: string, tenantId: string): Promise<any> {
    const site = await this.prisma.site.findFirst({
      where: { id: siteId, tenantId, deletedAt: null },
      select: { id: true, settings: true },
    });
    if (!site) throw new NotFoundException("Site not found");
    return site;
  }

  private readPopups(site: any): Popup[] {
    const settings = (site.settings as any) || {};
    return Array.isArray(settings.popups) ? (settings.popups as Popup[]) : [];
  }

  private async persist(site: any, popups: Popup[]) {
    const settings = (site.settings as any) || {};
    return this.prisma.site.update({
      where: { id: site.id },
      data: { settings: { ...settings, popups } },
    });
  }

  async list(siteId: string, tenantId: string) {
    const site = await this.findSite(siteId, tenantId);
    return { items: this.readPopups(site) };
  }

  async create(siteId: string, tenantId: string, body: any): Promise<Popup> {
    const site = await this.findSite(siteId, tenantId);
    const now = new Date().toISOString();
    const popup: Popup = {
      id: this.genId(),
      name: (typeof body?.name === "string" && body.name.trim()) || "Pop-up",
      enabled: body?.enabled === true,
      template: KNOWN_TEMPLATES.has(body?.template) ? body.template : "modal-center",
      trigger: {
        type: ["time", "scroll", "exit", "immediate"].includes(body?.trigger?.type)
          ? body.trigger.type
          : "time",
        delaySeconds:
          typeof body?.trigger?.delaySeconds === "number" && body.trigger.delaySeconds >= 0
            ? body.trigger.delaySeconds
            : 5,
        scrollPercent:
          typeof body?.trigger?.scrollPercent === "number"
            ? Math.min(Math.max(body.trigger.scrollPercent, 5), 100)
            : 50,
      },
      mode: ["text", "image", "both"].includes(body?.mode) ? body.mode : "text",
      content: {
        title:
          typeof body?.content?.title === "string" ? body.content.title.slice(0, 200) : "",
        description:
          typeof body?.content?.description === "string"
            ? body.content.description.slice(0, 2000)
            : "",
        buttonText:
          typeof body?.content?.buttonText === "string"
            ? body.content.buttonText.slice(0, 60)
            : "",
        buttonUrl:
          typeof body?.content?.buttonUrl === "string"
            ? body.content.buttonUrl.slice(0, 2000)
            : "",
        imageUrl:
          typeof body?.content?.imageUrl === "string"
            ? body.content.imageUrl.slice(0, 2000)
            : "",
        imagePosition: body?.content?.imagePosition === "right" ? "right" : "left",
      },
      styles: {
        width:
          typeof body?.styles?.width === "string" && body.styles.width.trim() ? body.styles.width : "420px",
        bg: typeof body?.styles?.bg === "string" ? body.styles.bg : "#ffffff",
        textColor: typeof body?.styles?.textColor === "string" ? body.styles.textColor : "#0f172a",
        buttonColor: typeof body?.styles?.buttonColor === "string" ? body.styles.buttonColor : "#2563EB",
        overlayColor:
          typeof body?.styles?.overlayColor === "string" ? body.styles.overlayColor : "rgba(0,0,0,.5)",
        rounded: typeof body?.styles?.rounded === "string" ? body.styles.rounded : "1rem",
      },
      closable: body?.closable !== false,
      frequency: body?.frequency === "always" ? "always" : "session",
      pages: Array.isArray(body?.pages) ? body.pages.map((p: any) => String(p).slice(0, 500)) : ["*"],
      createdAt: now,
      updatedAt: now,
    };
    const popups = this.readPopups(site);
    if (popups.length >= 10) throw new BadRequestException("Máximo 10 pop-ups por sitio");
    popups.push(popup);
    await this.persist(site, popups);
    return popup;
  }

  async update(siteId: string, tenantId: string, popupId: string, body: any): Promise<Popup> {
    const site = await this.findSite(siteId, tenantId);
    const popups = this.readPopups(site);
    const idx = popups.findIndex((p) => p.id === popupId);
    if (idx === -1) throw new NotFoundException("Popup not found");

    const current = popups[idx];
    const merged: Popup = {
      ...current,
      name: typeof body?.name === "string" && body.name.trim() ? body.name.trim() : current.name,
      enabled: typeof body?.enabled === "boolean" ? body.enabled : current.enabled,
      template: KNOWN_TEMPLATES.has(body?.template) ? body.template : current.template,
      trigger: {
        ...current.trigger,
        ...(body?.trigger && typeof body.trigger === "object" ? body.trigger : {}),
      },
      mode: ["text", "image", "both"].includes(body?.mode) ? body.mode : current.mode,
      content: { ...current.content, ...(body?.content && typeof body.content === "object" ? body.content : {}) },
      styles: { ...current.styles, ...(body?.styles && typeof body.styles === "object" ? body.styles : {}) },
      closable: typeof body?.closable === "boolean" ? body.closable : current.closable,
      frequency: body?.frequency === "always" ? "always" : body?.frequency === "session" ? "session" : current.frequency,
      pages: Array.isArray(body?.pages) ? body.pages.map((p: any) => String(p).slice(0, 500)) : current.pages,
      updatedAt: new Date().toISOString(),
    };

    // Re-validar trigger tras el merge
    if (!["time", "scroll", "exit", "immediate"].includes(merged.trigger.type)) {
      merged.trigger.type = "time";
    }
    merged.trigger.delaySeconds =
      typeof merged.trigger.delaySeconds === "number" && merged.trigger.delaySeconds >= 0
        ? merged.trigger.delaySeconds
        : 5;
    merged.trigger.scrollPercent =
      typeof merged.trigger.scrollPercent === "number"
        ? Math.min(Math.max(merged.trigger.scrollPercent, 5), 100)
        : 50;

    popups[idx] = merged;
    await this.persist(site, popups);
    return merged;
  }

  async remove(siteId: string, tenantId: string, popupId: string): Promise<{ ok: boolean }> {
    const site = await this.findSite(siteId, tenantId);
    const popups = this.readPopups(site);
    const next = popups.filter((p) => p.id !== popupId);
    if (next.length === popups.length) throw new NotFoundException("Popup not found");
    await this.persist(site, next);
    return { ok: true };
  }
}
