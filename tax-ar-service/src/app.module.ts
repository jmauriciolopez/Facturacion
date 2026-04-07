import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { PrismaModule } from './core/infrastructure/prisma/prisma.module';
import appConfig from './modules/config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    ObservabilityModule,
    HealthModule,
    FiscalModule,
  ],
})
export class AppModule {}
