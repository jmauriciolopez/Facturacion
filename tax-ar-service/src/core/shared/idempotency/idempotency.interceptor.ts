import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IdempotencyService } from './idempotency.service';
import { Response as ExpressResponse } from 'express';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotencyService: IdempotencyService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<ExpressResponse>();
    
    // In this architecture, tenantId is expected to be attached to the request by AuthGuard/Middleware
    const tenantId = request.tenant?.id || request.tenantId;
    const idempotencyKey = request.headers['x-idempotency-key'] as string;

    if (!tenantId || !idempotencyKey) {
      return next.handle();
    }

    // 1. Check if we already have a record for this key and tenant
    const record = await this.idempotencyService.getRecord(tenantId, idempotencyKey);

    if (record) {
      // Return cached response
      response.status(record.statusCode);
      response.setHeader('x-idempotency-hit', 'true');
      return of(record.responseBody);
    }

    // 2. If no record, proceed with execution and cache the result
    return next.handle().pipe(
      map(async (data) => {
        // We only cache successful responses (2xx) or specific business errors if needed
        const statusCode = response.statusCode;
        
        if (statusCode >= 200 && statusCode < 300) {
          await this.idempotencyService.saveRecord({
            tenantId,
            idempotencyKey,
            method: request.method,
            path: request.url,
            statusCode,
            responseBody: data,
          });
        }
        
        return data;
      }),
    );
  }
}
