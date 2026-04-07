import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

/**
 * Logger estructurado en JSON.
 * En producción, la salida puede ser consumida por Datadog, Loki, CloudWatch, etc.
 * Incluye correlationId para trazabilidad por request.
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private formatEntry(
    level: string,
    message: string,
    context?: string,
    extra?: Record<string, unknown>,
  ): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: 'tax-ar-service',
      context: context ?? 'App',
      message,
      ...extra,
    });
  }

  log(message: string, context?: string, extra?: Record<string, unknown>) {
    console.log(this.formatEntry('info', message, context, extra));
  }

  error(message: string, trace?: string, context?: string) {
    console.error(this.formatEntry('error', message, context, { trace }));
  }

  warn(message: string, context?: string) {
    console.warn(this.formatEntry('warn', message, context));
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatEntry('debug', message, context));
    }
  }

  verbose(message: string, context?: string) {
    console.log(this.formatEntry('verbose', message, context));
  }
}
