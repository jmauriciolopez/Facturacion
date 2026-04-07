import { UUID, ISODateString } from '../shared';
import { IvaCondition } from './enums';

/** Perfil fiscal del emisor (empresa que factura) */
export interface FiscalProfile {
  id: UUID;
  tenantId: UUID;
  /** CUIT del emisor registrado en AFIP */
  cuit: string;
  businessName: string;
  fantasyName?: string;
  ivaCondition: IvaCondition;
  /** Domicilio fiscal registrado en AFIP */
  address: string;
  city: string;
  province: string;
  zipCode: string;
  /** Número de inicio de actividades (YYYYMMDD) */
  activityStartDate: string;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
