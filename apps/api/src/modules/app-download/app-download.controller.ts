import {
  Controller, Get, Post, Delete, Body, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AppDownloadService } from "./app-download.service";

@ApiTags("app-download")
@Controller("app-download")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppDownloadController {
  constructor(private appDownloadService: AppDownloadService) {}

  private checkSuperAdmin(user: any) {
    if (!user.roles?.includes("super_admin")) {
      throw new BadRequestException("Solo el super admin puede gestionar la app");
    }
  }

  @Get()
  @ApiOperation({ summary: "Get global APK info" })
  getApk() {
    return this.appDownloadService.getApk() || { message: "No hay APK configurada" };
  }

  @Post()
  @ApiOperation({ summary: "Upload global APK (super admin only)" })
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
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body("apkVersion") apkVersion?: string,
    @Body("apkName") apkName?: string,
  ) {
    this.checkSuperAdmin(user);
    if (!file) throw new BadRequestException("Archivo APK requerido");

    const apkBuffer = file.buffer || (() => {
      const fs = require("fs");
      return fs.readFileSync(file.path);
    })();

    return this.appDownloadService.setApk({
      apkBuffer,
      apkVersion: apkVersion || "",
      apkName: apkName || file.originalname.replace(".apk", ""),
      apkSize: file.size,
      originalFilename: file.originalname,
    });
  }

  @Delete()
  @ApiOperation({ summary: "Remove global APK (super admin only)" })
  async removeApk(@CurrentUser() user: any) {
    this.checkSuperAdmin(user);
    return this.appDownloadService.removeApk();
  }
}
