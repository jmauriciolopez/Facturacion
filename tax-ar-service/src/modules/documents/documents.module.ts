import { Module } from '@nestjs/common';
import { FiscalDocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  controllers: [FiscalDocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
