import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Global: el LoggerService queda disponible en toda la app
 * sin necesidad de importar ObservabilityModule en cada módulo.
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class ObservabilityModule {}
