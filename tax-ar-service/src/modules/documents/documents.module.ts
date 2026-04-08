import { Module } from '@nestjs/common';
import { FiscalDocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AfipModule } from '../../core/infrastructure/afip/afip.module';
import { PdfModule } from '../../core/infrastructure/pdf/pdf.module';
import { FiscalModule } from '../fiscal/fiscal.module';
import { UIMapperService } from './ui-mapper.service';

@Module({
  imports: [AfipModule, PdfModule, FiscalModule],
  controllers: [FiscalDocumentsController],
  providers: [DocumentsService, UIMapperService],
})
export class DocumentsModule {}
