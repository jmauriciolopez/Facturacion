import { UUID, ISODateString } from '../shared';
import { CustomerDocType, IvaCondition } from './enums';

/** Datos fiscales del receptor del comprobante */
export interface CustomerFiscalData {
  id: UUID;
  tenantId: UUID;
  docType: CustomerDocType;
  docNumber: string;
  businessName: string;
  ivaCondition: IvaCondition;
  address?: string;
  email?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
