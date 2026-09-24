import {
  Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException, ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { TemplatesService } from "./templates.service";
import { TemplatesImportService } from "./zip-import.service";
import { MediaService } from "../media/media.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PERMISSIONS } from "../../shared/index";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("templates")
@Controller("templates")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(
    private templatesService: TemplatesService,
    private templatesImportService: TemplatesImportService,
    private mediaService: MediaService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List templates" })
  async findAll(@CurrentUser() user: any, @Query("categoryId") categoryId?: string) {
    return this.templatesService.findAllForTenant(user.tenantId, categoryId);
  }

  @Get("categories")
  @ApiOperation({ summary: "List template categories" })
  async getCategories() {
    return this.templatesService.getCategories();
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin/import-zip")
  @ApiOperation({ summary: "Super admin: importar plantilla desde un ZIP (HTML + CSS)" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (file.originalname.toLowerCase().endsWith(".zip") || file.mimetype === "application/zip") {
          cb(null, true);
        } else {
          cb(new BadRequestException("Solo se permiten archivos ZIP"), false);
        }
      },
      limits: { fileSize: 40 * 1024 * 1024 },
    }),
  )
  async importZip(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body("name") name?: string,
    @Body("description") description?: string,
    @Body("categoryId") categoryId?: string,
    @Body("isPremium") isPremium?: string,
    @Body("preview") preview?: string,
  ) {
    if (!user?.roles?.includes("super_admin")) {
      throw new ForbiddenException("Solo el super admin puede importar plantillas");
    }
    if (!file) throw new BadRequestException("Archivo ZIP requerido");
    const result: any = await this.templatesImportService.importZip(file, {
      name: name || file.originalname.replace(/\.zip$/i, ""),
      description,
      categoryId,
      isPremium: isPremium === "true" || isPremium === "1",
      dryRun: preview === "true" || preview === "1",
    });
    if (result?.id) {
      try {
        await this.templatesService.ensureErrorPage(result.id);
      } catch {
        // la importación ya se completó; la página 404 puede generarse luego
      }
    }
    return result;
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin/:id/thumbnail")
  @ApiOperation({ summary: "Super admin: subir imagen de portada (thumbnail) de una plantilla" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
          cb(null, true);
        } else {
          cb(new BadRequestException("Solo se permiten imágenes"), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadThumbnail(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!user?.roles?.includes("super_admin")) {
      throw new ForbiddenException("Solo el super admin puede cambiar el thumbnail de plantillas");
    }
    if (!file) throw new BadRequestException("Imagen requerida");
    const { url } = await this.mediaService.uploadTemplateThumbnail(file);
    return this.templatesService.update(id, { thumbnail: url });
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Get("admin/all")
  @ApiOperation({ summary: "Admin: list templates" })
  async adminFindAll(@Query("categoryId") categoryId?: string) {
    return this.templatesService.adminFindAll(categoryId);
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Get("admin/:id")
  @ApiOperation({ summary: "Admin: get template by ID" })
  async adminFindById(@Param("id") id: string) {
    return this.templatesService.adminFindById(id);
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin/diversify")
  @ApiOperation({ summary: "Admin: make templates visually distinct" })
  async diversifyAll() {
    return this.templatesService.diversifyAllTemplates();
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin/ensure-error-pages")
  @ApiOperation({ summary: "Admin: asegurar página 404 en todas las plantillas" })
  async ensureErrorPages() {
    return this.templatesService.ensureErrorPagesForAllTemplates();
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin/:id/diversify")
  @ApiOperation({ summary: "Admin: make a template visually distinct" })
  async diversifyOne(@Param("id") id: string) {
    return this.templatesService.diversifyTemplate(id);
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("admin/:id/presets/portfolio-creativo")
  @ApiOperation({ summary: "Admin: apply Portafolio Creativo preset" })
  async applyPortfolioCreativo(@Param("id") id: string) {
    return this.templatesService.applyPortfolioCreativoPreset(id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get template by ID" })
  async findById(@CurrentUser() user: any, @Param("id") id: string) {
    return this.templatesService.findByIdForTenant(id, user.tenantId);
  }

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("from-site/:siteId")
  @ApiOperation({ summary: "Save site as template" })
  async createFromSite(
    @Param("siteId") siteId: string,
    @Body() body: { name: string; description?: string }
  ) {
    return this.templatesService.createFromSite(siteId, body.name, body.description);
  }

  @Put(":id")
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiOperation({ summary: "Update template" })
  async update(@Param("id") id: string, @Body() body: any) {
    return this.templatesService.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiOperation({ summary: "Super admin: eliminar plantilla" })
  async remove(@CurrentUser() user: any, @Param("id") id: string) {
    if (!user?.roles?.includes("super_admin")) {
      throw new ForbiddenException("Solo el super admin puede eliminar plantillas");
    }
    return this.templatesService.remove(id);
  }

  @Post("categories")
  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @ApiOperation({ summary: "Create template category" })
  async createCategory(@Body() body: { name: string; slug?: string }) {
    return this.templatesService.createCategory(body);
  }
}
