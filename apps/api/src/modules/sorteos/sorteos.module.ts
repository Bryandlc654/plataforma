import { Module } from "@nestjs/common";
import { SorteosController } from "./sorteos.controller";
import { SorteosService } from "./sorteos.service";

@Module({
  controllers: [SorteosController],
  providers: [SorteosService],
  exports: [SorteosService],
})
export class SorteosModule {}
