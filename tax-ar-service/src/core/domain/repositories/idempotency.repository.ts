import { UUID } from '../../shared';
import { IdempotencyRecord } from '../idempotency-record.entity';

export interface IdempotencyRepository {
  findByKey(tenantId: UUID, key: string): Promise<IdempotencyRecord | null>;
  save(record: Omit<IdempotencyRecord, 'id' | 'createdAt'>): Promise<IdempotencyRecord>;
}
