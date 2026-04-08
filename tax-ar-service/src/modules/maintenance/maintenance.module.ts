import { Module } from '@nestjs/common';
import { CleanupService } from './cleanup.service';
import { PrismaModule } from '../../core/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CleanupService],
  exports: [CleanupService],
})
export class MaintenanceModule {}
