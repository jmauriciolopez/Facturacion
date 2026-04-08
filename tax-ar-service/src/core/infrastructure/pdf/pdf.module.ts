import { Module } from '@nestjs/common';
import { InvoiceGeneratorService } from './invoice.generator.service';

@Module({
  providers: [InvoiceGeneratorService],
  exports: [InvoiceGeneratorService],
})
export class PdfModule {}
