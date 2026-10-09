import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { KnowledgeBaseService, KB_CATEGORIES } from "./knowledge-base.service";

@ApiTags("knowledge-base")
@Controller("knowledge-base")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KnowledgeBaseController {
  constructor(private knowledgeBaseService: KnowledgeBaseService) {}

  private assertStaff(user: any) {
    if (!user?.roles?.includes("super_admin") && !user?.roles?.includes("support")) {
      throw new ForbiddenException("Solo el super admin puede gestionar la base de conocimientos");
    }
  }

  private assertSuperAdmin(user: any) {
    if (!user?.roles?.includes("super_admin")) {
      throw new ForbiddenException("Solo el super admin puede realizar esta acción");
    }
  }

  @Get()
  @ApiOperation({ summary: "Listar artículos publicados (todos los roles)" })
  async listPublished() {
    return this.knowledgeBaseService.listPublished();
  }

  @Get("categories")
  @ApiOperation({ summary: "Listar categorías con conteo de artículos publicados" })
  async categories() {
    return {
      categories: KB_CATEGORIES,
      counts: await this.knowledgeBaseService.counts(),
    };
  }

  @Get("all")
  @ApiOperation({ summary: "Listar todos los artículos incl. borradores (super admin/support)" })
  async listAll(@CurrentUser() user: any) {
    this.assertStaff(user);
    return this.knowledgeBaseService.listAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener un artículo publicado (o cualquiera para staff)" })
  async getOne(@CurrentUser() user: any, @Param("id") id: string) {
    const canSeeAll = user?.roles?.includes("super_admin") || user?.roles?.includes("support");
    return this.knowledgeBaseService.getOne(id, canSeeAll);
  }

  @Post()
  @ApiOperation({ summary: "Crear artículo (super admin)" })
  async create(@CurrentUser() user: any, @Body() body: any) {
    this.assertSuperAdmin(user);
    return this.knowledgeBaseService.create(body, user.id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Actualizar artículo (super admin)" })
  async update(@CurrentUser() user: any, @Param("id") id: string, @Body() body: any) {
    this.assertSuperAdmin(user);
    return this.knowledgeBaseService.update(id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar artículo (super admin)" })
  async remove(@CurrentUser() user: any, @Param("id") id: string) {
    this.assertSuperAdmin(user);
    return this.knowledgeBaseService.remove(id);
  }
}