import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  CreateDocumentRequest,
  FiscalDocumentResponse,
  QrResponse,
  AuditEvent,
} from './types';

export interface TaxArClientConfig {
  baseUrl: string;
  tenantId: string;
  timeout?: number;
}

export class TaxArClient {
  private axiosInstance: AxiosInstance;

  constructor(private config: TaxArClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': config.tenantId,
      },
    });
  }

  /**
   * Crea un nuevo borrador de documento fiscal.
   */
  async createDocument(
    data: CreateDocumentRequest,
  ): Promise<FiscalDocumentResponse> {
    const response = await this.axiosInstance.post<FiscalDocumentResponse>(
      '/v1/fiscal-documents',
      data,
    );
    return response.data;
  }

  /**
   * Autoriza un documento existente ante AFIP.
   */
  async authorizeDocument(id: string): Promise<FiscalDocumentResponse> {
    const response = await this.axiosInstance.post<FiscalDocumentResponse>(
      `/v1/fiscal-documents/${id}/issue`,
    );
    return response.data;
  }

  /**
   * Reintenta la autorización de un documento fallido.
   */
  async retryAuthorization(id: string): Promise<FiscalDocumentResponse> {
    const response = await this.axiosInstance.post<FiscalDocumentResponse>(
      `/v1/fiscal-documents/${id}/retry`,
    );
    return response.data;
  }

  /**
   * Obtiene el estado y datos de un documento fiscal.
   */
  async getDocument(id: string): Promise<FiscalDocumentResponse> {
    const response = await this.axiosInstance.get<FiscalDocumentResponse>(
      `/v1/fiscal-documents/${id}`,
    );
    return response.data;
  }

  /**
   * Obtiene la traza de auditoría de un documento.
   */
  async getAuditTrail(id: string): Promise<AuditEvent[]> {
    const response = await this.axiosInstance.get<AuditEvent[]>(
      `/v1/fiscal-documents/${id}/audit`,
    );
    return response.data;
  }

  /**
   * Obtiene el código QR en formato Data URL.
   */
  async getQrCode(id: string): Promise<QrResponse> {
    const response = await this.axiosInstance.get<QrResponse>(
      `/v1/fiscal-documents/${id}/qr`,
    );
    return response.data;
  }

  /**
   * Descarga el PDF del comprobante como un Buffer.
   */
  async getInvoicePdf(id: string): Promise<Buffer> {
    const response = await this.axiosInstance.get(`/v1/fiscal-documents/${id}/pdf`, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  /**
   * Lista los documentos fiscales del tenant.
   */
  async listDocuments(): Promise<FiscalDocumentResponse[]> {
    const response = await this.axiosInstance.get<FiscalDocumentResponse[]>(
      '/v1/fiscal-documents',
    );
    return response.data;
  }

  /**
   * Verifica el estado de salud del microservicio.
   */
  async healthCheck(): Promise<any> {
    const response = await this.axiosInstance.get('/health');
    return response.data;
  }
}
