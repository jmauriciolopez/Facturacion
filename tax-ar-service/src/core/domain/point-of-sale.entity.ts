import { UUID, ISODateString } from '../shared';

export interface PointOfSale {
  id: UUID;
  tenantId: UUID;
  /** Número de punto de venta registrado en AFIP (1-9998) */
  number: number;
  description?: string;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
