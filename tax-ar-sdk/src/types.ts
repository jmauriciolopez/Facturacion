/**
 * Tipos e Interfaces para el SDK de Facturación AR
 */

export enum DocumentConcept {
  PRODUCTS = 1,
  SERVICES = 2,
  PRODUCTS_AND_SERVICES = 3,
}

export enum CurrencyCode {
  ARS = 'PES',
  USD = 'DOL',
  EUR = '060',
}

export enum CustomerDocType {
  CUIT = 80,
  CUIL = 86,
  CDI = 87,
  DNI = 96,
  FOREIGN = 99,
}

export enum VoucherType {
  FACTURA_A = 1,
  NOTA_DEBITO_A = 2,
  NOTA_CREDITO_A = 3,
  RECIBO_A = 4,
  FACTURA_B = 6,
  NOTA_DEBITO_B = 7,
  NOTA_CREDITO_B = 8,
  RECIBO_B = 9,
  FACTURA_C = 11,
  NOTA_DEBITO_C = 12,
  NOTA_CREDITO_C = 13,
  FACTURA_E = 19,
}

export enum IvaCondition {
  RESPONSABLE_INSCRIPTO = 'RI',
  MONOTRIBUTISTA = 'MT',
  EXENTO = 'EX',
  CONSUMIDOR_FINAL = 'CF',
  NO_RESPONSABLE = 'NR',
}

export interface CreateDocumentItem {
  productCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  ivaAliquotCode: number;
}

export interface CustomerData {
  docType: CustomerDocType;
  docNumber: string;
  businessName: string;
  ivaCondition: IvaCondition;
  address?: string;
  email?: string;
}

export interface CreateDocumentRequest {
  pointOfSaleId: string;
  customer: CustomerData;
  voucherType: VoucherType;
  concept: DocumentConcept;
  currency: CurrencyCode;
  exchangeRate?: number;
  voucherDate: string; // YYYYMMDD
  serviceFromDate?: string;
  serviceToDate?: string;
  paymentDueDate?: string;
  items: CreateDocumentItem[];
  idempotencyKey?: string;
}

export enum FiscalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  REJECTED = 'rejected',
  ERROR = 'error',
  CANCELLED = 'cancelled',
}

export interface FiscalDocumentResponse {
  id: string;
  status: FiscalStatus;
  voucherNumber?: number;
  cae?: string;
  caeDueDate?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QrResponse {
  qrDataUrl: string;
}

export interface AuditEvent {
  id: string;
  type: string;
  payload: any;
  createdAt: string;
}
