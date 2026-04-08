import { Module } from '@nestjs/common';
import { CatalogsService } from './catalogs.service';
import { FiscalValidationService } from './fiscal-validation.service';
import { AuditService } from './audit.service';
import { PrismaModule } from '../../core/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [CatalogsService, FiscalValidationService, AuditService],
  exports: [CatalogsService, FiscalValidationService, AuditService],
})
export class FiscalModule {}
