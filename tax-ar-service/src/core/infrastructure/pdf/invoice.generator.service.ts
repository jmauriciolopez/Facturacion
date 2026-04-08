import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as qrcode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { FiscalDocument, FiscalAuthorization } from '@prisma/client';

@Injectable()
export class InvoiceGeneratorService {
  private readonly logger = new Logger(InvoiceGeneratorService.name);

  /**
   * Generates a premium PDF for a fiscal document, including the AFIP QR code.
   */
  async generateInvoicePdf(
    document: any, // Using any to access relations like pointOfSale, customer, profile
    authorization: FiscalAuthorization,
  ): Promise<Buffer> {
    this.logger.log(`Generating PDF for document ${document.id}`);

    // 1. Generate QR Code
    const qrImage = await this.generateAfipQr(document, authorization);

    // 2. Prepare Template Data
    const templateData = this.prepareTemplateData(document, authorization, qrImage);

    // 3. Render HTML
    const html = await this.renderTemplate(templateData);

    // 4. Generate PDF via Puppeteer
    return this.convertToPdf(html);
  }

  /**
   * Generates the AFIP compliant QR code image in Base64.
   */
  private async generateAfipQr(document: any, authorization: FiscalAuthorization): Promise<string> {
    const qrData = {
      ver: 1,
      fecha: document.voucherDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'), // YYYY-MM-DD
      cuit: parseInt(document.tenant.clientCuit),
      ptoVta: document.pointOfSale.number,
      tipoCmp: document.voucherType,
      nroCmp: document.voucherNumber,
      importe: parseFloat(document.totalAmount.toString()),
      moneda: document.currency === 'ARS' ? 'PES' : 'DOL',
      ctz: parseFloat(document.exchangeRate.toString()) || 1,
      tipoDocRec: document.customer.docType,
      nroDocRec: parseInt(document.customer.docNumber),
      tipoCodAut: 'E', // CAE
      codAut: parseInt(authorization.cae),
    };

    const payload = Buffer.from(JSON.stringify(qrData)).toString('base64');
    const url = `https://www.arca.gob.ar/fe/qr/?p=${payload}`;

    return qrcode.toDataURL(url);
  }

  private prepareTemplateData(document: any, authorization: FiscalAuthorization, qrImage: string) {
    return {
      company: {
        name: document.tenant.name,
        cuit: document.tenant.clientCuit,
        address: document.pointOfSale.description || 'S/D', // Placeholder or use FiscalProfile
        // Add more from FiscalProfile if available in relations
      },
      document: {
        type: this.getVoucherTypeText(document.voucherType),
        typeCode: document.voucherType.toString().padStart(2, '0'),
        number: `${document.pointOfSale.number.toString().padStart(5, '0')}-${document.voucherNumber.toString().padStart(8, '0')}`,
        date: document.voucherDate.replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2/$1'),
        cae: authorization.cae,
        caeVto: authorization.caeExpirationDate.replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2/$1'),
        qrImage,
      },
      customer: {
        name: document.customer.businessName,
        docType: this.getDocTypeText(document.customer.docType),
        docNumber: document.customer.docNumber,
        ivaCondition: document.customer.ivaCondition,
        address: document.customer.address,
      },
      items: document.items.map((item: any) => ({
        description: item.description,
        quantity: parseFloat(item.quantity.toString()),
        unitPrice: parseFloat(item.unitPrice.toString()),
        ivaRate: `${parseFloat(item.ivaAliquotRate.toString())}%`,
        subtotal: parseFloat(item.subtotal.toString()),
        total: parseFloat(item.total.toString()),
      })),
      totals: {
        net: parseFloat(document.netAmount.toString()),
        iva: parseFloat(document.ivaAmount.toString()),
        total: parseFloat(document.totalAmount.toString()),
        currency: document.currency,
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
