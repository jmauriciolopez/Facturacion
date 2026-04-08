import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const correlationId = req.headers['x-correlation-id'];

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const delay = Date.now() - now;
        
        this.logger.log({
          message: `${method} ${url} ${res.statusCode} +${delay}ms`,
          method,
          url,
          statusCode: res.statusCode,
          responseTime: delay,
          correlationId,
        });
      }),
    );
  }
}
