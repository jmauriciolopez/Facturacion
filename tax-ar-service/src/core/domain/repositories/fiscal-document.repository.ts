import { UUID, PaginationOptions, PaginatedResult } from '../../shared';
import { FiscalDocument } from '../fiscal-document.entity';
import { FiscalStatus } from '../enums';

export interface FiscalDocumentFilters {
  tenantId: UUID;
  status?: FiscalStatus;
  pointOfSaleId?: UUID;
  from?: string;
  to?: string;
}

export interface FiscalDocumentRepository {
  findById(id: UUID): Promise<FiscalDocument | null>;
  findByIdAndTenant(id: UUID, tenantId: UUID): Promise<FiscalDocument | null>;
  findAll(
    filters: FiscalDocumentFilters,
    opts: PaginationOptions,
  ): Promise<PaginatedResult<FiscalDocument>>;
  save(
    doc: Omit<
      FiscalDocument,
      'id' | 'createdAt' | 'updatedAt' | 'items' | 'associatedVouchers'
    >,
  ): Promise<FiscalDocument>;
  update(id: UUID, data: Partial<FiscalDocument>): Promise<FiscalDocument>;
}
