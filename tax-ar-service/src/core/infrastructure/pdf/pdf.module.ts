import { Module } from '@nestjs/common';
import { InvoiceGeneratorService } from './invoice.generator.service';
import { QrModule } from '../../../modules/qr/qr.module';

@Module({
  imports: [QrModule],
  providers: [InvoiceGeneratorService],
  exports: [InvoiceGeneratorService],
})
export class PdfModule {}
