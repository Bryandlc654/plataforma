import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PagesService } from "./pages.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("pages")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PagesController {
  constructor(private pagesService: PagesService) {}

  @Get("sites/:siteId/pages")
  @ApiOperation({ summary: "List pages for a site" })
  async findAll(@Param("siteId") siteId: string, @CurrentUser() user: any) {
    return this.pagesService.findAll(siteId, user.tenantId);
  }

  @Post("sites/:siteId/pages")
  @ApiOperation({ summary: "Create page" })
  async create(
    @Param("siteId") siteId: string,
    @CurrentUser() user: any,
    @Body() body: any
  ) {
    return this.pagesService.create(siteId, user.tenantId, body);
  }

  @Get("pages/:id")
  @ApiOperation({ summary: "Get page by ID" })
  async findById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.pagesService.findById(id, user.tenantId);
  }

  @Put("pages/:id")
  @ApiOperation({ summary: "Update page" })
  async update(@Param("id") id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.pagesService.update(id, user.tenantId, body);
  }

  @Delete("pages/:id")
  @ApiOperation({ summary: "Delete page" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.pagesService.remove(id, user.tenantId);
  }

  @Put("sites/:siteId/pages/reorder")
  @ApiOperation({ summary: "Reorder pages" })
  async reorderPages(
    @Param("siteId") siteId: string,
    @CurrentUser() user: any,
    @Body("pageIds") pageIds: string[]
  ) {
    return this.pagesService.reorderPages(siteId, user.tenantId, pageIds);
  }

  @Post("pages/:pageId/blocks")
  @ApiOperation({ summary: "Add block to page" })
  async addBlock(
    @Param("pageId") pageId: string,
    @CurrentUser() user: any,
    @Body() body: any
  ) {
    return this.pagesService.addBlock(pageId, user.tenantId, body);
  }

  @Put("blocks/:id")
  @ApiOperation({ summary: "Update block" })
  async updateBlock(@Param("id") id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.pagesService.updateBlock(id, user.tenantId, body);
  }

  @Delete("blocks/:id")
  @ApiOperation({ summary: "Delete block" })
  async removeBlock(@Param("id") id: string, @CurrentUser() user: any) {
    return this.pagesService.removeBlock(id, user.tenantId);
  }

  @Put("pages/:pageId/blocks/reorder")
  @ApiOperation({ summary: "Reorder blocks" })
  async reorderBlocks(
    @Param("pageId") pageId: string,
    @CurrentUser() user: any,
    @Body("blockIds") blockIds: string[]
  ) {
    return this.pagesService.reorderBlocks(pageId, user.tenantId, blockIds);
  }
}
