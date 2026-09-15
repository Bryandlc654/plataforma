import { Module } from "@nestjs/common";
import { PublishingController } from "./publishing.controller";
import { PublishingService } from "./publishing.service";
import { OrdersModule } from "../orders/orders.module";

@Module({
  imports: [OrdersModule],
  controllers: [PublishingController],
  providers: [PublishingService],
  exports: [PublishingService],
})
export class PublishingModule {}
