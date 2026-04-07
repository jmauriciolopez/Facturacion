import { UUID, ISODateString } from '../shared';

/**
 * Registro de idempotencia para emisiones.
 * Permite que el cliente reenvíe el mismo request
 * sin riesgo de duplicar un comprobante.
 */
export interface IdempotencyRecord {
  id: UUID;
  tenantId: UUID;
  /** Clave provista por el cliente en el header Idempotency-Key */
  idempotencyKey: string;
  /** ID del comprobante fiscal generado en el primer request */
  fiscalDocumentId: UUID;
  /** Status HTTP de la primera respuesta */
  responseStatus: number;
  /** Cuerpo serializado de la primera respuesta */
  responseBody: string;
  createdAt: ISODateString;
  /** TTL: los registros se pueden limpiar pasada esta fecha */
  expiresAt: ISODateString;
}
