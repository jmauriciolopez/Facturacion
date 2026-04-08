import { Module } from '@nestjs/common';
import { CatalogsService } from './catalogs.service';
import { FiscalValidationService } from './fiscal-validation.service';
import { PrismaModule } from '../../core/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [CatalogsService, FiscalValidationService],
  exports: [CatalogsService, FiscalValidationService],
})
export class FiscalModule {}
