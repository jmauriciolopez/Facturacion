import { Module, Global } from '@nestjs/common';
import { IdempotencyService } from './idempotency/idempotency.service';
import { IdempotencyInterceptor } from './idempotency/idempotency.interceptor';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [IdempotencyService, IdempotencyInterceptor],
  exports: [IdempotencyService, IdempotencyInterceptor],
})
export class SharedModule {}
