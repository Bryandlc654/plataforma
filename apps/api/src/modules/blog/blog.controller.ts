import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { BlogService } from "./blog.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("blog")
@Controller("blog")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Get("sites/:siteId/settings")
  @ApiOperation({ summary: "Get blog settings for a site" })
  async getSettings(@CurrentUser() user: any, @Param("siteId") siteId: string) {
    return this.blogService.getSettings(siteId, user.tenantId);
  }

  @Put("sites/:siteId/settings")
  @ApiOperation({ summary: "Enable/disable and configure the blog" })
  async updateSettings(
    @CurrentUser() user: any,
    @Param("siteId") siteId: string,
    @Body() body: { enabled?: boolean; title?: string; slug?: string },
  ) {
    return this.blogService.updateSettings(siteId, user.tenantId, body);
  }

  @Get("sites/:siteId/articles")
  @ApiOperation({ summary: "List blog articles" })
  async list(
    @CurrentUser() user: any,
    @Param("siteId") siteId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    return this.blogService.list(
      siteId,
      user.tenantId,
      parseInt(page || "1", 10),
      parseInt(limit || "20", 10),
      status,
    );
  }

  @Get("sites/:siteId/articles/:id")
  @ApiOperation({ summary: "Get a blog article" })
  async get(
    @CurrentUser() user: any,
    @Param("siteId") siteId: string,
    @Param("id") id: string,
  ) {
    return this.blogService.get(siteId, user.tenantId, id);
  }

  @Post("sites/:siteId/articles")
  @ApiOperation({ summary: "Create a blog article" })
  async create(
    @CurrentUser() user: any,
    @Param("siteId") siteId: string,
    @Body() body: any,
  ) {
    return this.blogService.create(siteId, user.tenantId, body);
  }

  @Put("sites/:siteId/articles/:id")
  @ApiOperation({ summary: "Update a blog article" })
  async update(
    @CurrentUser() user: any,
    @Param("siteId") siteId: string,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.blogService.update(siteId, user.tenantId, id, body);
  }

  @Delete("sites/:siteId/articles/:id")
  @ApiOperation({ summary: "Delete a blog article" })
  async remove(
    @CurrentUser() user: any,
    @Param("siteId") siteId: string,
    @Param("id") id: string,
  ) {
    return this.blogService.remove(siteId, user.tenantId, id);
  }
}
