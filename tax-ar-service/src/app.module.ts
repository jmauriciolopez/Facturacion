import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import appConfig from './modules/config/app.config';

@Module({
  imports: [
    // Configuración global — variables de entorno disponibles en toda la app
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Observabilidad: logs estructurados, correlationId
    ObservabilityModule,

    // Health checks
    HealthModule,

    // Módulo fiscal principal (entry point de toda la lógica fiscal)
    FiscalModule,
  ],
})
export class AppModule {}
