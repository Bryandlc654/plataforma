import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { VercelService } from "./vercel.service";
import { resolvePublicSiteUrl } from "../publishing/seo-helpers";
import { join } from "path";
import { existsSync, unlinkSync } from "fs";
import * as dns from "dns";

const RESERVED_PATHS = ["api", "dashboard", "login", "register", "admin", "templates", "auth", "public", "static", "images", "fonts", "s"];

@Injectable()
export class SitesService {
  constructor(
    private prisma: PrismaService,
    private vercel: VercelService,
  ) {}

  async create(tenantId: string, dto: { name: string; templateId: string; subdomain?: string; domain?: string }) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, isActive: true, maxSites: true, plan: { select: { slug: true, price: true } } },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");
    if (!tenant.isActive) throw new ForbiddenException("Tenant is suspended");

    const siteCount = await this.prisma.site.count({ where: { tenantId, deletedAt: null } });
    if (siteCount >= tenant.maxSites) throw new ForbiddenException("Site limit reached for your plan");

    let subdomain: string;
    if (dto.subdomain) {
      subdomain = dto.subdomain
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/^-|-$/g, "")
        .substring(0, 63);

      if (subdomain.length < 3) throw new ForbiddenException("Subdomain must be at least 3 characters");
      if (RESERVED_PATHS.includes(subdomain)) throw new ConflictException(`El dominio "${subdomain}" es reservado y no puede ser usado.`);

      const existing = await this.prisma.site.findUnique({ where: { subdomain }, select: { id: true } });
      if (existing) throw new ConflictException(`El dominio "${subdomain}" ya está siendo utilizado por otro usuario.`);
    } else {
      let base = dto.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 40);

      if (!base || RESERVED_PATHS.includes(base)) base = "site";
      subdomain = `${base}-${Math.random().toString(36).substring(2, 6)}`;

      const existing = await this.prisma.site.findUnique({ where: { subdomain }, select: { id: true } });
      if (existing) subdomain = `${base}-${Math.random().toString(36).substring(2, 8)}`;
    }

    if (!dto.templateId) throw new BadRequestException("Template is required to create a site");

    const template = await this.prisma.template.findUnique({
      where: { id: dto.templateId },
      select: { id: true, isActive: true, isPremium: true },
    });
    if (!template) throw new NotFoundException("Template not found");
    if (!template.isActive) throw new ForbiddenException("Template is not available");

    if (template.isPremium) {
      const hasPaidPlan = tenant.plan && tenant.plan.slug !== "free" && Number(tenant.plan.price) > 0;
      const activeSub = await this.prisma.subscription.findFirst({
        where: { tenantId, status: "active" },
        select: { id: true },
      });
      if (!hasPaidPlan && !activeSub) throw new ForbiddenException("This template requires a paid plan");
    }

    if (dto.domain) {
      const cleanDomain = dto.domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "").trim();
      const reserved = ["build.icebergup.com", "backplat.nextboostbusiness", "backplat.nextboostperu.com", "apiplat.nextboostperu.com"];
      if (reserved.includes(cleanDomain)) throw new ConflictException("Este dominio está reservado para la plataforma.");
      if (cleanDomain.endsWith(".build.icebergup.com") || cleanDomain.endsWith(".vercel.app")) throw new ConflictException("No puedes usar un subdominio de la plataforma como dominio de sitio.");
      const existingDomain = await this.prisma.site.findUnique({ where: { domain: cleanDomain }, select: { id: true } });
      if (existingDomain) throw new ConflictException(`Domain "${cleanDomain}" is already in use`);
      dto.domain = cleanDomain;
    }

    const site = await this.prisma.$transaction(async (tx) => {
      const site = await tx.site.create({
        data: {
          tenantId,
          name: dto.name,
          subdomain,
          domain: dto.domain,
          templateId: dto.templateId,
          settings: {},
          isPublished: true,
          publishedAt: new Date(),
        },
        select: { id: true, tenantId: true, subdomain: true, domain: true },
      });

      const template = await tx.template.findUnique({
        where: { id: dto.templateId },
        select: {
          pages: {
            select: {
              name: true, slug: true, path: true, isDefault: true, sortOrder: true,
              blocks: { select: { type: true, content: true, styles: true, sortOrder: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (template) {
        for (const tPage of template.pages) {
          const sitePage = await tx.sitePage.create({
            data: {
              siteId: site.id,
              name: tPage.name,
              slug: tPage.slug,
              path: tPage.path,
              isDefault: tPage.isDefault,
              sortOrder: tPage.sortOrder,
            },
            select: { id: true },
          });

          if (tPage.blocks.length > 0) {
            await tx.pageBlock.createMany({
              data: tPage.blocks.map((b) => ({
                sitePageId: sitePage.id,
                type: b.type,
                content: b.content as any,
                styles: b.styles as any,
                sortOrder: b.sortOrder,
              })),
            });
          }
        }
      }

      await tx.auditLog.create({
        data: { tenantId, action: "site.create", resource: "Site", resourceId: site.id },
      });

      return site;
    });

    let vercel: any = null;
    if (site.domain) {
      vercel = await this.vercel.addDomain(site.domain);
    }

    const fullSite = await this.findById(site.id, tenantId);
    return { ...fullSite, url: resolvePublicSiteUrl(site), vercel };
  }

  async findAll(tenantId: string, filters?: { page?: number; limit?: number }) {
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(100, Math.max(1, filters?.limit || 50));

    const [items, total] = await Promise.all([
      this.prisma.site.findMany({
        where: { tenantId, deletedAt: null },
        select: {
          id: true, name: true, subdomain: true, domain: true, isPublished: true,
          primaryColor: true, logoUrl: true, faviconUrl: true, createdAt: true, updatedAt: true,
          _count: { select: { pages: true } },
          template: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.site.count({ where: { tenantId, deletedAt: null } }),
    ]);

    return { items, total, page, limit };
  }

  async getCapabilities(tenantId: string) {
    const sites = await this.prisma.site.findMany({
      where: { tenantId, deletedAt: null },
      select: { template: { select: { name: true, description: true, tags: true } } },
      take: 20,
    });

    let bookings = false;
    let ecommerce = false;

    for (const site of sites) {
      const t = site.template;
      if (!t) continue;

      const tags: string[] = Array.isArray(t.tags)
        ? t.tags.map(String)
        : typeof t.tags === "string"
          ? (t.tags as string).split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)
          : [];
      const haystack = `${t.name || ""} ${t.description || ""} ${tags.join(" ")}`.toLowerCase();

      if (!bookings) {
        const tagged = tags.some((x) => ["bookings", "booking", "reservas", "reserva", "citas", "cita"].includes(x));
        const named = /reservas|reserva|booking|agend|agenda|citas|cita online|barber|sal[oó]n|cl[ií]nic|spa|consultorio|restaurante|cafeter[ií]a|bar|mesa/.test(haystack);
        if (tagged || named) bookings = true;
      }

      if (!ecommerce) {
        const tagged = tags.some((x) => ["ecommerce", "e-commerce", "tienda", "shop"].includes(x));
        const named = /ecommerce|e-commerce|tienda online|shop|cat[aá]logo de productos|venta online|carrito/.test(haystack);
        if (tagged || named) ecommerce = true;
      }

      if (bookings && ecommerce) break;
    }

    return { bookings, ecommerce };
  }

  async findById(id: string, tenantId?: string) {
    const where: any = { id, deletedAt: null };
    if (tenantId) where.tenantId = tenantId;

    const site = await this.prisma.site.findFirst({
      where,
      select: {
        id: true, tenantId: true, name: true, subdomain: true, domain: true,
        templateId: true, isPublished: true, primaryColor: true, seoTitle: true, seoDesc: true,
        logoUrl: true, faviconUrl: true, settings: true, publishedAt: true, createdAt: true, updatedAt: true,
        pages: {
          select: {
            id: true, name: true, slug: true, path: true, isDefault: true, sortOrder: true, seoTitle: true, seoDesc: true,
            blocks: {
              select: { id: true, type: true, content: true, styles: true, sortOrder: true },
              orderBy: { sortOrder: "asc" },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        template: { select: { id: true, name: true } },
      },
    });
    if (!site) throw new NotFoundException("Site not found");
    return site;
  }

  async update(id: string, tenantId: string, data: {
    name?: string;
    domain?: string | null;
    primaryColor?: string;
    seoTitle?: string;
    seoDesc?: string;
    settings?: any;
    logoUrl?: string;
    faviconUrl?: string;
  }) {
    const current = await this.prisma.site.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, domain: true },
    });
    if (!current) throw new NotFoundException("Site not found");

    if (data.domain) {
      data.domain = data.domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "").trim();
      const reserved = ["build.icebergup.com", "backplat.nextboostbusiness", "backplat.nextboostperu.com", "apiplat.nextboostperu.com"];
      if (reserved.includes(data.domain)) throw new ConflictException("Este dominio está reservado para la plataforma.");
      if (data.domain.endsWith(".build.icebergup.com") || data.domain.endsWith(".vercel.app")) throw new ConflictException("No puedes usar un subdominio de la plataforma como dominio de sitio.");
      const existing = await this.prisma.site.findUnique({ where: { domain: data.domain }, select: { id: true } });
      if (existing && existing.id !== id) throw new ConflictException("Domain already in use");
    }

    const oldDomain = current.domain || undefined;
    const newDomain = data.domain || undefined;

    if (oldDomain !== newDomain) {
      if (oldDomain) await this.vercel.removeDomain(oldDomain);
      if (newDomain) await this.vercel.addDomain(newDomain);
    }

    const allowed: (keyof NonNullable<typeof data>)[] = ["name", "domain", "primaryColor", "seoTitle", "seoDesc", "settings", "logoUrl", "faviconUrl"];
    const cleanData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) cleanData[key] = data[key];
    }

    const site = await this.prisma.site.update({
      where: { id },
      data: cleanData,
      select: {
        id: true, tenantId: true, name: true, subdomain: true, domain: true,
        primaryColor: true, seoTitle: true, seoDesc: true, logoUrl: true, faviconUrl: true,
        settings: true, isPublished: true, createdAt: true, updatedAt: true,
      },
    });

    return {
      ...site,
      vercel: newDomain ? await this.vercel.getDomainConfig(newDomain) : null,
    };
  }

  async remove(id: string, tenantId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, domain: true },
    });
    if (!site) throw new NotFoundException("Site not found");

    if (site.domain) await this.vercel.removeDomain(site.domain);

    return this.prisma.site.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }

  async checkDomainDns(id: string, domain: string) {
    const site = await this.prisma.site.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!site) throw new NotFoundException("Site not found");

    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "").trim();

    const vercel = await this.vercel.getDomainConfig(cleanDomain);

    let resolvedIps: string[] = [];
    try {
      resolvedIps = await dns.promises.resolve4(cleanDomain);
    } catch {}

    const isMisconfigured = vercel && (vercel.misconfigured === true || vercel.verified === false);
    const pointsToServer = Boolean(resolvedIps.length) && !isMisconfigured;

    return {
      domain: cleanDomain,
      pointsToServer,
      resolvedIps,
      serverIp: process.env.SERVER_IP || "IP del servidor",
      vercel: vercel && !vercel.error ? vercel : null,
      vercelConfigured: this.vercel.isConfigured,
    };
  }

  async setApk(id: string, tenantId: string, dto: { apkUrl: string; apkVersion: string; apkName: string; apkSize: number }) {
    const site = await this.prisma.site.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, settings: true },
    });
    if (!site) throw new NotFoundException("Site not found");

    const settings = ((site.settings as any) || {});

    if (settings.apkUrl) {
      const filename = settings.apkUrl.split("/").pop();
      if (filename) {
        const filePath = join(process.cwd(), "uploads", "apk", filename);
        if (existsSync(filePath)) {
          try { unlinkSync(filePath); } catch {}
        }
      }
    }

    return this.prisma.site.update({
      where: { id },
      data: {
        settings: {
          ...settings,
          apkUrl: dto.apkUrl,
          apkVersion: dto.apkVersion,
          apkName: dto.apkName,
          apkSize: dto.apkSize,
        },
      },
      select: { id: true, settings: true },
    });
  }

  async removeApk(id: string, tenantId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, settings: true },
    });
    if (!site) throw new NotFoundException("Site not found");

    const settings = ((site.settings as any) || {});

    if (settings.apkUrl) {
      const filename = settings.apkUrl.split("/").pop();
      if (filename) {
        const filePath = join(process.cwd(), "uploads", "apk", filename);
        if (existsSync(filePath)) {
          try { unlinkSync(filePath); } catch {}
        }
      }
    }

    const { apkUrl, apkVersion, apkName, apkSize, ...rest } = settings;
    return this.prisma.site.update({
      where: { id },
      data: { settings: rest },
      select: { id: true, settings: true },
    });
  }
}
