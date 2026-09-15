import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PopupsService } from "./popups.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("popups")
@Controller("popups")
export class PopupsController {
  constructor(private readonly popupsService: PopupsService) {}

  @Get("sites/:siteId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List popups of a site" })
  async list(
    @Param("siteId") siteId: string,
    @CurrentUser("tenantId") tenantId: string
  ) {
    return this.popupsService.list(siteId, tenantId);
  }

  @Post("sites/:siteId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a popup on a site" })
  async create(
    @Param("siteId") siteId: string,
    @CurrentUser("tenantId") tenantId: string,
    @Body() body: any
  ) {
    return this.popupsService.create(siteId, tenantId, body);
  }

  @Put("sites/:siteId/:popupId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a popup" })
  async update(
    @Param("siteId") siteId: string,
    @Param("popupId") popupId: string,
    @CurrentUser("tenantId") tenantId: string,
    @Body() body: any
  ) {
    return this.popupsService.update(siteId, tenantId, popupId, body);
  }

  @Delete("sites/:siteId/:popupId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a popup" })
  async remove(
    @Param("siteId") siteId: string,
    @Param("popupId") popupId: string,
    @CurrentUser("tenantId") tenantId: string
  ) {
    return this.popupsService.remove(siteId, tenantId, popupId);
  }
}
