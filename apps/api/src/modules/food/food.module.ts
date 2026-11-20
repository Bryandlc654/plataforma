import { Module } from "@nestjs/common";
import { FoodController, FoodPublicController } from "./food.controller";
import { FoodService } from "./food.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [FoodPublicController, FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
