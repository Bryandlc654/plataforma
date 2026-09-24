import {
  Controller, Get, Put, Param, Body, Query, UseGuards, Res,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SeoService } from "./seo.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("seo")
@Controller("seo")
export class SeoController {
  constructor(private seoService: SeoService) {}

  @Get("sites/:siteId/meta")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get SEO metadata for site" })
  async getSeoMeta(@Param("siteId") siteId: string, @CurrentUser() user: any) {
    return this.seoService.getSeoMeta(siteId, user.tenantId);
  }

  @Put("sites/:siteId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update site SEO" })
  async updateSiteSeo(@Param("siteId") siteId: string, @CurrentUser() user: any, @Body() body: any) {
    return this.seoService.updateSiteSeo(siteId, user.tenantId, body);
  }

  @Put("pages/:pageId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update page SEO" })
  async updatePageSeo(@Param("pageId") pageId: string, @CurrentUser() user: any, @Body() body: any) {
    return this.seoService.updatePageSeo(pageId, user.tenantId, body);
  }

  @Public()
  @Get("sitemap/:siteId")
  @ApiOperation({ summary: "Generate sitemap.xml (public)" })
  async sitemap(@Param("siteId") siteId: string, @Res() res: Response) {
    const xml = await this.seoService.generateSitemap(siteId);
    res.setHeader("Content-Type", "application/xml");
    res.send(xml);
  }

  @Public()
  @Get("robots/:siteId")
  @ApiOperation({ summary: "Generate robots.txt (public)" })
  async robots(@Param("siteId") siteId: string, @Res() res: Response) {
    const txt = await this.seoService.generateRobots(siteId);
    res.setHeader("Content-Type", "text/plain");
    res.send(txt);
  }
}
