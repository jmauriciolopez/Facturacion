import { UUID, PaginationOptions, PaginatedResult } from '../../shared';
import { Tenant } from '../tenant.entity';

export interface TenantRepository {
  findById(id: UUID): Promise<Tenant | null>;
  findByCuit(cuit: string): Promise<Tenant | null>;
  findByApiKeyHash(hash: string): Promise<Tenant | null>;
  findAll(opts: PaginationOptions): Promise<PaginatedResult<Tenant>>;
  save(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant>;
  update(id: UUID, data: Partial<Tenant>): Promise<Tenant>;
}
