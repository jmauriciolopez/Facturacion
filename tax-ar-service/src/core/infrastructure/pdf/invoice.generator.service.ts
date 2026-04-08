import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { FiscalAuthorization } from '@prisma/client';
import { QrService, QrDocumentData } from '../../../modules/qr/qr.service';

@Injectable()
export class InvoiceGeneratorService {
  private readonly logger = new Logger(InvoiceGeneratorService.name);

  constructor(private readonly qrService: QrService) {}

  /**
   * Generates a premium PDF for a fiscal document, including the ARCA QR code.
   */
  async generateInvoicePdf(
    document: any, // Joined data from DocumentsService
    authorization: FiscalAuthorization,
  ): Promise<Buffer> {
    const docId = String(document.id);
    this.logger.log(`Generating PDF for document ${docId}`);

    // Adjust data for QR service interface mapping
    const qrData: QrDocumentData = {
      id: docId,
      date: new Date(String(document.voucherDate).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')),
      pointOfSale: { number: Number(document.pointOfSale.number) },
      documentType: Number(document.voucherType),
      documentNumber: Number(document.voucherNumber),
      totalAmount: parseFloat(String(document.totalAmount)),
      currency: String(document.currency),
      exchangeRate: parseFloat(String(document.exchangeRate)),
      customer: {
        docType: Number(document.customer.docType),
        docNumber: String(document.customer.docNumber),
      },
      authorization: {
        cae: String(authorization.cae),
      },
      tenant: {
        fiscalProfile: {
          cuit: String(document.tenant.clientCuit),
        },
      },
    };

    // 1. Generate QR Code via dedicated service
    const qrImage = await this.qrService.generateQrDataUrl(qrData);

    // 2. Prepare Template Data
    const templateData = this.prepareTemplateData(document, authorization, qrImage);

    // 3. Render HTML
    const html = await this.renderTemplate(templateData);

    // 4. Generate PDF via Puppeteer
    return this.convertToPdf(html);
  }

  private prepareTemplateData(document: any, authorization: FiscalAuthorization, qrImage: string) {
    const posNumber = Number(document.pointOfSale.number).toString().padStart(5, '0');
    const voucherNumber = Number(document.voucherNumber).toString().padStart(8, '0');
    
    return {
      company: {
        name: String(document.tenant.name),
        cuit: String(document.tenant.clientCuit),
        address: String(document.pointOfSale.description || 'S/D'),
      },
      document: {
        type: this.getVoucherTypeText(Number(document.voucherType)),
        typeCode: Number(document.voucherType).toString().padStart(2, '0'),
        number: `${posNumber}-${voucherNumber}`,
        date: String(document.voucherDate).replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2/$1'),
        cae: String(authorization.cae),
        caeVto: String(authorization.caeExpirationDate).replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2/$1'),
        qrImage,
      },
      customer: {
        name: String(document.customer.businessName),
        docType: this.getDocTypeText(Number(document.customer.docType)),
        docNumber: String(document.customer.docNumber),
        ivaCondition: String(document.customer.ivaCondition),
        address: String(document.customer.address || ''),
      },
      items: document.items.map((item: any) => ({
        description: String(item.description),
        quantity: parseFloat(String(item.quantity)),
        unitPrice: parseFloat(String(item.unitPrice)),
        ivaRate: `${parseFloat(String(item.ivaAliquotRate))}%`,
        subtotal: parseFloat(String(item.subtotal)),
        total: parseFloat(String(item.total)),
      })),
      totals: {
        net: parseFloat(String(document.netAmount)),
        iva: parseFloat(String(document.ivaAmount)),
        total: parseFloat(String(document.totalAmount)),
        currency: String(document.currency),
      },
    };
  }

  private async renderTemplate(data: any): Promise<string> {
    const templatePath = path.join(__dirname, 'templates', 'invoice.template.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    return template(data);
  }

  private async convertToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });
    await browser.close();
    return Buffer.from(pdf);
  }

  private getVoucherTypeText(type: number): string {
    const types: Record<number, string> = {
      1: 'FACTURA A',
      6: 'FACTURA B',
      11: 'FACTURA C',
      2: 'NOTA DE DÉBITO A',
      3: 'NOTA DE CRÉDITO A',
      7: 'NOTA DE DÉBITO B',
      8: 'NOTA DE CRÉDITO B',
      12: 'NOTA DE DÉBITO C',
      13: 'NOTA DE CRÉDITO C',
    };
    return types[type] || 'COMPROBANTE';
  }

  private getDocTypeText(type: number): string {
    const types: Record<number, string> = {
      80: 'CUIT',
      86: 'CUIL',
      96: 'DNI',
      99: 'CO CONSUMIDOR FINAL',
    };
    return types[type] || 'DOC';
  }
}
