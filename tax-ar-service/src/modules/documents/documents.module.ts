import { Module } from '@nestjs/common';
import { FiscalDocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AfipModule } from '../../core/infrastructure/afip/afip.module';

@Module({
  imports: [AfipModule],
  controllers: [FiscalDocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
