import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HealthModule } from './modules/health/health.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { PrismaModule } from './core/infrastructure/prisma/prisma.module';
import { SecurityModule } from './core/infrastructure/security/security.module';
import { AfipModule } from './core/infrastructure/afip/afip.module';
import { SharedModule } from './core/shared/shared.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CorrelationIdMiddleware } from './core/infrastructure/logging/correlation-id.middleware';
import { LoggerInterceptor } from './core/shared/logging/logger.interceptor';
import appConfig from './modules/config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    SecurityModule,
    AfipModule,
    SharedModule,
    ObservabilityModule,
    HealthModule,
    FiscalModule,
    TenantsModule,
    DocumentsModule,
    CertificatesModule,
    MaintenanceModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
