import { UUID, ISODateString } from '../shared';
import { AuditEventType } from './enums';

export interface FiscalEvent {
  id: UUID;
  tenantId: UUID;
  fiscalDocumentId?: UUID;
  eventType: AuditEventType;
  /** Actor que originó el evento (sistema cliente, scheduler, etc.) */
  actor?: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
  errorMessage?: string;
  errorStack?: string;
  occurredAt: ISODateString;
}
