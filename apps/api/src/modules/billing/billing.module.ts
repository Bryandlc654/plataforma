import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { PlatformModule } from "../platform/platform.module";

@Module({
  imports: [SubscriptionsModule, PlatformModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
