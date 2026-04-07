import { UUID } from '../../shared';
import { FiscalEvent } from '../fiscal-event.entity';
import { AuditEventType } from '../enums';

export interface FiscalEventRepository {
  findByDocument(fiscalDocumentId: UUID): Promise<FiscalEvent[]>;
  findByTenant(tenantId: UUID, limit?: number): Promise<FiscalEvent[]>;
  save(event: Omit<FiscalEvent, 'id' | 'occurredAt'>): Promise<FiscalEvent>;
  saveMany(events: Omit<FiscalEvent, 'id' | 'occurredAt'>[]): Promise<void>;
}
