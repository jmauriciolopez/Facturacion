import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global: PrismaService disponible en toda la app
 * sin necesidad de importar PrismaModule en cada feature module.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
