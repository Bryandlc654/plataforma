import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PlatformBranding, PlatformService } from "./platform.service";

@ApiTags("platform")
@Controller("platform")
export class PlatformController {
  constructor(private platformService: PlatformService) {}

  @Public()
  @Get("branding")
  @ApiOperation({ summary: "Get public platform branding" })
  async getBranding() {
    return this.platformService.getBranding();
  }

  @Put("branding")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update platform branding (superadmin or platform admin)" })
  async updateBranding(@CurrentUser() user: any, @Body() body: Partial<PlatformBranding>) {
    return this.platformService.updateBranding(user, body);
  }

  @Get("payments")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get platform payment gateway config" })
  async getPayments(@CurrentUser() user: any) {
    return this.platformService.getPaymentsPublic(user);
  }

  @Put("payments")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update platform payment gateway config (superadmin or platform admin)" })
  async updatePayments(@CurrentUser() user: any, @Body() body: any) {
    return this.platformService.updatePayments(user, body);
  }

  @Post("branding/logo")
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload platform logo (superadmin or platform admin)" })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new BadRequestException("Solo se permiten imágenes") as any, false);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  async uploadLogo(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.platformService.uploadLogo(user, file);
  }
}
