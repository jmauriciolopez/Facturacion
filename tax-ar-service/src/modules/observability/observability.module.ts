import { Module, Global } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport: process.env.NODE_ENV !== 'production' 
          ? { target: 'pino-pretty', options: { colorize: true } } 
          : undefined,
        customProps: () => ({
          service: 'tax-ar-service',
        }),
      },
    }),
  ],
  exports: [LoggerModule],
})
export class ObservabilityModule {}
