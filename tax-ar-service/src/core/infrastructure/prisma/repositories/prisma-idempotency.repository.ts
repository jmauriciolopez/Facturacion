import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IdempotencyRepository } from '../../../domain/repositories/idempotency.repository';
import { IdempotencyRecord } from '../../../domain/idempotency-record.entity';
import { UUID } from '../../../shared';

@Injectable()
export class PrismaIdempotencyRepository implements IdempotencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(tenantId: UUID, key: string): Promise<IdempotencyRecord | null> {
    const record = await this.prisma.idempotencyRecord.findUnique({
      where: {
        tenantId_idempotencyKey: {
          tenantId,
          idempotencyKey: key,
        },
      },
    });

    if (!record) return null;
    return record as unknown as IdempotencyRecord;
  }

  async save(
    record: Omit<IdempotencyRecord, 'id' | 'createdAt'>,
  ): Promise<IdempotencyRecord> {
    const result = await this.prisma.idempotencyRecord.upsert({
      where: {
        tenantId_idempotencyKey: {
          tenantId: record.tenantId,
          idempotencyKey: record.idempotencyKey,
        },
      },
      update: {
        statusCode: record.responseStatus,
        responseBody: record.responseBody as any,
      },
      create: {
        tenantId: record.tenantId,
        idempotencyKey: record.idempotencyKey,
        method: 'POST',
        path: '/fiscal-documents',
        statusCode: record.responseStatus,
        responseBody: record.responseBody as any,
      },
    });

    return result as unknown as IdempotencyRecord;
  }
}
