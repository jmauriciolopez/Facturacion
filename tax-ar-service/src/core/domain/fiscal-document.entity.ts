import { UUID, ISODateString } from '../shared';
import {
  FiscalStatus,
  VoucherType,
  DocumentConcept,
  CurrencyCode,
} from './enums';
import { FiscalDocumentItem } from './fiscal-document-item.entity';

export interface AssociatedVoucher {
  voucherType: VoucherType;
  pointOfSale: number;
  number: number;
  date: string;
  cuit: string;
}

export interface FiscalDocument {
  id: UUID;
  tenantId: UUID;
  /** Idempotency key del request de creación */
  idempotencyKey?: string;
  /** Correlation ID para trazabilidad cross-service */
  correlationId?: string;
  pointOfSaleId: UUID;
  customerId: UUID;
  voucherType: VoucherType;
  concept: DocumentConcept;
  currency: CurrencyCode;
  exchangeRate: number;
  /** Número de comprobante asignado por AFIP */
  voucherNumber?: number;
  /** Fecha del comprobante (YYYYMMDD) */
  voucherDate: string;
  /** Fecha de servicio desde (YYYYMMDD) — obligatorio para conceptos 2 y 3 */
  serviceFromDate?: string;
  /** Fecha de servicio hasta (YYYYMMDD) */
  serviceToDate?: string;
  /** Fecha de vencimiento del pago (YYYYMMDD) */
  paymentDueDate?: string;
  netAmount: number;
  ivaAmount: number;
  otherTaxesAmount: number;
  totalAmount: number;
  status: FiscalStatus;
  items: FiscalDocumentItem[];
  associatedVouchers: AssociatedVoucher[];
  /** XML raw enviado a AFIP */
  rawRequest?: string;
  /** XML raw recibido de AFIP */
  rawResponse?: string;
  /** Metadatos adicionales */
  metadata?: Record<string, any>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
