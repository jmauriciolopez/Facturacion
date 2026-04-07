import { UUID } from '../../shared';
import { AccessTicket } from '../access-ticket.entity';
import { FiscalEnvironment } from '../enums';

export interface AccessTicketRepository {
  findValid(
    tenantId: UUID,
    environment: FiscalEnvironment,
    service: string,
  ): Promise<AccessTicket | null>;
  save(ticket: Omit<AccessTicket, 'id' | 'createdAt'>): Promise<AccessTicket>;
  invalidate(
    tenantId: UUID,
    environment: FiscalEnvironment,
    service: string,
  ): Promise<void>;
}
