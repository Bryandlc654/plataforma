import { Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SeedService } from "./seed.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { PERMISSIONS } from "../../shared/index";

@ApiTags("seed")
@Controller("seed")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SeedController {
  constructor(private seedService: SeedService) {}

  @RequirePermissions(PERMISSIONS.CONFIG_SYSTEM)
  @Post("ecommerce-template")
  @ApiOperation({ summary: "Admin: seed URBAN NOIR ecommerce template on demand" })
  async seedEcommerce() {
    await this.seedService.seedEcommerceTemplate();
    return { ok: true, message: "URBAN NOIR ecommerce template seeded" };
  }
}
