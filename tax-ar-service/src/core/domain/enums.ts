/** Ambiente AFIP/ARCA */
export enum FiscalEnvironment {
  HOMOLOGATION = 'homologation',
  PRODUCTION = 'production',
}

/** Estado del ciclo de vida de un comprobante */
export enum FiscalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  REJECTED = 'rejected',
  ERROR = 'error',
  CANCELLED = 'cancelled',
}

/** Concepto del comprobante según AFIP */
export enum DocumentConcept {
  PRODUCTS = 1,
  SERVICES = 2,
  PRODUCTS_AND_SERVICES = 3,
}

/** Monedas soportadas */
export enum CurrencyCode {
  ARS = 'PES',
  USD = 'DOL',
  EUR = '060',
}

/** Tipos de documento del receptor */
export enum CustomerDocType {
  CUIT = 80,
  CUIL = 86,
  CDI = 87,
  DNI = 96,
  FOREIGN = 99,
}

/** Tipos de comprobante AFIP más usados */
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

/** Tipos de evento de auditoría */
export enum AuditEventType {
  DOCUMENT_CREATED = 'document_created',
  DOCUMENT_VALIDATED = 'document_validated',
  DOCUMENT_VALIDATION_FAILED = 'document_validation_failed',
  WSAA_TOKEN_REQUESTED = 'wsaa_token_requested',
  WSAA_TOKEN_REFRESHED = 'wsaa_token_refreshed',
  WSFEV1_REQUEST_SENT = 'wsfev1_request_sent',
  WSFEV1_RESPONSE_RECEIVED = 'wsfev1_response_received',
  DOCUMENT_AUTHORIZED = 'document_authorized',
  DOCUMENT_REJECTED = 'document_rejected',
  DOCUMENT_ERROR = 'document_error',
  RETRY_ATTEMPTED = 'retry_attempted',
  PDF_GENERATED = 'pdf_generated',
  QR_GENERATED = 'qr_generated',
}

/** Condición IVA del emisor/receptor */
export enum IvaCondition {
  RESPONSABLE_INSCRIPTO = 'RI',
  MONOTRIBUTISTA = 'MT',
  EXENTO = 'EX',
  CONSUMIDOR_FINAL = 'CF',
  NO_RESPONSABLE = 'NR',
}
