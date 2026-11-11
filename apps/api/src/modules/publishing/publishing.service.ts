import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { applyCatalogToContent, isCatalogSection, renderTemplateVariantHtml, renderGenericBlockHtml, genericPageBaseCss, sanitizeTemplateContent, THEMED_TEMPLATE_VARIANTS, getTemplateThemeColors, getTemplateThemeFonts } from "@plataforma/shared";
import {
  resolvePublicSiteUrl,
  normalizePublicPath,
  escapeHtml,
} from "./seo-helpers";
import {
  applyPaletteToThemeColors,
  applyPaletteToVariantHtml,
  buildCapturedThemeOverrides,
  explicitPaletteRoles,
  paletteCssVariables,
  resolveSitePalette,
  type SitePalette,
} from "@plataforma/shared";
import { resolveBlogSettings } from "../blog/blog.util";
import { buildSnapshot, isSnapshot, snapshotPages } from "./published-snapshot";
import { Prisma } from "@prisma/client";

/** Ruta reservada de la página de error 404 del sitio/plantilla. */
const ERROR_PAGE_PATH = "/404";
/** Ruta reservada de la página de mantenimiento mostrada al despublicar. */
const MAINTENANCE_PAGE_PATH = "/mantenimiento";

type UnpublishedBehavior = "404" | "maintenance";

function resolveUnpublishedBehavior(settings: any): UnpublishedBehavior {
  const raw = settings && typeof settings === "object" ? settings.unpublishedBehavior : null;
  return raw === "maintenance" ? "maintenance" : "404";
}

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
  private readonly htmlCache = new Map<string, { value: string; expiry: number; version?: string }>();
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

  private setCached(cache: Map<string, { value: string; expiry: number; version?: string }>, key: string, value: string, ttlMs: number, version?: string) {
    if (cache.size >= PublishingService.CACHE_MAX) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    cache.set(key, { value, expiry: Date.now() + ttlMs, version });
  }

  /**
   * Versión del sitio para validar la caché. invalidateCache solo limpia la instancia que
   * publicó; con varias instancias de Cloud Run las demás servían la versión vieja hasta
   * 60 s. Comparar esta versión (una consulta mínima por índice único) lo evita.
   */
  private siteVersionOf(site: { id?: string; updatedAt?: Date | null; publishedAt?: Date | null; isPublished?: boolean } | null): string {
    if (!site) return "missing";
    return `${site.id}:${site.updatedAt?.getTime() ?? 0}:${site.publishedAt?.getTime() ?? 0}:${site.isPublished ? 1 : 0}`;
  }

  private async currentSiteVersion(subdomain: string): Promise<string> {
    const site = await this.prisma.site.findFirst({
      where: { OR: [{ subdomain }, { domain: subdomain }], deletedAt: null },
      select: { id: true, updatedAt: true, publishedAt: true, isPublished: true },
    });
    return this.siteVersionOf(site);
  }

  private invalidateCache(subdomain: string) {
    for (const key of [...this.htmlCache.keys(), ...this.staticCache.keys()]) {
      if (key.startsWith(subdomain)) {
        this.htmlCache.delete(key);
        this.staticCache.delete(key);
      }
    }
  }

  /**
   * Páginas que ve el público: la copia guardada al publicar, no el borrador del editor.
   * Un sitio publicado antes de existir la copia la recibe la primera vez que se visita,
   * con lo que el público ya estaba viendo (no cambia nada para sus visitantes).
   */
  private async publicPagesOf(site: { id: string; isPublished?: boolean; publishedSnapshot?: any }, withBlocks = true): Promise<any[]> {
    if (isSnapshot(site.publishedSnapshot)) {
      const pages = snapshotPages(site.publishedSnapshot);
      return withBlocks ? pages : pages.map(({ blocks: _b, ...page }) => page);
    }
    const live = await this.prisma.sitePage.findMany({
      where: { siteId: site.id },
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    if (site.isPublished) {
      await this.prisma.site
        .updateMany({ where: { id: site.id, publishedSnapshot: { equals: Prisma.AnyNull } }, data: { publishedSnapshot: buildSnapshot(live) as any } })
        .catch((err: any) => console.warn(`[publishing] No se pudo guardar la copia publicada de ${site.id}: ${err?.message}`));
    }
    return withBlocks ? live : live.map(({ blocks: _b, ...page }: any) => page);
  }

  async publish(id: string, tenantId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        tenant: { select: { subdomain: true, customDomain: true } },
      },
    });

    if (!site) throw new NotFoundException("Site not found");

    // La copia publicada es el borrador tal cual (con las secciones ocultas: se filtran al dibujar).
    const draftPages = await this.prisma.sitePage.findMany({
      where: { siteId: id },
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    const publishedAt = new Date();

    await this.prisma.site.update({
      where: { id },
      data: { isPublished: true, publishedAt, publishedSnapshot: buildSnapshot(draftPages, publishedAt) as any },
    });

    const cacheKeys = [site.tenant?.subdomain, site.subdomain, site.domain].filter(
      Boolean
    ) as string[];
    for (const key of cacheKeys) this.invalidateCache(key);

    return {
      url: resolvePublicSiteUrl(site),
      publishedAt,
      pages: draftPages.length,
    };
  }

  async unpublish(id: string, tenantId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        subdomain: true,
        domain: true,
        tenant: { select: { subdomain: true } },
      },
    });
    if (!site) throw new NotFoundException("Site not found");

    await this.prisma.site.update({
      where: { id },
      data: { isPublished: false },
    });

    const cacheKeys = [site?.tenant?.subdomain, site?.subdomain, site?.domain].filter(
      Boolean
    ) as string[];
    for (const key of cacheKeys) this.invalidateCache(key);

    return { published: false };
  }

  async preview(id: string, tenantId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id, tenantId, deletedAt: null },
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
    });

    if (!site) throw new NotFoundException("Site not found");
    const pages = await this.publicPagesOf(site);
    for (const pg of pages) pg.blocks = (pg.blocks || []).filter((b: any) => !b.styles?.hidden); // secciones ocultas desde el editor

    return {
      site: {
        name: site.name,
        primaryColor: site.primaryColor,
        logoUrl: site.logoUrl,
        faviconUrl: site.faviconUrl,
        seoTitle: site.seoTitle,
        seoDesc: site.seoDesc,
      },
      pages: pages.map((p: any) => ({
        name: p.name,
        slug: p.slug,
        path: p.path,
        blocks: p.blocks,
      })),
    };
  }

  async renderTemplatePreview(site: any, pagePath?: string): Promise<string> {
    return this.renderFullSite(site, pagePath);
  }

  async getPublicHtml(subdomain: string, path?: string): Promise<{ html: string; status: number }> {
    const cacheKey = `${subdomain}:${path || "/"}`;
    const entry = this.htmlCache.get(cacheKey);
    if (entry && entry.expiry > Date.now()) {
      // Otra instancia pudo publicar, despublicar o cambiar el sitio: se valida la versión.
      if (entry.version && entry.version === (await this.currentSiteVersion(subdomain))) {
        return { html: entry.value, status: 200 };
      }
      this.htmlCache.delete(cacheKey);
    } else if (entry) {
      this.htmlCache.delete(cacheKey);
    }

    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    const promise = withTimeout((async () => {
      const site = await this.prisma.site.findFirst({
        where: {
          OR: [{ subdomain }, { domain: subdomain }],
          deletedAt: null,
        },
        include: {
          tenant: { select: { settings: true } },
        },
      }) as any;

      if (!site) throw new NotFoundException("Site not found");
      // Lo publicado, no el borrador del editor.
      site.pages = await this.publicPagesOf(site);
      for (const pg of site.pages) pg.blocks = (pg.blocks || []).filter((b: any) => !b.styles?.hidden); // secciones ocultas desde el editor

      // Sitio despublicado: mostrar página de mantenimiento (503) o 404 según la config.
      if (!site.isPublished) {
        const behavior = resolveUnpublishedBehavior(site.settings);
        let page: any;
        let status: number;
        if (behavior === "maintenance") {
          page = this.synthesizeMaintenancePage(site);
          site.pages.push(page);
          status = 503;
        } else {
          page = this.resolveErrorPage(site);
          status = 404;
        }
        const pagePath = normalizePublicPath(page?.path || ERROR_PAGE_PATH);
        const html = await this.renderFullSite(site, pagePath, []);
        return { html, status };
      }

      // Blog (opt-in): /<slug> (índice) y /<slug>/<articulo>.
      const blog = resolveBlogSettings(site.settings);
      if (blog.enabled && path) {
        const wanted = normalizePublicPath(path);
        const base = `/${blog.slug}`;
        if (wanted === base || wanted === `${base}/`) {
          const page = await this.buildBlogIndexPage(site, blog);
          site.pages.push(page as any);
          const html = await this.renderFullSite(site, page.path, []);
          return { html, status: 200 };
        }
        if (wanted.startsWith(`${base}/`)) {
          const articleSlug = wanted.slice(base.length + 1);
          const article = await this.prisma.blogArticle.findFirst({
            where: { siteId: site.id, tenantId: site.tenantId, slug: articleSlug, isPublished: true },
          });
          if (article) {
            const page = this.buildBlogArticlePage(site, blog, article);
            site.pages.push(page as any);
            const html = await this.renderFullSite(site, page.path, []);
            return { html, status: 200 };
          }
        }
      }

      const isReviewFormRoute = path && normalizePublicPath(path) === "/dejar-opinion";
      const isCheckoutRoute = !!path && normalizePublicPath(path) === "/checkout";

      let sorteoSlug: string | null = null;
      let linktreeSlug: string | null = null;
      if (path && !isReviewFormRoute) {
        const cleanPath = normalizePublicPath(path).replace(/^\//, "");
        const sorteo = await this.prisma.sorteo.findFirst({
          where: { tenantId: site.tenantId, slug: cleanPath, isActive: true },
          select: { id: true, title: true, slug: true, description: true, fields: true, startDate: true, endDate: true },
        });
        if (sorteo) sorteoSlug = sorteo.slug;

        if (!sorteoSlug) {
          const linktreeMatch = await this.prisma.linkPage.findFirst({
            where: { tenantId: site.tenantId, slug: cleanPath, isActive: true },
          });
          if (linktreeMatch) linktreeSlug = linktreeMatch.slug;
        }
      }

      if (path && !isReviewFormRoute && !isCheckoutRoute && !sorteoSlug && !linktreeSlug) {
        const wanted = normalizePublicPath(path);
        const match = site.pages.find(
          (p: any) => normalizePublicPath(p.path) === wanted
        );
        if (!match) {
          const errorPage = this.resolveErrorPage(site);
          const errorPath = normalizePublicPath(errorPage?.path || ERROR_PAGE_PATH);
          const html = await this.renderFullSite(site, errorPath, []);
          return { html, status: 404 };
        }
      }

      if (isReviewFormRoute) {
        site.pages.push({
          name: "Dejar Opinión",
          path: "/dejar-opinion",
          isDefault: false,
          blocks: [{ type: "review-form", content: { tenantId: site.tenantId, siteId: site.id }, styles: {} } as any]
        } as any);
      }

      if (isCheckoutRoute) {
        const hasUrbanNoir = site.pages.some(
          (p: any) => (p.blocks || []).some((b: any) => b.content && b.content.variant === "urban-noir")
        );
        if (!hasUrbanNoir) throw new NotFoundException("Page not found");
        const defaultPage = site.pages.find((p: any) => p.isDefault) || site.pages[0];
        const headerBlock = defaultPage?.blocks?.find((b: any) => b.type === "header");
        const footerBlock = defaultPage?.blocks?.find((b: any) => b.type === "footer");
        const tenantSettings = (site.tenant?.settings as any) || {};
        const paymentGateway = tenantSettings.paymentGateway || {};
        const paypalCfg = paymentGateway.providers?.paypal || {};
        const payphoneCfg = paymentGateway.providers?.payphone || {};
        const paymentConfig = {
          defaultMethod:
            paymentGateway.defaultMethod === "paypal"
              ? "paypal"
              : paymentGateway.defaultMethod === "payphone"
                ? "payphone"
                : "cod",
          currency: "USD",
          paypal: {
            enabled: paypalCfg.enabled === true && !!paypalCfg.clientId,
            clientId: String(paypalCfg.clientId || ""),
            mode: paypalCfg.mode === "live" ? "live" : "sandbox",
          },
          payphone: {
            enabled: payphoneCfg.enabled === true && !!payphoneCfg.token && !!payphoneCfg.storeId,
            token: String(payphoneCfg.token || ""),
            storeId: String(payphoneCfg.storeId || ""),
            mode: payphoneCfg.mode === "live" ? "live" : "sandbox",
          },
        };
        const blocks: any[] = [
          headerBlock ? ({ ...headerBlock } as any) : null,
          { type: "checkout", content: { variant: "urban-noir", tenantId: site.tenantId, checkoutBase: resolvePublicSiteUrl(site), payment: paymentConfig }, styles: {} } as any,
          footerBlock ? ({ ...footerBlock } as any) : null,
        ].filter(Boolean) as any[];
        site.pages.push({
          name: "Checkout",
          path: "/checkout",
          isDefault: false,
          blocks,
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
          select: { id: true, title: true, slug: true, description: true, fields: true, startDate: true, endDate: true },
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
      this.setCached(this.htmlCache, cacheKey, html, 60_000, this.siteVersionOf(site));
      return { html, status: 200 };
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
      }) as any;

      if (!site) throw new NotFoundException("Site not found");
      site.pages = await this.publicPagesOf(site, false);

      const urlBase = resolvePublicSiteUrl(site);
      const lastmod =
        site.publishedAt?.toISOString().split("T")[0] ||
        new Date().toISOString().split("T")[0];

      const sitemapPages = site.pages.filter(
        (page: any) =>
          normalizePublicPath(page.path || "/") !== ERROR_PAGE_PATH && page.slug !== "404"
      );
      const entry = (loc: string, priority: string) =>
        `  <url>\n    <loc>${escapeHtml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

      const urls = sitemapPages.map((page) => {
        const loc =
          page.path === "/" ? urlBase : `${urlBase}${normalizePublicPath(page.path)}`;
        const priority = page.isDefault ? "1.0" : "0.8";
        return entry(loc, priority);
      });

      const blog = resolveBlogSettings(site.settings);
      if (blog.enabled) {
        urls.push(entry(`${urlBase}/${blog.slug}`, "0.7"));
        const articles = await this.prisma.blogArticle.findMany({
          where: { siteId: site.id, isPublished: true },
          select: { slug: true },
          orderBy: { publishedAt: "desc" },
        });
        for (const a of articles) {
          urls.push(entry(`${urlBase}/${blog.slug}/${a.slug}`, "0.6"));
        }
      }

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
    return "https://plataforma-api-rkav7vkxia-uc.a.run.app";
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

  /** Reemplaza tokens `{{__ED::asset:...}}` dentro de CSS por URLs absolutas. */
  private resolveCssAssetTokens(css: string): string {
    return String(css || "").replace(/\{\{__ED::asset:([^{}]+)\}\}/g, (_m, ref: string) => {
      const rel = String(ref || "").trim();
      if (/^https?:\/\//i.test(rel)) return rel;
      return `${this.apiBaseUrl()}${rel}`;
    });
  }

  private isHexColor(value: any): boolean {
    return typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
  }

  /**
   * Aplica la paleta global a los bloques genéricos (sin variante). Las
   * variantes de plantilla manejan su propio theming más abajo.
   */
  private applyPaletteToBlock(block: any, palette: SitePalette, explicit: boolean): any {
    if (!explicit) return block;
    const content = block?.content;
    if (!content || typeof content !== "object" || content.variant) return block;
    return {
      ...block,
      content: {
        ...content,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
      },
    };
  }

  /** Serializa atributos de `<html>`/`<body>` capturados al importar la plantilla. */
  private attrsToHtml(
    attrs: Record<string, string> | undefined,
    defaults: Record<string, string> = {},
    extraClass = ""
  ): string {
    const merged: Record<string, string> = { ...defaults };
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value == null) continue;
      merged[String(key).toLowerCase()] = String(value);
    }
    if (extraClass) merged.class = [merged.class, extraClass].filter(Boolean).join(" ").trim();
    return Object.entries(merged)
      .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
      .join(" ");
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
    const variant = site.pages?.[0]?.blocks?.[0]?.content?.variant;
    const isRawHtml = variant === "raw-html";

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
${isRawHtml ? "" : "*{margin:0;padding:0;box-sizing:border-box}\nbody{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#1e293b}"}
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

  /**
   * Secciones de productos "en vivo": se llenan con los productos de la tienda según sus
   * opciones (categoría, orden, cantidad, agotados). La selección es la misma que ve el editor
   * (applyCatalogToContent en @plataforma/shared).
   */
  private async hydrateCatalogProducts(blocks: any[], site: any): Promise<any[]> {
    const catalogBlocks = (blocks || []).filter((b: any) => isCatalogSection(b.type, b.content));
    if (catalogBlocks.length === 0) return blocks;

    const products = await this.prisma.product.findMany({
      where: { tenantId: site.tenantId, isActive: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 500,
      select: { id: true, name: true, price: true, comparePrice: true, images: true, description: true, isActive: true, isFeatured: true, stock: true, categoryId: true, createdAt: true },
    });
    for (const block of catalogBlocks) {
      block.content = applyCatalogToContent(block.type, block.content, products as any, (url) => this.absoluteUrl(url));
    }
    return blocks;
  }

  private urbanNoirCartHtml(subdomain: string, sitePublicUrl: string): string {
    const api = this.apiV1Url();
    const cfg = `window.UN_CART_CFG = { subdomain: "${subdomain}", apiBase: "${api}", siteBase: "${sitePublicUrl}" };`;
    return `
<div id="un-cart-overlay" class="fixed inset-0 bg-black/50 z-[10000] hidden" aria-hidden="true"></div>
<aside id="un-cart-drawer" aria-label="Carrito" class="fixed top-0 right-0 z-[10001] h-full w-full max-w-md bg-white flex flex-col translate-x-full transition-transform duration-300 ease-in-out">
  <div class="flex items-center justify-between px-6 py-5 border-b border-black">
    <h3 class="font-display font-bold uppercase tracking-widest text-lg">Tu carrito</h3>
    <button type="button" id="un-cart-close" aria-label="Cerrar carrito" class="hover:opacity-60">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  </div>
  <div id="un-cart-body" class="flex-1 overflow-y-auto">
    <div id="un-cart-view" class="px-6 py-4"></div>
  </div>
  <div id="un-cart-summary" class="border-t border-black px-6 py-5">
    <div class="flex justify-between items-baseline mb-1">
      <span class="uppercase tracking-widest text-sm">Subtotal</span>
      <span id="un-cart-subtotal" class="font-bold text-lg">$0.00</span>
    </div>
    <button id="un-go-checkout" class="mt-4 w-full bg-black text-white font-bold py-4 uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors">Finalizar pedido</button>
    <button id="un-cart-vaciar" class="mt-2 w-full text-xs uppercase tracking-widest text-gray-500 hover:text-black transition-colors">Vaciar carrito</button>
  </div>
</aside>
<script>
${cfg}
(function(){
  var cfg = window.UN_CART_CFG || {};
  var STORE = "un_cart_v1";
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(STORE) || "[]") || []; } catch (e) { cart = []; }
  if (!Array.isArray(cart)) cart = [];
  function money(n){ return Number(n || 0).toFixed(2); }
  function count(){ var s = 0; for (var i = 0; i < cart.length; i++) { s += (Number(cart[i].qty) || 0); } return s; }
  function totalSum(){ var s = 0; for (var j = 0; j < cart.length; j++) { s += (Number(cart[j].price) || 0) * (Number(cart[j].qty) || 0); } return s; }
  function save(){ try { localStorage.setItem(STORE, JSON.stringify(cart)); } catch (e) {} }
  var overlay = document.getElementById("un-cart-overlay");
  var drawer = document.getElementById("un-cart-drawer");
  var viewEl = document.getElementById("un-cart-view");
  var summary = document.getElementById("un-cart-summary");
  var subtotalEl = document.getElementById("un-cart-subtotal");
  var badge = document.querySelector("#un-cart-btn [data-count]");
  var coItemsEl = document.getElementById("un-co-items");
  var coTotalEl = document.getElementById("un-co-total");
  var coEmptyEl = document.getElementById("un-co-empty");
  var coWrapEl = document.getElementById("un-co-wrap");
  var coDoneEl = document.getElementById("un-co-done");
  var coBtnAmount = document.getElementById("un-co-btn-amount");
  var checkoutBase = cfg.siteBase || ((cfg.apiBase || "") + "/p/" + (cfg.subdomain || ""));
  var apiCheckoutBase = (cfg.apiBase || "") + "/p/" + (cfg.subdomain || "");
  var paymentBox = document.getElementById("un-payment-box");
  var paypalEnabled = paymentBox && paymentBox.getAttribute("data-paypal-enabled") === "1";
  var paypalBtnBox = document.getElementById("un-paypal-box");
  var codPayBox = document.getElementById("un-cod-pay");
  var paypalRendered = false;
  var payphoneEnabled = paymentBox && paymentBox.getAttribute("data-payphone-enabled") === "1";
  var payphoneBtnBox = document.getElementById("un-payphone-box");
  var payphoneRendered = false;
  var payphoneReturnHandled = false;
  var payphoneInitTimer = null;
  var pendingOrderId = null;
  function selectedMethod(){ var r = document.querySelector('input[name="payment"]:checked'); return r ? r.value : "cod"; }
  function paypalNote(msg){
    if (msg) {
      var el = document.getElementById("un-paypal-note");
      if (el) { el.textContent = msg; el.classList.remove("hidden"); }
    }
  }
  function payphoneNote(msg){
    if (msg) {
      var el = document.getElementById("un-payphone-note");
      if (el) { el.textContent = msg; el.classList.remove("hidden"); }
    }
  }
  function setMethod(m){
    var isPaypal = m === "paypal" && paypalEnabled;
    var isPayphone = m === "payphone" && payphoneEnabled;
    if (isPaypal) { if (codPayBox) { codPayBox.classList.add("hidden"); } if (payphoneBtnBox) { payphoneBtnBox.classList.add("hidden"); } if (paypalBtnBox) { paypalBtnBox.classList.remove("hidden"); } initPaypal(); }
    else if (isPayphone) { if (codPayBox) { codPayBox.classList.add("hidden"); } if (paypalBtnBox) { paypalBtnBox.classList.add("hidden"); } if (payphoneBtnBox) { payphoneBtnBox.classList.remove("hidden"); } initPayphone(); }
    else { if (paypalBtnBox) { paypalBtnBox.classList.add("hidden"); } if (payphoneBtnBox) { payphoneBtnBox.classList.add("hidden"); } if (codPayBox) { codPayBox.classList.remove("hidden"); } }
  }
  function buildPayload(method){
    var data = { items: [], paymentMethod: method };
    for (var p = 0; p < cart.length; p++) { data.items.push({ productId: cart[p].id, quantity: Number(cart[p].qty) || 1 }); }
    var f = document.getElementById("un-checkout-form");
    if (!f) return null;
    Array.prototype.forEach.call(f.querySelectorAll("[name]"), function(inp){
      if (!inp.name) return;
      if (inp.name === "payment") return;
      data[inp.name] = (inp.value || "").trim();
    });
    if (method !== "cod" && !(data.customerName && data.customerPhone && data.address)) {
      throw new Error("Completa tus datos de entrega antes de pagar");
    }
    return data;
  }
  function postJson(url, payload){
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); });
  }
  function showDone(msg, orderId){
    cart = []; save();
    if (coWrapEl) { coWrapEl.classList.add("hidden"); }
    if (coDoneEl) { coDoneEl.classList.remove("hidden"); }
    var oid = document.getElementById("un-order-id");
    if (oid && orderId) { oid.textContent = "#" + String(orderId).slice(0, 8).toUpperCase(); }
    var dm = document.getElementById("un-co-done-msg");
    if (dm) { dm.textContent = msg; }
    if (badge) { badge.textContent = "0"; badge.style.display = "none"; }
  }
  function handlePayphoneReturn(){
    var q = (window.location.search || "").replace(/^\\?/, "");
    if (!q) return;
    var params = {};
    q.split("&").forEach(function(kv){
      var parts = kv.split("=");
      if (parts[0]) { params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || ""); }
    });
    var id = params.id;
    var clientTxId = params.clientTransactionId;
    if (!id || !clientTxId) return;
    payphoneReturnHandled = true;
    postJson(apiCheckoutBase + "/payphone/confirm", { id: Number(id) || 0, clientTransactionId: clientTxId })
      .then(function(res){
        if (!res.ok || res.j.error) { throw new Error((res.j && res.j.message) || "Error al confirmar el pago"); }
        showDone("Pago confirmado con Payphone. Te contactaremos para coordinar la entrega de tu pedido.", (res.j.data && res.j.data.orderId) || "");
      })
      .catch(function(err){ alert(err.message || "Ocurrió un error al confirmar el pago con Payphone"); });
  }
  function renderPaypalBtn(box){
    if (paypalRendered) return;
    paypalRendered = true;
    window.paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },
      createOrder: function(data, actions){
        var payload;
        try { payload = buildPayload("paypal"); } catch (err) { return Promise.reject(err.message || "Datos incompletos"); }
        return postJson(apiCheckoutBase + "/paypal/create-order", payload)
          .then(function(res){
            if (!res.ok || res.j.error || !res.j.data || !res.j.data.paypalOrderId) {
              throw new Error((res.j && (res.j.message || (res.j.data && res.j.data.message))) || "Error al iniciar el pago con PayPal");
            }
            pendingOrderId = res.j.data.orderId || null;
            return res.j.data.paypalOrderId;
          });
      },
      onApprove: function(data, actions){
        return postJson(apiCheckoutBase + "/paypal/capture-order", { paypalOrderId: data.orderID, orderId: pendingOrderId || "" })
          .then(function(res){
            if (!res.ok || res.j.error) { throw new Error((res.j && res.j.message) || "Error al confirmar el pago"); }
            pendingOrderId = null;
            showDone("Pago confirmado con PayPal. Te contactaremos para coordinar la entrega de tu pedido.", (res.j.data && res.j.data.orderId) || "");
          })
          .catch(function(err){ alert(err.message || "Ocurrió un error al confirmar el pago"); });
      },
      onCancel: function(data){ pendingOrderId = null; }
    }).render("#paypal-button-container").catch(function(err){
      paypalNotifying(err);
    });
  }
  function paypalNotifying(err){
    paypalNote("No se pudo cargar el botón de PayPal: " + ((err && err.message) ? err.message : "revisa la configuración de pagos"));
    paypalRendered = false;
  }
  function initPaypal(){
    var box = document.getElementById("paypal-button-container");
    if (!box) return;
    if (!window.paypal) {
      paypalNote("Cargando PayPal...");
      var tries = 0;
      var timer = setInterval(function(){
        tries++;
        if (window.paypal) { clearInterval(timer); renderPaypalBtn(box); }
        else if (tries > 40) { clearInterval(timer); paypalNote("No se pudo cargar PayPal. Revisa la configuración de pagos del sitio."); }
      }, 500);
      return;
    }
    renderPaypalBtn(box);
  }
  function renderPayphoneWidget(box){
    if (payphoneRendered) return;
    payphoneRendered = true;
    var payload;
    try { payload = buildPayload("payphone"); } catch (err) { payphoneRendered = false; payphoneNote(err.message || "Datos incompletos"); return; }
    payphoneNote("Preparando Payphone...");
    postJson(apiCheckoutBase + "/payphone/create-order", payload)
      .then(function(res){
        if (!res.ok || res.j.error || !res.j.data || !res.j.data.clientTransactionId || !res.j.data.provider || !res.j.data.provider.token) {
          payphoneRendered = false;
          throw new Error((res.j && (res.j.message || (res.j.data && res.j.data.message))) || "Error al iniciar el pago con Payphone");
        }
        pendingOrderId = res.j.data.orderId || null;
        var data = res.j.data;
        var provider = data.provider;
        var priv = document.getElementById("un-payphone-note");
        if (priv) { priv.classList.add("hidden"); }
        var cfg = {
          token: provider.token,
          clientTransactionId: data.clientTransactionId,
          amount: data.amount,
          amountWithoutTax: data.amount,
          currency: data.currency || "USD",
          storeId: provider.storeId,
          reference: "Pago por pedido #" + String(data.orderId || "").slice(0, 8).toUpperCase(),
          lang: "es",
          defaultMethod: "card",
          optionalParameter: "Plataforma"
        };
        if (payload.customerEmail) { cfg.email = payload.customerEmail; }
        if (payload.customerPhone) { cfg.phoneNumber = payload.customerPhone; }
        if (typeof window.PPaymentButtonBox !== "function") {
          payphoneRendered = false;
          payphoneNote("No se pudo cargar el botón de Payphone. Revisa la configuración de pagos del sitio.");
          return;
        }
        window.ppb = new window.PPaymentButtonBox(cfg).render("pp-button");
      })
      .catch(function(err){ payphoneRendered = false; payphoneNote(err.message || "Ocurrió un error al preparar Payphone"); });
  }
  function initPayphone(){
    if (payphoneReturnHandled) return;
    var box = document.getElementById("pp-button");
    if (!box) return;
    if (!window.PPaymentButtonBox) {
      payphoneNote("Cargando Payphone...");
      if (payphoneInitTimer) return;
      var tries = 0;
      payphoneInitTimer = setInterval(function(){
        tries++;
        if (window.PPaymentButtonBox) { clearInterval(payphoneInitTimer); payphoneInitTimer = null; renderPayphoneWidget(box); }
        else if (tries > 40) { clearInterval(payphoneInitTimer); payphoneInitTimer = null; payphoneNote("No se pudo cargar Payphone. Revisa la configuración de pagos del sitio."); }
      }, 500);
      return;
    }
    renderPayphoneWidget(box);
  }
  function open(){ if (overlay) { overlay.classList.remove("hidden"); } if (drawer) { drawer.classList.remove("translate-x-full"); } document.body.style.overflow = "hidden"; }
  function close(){ if (overlay) { overlay.classList.add("hidden"); } if (drawer) { drawer.classList.add("translate-x-full"); } document.body.style.overflow = ""; }
  function renderCo(){
    if (!coItemsEl) return;
    if (!cart.length) {
      if (coEmptyEl) { coEmptyEl.classList.remove("hidden"); }
      if (coWrapEl) { coWrapEl.classList.add("hidden"); }
      if (coDoneEl) { coDoneEl.classList.add("hidden"); }
      if (coTotalEl) { coTotalEl.textContent = "$0.00"; }
      if (coBtnAmount) { coBtnAmount.textContent = "0.00"; }
      return;
    }
    if (coEmptyEl) { coEmptyEl.classList.add("hidden"); }
    if (coWrapEl) { coWrapEl.classList.remove("hidden"); }
    var html = "";
    for (var i = 0; i < cart.length; i++) {
      var it = cart[i];
      html += '<div class="flex gap-4 py-4">' +
        (it.image ? '<img src="' + it.image + '" alt="" class="w-20 h-24 object-cover grayscale">' : '<div class="w-20 h-24 bg-gray-100"></div>') +
        '<div class="flex-1 min-w-0">' +
          '<p class="font-bold text-sm uppercase tracking-wider truncate">' + (it.title || "") + '</p>' +
          '<p class="text-gray-500 text-xs mt-0.5">Cantidad: ' + (Number(it.qty) || 0) + '</p>' +
          '<p class="text-sm font-bold mt-1">$' + money(it.price) + '</p>' +
        '</div>' +
        '<span class="font-bold text-sm self-center">$' + money((Number(it.price) || 0) * (Number(it.qty) || 0)) + '</span>' +
      '</div>';
    }
    coItemsEl.innerHTML = html;
    var total = totalSum();
    if (coTotalEl) { coTotalEl.textContent = "$" + money(total); }
    if (coBtnAmount) { coBtnAmount.textContent = money(total); }
  }
  function render(){
    if (badge) { badge.textContent = String(count()); badge.style.display = count() ? "block" : "none"; }
    if (summary) { summary.style.display = cart.length ? "block" : "none"; }
    if (viewEl) {
      if (!cart.length) {
        viewEl.innerHTML = '<div class="py-16 text-center"><p class="text-gray-400 uppercase tracking-widest text-sm mb-4">Tu carrito está vacío</p><p class="text-xs text-gray-400">Explora el catálogo y añade tus piezas.</p></div>';
        if (subtotalEl) { subtotalEl.textContent = "$0.00"; }
      } else {
        var html = "";
        for (var i = 0; i < cart.length; i++) {
          var it = cart[i];
          html += '<div class="flex gap-4 py-4 border-b border-gray-100">' +
            (it.image ? '<img src="' + it.image + '" alt="" class="w-20 h-24 object-cover grayscale">' : '<div class="w-20 h-24 bg-gray-100"></div>') +
            '<div class="flex-1 min-w-0">' +
              '<p class="font-bold text-sm uppercase tracking-wider truncate">' + (it.title || "") + '</p>' +
              '<p class="text-sm font-bold mt-1">$' + money(it.price) + '</p>' +
              '<div class="flex items-center gap-3 mt-3">' +
                '<button type="button" data-dec="' + i + '" aria-label="Quitar uno" class="w-7 h-7 border border-black hover:bg-black hover:text-white transition-colors">-</button>' +
                '<span class="text-sm font-bold w-5 text-center">' + (Number(it.qty) || 0) + '</span>' +
                '<button type="button" data-inc="' + i + '" aria-label="Añadir uno" class="w-7 h-7 border border-black hover:bg-black hover:text-white transition-colors">+</button>' +
                '<button type="button" data-rm="' + i + '" class="ml-auto text-xs uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors">Quitar</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        }
        viewEl.innerHTML = html;
        if (subtotalEl) { subtotalEl.textContent = "$" + money(totalSum()); }
      }
    }
    renderCo();
  }
  document.addEventListener("click", function(e){
    var t = e.target ? e.target : null;
    if (!t || !t.closest) return;
    var add = t.closest("[data-add-cart]");
    if (add) {
      var addId = add.getAttribute("data-id");
      if (!addId) return;
      var found = false;
      for (var k = 0; k < cart.length; k++) { if (cart[k].id === addId) { cart[k].qty = (Number(cart[k].qty) || 0) + 1; found = true; break; } }
      if (!found) { cart.push({ id: addId, title: add.getAttribute("data-title"), price: add.getAttribute("data-price"), image: add.getAttribute("data-image"), qty: 1 }); }
      save(); render(); open();
      return;
    }
    if (t.closest("#un-cart-close") || t.closest("#un-cart-overlay")) { close(); return; }
    if (t.closest("#un-cart-btn")) { render(); open(); return; }
    if (t.closest("#un-go-checkout")) { window.location.href = checkoutBase + "/checkout"; return; }
    if (t.closest("#un-cart-vaciar")) { cart = []; save(); render(); return; }
    var dec = t.closest("[data-dec]"), inc = t.closest("[data-inc]"), rm = t.closest("[data-rm]");
    if (dec || inc || rm) {
      var idx = Number((dec || inc || rm).getAttribute(dec ? "data-dec" : inc ? "data-inc" : "data-rm"));
      if (cart[idx]) {
        if (dec) { cart[idx].qty = Math.max(1, (Number(cart[idx].qty) || 1) - 1); }
        else if (inc) { cart[idx].qty = (Number(cart[idx].qty) || 0) + 1; }
        else { cart.splice(idx, 1); }
        save(); render();
      }
      return;
    }
  });
  var form = document.getElementById("un-checkout-form");
  if (form) {
    form.addEventListener("submit", function(ev){
      ev.preventDefault();
      var btn = form.querySelector("button[type=submit]");
      if (btn) { btn.disabled = true; btn.textContent = "Enviando..."; }
      var data;
      try { data = buildPayload("cod"); } catch (err) { if (btn) { btn.disabled = false; btn.textContent = "Confirmar pedido"; } return; }
      if (!data) { if (btn) { btn.disabled = false; btn.textContent = "Confirmar pedido"; } return; }
      postJson(apiCheckoutBase + "/orders", data)
        .then(function(res){
          if (!res.ok || res.j.error) { throw new Error((res.j && res.j.message) || "Error al procesar el pedido"); }
          if (btn) { btn.disabled = false; btn.textContent = "Confirmar pedido"; }
          showDone("Pagarás en efectivo al recibirlo. Te contactaremos en breve para coordinar la entrega.", (res.j.data && res.j.data.id) || res.j.id || "");
        })
        .catch(function(err){
          if (btn) { btn.disabled = false; btn.textContent = "Confirmar pedido"; }
          alert(err.message || "Ocurrió un error al enviar el pedido");
        });
    });
  }
if (paymentBox) {
    Array.prototype.forEach.call(paymentBox.querySelectorAll('input[name="payment"]'), function(r){
      r.addEventListener("change", function(){ setMethod(selectedMethod()); });
    });
  }
  var coForm = document.getElementById("un-checkout-form");
  if (coForm) {
    coForm.addEventListener("input", function(){
      if (!payphoneReturnHandled && selectedMethod() === "payphone" && payphoneEnabled && !payphoneRendered) {
        initPayphone();
      }
    });
  }
  render();
  setMethod(selectedMethod());
})();
</script>`;
  }

  async resolveTenantBySubdomain(subdomain: string): Promise<string | null> {
    const site = await this.prisma.site.findFirst({
      where: {
        OR: [{ subdomain }, { domain: subdomain }],
        isPublished: true,
        deletedAt: null,
      },
      select: { tenantId: true, id: true },
    });
    return site?.tenantId || null;
  }

  /**
   * Devuelve la página 404 del sitio. Si no existe (plantillas antiguas), la
   * sintetiza a partir de la página por defecto para conservar el estilo.
   */
  private resolveErrorPage(site: any): any {
    const existing = (site.pages || []).find(
      (p: any) =>
        normalizePublicPath(p.path || "/") === ERROR_PAGE_PATH || p.slug === "404"
    );
    if (existing) {
      if (normalizePublicPath(existing.path || "/") !== ERROR_PAGE_PATH) {
        existing.path = ERROR_PAGE_PATH;
      }
      return existing;
    }
    const synthesized = this.synthesizeErrorPage(site);
    site.pages.push(synthesized);
    return synthesized;
  }

  private synthesizeErrorPage(site: any): any {
    return this.synthesizeStatusPage(site, {
      name: "404",
      slug: "404",
      path: ERROR_PAGE_PATH,
      title: "404",
      subtitle: "No encontramos la página que buscas.",
      buttonText: "Volver al inicio",
      buttonUrl: "/",
    });
  }

  private synthesizeMaintenancePage(site: any): any {
    return this.synthesizeStatusPage(site, {
      name: "En mantenimiento",
      slug: "mantenimiento",
      path: MAINTENANCE_PAGE_PATH,
      title: "En mantenimiento",
      subtitle: "Estamos trabajando para mejorar tu experiencia. Volvemos muy pronto.",
    });
  }

  /**
   * Construye una página de estado (404 / mantenimiento) reutilizando el estilo
   * de la página por defecto de la plantilla (header + hero + footer).
   */
  private synthesizeStatusPage(
    site: any,
    status: {
      name: string;
      slug: string;
      path: string;
      title: string;
      subtitle: string;
      buttonText?: string;
      buttonUrl?: string;
    }
  ): any {
    const defaultPage =
      (site.pages || []).find((p: any) => p.isDefault) || site.pages?.[0];
    const blocks: any[] = [];
    const header = defaultPage?.blocks?.find((b: any) => b.type === "header");
    if (header) {
      blocks.push({ type: "header", content: header.content, styles: header.styles });
    }
    const hero = defaultPage?.blocks?.find((b: any) => b.type === "hero");
    const variant = (defaultPage?.blocks || []).find(
      (b: any) => b.content && b.content.variant
    )?.content?.variant;
    const heroContent = hero?.content ? { ...hero.content } : {};
    blocks.push({
      type: hero ? "hero" : "cta",
      content: {
        ...heroContent,
        variant: heroContent.variant || variant,
        title: status.title,
        subtitle: status.subtitle,
        buttonText: status.buttonText,
        buttonUrl: status.buttonUrl,
        slides: undefined,
        highlights: undefined,
        secondaryButtonText: undefined,
        secondaryButtonUrl: undefined,
      },
      styles: hero?.styles,
    });
    const footer = defaultPage?.blocks?.find((b: any) => b.type === "footer");
    if (footer) {
      blocks.push({ type: "footer", content: footer.content, styles: footer.styles });
    }
    return {
      name: status.name,
      slug: status.slug,
      path: status.path,
      isDefault: false,
      sortOrder: 999,
      blocks,
    };
  }

  private siteVariant(site: any): string | undefined {
    const defaultPage =
      (site.pages || []).find((p: any) => p.isDefault) || site.pages?.[0];
    return (defaultPage?.blocks || []).find((b: any) => b.content && b.content.variant)
      ?.content?.variant;
  }

  /** Header + contenido + footer, reutilizando el chrome de la página por defecto. */
  private buildChromeBlocks(site: any, middle: any[]): any[] {
    const defaultPage =
      (site.pages || []).find((p: any) => p.isDefault) || site.pages?.[0];
    const header = defaultPage?.blocks?.find((b: any) => b.type === "header");
    const footer = defaultPage?.blocks?.find((b: any) => b.type === "footer");
    return [
      header ? { type: "header", content: header.content, styles: header.styles } : null,
      ...middle,
      footer ? { type: "footer", content: footer.content, styles: footer.styles } : null,
    ].filter(Boolean) as any[];
  }

  private async buildBlogIndexPage(site: any, blog: { title: string; slug: string }) {
    const articles = await this.prisma.blogArticle.findMany({
      where: { siteId: site.id, isPublished: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        authorName: true,
        publishedAt: true,
      },
    });
    const items = articles.map((a) => ({
      title: a.title,
      url: `${resolvePublicSiteUrl(site)}/${blog.slug}/${a.slug}`,
      excerpt: a.excerpt || "",
      coverImage: a.coverImage ? this.absoluteUrl(a.coverImage) : "",
      authorName: a.authorName || "",
      date: a.publishedAt ? a.publishedAt.toISOString() : "",
    }));
    const blocks = this.buildChromeBlocks(site, [
      {
        type: "blog-list",
        content: { variant: this.siteVariant(site), title: blog.title, items },
        styles: {},
      },
    ]);
    return {
      name: blog.title,
      slug: blog.slug,
      path: `/${blog.slug}`,
      isDefault: false,
      sortOrder: 998,
      seoTitle: blog.title,
      seoDesc: "",
      blocks,
    };
  }

  private buildBlogArticlePage(
    site: any,
    blog: { title: string; slug: string },
    article: any,
  ) {
    const blocks = this.buildChromeBlocks(site, [
      {
        type: "blog-article",
        content: {
          variant: this.siteVariant(site),
          title: article.title,
          excerpt: article.excerpt || "",
          content: article.content || "",
          coverImage: article.coverImage ? this.absoluteUrl(article.coverImage) : "",
          authorName: article.authorName || "",
          date: article.publishedAt ? article.publishedAt.toISOString() : "",
          blogTitle: blog.title,
          blogUrl: `${resolvePublicSiteUrl(site)}/${blog.slug}`,
        },
        styles: {},
      },
    ]);
    return {
      name: article.title,
      slug: article.slug,
      path: `/${blog.slug}/${article.slug}`,
      isDefault: false,
      sortOrder: 998,
      seoTitle: article.seoTitle || article.title,
      seoDesc: article.seoDesc || article.excerpt || "",
      ogImage: article.seoImage || undefined,
      blocks,
    };
  }

  /** Agrega el enlace del blog al menú de la cabecera si el blog está habilitado. */
  private withBlogNav(
    blocks: any[],
    blog: { enabled: boolean; title: string; slug: string },
    site: any,
  ): any[] {
    if (!blog.enabled || !Array.isArray(blocks)) return blocks;
    const url = `${resolvePublicSiteUrl(site)}/${blog.slug}`;
    const push = (arr: any[]) =>
      arr.some((l) => l && l.url === url) ? arr : [...arr, { label: blog.title, url }];

    return blocks.map((b) => {
      if (b?.type !== "header") return b;
      const content = { ...(b.content || {}) };
      if (Array.isArray(content.links)) {
        content.links = push(content.links);
      } else if (Array.isArray(content.navLinks)) {
        content.navLinks = push(content.navLinks);
      } else {
        content.links = [{ label: blog.title, url }];
      }
      return { ...b, content };
    });
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
      page.blocks = await this.hydrateCatalogProducts(page.blocks, site);
    }

    const palette = resolveSitePalette(site.settings, site.primaryColor, site.secondaryColor);
    const explicitRoles = explicitPaletteRoles(site.settings);
    const explicitPalette = explicitRoles.length > 0;
    const blogNav = resolveBlogSettings(site.settings);
    const pageBlocks = this.withBlogNav(page?.blocks || [], blogNav, site);
    const themeBlocks = pageBlocks.map((block: any) =>
      this.applyPaletteToBlock(block, palette, explicitPalette)
    );

    let blocksHtml = themeBlocks
      .map((block: any) =>
        this.renderBlock(block.type, this.resolveBlockUrls(block).content, block.styles, site, reviews)
      ).join("\n") || "";

    const primary = palette.primary;
    const secondary = palette.secondary;
    const variant = page?.blocks?.[0]?.content?.variant;
    const isTemplate = (THEMED_TEMPLATE_VARIANTS as readonly string[]).includes(variant);
    const isUrbanNoir = variant === "urban-noir";
    const isRawHtml = variant === "raw-html";

    if (explicitPalette) {
      blocksHtml = applyPaletteToVariantHtml(blocksHtml, variant, palette);
    }

    const globalStyles = (site.settings as any)?.globalStyles || null;
    const stylePages = globalStyles?.pages || null;
    const pageStyle =
      (stylePages && (stylePages[normalizePublicPath(page?.path || "/")] || stylePages[page?.path || "/"] || stylePages["/"])) ||
      null;
    const pageCss = pageStyle?.css ? this.resolveCssAssetTokens(pageStyle.css) : "";
    const rawCssPath = typeof pageStyle?.cssPath === "string" ? pageStyle.cssPath : "";
    const pageCssHref = rawCssPath
      ? `${/^https?:\/\//i.test(rawCssPath) ? rawCssPath : `${this.apiBaseUrl()}${rawCssPath}`}${pageStyle.cssHash ? `?h=${pageStyle.cssHash}` : ""}`
      : "";
    const themeOverride = buildCapturedThemeOverrides(pageStyle?.theme, palette, explicitRoles);
    const pageHead = typeof pageStyle?.head === "string" ? pageStyle.head : "";
    const runtimeScript =
      typeof globalStyles?.runtime?.script === "string" ? globalStyles.runtime.script : "";
    const pageHtmlAttrs: Record<string, string> | undefined = pageStyle?.htmlAttrs;
    const pageBodyAttrs: Record<string, string> | undefined = pageStyle?.bodyAttrs;

    const baseUrl = resolvePublicSiteUrl(site);
    const canonicalUrl =
      page && page.path !== "/"
        ? `${baseUrl}${normalizePublicPath(page.path)}`
        : baseUrl;

    const seoTitle = page?.seoTitle || site.seoTitle || site.name || "";
    const seoDesc = page?.seoDesc || site.seoDesc || "";
    const ogSettings = (site.settings as any)?.og || {};
    const ogImage = page?.ogImage
      ? this.absoluteUrl(page.ogImage)
      : ogSettings.image
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

    const baseThemeColors = getTemplateThemeColors(variant);

    const themeColors = explicitPalette
      ? applyPaletteToThemeColors(baseThemeColors, variant, palette, explicitRoles) || baseThemeColors
      : baseThemeColors;

    const themeFonts = getTemplateThemeFonts(variant);

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
<html ${this.attrsToHtml(pageHtmlAttrs, { lang: "es" })}>
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
${pageHead}
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
${isTemplate || isRawHtml ? `
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
.material-symbols-outlined[data-weight="fill"] { font-variation-settings: 'FILL' 1; }
` : `
${genericPageBaseCss({ primary, secondary, accent: palette.accent }, paletteCssVariables(palette))}
`}
</style>
${pageCssHref ? `<link rel="stylesheet" href="${escapeHtml(pageCssHref)}">` : ""}
${pageCss ? `<style>\n${pageCss}\n</style>` : ""}
${themeOverride ? `<style>\n${themeOverride}\n</style>` : ""}
<style>:root{${paletteCssVariables(palette)}}</style>
${runtimeScript ? `<script>\n${runtimeScript}\n</script>` : ""}
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
<body ${this.attrsToHtml(pageBodyAttrs, {}, isTemplate ? "bg-background text-on-background font-body-md text-body-md antialiased selection:bg-tertiary-fixed-dim selection:text-on-tertiary-fixed-variant" : "")}>
${blocksHtml}
${isUrbanNoir ? this.urbanNoirCartHtml(site.subdomain || site.domain || "", resolvePublicSiteUrl(site)) : ""}
${waButton}
${apkButton}
</body>
</html>`;
  }

  private renderBlock(type: string, content: any, _styles?: any, site?: any, reviews: any[] = []): string {
    const decoded = decodeUnicodeEscapes(content) || {};

    // Bloques con variante de plantilla: saneados y dibujados desde @plataforma/shared.
    const variantHtml = renderTemplateVariantHtml(type, decoded, this.apiBaseUrl(), site);
    if (variantHtml) return variantHtml;

    // Los bloques del blog los genera el sistema y escapan sus propios valores.
    const c = type === "blog-list" || type === "blog-article" ? decoded : sanitizeTemplateContent(decoded);

    if (type === "blog-list") return this.renderBlogList(c);
    if (type === "blog-article") return this.renderBlogArticle(c);
    return renderGenericBlockHtml(type, c, { apiBaseUrl: this.apiBaseUrl(), site, reviews }) || "";
  }

  private sanitizeArticleHtml(html: string): string {
    return String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
      .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  }

  private formatBlogDate(value: string): string {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    try {
      return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return d.toISOString().split("T")[0];
    }
  }

  /** Índice del blog, adaptado a la paleta global y tipografía de la plantilla. */
  private renderBlogList(c: any): string {
    const items: any[] = Array.isArray(c.items) ? c.items : [];
    const title = escapeHtml(c.title || "Blog");

    const cards = items
      .map((item) => {
        const date = this.formatBlogDate(item.date);
        return `<a href="${escapeHtml(item.url || "#")}" class="site-blog-card" style="display:flex;flex-direction:column;border-radius:18px;overflow:hidden;background:var(--site-surface,#f8fafc);border:1px solid rgba(127,127,127,.16);text-decoration:none;box-shadow:0 1px 3px rgba(0,0,0,.05);transition:transform .2s,box-shadow .2s">
  ${item.coverImage ? `<img src="${escapeHtml(item.coverImage)}" alt="${escapeHtml(item.title)}" loading="lazy" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block">` : ""}
  <div style="padding:1.5rem;display:flex;flex-direction:column;gap:.6rem;flex:1">
    ${date ? `<span style="font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;color:var(--site-primary,#2563EB);font-weight:700">${date}</span>` : ""}
    <h2 style="margin:0;font-size:1.3rem;font-weight:800;line-height:1.25;color:var(--site-text,#0f172a)">${escapeHtml(item.title || "")}</h2>
    ${item.excerpt ? `<p style="margin:0;color:var(--site-text,#0f172a);opacity:.7;line-height:1.6;font-size:.95rem">${escapeHtml(item.excerpt)}</p>` : ""}
    <span style="margin-top:auto;color:var(--site-primary,#2563EB);font-weight:700;font-size:.9rem">Leer más →</span>
  </div>
</a>`;
      })
      .join("");

    return `<section style="max-width:1120px;margin:0 auto;padding:clamp(3rem,8vw,5rem) clamp(1rem,5vw,2rem)">
  <header style="text-align:center;margin-bottom:clamp(2rem,5vw,3rem)">
    <h1 style="margin:0;font-size:clamp(2rem,5vw,3rem);font-weight:800;line-height:1.1;color:var(--site-text,#0f172a)">${title}</h1>
  </header>
  ${items.length
    ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:clamp(1rem,2vw,1.5rem)">${cards}</div>`
    : `<p style="text-align:center;color:var(--site-text,#0f172a);opacity:.6">Aún no hay artículos publicados.</p>`}
</section>`;
  }

  /** Artículo del blog, con el contenido en HTML del autor. */
  private renderBlogArticle(c: any): string {
    const date = this.formatBlogDate(c.date);
    const blogTitle = escapeHtml(c.blogTitle || "Blog");
    const contentStyle = `<style>
.site-blog-content{line-height:1.75;font-size:1.05rem;color:var(--site-text,#0f172a)}
.site-blog-content h2{font-size:1.5rem;font-weight:700;margin:1.75rem 0 .75rem}
.site-blog-content h3{font-size:1.25rem;font-weight:700;margin:1.5rem 0 .5rem}
.site-blog-content p{margin:0 0 1rem}
.site-blog-content ul{list-style:disc;padding-left:1.5rem;margin:0 0 1rem}
.site-blog-content ol{list-style:decimal;padding-left:1.5rem;margin:0 0 1rem}
.site-blog-content a{color:var(--site-primary,#2563EB);text-decoration:underline}
.site-blog-content img{max-width:100%;height:auto;border-radius:12px;margin:1rem 0}
.site-blog-content blockquote{border-left:4px solid var(--site-primary,#2563EB);padding-left:1rem;margin:1rem 0;opacity:.8}
</style>`;

    return `${contentStyle}<article style="max-width:800px;margin:0 auto;padding:clamp(2.5rem,8vw,5rem) clamp(1rem,5vw,2rem)">
  <a href="${escapeHtml(c.blogUrl || "/")}" style="display:inline-block;margin-bottom:1.25rem;color:var(--site-primary,#2563EB);font-weight:700;text-decoration:none">← ${blogTitle}</a>
  <h1 style="margin:0 0 .75rem;font-size:clamp(2rem,5vw,3rem);font-weight:800;line-height:1.12;color:var(--site-text,#0f172a)">${escapeHtml(c.title || "")}</h1>
  <div style="display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;color:var(--site-text,#0f172a);opacity:.6;font-size:.85rem;margin-bottom:1.5rem">
    ${c.authorName ? `<span>${escapeHtml(c.authorName)}</span>` : ""}
    ${c.authorName && date ? `<span>•</span>` : ""}
    ${date ? `<span>${date}</span>` : ""}
  </div>
  ${c.coverImage ? `<img src="${escapeHtml(c.coverImage)}" alt="${escapeHtml(c.title || "")}" style="width:100%;height:auto;border-radius:16px;margin-bottom:2rem;display:block">` : ""}
  <div class="site-blog-content">${this.sanitizeArticleHtml(c.content)}</div>
</article>`;
  }
}
