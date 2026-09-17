import { Module } from "@nestjs/common";
import { TemplatesController } from "./templates.controller";
import { TemplatesService } from "./templates.service";
import { TemplatesImportService } from "./zip-import.service";

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplatesImportService],
  exports: [TemplatesService, TemplatesImportService],
})
export class TemplatesModule {}
