import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,
  UploadedFile, UseInterceptors, BadRequestException, ForbiddenException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { SitesService } from "./sites.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

const APK_DIR = join(process.cwd(), "uploads", "apk");

@ApiTags("sites")
@Controller("sites")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SitesController {
  constructor(private sitesService: SitesService) {}

  @Post()
  @ApiOperation({ summary: "Create new site" })
  async create(
    @CurrentUser() user: any,
    @Body() body: { name: string; templateId: string; subdomain?: string; domain?: string },
  ) {
    return this.sitesService.create(user.tenantId, body);
  }

  @Get()
  @ApiOperation({ summary: "List tenant sites" })
  async findAll(
    @CurrentUser() user: any,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.sitesService.findAll(user.tenantId, { page: Number(page) || 1, limit: Number(limit) || 50 });
  }

  @Get("capabilities")
  @ApiOperation({ summary: "Tenant module capabilities based on template choices" })
  async getCapabilities(@CurrentUser() user: any) {
    return this.sitesService.getCapabilities(user.tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get site by ID" })
  async findById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.sitesService.findById(id, user.tenantId);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update site" })
  async update(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.sitesService.update(id, user.tenantId, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete site" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.sitesService.remove(id, user.tenantId);
  }

  @Get(":id/check-domain")
  @ApiOperation({ summary: "Check if custom domain DNS points to server" })
  async checkDomain(@Param("id") id: string, @CurrentUser() user: any, @Query("domain") domain: string) {
    return this.sitesService.checkDomainDns(id, domain);
  }

  @Post(":id/apk")
  @ApiOperation({ summary: "Upload APK for a site" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(APK_DIR)) mkdirSync(APK_DIR, { recursive: true });
          cb(null, APK_DIR);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          cb(null, `${unique}.apk`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === "application/vnd.android.package-archive" || file.originalname.endsWith(".apk")) {
          cb(null, true);
        } else {
          cb(new BadRequestException("Solo se permiten archivos APK"), false);
        }
      },
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  async uploadApk(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body("apkVersion") apkVersion?: string,
    @Body("apkName") apkName?: string,
  ) {
    if (!file) throw new BadRequestException("Archivo APK requerido");
    const apiBase = process.env.PUBLIC_API_URL || process.env.PLATAFORMA_API_URL || "https://plataforma-api-71743315793.us-central1.run.app";
    const apkUrl = `${apiBase}/uploads/apk/${file.filename}`;
    return this.sitesService.setApk(id, user.tenantId, {
      apkUrl,
      apkVersion: apkVersion || "",
      apkName: apkName || file.originalname,
      apkSize: file.size,
    });
  }

  @Delete(":id/apk")
  @ApiOperation({ summary: "Remove APK from a site" })
  async removeApk(@Param("id") id: string, @CurrentUser() user: any) {
    return this.sitesService.removeApk(id, user.tenantId);
  }
}
