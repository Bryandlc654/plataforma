import { Global, Module } from "@nestjs/common";
import { PlatformModule } from "../platform/platform.module";
import { EmailCampaignService } from "./email-campaign.service";
import { EmailService } from "./email.service";

@Global()
@Module({
  imports: [PlatformModule],
  providers: [EmailService, EmailCampaignService],
  exports: [EmailService],
})
export class EmailModule {}
