import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { OrdersModule } from "../orders/orders.module";
import { PublishingModule } from "../publishing/publishing.module";

@Module({
  imports: [OrdersModule, PublishingModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}