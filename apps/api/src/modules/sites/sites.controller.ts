import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,
  UploadedFile, UseInterceptors, BadRequestException, ForbiddenException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { SitesService } from "./sites.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PERMISSIONS } from "../../shared/index";

@ApiTags("sites")
@Controller("sites")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SitesController {
  constructor(private sitesService: SitesService) {}

  @RequirePermissions(PERMISSIONS.SITE_CREATE)
  @Post()
  @ApiOperation({ summary: "Create new site" })
  async create(
    @CurrentUser() user: any,
    @Body() body: { name: string; templateId: string; subdomain?: string; domain?: string },
  ) {
    return this.sitesService.create(user.tenantId, body);
  }

  @RequirePermissions(PERMISSIONS.SITE_READ)
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

  @RequirePermissions(PERMISSIONS.SITE_READ)
  @Get(":id")
  @ApiOperation({ summary: "Get site by ID" })
  async findById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.sitesService.findById(id, user.tenantId);
  }

  @RequirePermissions(PERMISSIONS.SITE_UPDATE)
  @Put(":id")
  @ApiOperation({ summary: "Update site" })
  async update(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.sitesService.update(id, user.tenantId, body);
  }

  @RequirePermissions(PERMISSIONS.SITE_DELETE)
  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete site" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.sitesService.remove(id, user.tenantId);
  }

  @RequirePermissions(PERMISSIONS.SITE_READ)
  @Get(":id/check-domain")
  @ApiOperation({ summary: "Check if custom domain DNS points to server" })
  async checkDomain(@Param("id") id: string, @CurrentUser() user: any, @Query("domain") domain: string) {
    return this.sitesService.checkDomainDns(id, user.tenantId, domain);
  }

  @RequirePermissions(PERMISSIONS.SITE_UPDATE)
  @Post(":id/apk")
  @ApiOperation({ summary: "Upload APK for a site" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
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
    const apkUrl = await this.sitesService.storeApk(file.buffer, file.originalname);
    return this.sitesService.setApk(id, user.tenantId, {
      apkUrl,
      apkVersion: apkVersion || "",
      apkName: apkName || file.originalname,
      apkSize: file.size,
    });
  }

  @RequirePermissions(PERMISSIONS.SITE_UPDATE)
  @Delete(":id/apk")
  @ApiOperation({ summary: "Remove APK from a site" })
  async removeApk(@Param("id") id: string, @CurrentUser() user: any) {
    return this.sitesService.removeApk(id, user.tenantId);
  }
}
