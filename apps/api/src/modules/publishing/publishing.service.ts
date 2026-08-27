import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { getPrestigeHtml, getArtCulinaireHtml, getRodriplastHtml, getIndigoHtml } from "@plataforma/shared";
import {
  resolvePublicSiteUrl,
  normalizePublicPath,
  escapeHtml,
} from "./seo-helpers";

const withTimeout = <T>(promise: Promise<T>, ms: number, msg = 'Request timeout'): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(msg)), ms);
    promise.then(val => { clearTimeout(timer); resolve(val); }).catch(err => { clearTimeout(timer); reject(err); });
  });
};

function decodeUnicodeEscapes(val: any): any {
  if (typeof val === "string") {
    if (!val.includes("\\u")) return val;
    try { return JSON.parse(JSON.stringify(val).replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))); }
    catch { return val.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))); }
  }
  if (Array.isArray(val)) return val.map(decodeUnicodeEscapes);
  if (val && typeof val === "object") {
    const out: any = {};
    for (const k of Object.keys(val)) out[k] = decodeUnicodeEscapes(val[k]);
    return out;
  }
  return val;
}

@Injectable()
export class PublishingService {
  private readonly htmlCache = new Map<string, { value: string; expiry: number }>();
  private readonly staticCache = new Map<string, { value: string; expiry: number }>();
  private readonly inFlightRequests = new Map<string, Promise<any>>();
  private static readonly CACHE_MAX = 200;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  private getCached(cache: Map<string, { value: string; expiry: number }>, key: string): string | null {
    const entry = cache.get(key);
    if (entry && entry.expiry > Date.now()) return entry.value;
    if (entry) cache.delete(key);
    return null;
  }

  private setCached(cache: Map<string, { value: string; expiry: number }>, key: string, value: string, ttlMs: number) {
    if (cache.size >= PublishingService.CACHE_MAX) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    cache.set(key, { value, expiry: Date.now() + ttlMs });
  }

  private invalidateCache(subdomain: string) {
    for (const key of [...this.htmlCache.keys(), ...this.staticCache.keys()]) {
      if (key.startsWith(subdomain)) {
        this.htmlCache.delete(key);
        this.staticCache.delete(key);
      }
    }
  }

  async publish(id: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        tenant: { select: { subdomain: true, customDomain: true } },
        pages: {
          include: { blocks: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!site || site.deletedAt) throw new NotFoundException("Site not found");

    for (const page of site.pages) {
      if (page.blocks) {
        page.blocks = await this.resolveLinktreeBlocks(page.blocks, site.tenantId);
      }
    }
    const html = this.renderSite(site);

    await this.prisma.site.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });

    const subdomain = site.tenant?.subdomain || site.subdomain;
    if (subdomain) this.invalidateCache(subdomain);

    return {
      url: resolvePublicSiteUrl(site),
      publishedAt: new Date(),
      pages: site.pages.length,
    };
  }

  async unpublish(id: string) {
    await this.prisma.site.update({
      where: { id },
      data: { isPublished: false },
    });
    return { published: false };
  }

  async preview(id: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        pages: {
          include: { blocks: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!site || site.deletedAt) throw new NotFoundException("Site not found");

    return {
      site: {
        id: site.id,
        name: site.name,
        primaryColor: site.primaryColor,
        seoTitle: site.seoTitle,
        seoDesc: site.seoDesc,
      },
      pages: site.pages.map((p) => ({
        name: p.name,
        slug: p.slug,
        path: p.path,
        blocks: p.blocks.map((b) => ({
          type: b.type,
          content: b.content,
          styles: b.styles,
        })),
      })),
    };
  }

  async getPublicSite(subdomain: string) {
    const site = await this.prisma.site.findFirst({
      where: {
        OR: [{ subdomain }, { domain: subdomain }],
        isPublished: true,
        deletedAt: null,
      },
      include: {
        pages: {
          include: { blocks: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!site) throw new NotFoundException("Site not found");

    return {
      site: {
        name: site.name,
        primaryColor: site.primaryColor,
        logoUrl: site.logoUrl,
        faviconUrl: site.faviconUrl,
        seoTitle: site.seoTitle,
        seoDesc: site.seoDesc,
      },
      pages: site.pages.map((p) => ({
        name: p.name,
        slug: p.slug,
        path: p.path,
        blocks: p.blocks,
      })),
    };
  }

  async getPublicHtml(subdomain: string, path?: string): Promise<string> {
    const cacheKey = `${subdomain}:${path || "/"}`;
    const cached = this.getCached(this.htmlCache, cacheKey);
    if (cached) return cached;

    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    const promise = withTimeout((async () => {
      const site = await this.prisma.site.findFirst({
        where: {
          OR: [{ subdomain }, { domain: subdomain }],
          isPublished: true,
          deletedAt: null,
        },
        include: {
          pages: {
            include: { blocks: { orderBy: { sortOrder: "asc" } } },
            orderBy: { sortOrder: "asc" },
          },
          tenant: { select: { settings: true } },
          template: { select: { globalStyles: true } },
        },
      });

      if (!site) throw new NotFoundException("Site not found");

      const isReviewFormRoute = path && normalizePublicPath(path) === "/dejar-opinion";

      let sorteoSlug: string | null = null;
      let linktreeSlug: string | null = null;
      if (path && !isReviewFormRoute) {
        const cleanPath = normalizePublicPath(path).replace(/^\//, "");
        const sorteo = await this.prisma.sorteo.findFirst({
          where: { tenantId: site.tenantId, slug: cleanPath, isActive: true },
          select: { id: true, title: true, slug: true, description: true, fields: true, endDate: true },
        });
        if (sorteo) sorteoSlug = sorteo.slug;

        if (!sorteoSlug) {
          const linktreeMatch = await this.prisma.linkPage.findFirst({
            where: { tenantId: site.tenantId, slug: cleanPath, isActive: true },
          });
          if (linktreeMatch) linktreeSlug = linktreeMatch.slug;
        }
      }

      if (path && !isReviewFormRoute && !sorteoSlug && !linktreeSlug) {
        const wanted = normalizePublicPath(path);
        const match = site.pages.find(
          (p: any) => normalizePublicPath(p.path) === wanted
        );
        if (!match) throw new NotFoundException("Page not found");
      }

      if (isReviewFormRoute) {
        site.pages.push({
          name: "Dejar Opinión",
          path: "/dejar-opinion",
          isDefault: false,
          blocks: [{ type: "review-form", content: { tenantId: site.tenantId, siteId: site.id }, styles: {} } as any]
        } as any);
      }

      if (linktreeSlug) {
        const linktree = await this.prisma.linkPage.findFirst({
          where: { tenantId: site.tenantId, slug: linktreeSlug, isActive: true },
        });
        if (linktree) {
          site.pages.push({
            name: linktree.title,
            path: `/${linktree.slug}`,
            isDefault: false,
            blocks: [{ type: 'linktree', content: { linktree, tenantId: site.tenantId }, styles: {} } as any]
          } as any);
        }
      }

      if (sorteoSlug) {
        const sorteo = await this.prisma.sorteo.findFirst({
          where: { tenantId: site.tenantId, slug: sorteoSlug, isActive: true },
          select: { id: true, title: true, slug: true, description: true, fields: true, endDate: true },
        });
        if (sorteo) {
          site.pages.push({
            name: sorteo.title,
            path: `/${sorteo.slug}`,
            isDefault: false,
            blocks: [{ type: "sorteo-form", content: { sorteo, tenantId: site.tenantId }, styles: {} } as any]
          } as any);
        }
      }

      const approvedReviews = await this.prisma.review.findMany({
        where: { tenantId: site.tenantId, isPublished: true },
        orderBy: { createdAt: "desc" },
      });

      const html = await this.renderFullSite(site, path, approvedReviews);
      this.setCached(this.htmlCache, cacheKey, html, 60_000);
      return html;
    })(), 10000, "Timeout rendering site").finally(() => {
      this.inFlightRequests.delete(cacheKey);
    });

    this.inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  async getPublicSitemap(subdomain: string): Promise<string> {
    const cacheKey = `${subdomain}:sitemap`;
    const cached = this.getCached(this.staticCache, cacheKey);
    if (cached) return cached;

    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    const promise = withTimeout((async () => {
      const site = await this.prisma.site.findFirst({
        where: {
          OR: [{ subdomain }, { domain: subdomain }],
          isPublished: true,
          deletedAt: null,
        },
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
        return `  <url>\n    <loc>${escapeHtml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
      });

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
      this.setCached(this.staticCache, cacheKey, xml, 3_600_000);
      return xml;
    })(), 5000, "Timeout generating sitemap").finally(() => {
      this.inFlightRequests.delete(cacheKey);
    });

    this.inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  async getPublicRobots(subdomain: string): Promise<string> {
    const cacheKey = `${subdomain}:robots`;
    const cached = this.getCached(this.staticCache, cacheKey);
    if (cached) return cached;

    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    const promise = withTimeout((async () => {
      const site = await this.prisma.site.findFirst({
        where: {
          OR: [{ subdomain }, { domain: subdomain }],
          isPublished: true,
          deletedAt: null,
        },
      });

      if (!site) throw new NotFoundException("Site not found");

      const urlBase = resolvePublicSiteUrl(site);
      const robots = `User-agent: *\nAllow: /\nSitemap: ${urlBase}/sitemap.xml\n`;
      this.setCached(this.staticCache, cacheKey, robots, 3_600_000);
      return robots;
    })(), 5000, "Timeout generating robots").finally(() => {
      this.inFlightRequests.delete(cacheKey);
    });

    this.inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  private apiBaseUrl(): string {
    const url = process.env.PUBLIC_API_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (url && !url.includes("localhost")) {
      return url.replace(/\/+$/, "");
    }
    return "https://plataforma-api-71743315793.us-central1.run.app";
  }

  private apiV1Url(): string {
    return this.apiBaseUrl() + "/api/v1";
  }

  private absoluteUrl(url: string): string {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/uploads/")) return `${this.apiBaseUrl()}${url}`;
    return url;
  }

  private isLightColor(hex: string): boolean {
    if (!hex || !hex.startsWith("#")) return true;
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  }

  private resolveBlockUrls(block: any): any {
    const content = { ...(block.content || {}) };
    // Common image fields
    const imgFields = ["backgroundImage", "logoImage", "image", "imageUrl", "url"];
    for (const key of imgFields) {
      if (content[key]) content[key] = this.absoluteUrl(content[key]);
    }
    // Nested arrays: members, plans, items, slides
    for (const arrKey of ["members", "plans", "items", "slides", "images"]) {
      if (Array.isArray(content[arrKey])) {
        content[arrKey] = content[arrKey].map((item: any) => {
          if (typeof item === "string") return item;
          const resolved = { ...item };
          for (const key of imgFields) {
            if (resolved[key]) resolved[key] = this.absoluteUrl(resolved[key]);
          }
          return resolved;
        });
      }
    }
    return { ...block, content };
  }

  private renderSite(site: any): string {
    const blocksHtml = site.pages.flatMap((page: any) =>
      page.blocks.map((block: any) =>
        this.renderBlock(block.type, block.content, block.styles, site)
      )
    ).join("\n");

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${site.seoTitle || site.name}</title>
<meta name="description" content="${site.seoDesc || ""}">
<link rel="icon" href="${site.faviconUrl || ""}">
<style>
:root{--primary:${site.primaryColor || "#2563EB"}}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#1e293b}
</style>
</head>
<body>
${blocksHtml}
</body>
</html>`;
  }

  private async resolveLinktreeBlocks(blocks: any[], tenantId: string): Promise<any[]> {
    const resolved: any[] = [];
    for (const block of blocks) {
      if (block.type === "linktree" && !block.content?.linktree) {
        const lt = await this.prisma.linkPage.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: "desc" },
        });
        if (lt) {
          resolved.push({ ...block, content: { ...block.content, linktree: lt } });
          continue;
        }
      }
      resolved.push(block);
    }
    return resolved;
  }

  private async renderFullSite(site: any, requestedPath?: string, reviews: any[] = []): Promise<string> {
    const wanted = requestedPath ? normalizePublicPath(requestedPath) : "/";
    const defaultPage = site.pages.find((p: any) => p.isDefault) || site.pages[0];
    const page =
      (requestedPath
        ? site.pages.find((p: any) => normalizePublicPath(p.path) === wanted)
        : undefined) || defaultPage;

    if (page?.blocks) {
      page.blocks = await this.resolveLinktreeBlocks(page.blocks, site.tenantId);
    }

    // Resolve global (shared) header/footer: site override > template globalStyles
    const siteSettings = (site?.settings as any) || {};
    const templateGlobal = (site?.template?.globalStyles as any) || {};
    const sharedHeaderRaw = siteSettings.globalHeader || templateGlobal.header;
    const sharedFooterRaw = siteSettings.globalFooter || templateGlobal.footer;

    const currentPath = page?.path || "/";
    const sharedHeader = this.renderSharedChrome(sharedHeaderRaw, "header", site, reviews, currentPath);
    const sharedFooter = this.renderSharedChrome(sharedFooterRaw, "footer", site, reviews, currentPath);

    const blocksHtml = (page?.blocks || [])
      .filter((block: any) => {
        if ((block.type === "header" || block.type === "footer") && (sharedHeaderRaw || sharedFooterRaw)) {
          return false;
        }
        return true;
      })
      .map((block: any) =>
        this.renderBlock(block.type, this.resolveBlockUrls(block).content, block.styles, site, reviews)
      ).join("\n") || "";

    const primary = site.primaryColor || "#2563EB";
    const secondary = site.secondaryColor || "#1E40AF";
    const variant = page?.blocks?.[0]?.content?.variant;
    const isTemplate = variant === "art-culinaire" || variant === "prestige" || variant === "rodriplast" || variant === "indigo";

    const baseUrl = resolvePublicSiteUrl(site);
    const canonicalUrl =
      page && page.path !== "/"
        ? `${baseUrl}${normalizePublicPath(page.path)}`
        : baseUrl;

    const seoTitle = page?.seoTitle || site.seoTitle || site.name || "";
    const seoDesc = page?.seoDesc || site.seoDesc || "";
    const ogSettings = (site.settings as any)?.og || {};
    const ogImage = ogSettings.image
      ? this.absoluteUrl(ogSettings.image)
      : this.absoluteUrl(site.logoUrl);
    const favicon = this.absoluteUrl(site.faviconUrl);

    const waSettings = (site.tenant?.settings as any)?.whatsapp || {};
    const waEnabled = waSettings.enabled === true && !!waSettings.phoneNumber;
    const waPhone = (waSettings.phoneNumber || "").replace(/[^0-9]/g, "");
    const waButton = waEnabled ? `
<a href="https://wa.me/${waPhone}?text=${encodeURIComponent(waSettings.message || "Hola")}" target="_blank" rel="noopener" data-analytics-click data-analytics-type="whatsapp_click" data-analytics-label="whatsapp_floating" style="position:fixed;z-index:9999;${waSettings.buttonPosition === "left" ? "left:1.5rem" : "right:1.5rem"};bottom:1.5rem;width:56px;height:56px;background:${waSettings.buttonColor || "#25D366"};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.4);transition:transform .2s,box-shadow .2s;text-decoration:none" title="Chatea con nosotros">
<svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
 </a>` : "";

    const apkSettings = (site.settings as any) || {};
    const apkUrl = apkSettings.apkUrl || "";
    const apkName = apkSettings.apkName || "App";
    const apkButton = apkUrl ? `
<a href="${apkUrl}" download="${apkName}.apk" data-analytics-click data-analytics-type="apk_download" data-analytics-label="apk_floating" style="position:fixed;z-index:9999;right:1.5rem;bottom:${waEnabled ? "5.5rem" : "1.5rem"};display:flex;align-items:center;gap:.5rem;padding:0 1rem;height:48px;background:var(--primary,#2563EB);color:white;border-radius:24px;text-decoration:none;font-size:.85rem;font-weight:600;box-shadow:0 4px 16px rgba(37,99,235,.35);transition:transform .2s,box-shadow .2s" title="Descargar ${apkName}">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
<span>Descargar App</span>
</a>` : "";

    const themeColors = variant === "rodriplast" ? {
      "rodri-primary": "#4fad33",
      "rodri-primary-dark": "#3d8f29",
      "rodri-primary-glow": "#4fad33",
      "rodri-accent": "#84cc16",
      "rodri-charcoal": "#0f172a",
      "rodri-charcoal-foreground": "#f8fafc",
      "rodri-muted": "#64748b",
      "rodri-muted-foreground": "#64748b",
      "rodri-foreground": "#0f172a",
      "rodri-background": "#ffffff",
      "rodri-card": "#ffffff",
      "rodri-secondary": "#f8fafc",
      "rodri-border": "#e2e8f0",
      "rodri-input": "#e2e8f0",
      "rodri-primary-foreground": "#ffffff",
    } : variant === "indigo" ? {
      "indigo-brand": "#fdcb0c",
      "indigo-dark": "#050505",
      "indigo-light": "#fcfcfc",
      "indigo-gray": "#999999",
      "on-primary": "#fdcb0c",
      "primary": "#fdcb0c",
      "tertiary-container": "#050505",
      "error-container": "#ffdad6",
      "on-error": "#ffffff",
      "surface-container-lowest": "#fcfcfc",
      "primary-fixed-dim": "#fdcb0c",
      "on-background": "#050505",
    } : variant === "art-culinaire" ? {
      "on-primary": "#ffffff",
      "tertiary-container": "#261900",
      "error-container": "#ffdad6",
      "on-error": "#ffffff",
      "surface-container-lowest": "#ffffff",
      "primary-fixed-dim": "#c8c6c5",
      "on-background": "#1b1c1c",
      "surface-dim": "#dbd9d9",
      "inverse-on-surface": "#f2f0f0",
      "surface": "#fbf9f8",
      "on-tertiary-fixed": "#261900",
      "background": "#fbf9f8",
      "surface-bright": "#fbf9f8",
      "tertiary-fixed-dim": "#e9c176",
      "surface-container-low": "#f5f3f3",
      "tertiary": "#000000",
      "on-secondary-fixed-variant": "#474744",
      "outline": "#747878",
      "surface-variant": "#e4e2e2",
      "surface-container": "#efeded",
      "on-primary-container": "#858383",
      "on-error-container": "#93000a",
      "primary-container": "#1c1b1b",
      "on-secondary-fixed": "#1b1c19",
      "on-tertiary-fixed-variant": "#5d4201",
      "on-surface": "#1b1c1c",
      "on-surface-variant": "#444748",
      "secondary": "#5e5e5b",
      "error": "#ba1a1a",
      "secondary-container": "#e1dfdb",
      "on-tertiary-container": "#a17f3b",
      "outline-variant": "#c4c7c7",
      "surface-container-highest": "#e4e2e2",
      "inverse-primary": "#c8c6c5",
      "on-tertiary": "#ffffff",
      "on-secondary": "#ffffff",
      "secondary-fixed-dim": "#c8c6c2",
      "on-primary-fixed-variant": "#474646",
      "surface-tint": "#5f5e5e",
      "secondary-fixed": "#e4e2dd",
      "on-primary-fixed": "#1c1b1b",
      "primary-fixed": "#e5e2e1",
      "inverse-surface": "#303030",
      "tertiary-fixed": "#ffdea5",
      "on-secondary-container": "#63635f",
      "surface-container-high": "#eae8e7",
      "primary": "#000000"
    } : {
      "on-primary": "#ffffff",
      "tertiary-container": "#820801",
      "error-container": "#ffdad6",
      "on-error": "#ffffff",
      "surface-container-lowest": "#ffffff",
      "primary-fixed-dim": "#bcc2ff",
      "on-background": "#131b2e",
      "surface-dim": "#d2d9f4",
      "inverse-on-surface": "#eef0ff",
      "surface": "#faf8ff",
      "on-tertiary-fixed": "#400100",
      "background": "#faf8ff",
      "surface-bright": "#faf8ff",
      "tertiary-fixed-dim": "#ffb4a7",
      "surface-container-low": "#f2f3ff",
      "tertiary": "#590300",
      "on-secondary-fixed-variant": "#574500",
      "outline": "#757687",
      "surface-variant": "#dae2fd",
      "surface-container": "#eaedff",
      "on-primary-container": "#98a3ff",
      "on-error-container": "#93000a",
      "primary-container": "#0020c2",
      "on-secondary-fixed": "#241a00",
      "on-tertiary-fixed-variant": "#8e1307",
      "on-surface": "#131b2e",
      "on-surface-variant": "#444655",
      "secondary": "#735c00",
      "error": "#ba1a1a",
      "secondary-container": "#fed65b",
      "on-tertiary-container": "#ff8875",
      "outline-variant": "#c5c5d8",
      "surface-container-highest": "#dae2fd",
      "inverse-primary": "#bcc2ff",
      "on-tertiary": "#ffffff",
      "on-secondary": "#ffffff",
      "secondary-fixed-dim": "#e9c349",
      "on-primary-fixed-variant": "#152dc9",
      "surface-tint": "#374be0",
      "secondary-fixed": "#ffe088",
      "on-primary-fixed": "#000b62",
      "primary-fixed": "#dfe0ff",
      "inverse-surface": "#283044",
      "tertiary-fixed": "#ffdad4",
      "on-secondary-container": "#745c00",
      "surface-container-high": "#e2e7ff",
      "primary": "#001387"
    };

    const themeFonts = variant === "rodriplast" ? {
      "display": ["Inter"],
      "headline-md": ["Inter"],
      "headline-lg": ["Inter"],
      "headline-lg-mobile": ["Inter"],
      "headline-display": ["Inter"],
      "body-md": ["Inter"],
      "body-lg": ["Inter"],
      "label-sm": ["Inter"]
    } : variant === "indigo" ? {
      "display": ["Poppins"],
      "headline-md": ["Poppins"],
      "headline-lg": ["Poppins"],
      "headline-lg-mobile": ["Poppins"],
      "headline-display": ["Poppins"],
      "body-md": ["Poppins"],
      "body-lg": ["Poppins"],
      "label-sm": ["Poppins"]
    } : variant === "art-culinaire" ? {
      "headline-md": ["Playfair Display"],
      "headline-lg": ["Playfair Display"],
      "headline-lg-mobile": ["Playfair Display"],
      "headline-display": ["Playfair Display"],
      "body-md": ["Montserrat"],
      "body-lg": ["Montserrat"],
      "label-sm": ["Montserrat"]
    } : {
      "headline-md": ["Inter"],
      "headline-lg": ["Inter"],
      "headline-lg-mobile": ["Inter"],
      "headline-display": ["Inter"],
      "display-lg-mobile": ["Inter"],
      "display-lg": ["Inter"],
      "body-md": ["Inter"],
      "body-lg": ["Inter"],
      "label-sm": ["Inter"]
    };

    const themeFontSizes = {
      "headline-md": ["32px", { "lineHeight": "1.3", "fontWeight": "500" }],
      "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
      "headline-lg": ["48px", { "lineHeight": "1.2", "fontWeight": "600" }],
      "label-sm": ["12px", { "lineHeight": "1.0", "letterSpacing": "0.1em", "fontWeight": "600" }],
      "headline-lg-mobile": ["32px", { "lineHeight": "1.2", "fontWeight": "600" }],
      "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }],
      "headline-display": ["64px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700" }],
      "display-lg-mobile": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
      "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "600" }]
    };

    const themeSpacing = {
      "margin-mobile": "24px",
      "margin-desktop": "64px",
      "section-gap": "128px",
      "section-padding": "80px",
      "container-max": "1200px",
      "unit": "8px",
      "gutter": "32px"
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(seoTitle)}</title>
<meta name="description" content="${escapeHtml(seoDesc)}">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
<meta name="robots" content="index, follow">
<meta property="og:site_name" content="${escapeHtml(site.name || "")}">
<meta property="og:type" content="website">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta property="og:title" content="${escapeHtml(seoTitle)}">
<meta property="og:description" content="${escapeHtml(seoDesc)}">
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(seoTitle)}">
<meta name="twitter:description" content="${escapeHtml(seoDesc)}">
${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}">` : ""}
${favicon ? `<link rel="icon" href="${escapeHtml(favicon)}">` : ""}
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
${isTemplate ? `
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet" />
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script>
  tailwind.config = {
      darkMode: "class",
      theme: {
          extend: {
              "colors": ${JSON.stringify(themeColors)},
              "borderRadius": {
                  "DEFAULT": "0.25rem",
                  "lg": "0.5rem",
                  "xl": "0.75rem",
                  "full": "9999px"
              },
              "spacing": ${JSON.stringify(themeSpacing)},
              "fontFamily": ${JSON.stringify(themeFonts)},
              "fontSize": ${JSON.stringify(themeFontSizes)}
          }
      }
  }
</script>` : ""}
<style>
${isTemplate ? `
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
.material-symbols-outlined[data-weight="fill"] { font-variation-settings: 'FILL' 1; }
` : `
:root{--primary:${primary};--secondary:${secondary}}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#1e293b;background:#fff;-webkit-font-smoothing:antialiased}
img{max-width:100%;height:auto;display:block}
a{color:inherit}
/* Responsive header */
@media(max-width:768px){
  .pub-nav{display:none!important;width:100%;flex-direction:column;padding-top:1rem;gap:.5rem!important}
  .pub-menu-btn{display:block!important}
  .pub-header.open .pub-nav{display:flex!important}
}
/* Smooth animations */
.pub-header{transition:box-shadow .2s}
.pub-header:hover{box-shadow:0 1px 8px rgba(0,0,0,.06)}
`}
</style>
<script>
document.addEventListener("DOMContentLoaded",function(){
  // Mobile header toggle
  var b=document.querySelector(".pub-menu-btn");if(b){b.addEventListener("click",function(){document.querySelector(".pub-header").classList.toggle("open")})}
  // Carousel helper
  function setupCarousel(container,slideClass,dotClass,interval){
    var slides=container.querySelectorAll(slideClass)
    var dots=container.querySelectorAll(dotClass)
    if(slides.length<2)return;var cur=0,timer;
    function go(i){
      slides.forEach(function(s,j){s.style.opacity=j===i?"1":"0";if(s.classList.contains("hc-slide")){s.style.transform=j===i?"translateY(0)":"translateY(10px)";s.style.position=j===i?"relative":"absolute";s.style.pointerEvents=j===i?"auto":"none"}})
      dots.forEach(function(d,j){if(d.classList.contains("hdot")){d.style.background=j===i?"white":"rgba(255,255,255,.4)";d.style.width=j===i?"24px":"8px"}else{d.style.background=j===i?"#0f172a":"#e2e8f0";d.style.width=j===i?"24px":"8px"}})
      cur=i
    }
    function next(){go((cur+1)%slides.length)}
    timer=setInterval(next,interval||4000)
    dots.forEach(function(d){d.addEventListener("click",function(){clearInterval(timer);go(parseInt(d.getAttribute("data-i")));timer=setInterval(next,interval||4000)})})
  }
  // Hero carousel
  var hero=document.querySelector(".pub-hero");if(hero)setupCarousel(hero,".hs-slide, .hc-slide, .hdot",".hdot",5000)
  // Testimonials carousel
  var testi=document.querySelector(".pub-testimonials");if(testi)setupCarousel(testi,".ts-slide",".tdot",4000)
  // Form submission (intercept, post via fetch, show status inline)
  document.querySelectorAll("form[data-pub-form]").forEach(function(form){
    var status=form.querySelector("[data-pub-form-status]")
    form.addEventListener("submit",function(e){
      e.preventDefault()
      if(status){status.style.display="block";status.style.background="#eff6ff";status.style.color="#1d4ed8";status.textContent="Enviando..."}
      var btn=form.querySelector("button[type=submit]")
      if(btn)btn.disabled=true
      var body={}
      Array.prototype.forEach.call(form.querySelectorAll("[name]"),function(inp){body[inp.name]=inp.value})
      fetch(form.action,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
        .then(function(r){return r.json().then(function(j){return {ok:r.ok,json:j}})})
        .then(function(res){
          if(!res.ok||res.json.error){throw new Error(res.json.message||"Error")}
          form.reset()
          if(status){status.style.background="#f0fdf4";status.style.color="#15803d";status.textContent="¡Registro exitoso!"}
        })
        .catch(function(){
          if(status){status.style.background="#fef2f2";status.style.color="#b91c1c";status.textContent="Ocurrió un error. Inténtalo nuevamente."}
        })
        .finally(function(){if(btn)btn.disabled=false})
    })
  })
})
</script>
<script>
(function(){
  var tid="${site.tenantId}";var sid="${site.id}";var apiBase="${this.apiV1Url()}";
  var track=function(data){
    data.tenantId=tid;data.siteId=sid;data.path=data.path||window.location.pathname;
    try{fetch(apiBase+"/analytics/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data),keepalive:true}).catch(function(){})}
    catch(e){try{if(navigator.sendBeacon){navigator.sendBeacon(apiBase+"/analytics/track",new Blob([JSON.stringify(data)],{type:"application/json"}))}}catch(e2){}}
  };
  track({type:"pageview",path:window.location.pathname,referrer:document.referrer||""});
  document.addEventListener("click",function(e){
    var t=e.target.closest("[data-analytics-click]");
    if(!t)return;
    var label=t.getAttribute("data-analytics-label")||"";
    track({type:t.getAttribute("data-analytics-type")||"click",metadata:{label:label,href:t.getAttribute("href")||""}});
  });
})()
</script>
</head>
<body class="${isTemplate ? "bg-background text-on-background font-body-md text-body-md antialiased selection:bg-tertiary-fixed-dim selection:text-on-tertiary-fixed-variant" : ""}">
${sharedHeader}
${blocksHtml}
${sharedFooter}
${waButton}
${apkButton}
</body>
</html>`;
  }

  private renderSharedChrome(
    raw: any,
    type: "header" | "footer",
    site?: any,
    reviews: any[] = [],
    currentPath?: string,
  ): string {
    if (!raw) return "";
    const c = decodeUnicodeEscapes(raw ? { ...raw, variant: raw.variant || "indigo" } : null) || {};
    if (c.variant !== "indigo") return "";

    // Compute active state for nav/footer links based on current page path
    const linkSets = [c.links, c.navLinks];
    for (const links of linkSets) {
      if (Array.isArray(links)) {
        for (const l of links) {
          const linkPath = (l.url || "").split("?")[0];
          l.active = !!linkPath && normalizePublicPath(linkPath) === normalizePublicPath(currentPath || "/");
        }
      }
    }

    return this.renderBlock(type, this.resolveBlockUrls({ type, content: c }).content, c.styles, site, reviews);
  }

  private renderBlock(type: string, content: any, _styles?: any, site?: any, reviews: any[] = []): string {
    const c = decodeUnicodeEscapes(content) || {};
    
    if (c.variant === "prestige") {
      const html = getPrestigeHtml(type, c, this.apiBaseUrl(), site);
      if (html) return html;
    }
    
    if (c.variant === "art-culinaire") {
      const html = getArtCulinaireHtml(type, c, this.apiBaseUrl(), site);
      if (html) return html;
    }

    if (c.variant === "rodriplast") {
      const html = getRodriplastHtml(type, c, this.apiBaseUrl(), site);
      if (html) return html;
    }

    if (c.variant === "indigo") {
      const html = getIndigoHtml(type, c, this.apiBaseUrl(), site);
      if (html) return html;
    }

    switch (type) {
      case "hero": {
        const bgImg = c.backgroundImage ? `<div style="position:absolute;inset:0;background-image:url(${this.absoluteUrl(c.backgroundImage)});background-size:cover;background-position:center;z-index:0"></div><div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:1"></div>` : "";
        return `<section style="position:relative;overflow:hidden;text-align:center;padding:clamp(4rem,12vw,8rem) clamp(1rem,5vw,2rem);color:white;min-height:clamp(400px,70vh,600px);display:flex;align-items:center;justify-content:center;${c.backgroundImage ? "" : "background:linear-gradient(135deg,var(--primary),#1e40af)"}">
${bgImg}
${!c.backgroundImage ? `<div style="position:absolute;inset:0;background:radial-gradient(circle at top,rgba(255,255,255,0.12),transparent 60%);z-index:0"></div>` : ""}
<div style="position:relative;z-index:2;max-width:800px;margin:0 auto;padding:0 clamp(1rem,5vw,2rem)">
${c.kicker ? `<p style="display:inline-block;background:rgba(255,255,255,0.15);padding:clamp(4px,1vw,8px) clamp(12px,2vw,20px);border-radius:100px;font-size:clamp(.65rem,1.1vw,.75rem);font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-bottom:1.5rem;border:1px solid rgba(255,255,255,0.2)">${c.kicker}</p>` : ""}
<h1 style="font-size:clamp(2rem,6vw,4rem);font-weight:800;margin-bottom:1.25rem;line-height:1.15">${c.title || ""}</h1>
${c.subtitle ? `<p style="font-size:clamp(1rem,2.5vw,1.3rem);opacity:.85;max-width:650px;margin:0 auto 2rem;line-height:1.6">${c.subtitle}</p>` : ""}
<div style="display:flex;flex-wrap:wrap;gap:clamp(.75rem,1.5vw,1rem);justify-content:center">
${c.buttonText ? `<a href="${c.buttonUrl || "#"}" data-analytics-click data-analytics-type="click" data-analytics-label="hero_cta" style="display:inline-block;background:white;color:var(--primary);padding:clamp(12px,2vw,16px) clamp(28px,4vw,40px);border-radius:14px;text-decoration:none;font-weight:600;font-size:clamp(.9rem,1.5vw,1rem);box-shadow:0 4px 16px rgba(0,0,0,.1);transition:transform .2s,box-shadow .2s">${c.buttonText}</a>` : ""}
${c.secondaryButtonText ? `<a href="${c.secondaryButtonUrl || "#"}" data-analytics-click data-analytics-type="click" data-analytics-label="hero_secondary_cta" style="display:inline-block;background:rgba(255,255,255,0.1);color:white;padding:clamp(12px,2vw,16px) clamp(28px,4vw,40px);border-radius:14px;text-decoration:none;font-weight:600;font-size:clamp(.9rem,1.5vw,1rem);border:1px solid rgba(255,255,255,0.25);transition:background .2s">${c.secondaryButtonText}</a>` : ""}
</div>
</div>
</section>`;
      }

      case "services":
        return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:clamp(2rem,5vw,3rem);color:#0f172a">${c.title || "Servicios"}</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:clamp(1rem,2vw,1.5rem)">
${(c.items || []).map((item: any) => `<div style="text-align:center;padding:clamp(1.5rem,3vw,2rem);border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;transition:box-shadow .2s">
<h3 style="font-size:clamp(1rem,2vw,1.2rem);font-weight:600;margin-bottom:.75rem;color:#0f172a">${item.title || ""}</h3>
<p style="color:#64748b;line-height:1.6;font-size:clamp(.85rem,1.5vw,.95rem)">${item.desc || ""}</p>
</div>`).join("")}
</div></section>`;

      case "faq":
        return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:800px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:clamp(2rem,4vw,2.5rem);color:#0f172a">${c.title || "Preguntas Frecuentes"}</h2>
${(c.items || []).map((item: any) => `<details style="margin-bottom:1rem;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
<summary style="padding:clamp(14px,2vw,20px);cursor:pointer;font-weight:600;color:#0f172a;display:flex;justify-content:space-between;align-items:center;font-size:clamp(.9rem,1.5vw,1rem)">${item.question || ""}<span style="font-size:1.2rem;transition:transform .2s">&#9662;</span></summary>
<p style="padding:0 clamp(14px,2vw,20px) clamp(14px,2vw,20px);color:#64748b;line-height:1.6;font-size:clamp(.85rem,1.5vw,.95rem)">${item.answer || ""}</p>
</details>`).join("")}
</section>`;

      case "cta":
        return `<section style="text-align:center;padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);background:var(--primary);color:white">
<h2 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:1rem">${c.title || ""}</h2>
<p style="font-size:clamp(.95rem,2vw,1.15rem);opacity:.9;max-width:650px;margin:0 auto 1.5rem;line-height:1.5">${c.subtitle || ""}</p>
${c.buttonText ? `<a href="${c.buttonUrl || "#"}" data-analytics-click data-analytics-type="click" data-analytics-label="cta_block" style="display:inline-block;background:white;color:var(--primary);padding:clamp(10px,2vw,14px) clamp(24px,4vw,36px);border-radius:10px;text-decoration:none;font-weight:600;font-size:clamp(.9rem,1.5vw,1rem)">${c.buttonText}</a>` : ""}
</section>`;

      case "testimonials": {
        let items = c.items || [];
        if (c.source === "dynamic") {
          items = reviews.map(r => ({
            name: r.authorName,
            quote: r.content,
            role: r.rating ? "★".repeat(r.rating) + "☆".repeat(5 - r.rating) : "",
          }));
        }
        if (items.length === 0) items = [{name: "No hay testimonios", quote: "Aún no hay reseñas publicadas.", role: ""}];

        const cols = c.columns || 3;
        const isCarousel = c.carousel === true;
        const colsClass = cols === 1 ? "1fr" : cols === 2 ? "repeat(2,1fr)" : "repeat(3,1fr)";

        const cardHtml = (item: any) => `<div style="padding:clamp(1.25rem,2.5vw,1.5rem);border-radius:16px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 2px rgba(0,0,0,.04);display:flex;flex-direction:column;height:100%">
<div style="color:#f59e0b;margin-bottom:.75rem;font-size:1rem">${item.role?.includes('★') ? item.role : '★ ★ ★ ★ ★'}</div>
<p style="font-style:italic;color:#475569;margin-bottom:1rem;line-height:1.6;font-size:clamp(.85rem,1.5vw,.95rem);flex:1">&ldquo;${item.quote || ""}&rdquo;</p>
<div style="display:flex;align-items:center;gap:.75rem;margin-top:auto">
<div style="width:clamp(36px,4vw,44px);height:clamp(36px,4vw,44px);border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-weight:700;color:#475569;font-size:clamp(.75rem,1.3vw,.85rem);flex-shrink:0">${(item.name?.[0] || "?").toUpperCase()}</div>
<div>
<div style="font-weight:600;color:#0f172a;font-size:clamp(.85rem,1.5vw,.95rem)">${item.name || ""}</div>
${!item.role?.includes('★') ? `<div style="color:#94a3b8;font-size:clamp(.75rem,1.2vw,.85rem)">${item.role || ""}</div>` : ''}
</div>
</div>
</div>`;

        if (isCarousel) {
          const slidesPerView = cols;
          const totalSlides = Math.ceil(items.length / slidesPerView);
          const slidesArr: any[][] = [];
          for (let s = 0; s < totalSlides; s++) {
            const chunk = items.slice(s * slidesPerView, s * slidesPerView + slidesPerView);
            slidesArr.push(chunk);
          }
          return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto" class="pub-testimonials" data-slides="${totalSlides}" data-active="0">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:clamp(2rem,5vw,3rem);color:#0f172a">${c.title || "Testimonios"}</h2>
${c.subtitle ? `<p style="text-align:center;color:#64748b;margin-top:-1.5rem;margin-bottom:2rem;font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
<div style="position:relative;overflow:hidden">
${slidesArr.map((chunk, si) => `<div class="ts-slide" style="display:grid;grid-template-columns:${colsClass};gap:clamp(1rem,2vw,1.5rem);transition:opacity .4s;${si > 0 ? "opacity:0;position:absolute;inset:0;pointer-events:none" : ""}">${chunk.map(cardHtml).join("")}</div>`).join("")}
</div>
${totalSlides > 1 ? `<div class="pub-testi-dots" style="display:flex;justify-content:center;gap:.5rem;margin-top:1.5rem">${slidesArr.map((_: any, i: number) => `<button class="tdot" data-i="${i}" style="height:8px;border-radius:50px;border:none;cursor:pointer;transition:all .3s;background:${i === 0 ? "#0f172a" : "#e2e8f0"};width:${i === 0 ? "24px" : "8px"}" aria-label="Slide ${i + 1}"></button>`).join("")}</div>` : ""}
</section>`;
        }

        return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:clamp(2rem,5vw,3rem);color:#0f172a">${c.title || "Testimonios"}</h2>
${c.subtitle ? `<p style="text-align:center;color:#64748b;margin-top:-1.5rem;margin-bottom:2rem;font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(${cols === 1 ? "100%" : cols === 2 ? "380px" : "280px"},100%),1fr));gap:clamp(1rem,2vw,1.5rem)">
${items.map(cardHtml).join("")}
</div>
</section>`;
      }

      case "review-form": {
        const tenantId = c.tenantId || site?.tenantId;
        const siteId = c.siteId || site?.id;
        const apiUrl = this.apiBaseUrl();
        return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:600px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:.5rem;color:#0f172a">${c.title || "Déjanos tu opinión"}</h2>
<p style="text-align:center;color:#64748b;margin-bottom:2rem">${c.subtitle || "Valoramos tu experiencia con nosotros"}</p>
<form action="${apiUrl}/api/v1/reviews/public" method="POST" data-pub-form class="pub-form" style="display:flex;flex-direction:column;gap:1.25rem;background:#fff;padding:2rem;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);border:1px solid #e2e8f0">
  <input type="hidden" name="tenantId" value="${tenantId}">
  <input type="hidden" name="siteId" value="${siteId}">
  <div style="display:flex;flex-direction:column;gap:.5rem;align-items:center;margin-bottom:1rem">
    <label style="font-weight:600;color:#334155;font-size:.95rem">Calificación</label>
    <div style="display:flex;flex-direction:row-reverse;gap:0.25rem" class="star-rating">
      <input type="radio" id="star5" name="rating" value="5" style="display:none" checked><label for="star5" style="cursor:pointer;font-size:2rem;color:#fbbf24">★</label>
      <input type="radio" id="star4" name="rating" value="4" style="display:none"><label for="star4" style="cursor:pointer;font-size:2rem;color:#cbd5e1">★</label>
      <input type="radio" id="star3" name="rating" value="3" style="display:none"><label for="star3" style="cursor:pointer;font-size:2rem;color:#cbd5e1">★</label>
      <input type="radio" id="star2" name="rating" value="2" style="display:none"><label for="star2" style="cursor:pointer;font-size:2rem;color:#cbd5e1">★</label>
      <input type="radio" id="star1" name="rating" value="1" style="display:none"><label for="star1" style="cursor:pointer;font-size:2rem;color:#cbd5e1">★</label>
    </div>
  </div>
  <style>
    .star-rating label:hover, .star-rating label:hover ~ label, .star-rating input:checked ~ label { color: #fbbf24 !important; }
  </style>
  <div style="display:flex;flex-direction:column;gap:.5rem">
    <label style="font-weight:600;color:#334155;font-size:.95rem">Tu nombre <span style="color:#ef4444">*</span></label>
    <input type="text" name="authorName" required style="padding:.75rem;border-radius:8px;border:1px solid #cbd5e1;font-size:1rem;outline:none;transition:border-color .2s">
  </div>
  <div style="display:flex;flex-direction:column;gap:.5rem">
    <label style="font-weight:600;color:#334155;font-size:.95rem">Tu correo (Opcional)</label>
    <input type="email" name="authorEmail" style="padding:.75rem;border-radius:8px;border:1px solid #cbd5e1;font-size:1rem;outline:none;transition:border-color .2s">
  </div>
  <div style="display:flex;flex-direction:column;gap:.5rem">
    <label style="font-weight:600;color:#334155;font-size:.95rem">Comentario <span style="color:#ef4444">*</span></label>
    <textarea name="content" required rows="4" style="padding:.75rem;border-radius:8px;border:1px solid #cbd5e1;font-size:1rem;outline:none;transition:border-color .2s;resize:vertical"></textarea>
  </div>
  <div data-pub-form-status class="form-status" style="display:none;padding:.75rem;border-radius:8px;font-size:.95rem"></div>
  <button type="submit" style="background:#0f172a;color:#fff;padding:.875rem 1.5rem;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:background .2s;font-size:1rem;margin-top:.5rem">Enviar opinión</button>
</form>
</section>`;
      }

      case "sorteo-form": {
        const sorteo = c.sorteo;
        const tenantId = c.tenantId || site?.tenantId;
        const apiUrl = this.apiBaseUrl();
        const fields = (sorteo?.fields || []) as any[];
        const bg = (sorteo?.background || {}) as any;
        const fieldHtml = fields.map((f: any) => {
          const req = f.required ? "required" : "";
          const reqStar = f.required ? '<span style="color:#ef4444"> *</span>' : "";
          const label = escapeHtml(f.label || f.name);
          if (f.type === "select" && f.options?.length) {
            const opts = f.options.map((o: string) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("");
            return `<div style="display:flex;flex-direction:column;gap:.4rem"><label style="font-weight:600;color:#334155;font-size:.9rem">${label}${reqStar}</label><select name="${escapeHtml(f.name)}" ${req} style="padding:.7rem;border-radius:8px;border:1px solid #cbd5e1;font-size:.95rem;background:#fff">${opts}</select></div>`;
          }
          if (f.type === "textarea") {
            return `<div style="display:flex;flex-direction:column;gap:.4rem"><label style="font-weight:600;color:#334155;font-size:.9rem">${label}${reqStar}</label><textarea name="${escapeHtml(f.name)}" ${req} rows="3" style="padding:.7rem;border-radius:8px;border:1px solid #cbd5e1;font-size:.95rem;resize:vertical"></textarea></div>`;
          }
          const inputType = f.type === "tel" ? "tel" : f.type === "email" ? "email" : f.type === "number" ? "number" : "text";
          return `<div style="display:flex;flex-direction:column;gap:.4rem"><label style="font-weight:600;color:#334155;font-size:.9rem">${label}${reqStar}</label><input type="${inputType}" name="${escapeHtml(f.name)}" ${req} style="padding:.7rem;border-radius:8px;border:1px solid #cbd5e1;font-size:.95rem"></div>`;
        }).join("\n");

        const desc = sorteo?.description ? `<p style="text-align:center;color:#64748b;margin-bottom:2rem;max-width:500px;margin-left:auto;margin-right:auto">${escapeHtml(sorteo.description)}</p>` : "";
        const endDate = sorteo?.endDate ? `<p style="text-align:center;color:#94a3b8;font-size:.85rem;margin-bottom:1.5rem">Fecha límite: ${new Date(sorteo.endDate).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</p>` : "";

        let sectionBg = "background:#f8fafc;";
        let titleColor = "#0f172a";
        let formBg = "#fff";
        if (bg.type === "color" && bg.color) {
          sectionBg = `background:${bg.color};`;
          titleColor = this.isLightColor(bg.color) ? "#0f172a" : "#ffffff";
          formBg = this.isLightColor(bg.color) ? "#ffffff" : "rgba(255,255,255,0.95)";
        } else if (bg.type === "gradient" && bg.gradientFrom && bg.gradientTo) {
          const angle = bg.gradientAngle || 135;
          sectionBg = `background:linear-gradient(${angle}deg,${bg.gradientFrom},${bg.gradientTo});`;
          titleColor = this.isLightColor(bg.gradientFrom) ? "#0f172a" : "#ffffff";
          formBg = this.isLightColor(bg.gradientFrom) ? "#ffffff" : "rgba(255,255,255,0.95)";
        } else if (bg.type === "image" && bg.imageUrl) {
          sectionBg = `background:url('${escapeHtml(bg.imageUrl)}') center/cover no-repeat;position:relative;`;
          titleColor = "#ffffff";
          formBg = "rgba(255,255,255,0.95)";
        }
        const imageOverlay = bg.type === "image" ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);pointer-events:none"></div>` : "";
        const wrapperOpen = bg.type === "image" ? `<div style="position:relative;${sectionBg}min-height:100vh;display:flex;align-items:center;justify-content:center;padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem)">${imageOverlay}<div style="position:relative;z-index:1;width:100%;max-width:600px">` : "";
        const wrapperClose = bg.type === "image" ? `</div></div>` : "";
        const sectionStyle = bg.type === "image" ? "" : `style="${sectionBg}padding:clamp(5rem,12vw,8rem) clamp(1rem,5vw,2rem);width:100%;min-height:100vh;display:flex;align-items:center;justify-content:center"`;

        return `<section ${sectionStyle}>
${wrapperOpen}
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:.5rem;color:${titleColor}">${escapeHtml(sorteo?.title || "Sorteo")}</h2>
${sorteo?.description ? `<p style="text-align:center;color:${titleColor};opacity:0.8;margin-bottom:2rem;max-width:500px;margin-left:auto;margin-right:auto">${escapeHtml(sorteo.description)}</p>` : ""}
${endDate}
<form action="${apiUrl}/api/v1/sorteos/public/${tenantId}/${sorteo?.slug}/participate" method="POST" data-pub-form class="pub-form" style="display:flex;flex-direction:column;gap:1.1rem;background:${formBg};padding:2rem;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.12);border:1px solid rgba(255,255,255,0.2)">
${fieldHtml}
  <div data-pub-form-status class="form-status" style="display:none;padding:.75rem;border-radius:8px;font-size:.95rem"></div>
  <button type="submit" style="background:#0f172a;color:#fff;padding:.875rem 1.5rem;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:background .2s;font-size:1rem;margin-top:.5rem">Participar</button>
</form>
${wrapperClose}
</section>`;
      }

      case "gallery":
        const images = (c.images || []);
        return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:clamp(2rem,5vw,3rem);color:#0f172a">${c.title || "Galería"}</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(150px,30vw,280px),1fr));gap:clamp(.75rem,1.5vw,1rem)">
${images.map((img: any) => `<img src="${this.absoluteUrl(img.url || "")}" alt="${img.alt || ""}" style="width:100%;height:clamp(160px,25vw,240px);object-fit:cover;border-radius:12px;transition:opacity .2s" loading="lazy">`).join("")}
</div></section>`;

      case "header": {
        const hLogoType = c.logoType || "text";
        const hHasImage = hLogoType === "image" || hLogoType === "both";
        const hHasText = hLogoType === "text" || hLogoType === "both";
        const variant = c.variant || "classic";
        const logoImg = hHasImage && c.logoImage
          ? `<img src="${this.absoluteUrl(c.logoImage)}" alt="${c.logoText || "Logo"}" style="height:clamp(28px,4vw,40px);width:auto;max-width:160px;object-fit:contain;flex-shrink:0">`
          : "";
        const logoTextEl = hHasText
          ? `<div style="font-weight:700;font-size:clamp(.95rem,2vw,1.2rem);color:#0f172a;flex-shrink:0">${c.logoText || ""}</div>`
          : "";
        const logoAvatar = !hHasImage && hHasText
          ? `<div style="height:clamp(28px,4vw,36px);width:clamp(28px,4vw,36px);border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:clamp(.7rem,1.3vw,.85rem);color:#475569;flex-shrink:0">${(c.logoText || "A")[0].toUpperCase()}</div>`
          : "";
        const logoEl = hHasImage && !hHasText ? logoImg : `${logoImg}${logoTextEl}${logoAvatar}`;
        const logoRow = `<div style="display:flex;align-items:center;gap:clamp(.5rem,1.5vw,.75rem);flex-shrink:0">${logoEl}</div>`;
        const ctaBtn = c.ctaText ? `<a href="${c.ctaUrl || "#"}" style="display:inline-block;background:#0f172a;color:white;padding:clamp(8px,1.5vw,10px) clamp(14px,2.5vw,20px);border-radius:10px;text-decoration:none;font-weight:600;font-size:clamp(.8rem,1.3vw,.9rem);white-space:nowrap;transition:background .2s;flex-shrink:0">${c.ctaText}</a>` : "";
        const navLinks = (c.links || []).map((link: any) => `<a href="${link.url || "#"}" style="color:#475569;text-decoration:none;font-size:clamp(.85rem,1.4vw,.95rem);transition:color .2s;white-space:nowrap">${link.label || ""}</a>`).join("");

        if (variant === "centered") {
          return `<header class="pub-header" style="position:sticky;top:0;z-index:100;background:white;border-bottom:1px solid #e2e8f0;padding:clamp(12px,2vw,16px) clamp(1rem,5vw,2rem)">
<div style="max-width:1200px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:clamp(.75rem,2vw,1rem)">
<div style="display:flex;align-items:center;justify-content:space-between;width:100%">
${logoRow}
<button class="pub-menu-btn" style="display:none;background:none;border:none;font-size:1.5rem;cursor:pointer;padding:4px 8px;color:#475569" aria-label="Menú">&#9776;</button>
</div>
<nav class="pub-nav" style="display:flex;gap:clamp(1.5rem,3vw,2.5rem);flex-wrap:wrap;justify-content:center;align-items:center">
${navLinks}
${ctaBtn}
</nav>
</div>
</header>`;
        }

        if (variant === "minimal") {
          return `<header class="pub-header" style="position:sticky;top:0;z-index:100;padding:clamp(12px,2vw,16px) clamp(1rem,5vw,2rem)">
<div style="max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:clamp(1rem,2vw,1.5rem)">
${logoRow}
<button class="pub-menu-btn" style="display:none;background:none;border:none;font-size:1.5rem;cursor:pointer;padding:4px 8px;color:#475569" aria-label="Menú">&#9776;</button>
<nav class="pub-nav" style="display:flex;gap:clamp(1.5rem,3vw,2rem);flex-wrap:wrap;align-items:center">
${navLinks}
${ctaBtn}
</nav>
</div>
</header>`;
        }

        // Classic
        return `<header class="pub-header" style="position:sticky;top:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:clamp(12px,2vw,16px) clamp(1rem,5vw,2rem);background:white;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;gap:.5rem">
${logoRow}
<button class="pub-menu-btn" style="display:none;background:none;border:none;font-size:1.5rem;cursor:pointer;padding:4px 8px;color:#475569" aria-label="Menú">&#9776;</button>
<nav class="pub-nav" style="display:flex;gap:clamp(1rem,2vw,1.5rem);flex-wrap:wrap;align-items:center">
${navLinks}
${ctaBtn}
</nav>
</header>`;
      }

      case "footer":
        return `<footer style="padding:clamp(2.5rem,8vw,3.5rem) clamp(1rem,5vw,2rem);background:#1e293b;color:#cbd5e1">
<div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:clamp(1.5rem,3vw,2.5rem)">
<div>
<h3 style="color:white;margin-bottom:1rem;font-size:clamp(1rem,2vw,1.15rem);font-weight:600">${c.companyName || ""}</h3>
<p style="font-size:clamp(.8rem,1.3vw,.9rem);line-height:1.6">${c.description || ""}</p>
</div>
${(c.columns || []).map((col: any) => `<div>
<h4 style="color:white;margin-bottom:.75rem;font-size:clamp(.8rem,1.3vw,.9rem);font-weight:600">${col.title || ""}</h4>
${(col.links || []).map((link: any) => `<div style="margin-bottom:.5rem"><a href="${link.url || "#"}" style="color:#94a3b8;text-decoration:none;font-size:clamp(.78rem,1.2vw,.85rem);transition:color .2s">${link.label || ""}</a></div>`).join("")}
</div>`).join("")}
</div>
<div style="text-align:center;padding-top:clamp(1.5rem,3vw,2rem);margin-top:clamp(1.5rem,3vw,2rem);border-top:1px solid #334155;font-size:clamp(.7rem,1.1vw,.8rem);opacity:.7">${c.copyright || ""}</div>
</footer>`;

      case "about":
        return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1100px;margin:0 auto">
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:clamp(2rem,5vw,3rem);align-items:center">
<div>
<h2 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;color:#0f172a;margin-bottom:1rem">${c.title || ""}</h2>
<p style="color:#475569;line-height:1.7;font-size:clamp(.9rem,1.5vw,1rem)">${c.description || ""}</p>
${c.buttonText ? `<a href="${c.buttonUrl || "#"}" data-analytics-click data-analytics-type="click" data-analytics-label="about_cta" style="display:inline-block;margin-top:1.5rem;background:var(--primary);color:white;padding:clamp(10px,2vw,14px) clamp(24px,4vw,32px);border-radius:10px;text-decoration:none;font-weight:600;font-size:clamp(.85rem,1.4vw,.95rem)">${c.buttonText}</a>` : ""}
</div>
${c.imageUrl ? `<div><img src="${this.absoluteUrl(c.imageUrl)}" alt="${c.title || ""}" style="width:100%;height:auto;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)" loading="lazy"></div>` : ""}
</div>
</section>`;

      case "contact": {
        const formFields = (c.fields || [{ label: "Nombre", type: "text", name: "name" }, { label: "Email", type: "email", name: "email" }, { label: "Mensaje", type: "textarea", name: "message" }]) as any[];
        const actionUrl = site?.tenantId ? `${this.apiV1Url()}/leads/submit/${site.tenantId}` : "#";
        return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);background:#f8fafc">
<div style="max-width:700px;margin:0 auto">
<div style="text-align:center;margin-bottom:clamp(2rem,4vw,2.5rem)">
<h2 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;color:#0f172a;margin-bottom:.5rem">${c.title || "Contacto"}</h2>
${c.subtitle ? `<p style="color:#64748b;font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
</div>
<form method="POST" action="${actionUrl}" data-pub-form style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:clamp(1.5rem,3vw,2rem);box-shadow:0 1px 3px rgba(0,0,0,.04)">
<input type="hidden" name="siteId" value="${site?.id || ""}">
<div style="display:flex;flex-direction:column;gap:1rem">
${formFields.map((f: any) => {
  if (f.type === "textarea") {
    return `<div><label style="display:block;font-size:clamp(.8rem,1.3vw,.9rem);font-weight:500;color:#334155;margin-bottom:.4rem">${f.label || f.name}${f.required ? ' <span style="color:#ef4444">*</span>' : ""}</label><textarea name="${f.name || "message"}" ${f.required ? "required" : ""} rows="4" style="width:100%;padding:clamp(10px,2vw,14px);border:1px solid #e2e8f0;border-radius:10px;font-size:clamp(.85rem,1.4vw,.95rem);font-family:inherit;resize:vertical;box-sizing:border-box"></textarea></div>`;
  }
  return `<div><label style="display:block;font-size:clamp(.8rem,1.3vw,.9rem);font-weight:500;color:#334155;margin-bottom:.4rem">${f.label || f.name}${f.required ? ' <span style="color:#ef4444">*</span>' : ""}</label><input type="${f.type || "text"}" name="${f.name || "field"}" ${f.required ? "required" : ""} style="width:100%;padding:clamp(10px,2vw,14px);border:1px solid #e2e8f0;border-radius:10px;font-size:clamp(.85rem,1.4vw,.95rem);font-family:inherit;box-sizing:border-box"></div>`;
}).join("")}
<div data-pub-form-status style="display:none;padding:12px 16px;border-radius:10px;font-size:clamp(.85rem,1.3vw,.9rem);text-align:center;font-weight:600"></div>
<button type="submit" style="width:100%;padding:clamp(10px,2vw,14px);background:var(--primary);color:white;border:none;border-radius:12px;font-weight:600;font-size:clamp(.85rem,1.4vw,.95rem);cursor:pointer;transition:background .2s">${c.buttonText || "Enviar"}</button>
</div>
</form>
</div>
</section>`;
      }

      case "whatsapp":
        return `<a href="https://wa.me/${c.phone || "521234567890"}?text=${encodeURIComponent(c.message || "Hola")}" target="_blank" rel="noopener" data-analytics-click data-analytics-type="whatsapp_click" data-analytics-label="whatsapp_block" style="position:fixed;z-index:9999;${c.position === "bottom-left" ? "left:1.5rem" : "right:1.5rem"};bottom:1.5rem;width:${c.size || 56}px;height:${c.size || 56}px;background:${c.color || "#25D366"};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.4);transition:transform .2s,box-shadow .2s;text-decoration:none" title="${c.tooltip || "Chatea con nosotros"}">
<svg width="${Math.floor((c.size || 56) * 0.5)}" height="${Math.floor((c.size || 56) * 0.5)}" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>`;

      case "pricing":
        return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);background:#f8fafc">
<div style="max-width:1200px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:.5rem;color:#0f172a">${c.title || "Nuestros planes"}</h2>
${c.subtitle ? `<p style="text-align:center;color:#64748b;margin-bottom:clamp(2rem,5vw,3rem);font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:clamp(1rem,2vw,1.5rem);align-items:start">
${(c.plans || []).map((plan: any) => {
  const features = typeof plan.features === "string" ? plan.features.split(",").map((s: string) => s.trim()).filter(Boolean) : (plan.features || []);
  const highlighted = plan.highlighted === "true" || plan.highlighted === true;
  return `<div style="border-radius:16px;padding:clamp(1.5rem,3vw,2.5rem);border:2px solid ${highlighted ? "#0f172a" : "#e2e8f0"};background:white;position:relative;${highlighted ? "transform:scale(1.02);box-shadow:0 8px 30px rgba(0,0,0,.08)" : "box-shadow:0 1px 3px rgba(0,0,0,.04)"}">
${highlighted ? `<span style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#0f172a;color:white;font-size:.7rem;font-weight:700;padding:4px 16px;border-radius:100px">Popular</span>` : ""}
<h3 style="font-size:clamp(1rem,2vw,1.2rem);font-weight:700;color:#0f172a;margin-bottom:.5rem">${plan.name || "Plan"}</h3>
<div style="font-size:clamp(2rem,5vw,3rem);font-weight:800;color:#0f172a;margin-bottom:.25rem">${plan.price || "$0"}</div>
${plan.description ? `<p style="color:#64748b;font-size:clamp(.8rem,1.3vw,.9rem);margin-bottom:1.5rem">${plan.description}</p>` : ""}
<ul style="list-style:none;padding:0;margin:0 0 1.5rem 0;display:flex;flex-direction:column;gap:.75rem">
${features.map((f: string) => `<li style="display:flex;gap:.5rem;font-size:clamp(.8rem,1.3vw,.9rem);color:#334155;line-height:1.4"><span style="color:#22c55e;flex-shrink:0;font-weight:700">✓</span> ${f}</li>`).join("")}
</ul>
${plan.buttonText ? `<a href="${plan.buttonUrl || "#"}" style="display:block;text-align:center;padding:clamp(10px,2vw,14px);border-radius:12px;font-weight:600;font-size:clamp(.85rem,1.3vw,.95rem);text-decoration:none;transition:background .2s;${highlighted ? "background:#0f172a;color:white" : "background:#f1f5f9;color:#0f172a"}">${plan.buttonText}</a>` : ""}
</div>`;
}).join("")}
</div>
</div>
</section>`;

      case "team":
        return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:.5rem;color:#0f172a">${c.title || "Nuestro equipo"}</h2>
${c.subtitle ? `<p style="text-align:center;color:#64748b;margin-bottom:clamp(2rem,5vw,3rem);font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));gap:clamp(1.5rem,3vw,2.5rem);text-align:center">
${(c.members || []).map((m: any) => `<div>
<div style="width:clamp(100px,20vw,140px);height:clamp(100px,20vw,140px);border-radius:16px;overflow:hidden;background:#f1f5f9;margin:0 auto;border:2px solid #e2e8f0;transition:border-color .2s">
${m.image ? `<img src="${m.image}" alt="${m.name || ""}" style="width:100%;height:100%;object-fit:cover">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:clamp(1.5rem,4vw,2.5rem);font-weight:700;color:#94a3b8">${(m.name?.[0] || "?").toUpperCase()}</div>`}
</div>
<h3 style="margin-top:1rem;font-weight:700;font-size:clamp(.9rem,1.5vw,1.05rem);color:#0f172a">${m.name || ""}</h3>
<p style="font-size:clamp(.75rem,1.2vw,.85rem);color:#64748b;margin-top:.25rem">${m.role || ""}</p>
${m.bio ? `<p style="font-size:clamp(.75rem,1.2vw,.85rem);color:#94a3b8;margin-top:.5rem;line-height:1.5">${m.bio}</p>` : ""}
</div>`).join("")}
</div>
</section>`;

      case "features":
        return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:.5rem;color:#0f172a">${c.title || "¿Por qué elegirnos?"}</h2>
${c.subtitle ? `<p style="text-align:center;color:#64748b;margin-bottom:clamp(2rem,5vw,3rem);font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:clamp(1rem,2vw,1.5rem)">
${(c.items || []).map((item: any) => `<div style="padding:clamp(1.25rem,2.5vw,2rem);border-radius:16px;background:#fff;border:1px solid #e2e8f0;transition:box-shadow .2s,border-color .2s">
<div style="font-size:clamp(1.5rem,3vw,2rem);margin-bottom:.75rem">${item.icon || "✨"}</div>
<h3 style="font-weight:600;color:#0f172a;margin-bottom:.5rem;font-size:clamp(.95rem,1.5vw,1.05rem)">${item.title || ""}</h3>
<p style="color:#64748b;font-size:clamp(.8rem,1.3vw,.9rem);line-height:1.6">${item.desc || ""}</p>
</div>`).join("")}
</div>
</section>`;

      case "form": {
        const formFields = (c.fields || []) as any[];
        const actionUrl = site?.tenantId ? `${this.apiV1Url()}/leads/submit/${site.tenantId}` : "#";
        return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);background:#f8fafc">
<div style="max-width:700px;margin:0 auto">
<div style="text-align:center;margin-bottom:clamp(2rem,4vw,2.5rem)">
<h2 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;color:#0f172a;margin-bottom:.5rem">${c.title || "Contáctanos"}</h2>
${c.subtitle ? `<p style="color:#64748b;font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
</div>
<form method="POST" action="${actionUrl}" data-pub-form style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:clamp(1.5rem,3vw,2rem);box-shadow:0 1px 3px rgba(0,0,0,.04)">
<input type="hidden" name="siteId" value="${site?.id || ""}">
<div style="display:flex;flex-direction:column;gap:1rem">
${formFields.map((f: any) => {
  if (f.type === "textarea") {
    return `<div><label style="display:block;font-size:clamp(.8rem,1.3vw,.9rem);font-weight:500;color:#334155;margin-bottom:.4rem">${f.label || f.name}${f.required ? ' <span style="color:#ef4444">*</span>' : ""}</label><textarea name="${f.name || "message"}" ${f.required ? "required" : ""} rows="4" style="width:100%;padding:clamp(10px,2vw,14px);border:1px solid #e2e8f0;border-radius:10px;font-size:clamp(.85rem,1.4vw,.95rem);font-family:inherit;resize:vertical;box-sizing:border-box"></textarea></div>`;
  }
  return `<div><label style="display:block;font-size:clamp(.8rem,1.3vw,.9rem);font-weight:500;color:#334155;margin-bottom:.4rem">${f.label || f.name}${f.required ? ' <span style="color:#ef4444">*</span>' : ""}</label><input type="${f.type || "text"}" name="${f.name || "field"}" ${f.required ? "required" : ""} style="width:100%;padding:clamp(10px,2vw,14px);border:1px solid #e2e8f0;border-radius:10px;font-size:clamp(.85rem,1.4vw,.95rem);font-family:inherit;box-sizing:border-box"></div>`;
}).join("")}
<div data-pub-form-status style="display:none;padding:12px 16px;border-radius:10px;font-size:clamp(.85rem,1.3vw,.9rem);text-align:center;font-weight:600"></div>
<button type="submit" style="width:100%;padding:clamp(10px,2vw,14px);background:#0f172a;color:white;border:none;border-radius:12px;font-weight:600;font-size:clamp(.85rem,1.4vw,.95rem);cursor:pointer;transition:background .2s">${c.buttonText || "Enviar"}</button>
</div>
</form>
</div>
</section>`;
      }

      case "image":
        const align = c.alignment || "center";
        const imgHtml = `<img src="${this.absoluteUrl(c.url || "")}" alt="${c.alt || ""}" style="width:100%;height:auto;border-radius:16px;display:block;${align === "center" ? "margin:0 auto" : align === "right" ? "margin-left:auto" : ""}" loading="lazy">`;
        const imgEl = c.link ? `<a href="${c.link}" target="_blank" rel="noopener" style="display:block;transition:opacity .2s">${imgHtml}</a>` : imgHtml;
        return `<section style="padding:clamp(2rem,6vw,4rem) clamp(1rem,5vw,2rem);max-width:1100px;margin:0 auto">
${imgEl}
${c.caption ? `<p style="text-align:center;margin-top:.75rem;font-size:clamp(.8rem,1.3vw,.9rem);color:#64748b">${c.caption}</p>` : ""}
</section>`;

      case "video": {
        const getEmbedUrl = (url: string) => {
          const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
          if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}${c.autoplay ? "?autoplay=1&mute=1" : ""}`;
          const vmMatch = url.match(/vimeo\.com\/(\d+)/);
          if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}${c.autoplay ? "?autoplay=1" : ""}`;
          return url;
        };
        const [a, b] = (c.aspectRatio || "16/9").split("/").map((x: string) => Number(x));
        const pad = (b / a) * 100;
        return `<section style="padding:clamp(2rem,6vw,4rem) clamp(1rem,5vw,2rem);max-width:1100px;margin:0 auto">
${c.title ? `<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2rem);font-weight:800;color:#0f172a;margin-bottom:clamp(1.5rem,3vw,2rem)">${c.title}</h2>` : ""}
<div style="position:relative;padding-top:${pad}%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
<iframe src="${getEmbedUrl(c.url || "")}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${c.title || "Video"}"></iframe>
</div>
</section>`;
      }

      case "linktree": {
        const lt = c.linktree;
        if (!lt) return "";
        const bg = lt.background;
        let sectionBg = "background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%)";
        let titleColor = "#ffffff";
        let descColor = "rgba(255,255,255,0.7)";
        let linkBg = "rgba(255,255,255,0.1)";
        let linkBorder = "1px solid rgba(255,255,255,0.15)";
        let linkText = "#ffffff";
        let socialBg = "rgba(255,255,255,0.12)";
        let socialText = "#ffffff";
        let isDark = true;
        let cardShadow = "0 8px 32px rgba(0,0,0,0.3)";
        if (bg?.type === "color" && bg.value) {
          sectionBg = `background:${bg.value}`;
          isDark = !this.isLightColor(bg.value);
        } else if (bg?.type === "gradient" && bg.value) {
          sectionBg = `background:${bg.value}`;
          isDark = !this.isLightColor(bg.gradientFrom || "#ffffff");
        } else if (bg?.type === "image" && bg.value) {
          sectionBg = `background:url('${escapeHtml(bg.value)}') center/cover no-repeat fixed`;
          isDark = true;
        }
        if (!isDark) {
          titleColor = "#0f172a"; descColor = "#64748b";
          linkBg = "#ffffff"; linkText = "#0f172a"; linkBorder = "1px solid #e2e8f0";
          socialBg = "#f1f5f9"; socialText = "#334155";
          cardShadow = "0 4px 20px rgba(0,0,0,0.08)";
        }
        const imageOverlay = bg?.type === "image" ? `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.6) 0%,rgba(0,0,0,0.4) 100%)"></div>` : "";
        const relativeOpen = bg?.type === "image" ? `<div style="position:relative">` : "";
        const relativeClose = bg?.type === "image" ? `</div>` : "";
        const logoShadow = isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.12)";

        const logoHtml = lt.logoUrl
          ? `<img src="${escapeHtml(this.absoluteUrl(lt.logoUrl))}" alt="${escapeHtml(lt.title)}" style="max-height:100px;width:auto;max-width:200px;object-fit:contain;margin-bottom:1.5rem;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.15))">`
          : `<div style="width:112px;height:112px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;display:flex;align-items:center;justify-content:center;font-size:2.25rem;font-weight:800;margin-bottom:1.25rem;box-shadow:${logoShadow};border:3px solid ${isDark ? "rgba(0,0,0,0.3)" : "#ffffff"};letter-spacing:-0.02em">${escapeHtml((lt.title || "?")[0]?.toUpperCase() || "?")}</div>`;

        const socialIcons: Record<string, string> = {
          instagram: "#E4405F", facebook: "#1877F2", twitter: "#1DA1F2",
          tiktok: "#000000", youtube: "#FF0000", whatsapp: "#25D366", linkedin: "#0A66C2",
        };
        const socialSvg: Record<string, string> = {
          instagram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
          facebook: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
          twitter: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
          tiktok: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 3.76.93V6.69z"/></svg>',
          youtube: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
          whatsapp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
          linkedin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
        };
        const socialsHtml = (lt.socials || []).map((s: any) => {
          const color = socialIcons[s.platform] || (isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0");
          const svg = socialSvg[s.platform] || `<span style="font-weight:700;font-size:.75rem;text-transform:capitalize">${escapeHtml((s.platform || "").substring(0, 2))}</span>`;
          return `<a href="${escapeHtml(s.url || "#")}" target="_blank" rel="noopener noreferrer" style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all .3s cubic-bezier(.4,0,.2,1);text-decoration:none;background:${color};color:#fff;box-shadow:0 4px 14px ${color}44" onmouseover="this.style.transform='translateY(-3px) scale(1.1)';this.style.boxShadow='0 8px 20px ${color}66'" onmouseout="this.style.transform='translateY(0) scale(1)';this.style.boxShadow='0 4px 14px ${color}44'">${svg}</a>`;
        }).join("\n");

        const linksHtml = (lt.links || []).filter((l: any) => l.isActive !== false).map((l: any, i: number) =>
          `<a href="${escapeHtml(l.url || "#")}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;width:100%;padding:1rem 1.5rem;border-radius:16px;text-align:center;font-weight:600;font-size:.95rem;letter-spacing:.01em;text-decoration:none;transition:all .3s cubic-bezier(.4,0,.2,1);box-shadow:${cardShadow};background:${linkBg};color:${linkText};border:${linkBorder};backdrop-filter:blur(10px)" onmouseover="this.style.transform='translateY(-3px) scale(1.02)';this.style.boxShadow='0 12px 40px rgba(0,0,0,0.25)'" onmouseout="this.style.transform='translateY(0) scale(1)';this.style.boxShadow='${cardShadow}'">${escapeHtml(l.title || "")}</a>`
        ).join("\n");

        return `<style>.linktree-fade{animation:linktreeIn .6s cubic-bezier(.16,1,.3,1) both}@keyframes linktreeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}</style>
<section style="${sectionBg};min-height:100vh;width:100%;display:flex;flex-direction:column;align-items:center;padding:clamp(4rem,12vw,6rem) clamp(1rem,5vw,2rem)">
${imageOverlay}
${relativeOpen}
<div style="width:100%;max-width:24rem;margin:0 auto;position:relative;z-index:1" class="linktree-fade">
<div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:2.5rem">
${logoHtml}
<h1 style="font-size:1.75rem;font-weight:800;margin-bottom:.5rem;color:${titleColor};letter-spacing:-.02em;line-height:1.2">${escapeHtml(lt.title || "")}</h1>
${lt.description ? `<p style="font-size:.95rem;color:${descColor};line-height:1.5;max-width:320px;margin:0 auto">${escapeHtml(lt.description)}</p>` : ""}
</div>
${socialsHtml ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:.75rem;margin-bottom:2.5rem">${socialsHtml}</div>` : ""}
${linksHtml ? `<div style="display:flex;flex-direction:column;gap:.875rem">${linksHtml}</div>` : ""}
<div style="margin-top:3.5rem;text-align:center">
<a href="https://icebergup.com" target="_blank" rel="noopener noreferrer" style="font-size:.7rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;color:${isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)"};transition:color .3s" onmouseover="this.style.color='${isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)"}'" onmouseout="this.style.color='${isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)"}'">Hecho por Iceberg Agency</a>
</div>
</div>
${relativeClose}
</section>`;
      }

      default:
        return `<div style="padding:clamp(2rem,5vw,3rem) clamp(1rem,4vw,2rem);text-align:center;color:#94a3b8"><p>Bloque: ${type}</p></div>`;
    }
  }
}
