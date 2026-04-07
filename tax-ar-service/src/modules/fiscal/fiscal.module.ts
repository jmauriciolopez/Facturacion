import { Module } from '@nestjs/common';

/**
 * Módulo fiscal principal.
 * A medida que avancen las etapas, este módulo importará:
 * - TenantsModule
 * - CertificatesModule
 * - DocumentsModule
 * - WsaaModule
 * - Wsfev1Module
 * - AuditModule
 * - QrModule
 * - PdfModule
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class FiscalModule {}
