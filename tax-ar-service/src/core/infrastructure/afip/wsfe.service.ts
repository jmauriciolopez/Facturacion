import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { WsaaService } from './wsaa.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  FiscalEnvironment,
  FiscalStatus,
  DocumentConcept,
  CurrencyCode,
} from '../../domain/enums';
import * as soap from 'soap';

@Injectable()
export class WsfeService {
  private readonly logger = new Logger(WsfeService.name);
  private readonly WSFE_WSDL = {
    [FiscalEnvironment.HOMOLOGATION]:
      'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL',
    [FiscalEnvironment.PRODUCTION]:
      'https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly wsaa: WsaaService,
  ) {}

  /**
   * Authorizes a fiscal document against AFIP's WSFEV1 service.
   * Updates the document status and creates a FiscalAuthorization record on success.
   */
  async authorizeDocument(tenantId: string, documentId: string): Promise<any> {
    const document: any = await this.prisma.fiscalDocument.findUnique({
      where: { id: documentId },
      include: {
        pointOfSale: true,
        customer: true,
        items: true,
        tenant: true,
      },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    if (document.tenantId !== tenantId) {
      throw new BadRequestException(
        'Security mismatch: document belongs to another tenant',
      );
    }

    const env = document.tenant.fiscalEnvironment as FiscalEnvironment;

    // 1. Get valid Access Ticket
    const ticket = await this.wsaa.getValidTicket(tenantId, env, 'wsfe');

    // 2. Map document values to AFIP structure
    const voucherNumber = await this.getNextVoucherNumber(
      env,
      ticket,
      document.pointOfSale.number,
      document.voucherType,
      document.tenant.clientCuit,
    );

    const feCAEReq = this.mapToAfipRequest(document, voucherNumber);

    // 3. Call FECAESolicitar
    const response = await this.callFecaeSolicitar(
      env,
      ticket,
      document.tenant.clientCuit,
      feCAEReq,
    );

    // 4. Handle AFIP Response
    return this.processAfipResponse(document.id, response, voucherNumber);
  }

  /**
   * Gets the last authorized voucher number from AFIP to determine the next one.
   */
  private async getNextVoucherNumber(
    env: FiscalEnvironment,
    ticket: any,
    pos: number,
    voucherType: number,
    clientCuit: string,
  ): Promise<number> {
    const client = await this.getSoapClient(env);
    return new Promise((resolve, reject) => {
      const args = {
        Auth: {
          Token: ticket.token,
          Sign: ticket.sign,
          Cuit: clientCuit,
        },
        PtoVta: pos,
        CbteTipo: voucherType,
      };

      client.FECompUltimoAutorizado(args, (err: any, result: any) => {
        if (err)
          return reject(new Error('AFIP_LAST_VOUCHER_ERROR: ' + err.message));
        const lastNumber = result.FECompUltimoAutorizadoResult.CbteNro;
        resolve(lastNumber + 1);
      });
    });
  }

  /**
   * Maps internal FiscalDocument to AFIP FECAESolicitar structure.
   */
  private mapToAfipRequest(document: any, voucherNumber: number) {
    return {
      FeCabReq: {
        CantReg: 1,
        PtoVta: document.pointOfSale.number,
        CbteTipo: document.voucherType,
      },
      FeDetReq: {
        FECAEDetRequest: {
          Concepto: document.concept || DocumentConcept.PRODUCTS,
          DocTipo: document.customer.docType,
          DocNro: document.customer.docNumber,
          CbteDesde: voucherNumber,
          CbteHasta: voucherNumber,
          CbteFch: document.voucherDate.replace(/-/g, ''),
          ImpTotal: document.totalAmount.toNumber(),
          ImpTotConc: 0,
          ImpNeto: document.netAmount.toNumber(),
          ImpOpEx: 0,
          ImpTrib: (document.otherTaxesAmount || 0).toNumber
            ? (document.otherTaxesAmount || 0).toNumber()
            : 0,
          ImpIVA: document.ivaAmount.toNumber(),
          MonId: document.currency === CurrencyCode.ARS ? 'PES' : 'DOL',
          MonCotiz: document.exchangeRate.toNumber(),
          Iva: {
            AlicIva: this.groupByIva(document.items),
          },
        },
      },
    };
  }

  private groupByIva(items: any[]) {
    const groups = new Map<number, { base: number; amount: number }>();
    for (const item of items) {
      const current = groups.get(item.ivaAliquotCode) || { base: 0, amount: 0 };
      groups.set(item.ivaAliquotCode, {
        base: current.base + item.subtotal.toNumber(),
        amount: current.amount + item.ivaAmount.toNumber(),
      });
    }

    return Array.from(groups.entries()).map(([id, data]) => ({
      Id: id,
      BaseImp: data.base.toFixed(2),
      Importe: data.amount.toFixed(2),
    }));
  }

  private async callFecaeSolicitar(
    env: FiscalEnvironment,
    ticket: any,
    cuit: string,
    feCAEReq: any,
  ): Promise<any> {
    const client = await this.getSoapClient(env);
    return new Promise((resolve, reject) => {
      const args = {
        Auth: {
          Token: ticket.token,
          Sign: ticket.sign,
          Cuit: cuit,
        },
        FeCAEReq: feCAEReq,
      };

      client.FECAESolicitar(args, (err: any, result: any) => {
        if (err) return reject(err);
        resolve(result.FECAESolicitarResult);
      });
    });
  }

  private async getSoapClient(env: FiscalEnvironment): Promise<any> {
    const wsdlUrl = this.WSFE_WSDL[env];
    return new Promise((resolve, reject) => {
      soap.createClient(wsdlUrl, (err, client) => {
        if (err) return reject(err);
        resolve(client);
      });
    });
  }

  private async processAfipResponse(
    docId: string,
    response: any,
    voucherNumber: number,
  ) {
    const result = response.FeDetResp.FECAEDetResponse[0];

    if (result.Resultado === 'A') {
      // Authorized
      await this.prisma.fiscalDocument.update({
        where: { id: docId },
        data: {
          status: FiscalStatus.AUTHORIZED as any,
          voucherNumber: voucherNumber,
          authorization: {
            create: {
              cae: result.CAE,
              caeExpirationDate: result.CAEFchVto,
              voucherNumber: voucherNumber,
              observations: response.Errors || null,
            },
          },
        },
      });
      return { status: 'AUTHORIZED', cae: result.CAE };
    } else {
      // Rejected
      const errorDetail =
        response.Errors || result.Observaciones || 'Rejected by AFIP';
      await this.prisma.fiscalDocument.update({
        where: { id: docId },
        data: {
          status: FiscalStatus.REJECTED as any,
          rawResponse: JSON.stringify(errorDetail),
        },
      });
      throw new BadRequestException(
        'AFIP_REJECTED: ' + JSON.stringify(errorDetail),
      );
    }
  }
}
