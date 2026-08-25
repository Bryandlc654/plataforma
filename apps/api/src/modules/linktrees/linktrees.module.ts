import { Module } from "@nestjs/common";
import { LinktreesController } from "./linktrees.controller";
import { LinktreesService } from "./linktrees.service";

@Module({
  controllers: [LinktreesController],
  providers: [LinktreesService],
  exports: [LinktreesService],
})
export class LinktreesModule {}
