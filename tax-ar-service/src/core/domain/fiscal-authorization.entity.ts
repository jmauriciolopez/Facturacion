import { UUID, ISODateString } from '../shared';

/** CAE otorgado por AFIP para un comprobante autorizado */
export interface FiscalAuthorization {
  id: UUID;
  fiscalDocumentId: UUID;
  cae: string;
  /** Fecha de vencimiento del CAE (YYYYMMDD) */
  caeExpirationDate: string;
  /** Número de comprobante asignado */
  voucherNumber: number;
  /** Observaciones devueltas por AFIP (puede haber CAE con advertencias) */
  observations?: FiscalObservation[];
  authorizedAt: ISODateString;
}

export interface FiscalObservation {
  code: number;
  message: string;
}
