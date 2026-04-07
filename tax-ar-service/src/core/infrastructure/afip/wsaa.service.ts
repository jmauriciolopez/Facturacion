import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AfipSignerService } from '../security/afip-signer.service';
import { CertificatesService } from '../../../modules/certificates/certificates.service';
import { FiscalEnvironment } from '../../domain/enums';
import { AccessTicket } from '@prisma/client';
import * as soap from 'soap';
import * as xml2js from 'xml2js';

@Injectable()
export class WsaaService {
  private readonly logger = new Logger(WsaaService.name);
  private readonly WSAA_WSDL = {
    [FiscalEnvironment.HOMOLOGATION]:
      'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?WSDL',
    [FiscalEnvironment.PRODUCTION]:
      'https://wsaa.afip.gov.ar/ws/services/LoginCms?WSDL',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly signer: AfipSignerService,
    private readonly certificates: CertificatesService,
  ) {}

  /**
   * Returns a valid Access Ticket (Token/Sign) for a specific tenant and service.
   * If a valid cached ticket exists, it returns it. Otherwise, it requests a new one from AFIP.
   */
  async getValidTicket(
    tenantId: string,
    environment: FiscalEnvironment,
    service: string = 'wsfe',
  ): Promise<AccessTicket> {
    const now = new Date();

    // 1. Check for valid cached ticket
    const cachedTicket = await this.prisma.accessTicket.findFirst({
      where: {
        tenantId,
        environment: environment as any,
        service,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (cachedTicket) {
      this.logger.debug(
        `Using cached AccessTicket for tenant ${tenantId} and service ${service}`,
      );
      return cachedTicket as any;
    }

    // 2. No valid ticket found, request a new one
    this.logger.log(
      `Requesting new AccessTicket from AFIP for tenant ${tenantId} and service ${service}`,
    );
    return this.requestNewTicket(tenantId, environment, service);
  }

  /**
   * Requests a new Access Ticket from AFIP's WSAA service.
   */
  private async requestNewTicket(
    tenantId: string,
    environment: FiscalEnvironment,
    service: string,
  ): Promise<AccessTicket> {
    // 2.1 Get certificate and decrypted private key
    const certificate = await this.certificates.findActive(
      tenantId as any,
      environment,
    );

    const privateKey = await this.certificates.getDecryptedPrivateKey(
      certificate.id as any,
    );

    // 2.2 Generate and sign the TRA (XML)
    const traXml = this.generateTra(service);
    const signedCms = this.signer.sign(
      traXml,
      certificate.certificatePem,
      privateKey,
    );

    // 2.3 Call WSAA LoginCms
    const wsdlUrl = this.WSAA_WSDL[environment];
    const authResponse = await this.callLoginCms(wsdlUrl, signedCms);

    // 2.4 Parse and store the ticket
    const ticketData = await this.parseWsaaResponse(authResponse);

    return (this.prisma.accessTicket as any).create({
      data: {
        tenantId,
        environment,
        service,
        token: ticketData.token,
        sign: ticketData.sign,
        generatedAt: ticketData.generatedAt,
        expiresAt: ticketData.expiresAt,
      },
    });
  }

  /**
   * Generates the TRA (Ticket de Requerimiento de Acceso) XML structure.
   */
  private generateTra(service: string): string {
    const now = new Date();
    const uniqueId = Math.floor(now.getTime() / 1000);
    const generationTime = new Date(now.getTime() - 3600000).toISOString(); // -1h offset for safety
    const expirationTime = new Date(now.getTime() + 3600000).toISOString(); // +1h

    return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${generationTime}</generationTime>
    <expirationTime>${expirationTime}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`;
  }

  /**
   * Calls the WSAA SOAP LoginCms web service.
   */
  private async callLoginCms(
    wsdlUrl: string,
    signedCms: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      soap.createClient(wsdlUrl, (err, client) => {
        if (err)
          return reject(new Error('WSAA_CLIENT_CREATE_ERROR: ' + err.message));

        client.loginCms({ in0: signedCms }, (err: any, result: any) => {
          if (err)
            return reject(new Error('WSAA_LOGIN_CMS_ERROR: ' + err.message));
          resolve(result.loginCmsReturn);
        });
      });
    });
  }

  /**
   * Parses the XML response from WSAA LoginCms using xml2js.
   */
  private async parseWsaaResponse(xmlResponse: string): Promise<{
    token: string;
    sign: string;
    generatedAt: Date;
    expiresAt: Date;
  }> {
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true,
    });
    try {
      const result = await parser.parseStringPromise(xmlResponse);
      const loginTicketResponse = result.loginTicketResponse;
      const header = loginTicketResponse.header;
      const credentials = loginTicketResponse.credentials;

      return {
        token: credentials.token,
        sign: credentials.sign,
        generatedAt: new Date(header.generationTime),
        expiresAt: new Date(header.expirationTime),
      };
    } catch (error: any) {
      this.logger.error('Error parsing WSAA response: ' + error.message);
      throw new Error('WSAA_RESPONSE_PARSE_ERROR');
    }
  }
}
