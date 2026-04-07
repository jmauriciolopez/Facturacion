import { UUID, ISODateString } from '../shared';
import { FiscalEnvironment } from './enums';

/** Certificado digital del emisor para autenticarse contra WSAA */
export interface TenantCertificate {
  id: UUID;
  tenantId: UUID;
  environment: FiscalEnvironment;
  /** Certificado X.509 en PEM — almacenado en texto plano (no es secreto) */
  certificatePem: string;
  /** Private key cifrada con AES — NUNCA en texto plano en la DB */
  encryptedPrivateKey: string;
  /** Fecha de expiración del certificado */
  expiresAt: ISODateString;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
