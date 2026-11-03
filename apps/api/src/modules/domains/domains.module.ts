import { Module } from "@nestjs/common";
import { DomainsController } from "./domains.controller";
import { DomainsService } from "./domains.service";
import { HostingerService } from "./hostinger.service";
import { PlatformModule } from "../platform/platform.module";
import { SitesModule } from "../sites/sites.module";

@Module({
  imports: [PlatformModule, SitesModule],
  controllers: [DomainsController],
  providers: [DomainsService, HostingerService],
})
export class DomainsModule {}
