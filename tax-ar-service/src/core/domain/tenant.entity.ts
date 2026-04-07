import { UUID, ISODateString } from '../shared';
import { FiscalEnvironment } from './enums';

export interface Tenant {
  id: UUID;
  name: string;
  /** CUIT del sistema cliente que consume el microservicio */
  clientCuit: string;
  /** API key hasheada del sistema cliente */
  apiKeyHash: string;
  isActive: boolean;
  fiscalEnvironment: FiscalEnvironment;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
