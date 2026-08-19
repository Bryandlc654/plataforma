import {
  Controller, Post, Get, Param, UseGuards, Res, Header, Query,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PublishingService } from "./publishing.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("publishing")
@Controller()
export class PublishingController {
  constructor(private publishingService: PublishingService) {}

  @Post("sites/:id/publish")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Publish a site" })
  async publish(@Param("id") id: string) {
    return this.publishingService.publish(id);
  }

  @Post("sites/:id/unpublish")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Unpublish a site" })
  async unpublish(@Param("id") id: string) {
    return this.publishingService.unpublish(id);
  }

  @Get("sites/:id/preview")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get site preview data" })
  async preview(@Param("id") id: string) {
    return this.publishingService.preview(id);
  }

  @Public()
  @Get("p/:subdomain")
  @Header("Content-Type", "text/html; charset=utf-8")
  @ApiOperation({ summary: "Public site - renders full HTML" })
  async getPublicSite(
    @Param("subdomain") subdomain: string,
    @Query("path") path: string,
    @Res() res: Response
  ) {
    const html = await this.publishingService.getPublicHtml(subdomain, path);
    res.send(html);
  }

  @Public()
  @Get("p/:subdomain/sitemap.xml")
  @ApiOperation({ summary: "Public sitemap.xml" })
  async getSitemap(@Param("subdomain") subdomain: string, @Res() res: Response) {
    const xml = await this.publishingService.getPublicSitemap(subdomain);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  }

  @Public()
  @Get("p/:subdomain/robots.txt")
  @ApiOperation({ summary: "Public robots.txt" })
  async getRobots(@Param("subdomain") subdomain: string, @Res() res: Response) {
    const txt = await this.publishingService.getPublicRobots(subdomain);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(txt);
  }
}
