import { Module } from '@nestjs/common';
import { FiscalDocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AfipModule } from '../../core/infrastructure/afip/afip.module';
import { PdfModule } from '../../core/infrastructure/pdf/pdf.module';

@Module({
  imports: [AfipModule, PdfModule],
  controllers: [FiscalDocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
