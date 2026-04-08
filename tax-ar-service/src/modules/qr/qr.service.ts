import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

/**
 * Interface representing the minimal data required from a FiscalDocument 
 * to generate an AFIP-compliant QR code.
 */
export interface QrDocumentData {
  id: string;
  date: Date;
  pointOfSale: { number: number };
  documentType: number;
  documentNumber: number;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  customer: { docType: number; docNumber: string };
  authorization: { cae: string };
  tenant: { fiscalProfile: { cuit: string } };
}

@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);
  private readonly ARCA_QR_URL = 'https://www.arca.gob.ar/fe/qr/?p=';

  /**
   * Generates the AFIP-compliant JSON payload for a given authorized document.
   */
  generatePayload(doc: QrDocumentData): any {
    if (!doc.authorization) {
      throw new Error(`Document ${doc.id} is not authorized. Cannot generate QR payload.`);
    }

    // AFIP expectations:
    // Moneda: PES, DOL, etc.
    const mappedCurrency = doc.currency === 'ARS' ? 'PES' : (doc.currency === 'USD' ? 'DOL' : doc.currency);

    return {
      ver: 1,
      fecha: doc.date.toISOString().split('T')[0],
      cuit: parseInt(doc.tenant?.fiscalProfile?.cuit || '0', 10),
      ptoVta: doc.pointOfSale.number,
      tipoCmp: doc.documentType,
      nroCmp: doc.documentNumber,
      importe: parseFloat(doc.totalAmount.toString()),
      moneda: mappedCurrency,
      ctz: parseFloat(doc.exchangeRate.toString()) || 1,
      tipoDocRec: doc.customer.docType,
      nroDocRec: parseInt(doc.customer.docNumber, 10),
      tipoCodAut: 'E', // 'E' for CAE
      codAut: parseInt(doc.authorization.cae, 10),
    };
  }

  /**
   * Generates a Data URL (base64 image) for the fiscal QR.
   */
  async generateQrDataUrl(doc: QrDocumentData): Promise<string> {
    const payload = this.generatePayload(doc);
    const jsonStr = JSON.stringify(payload);
    const encodedPayload = Buffer.from(jsonStr).toString('base64');
    const fullUrl = `${this.ARCA_QR_URL}${encodedPayload}`;

    try {
      return await QRCode.toDataURL(fullUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 300, // Slightly larger for PDF quality
      });
    } catch (error) {
      this.logger.error(`Error generating QR for document ${doc.id}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Returns the raw ARCA URL containing the encoded payload.
   */
  getAfipUrl(doc: QrDocumentData): string {
    const payload = this.generatePayload(doc);
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${this.ARCA_QR_URL}${encodedPayload}`;
  }
}
