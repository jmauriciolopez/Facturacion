import { UUID } from '../../shared';
import { TenantCertificate } from '../tenant-certificate.entity';
import { FiscalEnvironment } from '../enums';

export interface TenantCertificateRepository {
  findActive(tenantId: UUID, environment: FiscalEnvironment): Promise<TenantCertificate | null>;
  findById(id: UUID): Promise<TenantCertificate | null>;
  save(cert: Omit<TenantCertificate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenantCertificate>;
  deactivateAll(tenantId: UUID, environment: FiscalEnvironment): Promise<void>;
}
