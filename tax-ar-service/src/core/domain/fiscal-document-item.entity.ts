import { UUID } from '../shared';

export interface IvaAliquot {
  /** Código AFIP de la alícuota */
  code: number;
  /** Descripción: 21%, 10.5%, etc. */
  description: string;
  /** Porcentaje como número (21, 10.5, 0) */
  rate: number;
}

export interface FiscalDocumentItem {
  id: UUID;
  fiscalDocumentId: UUID;
  /** Código interno del producto/servicio */
  productCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  /** Descuento en pesos */
  discount: number;
  subtotal: number;
  ivaAliquot: IvaAliquot;
  ivaAmount: number;
  /** Total del ítem incluyendo IVA */
  total: number;
}
