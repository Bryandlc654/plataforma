import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  resolvePublicSiteUrl,
  normalizePublicPath,
} from "../publishing/seo-helpers";

@Injectable()
export class SeoService {
  private readonly cache = new Map<string, { value: string; expiry: number }>();

  constructor(private prisma: PrismaService) {}

  private getCached(key: string): string | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiry > Date.now()) return entry.value;
    if (entry) this.cache.delete(key);
    return null;
  }

  private setCached(key: string, value: string, ttlMs: number) {
    this.cache.set(key, { value, expiry: Date.now() + ttlMs });
  }

  async updateSiteSeo(siteId: string, data: any) {
    const update: any = {};
    const seoTitle = data?.seoTitle ?? data?.title;
    const seoDesc = data?.seoDesc ?? data?.description;
    if (typeof seoTitle === "string") update.seoTitle = seoTitle;
    if (typeof seoDesc === "string") update.seoDesc = seoDesc;

    if (typeof data?.ogImage === "string") {
      const current = await this.prisma.site.findUnique({
        where: { id: siteId },
        select: { settings: true },
      });
      const settings = (current?.settings as any) || {};
      update.settings = {
        ...settings,
        og: { ...(settings.og || {}), image: data.ogImage || "" },
      };
    }

    return this.prisma.site.update({ where: { id: siteId }, data: update });
  }

  async updatePageSeo(pageId: string, data: any) {
    const update: { seoTitle?: string; seoDesc?: string } = {};
    const seoTitle = data?.seoTitle ?? data?.title;
    const seoDesc = data?.seoDesc ?? data?.description;
    if (typeof seoTitle === "string") update.seoTitle = seoTitle;
    if (typeof seoDesc === "string") update.seoDesc = seoDesc;
    return this.prisma.sitePage.update({ where: { id: pageId }, data: update });
  }

  async generateSitemap(siteId: string): Promise<string> {
    const cached = this.getCached(`sitemap:${siteId}`);
    if (cached) return cached;

    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: { pages: { orderBy: { sortOrder: "asc" } } },
    });

    if (!site) throw new NotFoundException("Site not found");

    const urlBase = resolvePublicSiteUrl(site);
    const lastmod =
      site.publishedAt?.toISOString().split("T")[0] ||
      new Date().toISOString().split("T")[0];

    const urls = site.pages.map((page) => {
      const loc =
        page.path === "/" ? urlBase : `${urlBase}${normalizePublicPath(page.path)}`;
      const priority = page.isDefault ? "1.0" : "0.8";
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
    this.setCached(`sitemap:${siteId}`, xml, 3_600_000);
    return xml;
  }

  async generateRobots(siteId: string): Promise<string> {
    const cached = this.getCached(`robots:${siteId}`);
    if (cached) return cached;

    const site = await this.prisma.site.findUnique({ where: { id: siteId } });
    if (!site) throw new NotFoundException("Site not found");

    const urlBase = resolvePublicSiteUrl(site);
    const robots = `User-agent: *\nAllow: /\nSitemap: ${urlBase}/sitemap.xml\n`;
    this.setCached(`robots:${siteId}`, robots, 3_600_000);
    return robots;
  }

  async getSeoMeta(siteId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: {
        pages: {
          select: {
            id: true,
            name: true,
            slug: true,
            path: true,
            isDefault: true,
            seoTitle: true,
            seoDesc: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!site) throw new NotFoundException("Site not found");

    const url = resolvePublicSiteUrl(site);
    const og = (site.settings as any)?.og || {};

    return {
      url,
      subdomain: site.subdomain,
      domain: site.domain,
      published: site.isPublished,
      global: {
        title: site.seoTitle || site.name,
        description: site.seoDesc || "",
        ogTitle: site.seoTitle || site.name,
        ogDescription: site.seoDesc || "",
        ogImage: og.image || site.logoUrl || "",
        favicon: site.faviconUrl || "",
        siteName: site.name,
      },
      pages: site.pages.map((p) => ({
        id: p.id,
        name: p.name,
        path: p.path,
        isDefault: p.isDefault,
        title: p.seoTitle || `${p.name} - ${site.name}`,
        description: p.seoDesc || "",
        seoTitle: p.seoTitle || "",
        seoDesc: p.seoDesc || "",
      })),
    };
  }
}
