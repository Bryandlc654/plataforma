import { Module } from "@nestjs/common";
import { SitesController } from "./sites.controller";
import { SitesService } from "./sites.service";
import { VercelService } from "./vercel.service";

@Module({
  controllers: [SitesController],
  providers: [SitesService, VercelService],
  exports: [SitesService, VercelService],
})
export class SitesModule {}
