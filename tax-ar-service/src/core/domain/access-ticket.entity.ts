import { UUID, ISODateString } from '../shared';
import { FiscalEnvironment } from './enums';

/**
 * Token de acceso obtenido de WSAA.
 * Se cachea por tenant + ambiente + servicio para reutilizarlo
 * hasta que expire (tipicamente 12hs).
 */
export interface AccessTicket {
  id: UUID;
  tenantId: UUID;
  environment: FiscalEnvironment;
  /** Servicio AFIP al que pertenece el ticket (wsfev1, wsfex, etc.) */
  service: string;
  token: string;
  sign: string;
  /** Generado en (UTC ISO) */
  generatedAt: ISODateString;
  /** Expira en (UTC ISO) — extraído del XML de respuesta WSAA */
  expiresAt: ISODateString;
  createdAt: ISODateString;
}
