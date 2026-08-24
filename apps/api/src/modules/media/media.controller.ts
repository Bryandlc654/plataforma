import {
  Controller, Get, Post, Put, Delete, Param, Query, UseGuards, UseInterceptors,
  UploadedFile, Req, Body,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { MediaService } from "./media.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { v4 as uuid } from "uuid";
import * as path from "path";
import * as fs from "fs";

const TEMP_DIR = path.join(process.cwd(), "uploads", "_temp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

@ApiTags("media")
@Controller("media")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file", {
    storage: diskStorage({
      destination: TEMP_DIR,
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuid()}${ext}`);
      },
    }),
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload a file (max 50MB)" })
  async upload(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Query("folder") folder?: string
  ) {
    return this.mediaService.upload(user.tenantId, file, folder);
  }

  @Get()
  @ApiOperation({ summary: "List tenant media" })
  async findAll(
    @CurrentUser() user: any,
    @Query("folder") folder?: string,
    @Query("type") type?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.mediaService.findAll(user.tenantId, folder, type, parseInt(page || "1"), parseInt(limit || "30"));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get media by ID" })
  async findById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.mediaService.findById(id, user.tenantId);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update media metadata" })
  async update(@Param("id") id: string, @CurrentUser() user: any, @Body() body: { alt?: string; folder?: string; originalName?: string }) {
    return this.mediaService.update(id, user.tenantId, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete media" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.mediaService.remove(id, user.tenantId);
  }
}
