import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { REPOSITORY_TOKENS } from '../../core/domain/repositories/tokens';
import { FiscalDocumentRepository } from '../../core/domain/repositories/fiscal-document.repository';
import { UUID } from '../../core/shared';
import { FiscalStatus } from '../../core/domain/enums';
import { WsfeService } from '../../core/infrastructure/afip/wsfe.service';
import { InvoiceGeneratorService } from '../../core/infrastructure/pdf/invoice.generator.service';
import { PrismaService } from '../../core/infrastructure/prisma/prisma.service';
import { CatalogsService } from '../fiscal/catalogs.service';
import { FiscalValidationService } from '../fiscal/fiscal-validation.service';
import { AuditService } from '../fiscal/audit.service';
import { AuditEventType } from '../../core/domain/enums';
import { UIMapperService } from './ui-mapper.service';
import { QrService, QrDocumentData } from '../qr/qr.service';

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(REPOSITORY_TOKENS.FISCAL_DOCUMENT)
    private readonly documentRepo: FiscalDocumentRepository,
    private readonly wsfe: WsfeService,
    private readonly pdfGenerator: InvoiceGeneratorService,
    private readonly prisma: PrismaService,
    private readonly catalogs: CatalogsService,
    private readonly fiscalValidator: FiscalValidationService,
    private readonly audit: AuditService,
    private readonly uiMapper: UIMapperService,
    private readonly qrService: QrService,
  ) {}

  async getPdf(id: UUID, tenantId: UUID): Promise<Buffer> {
    const document = await this.prisma.fiscalDocument.findUnique({
      where: { id },
      include: {
        pointOfSale: true,
        customer: true,
        items: true,
        tenant: true,
        authorization: true,
      },
    });

    if (!document || document.tenantId !== tenantId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (!document.authorization) {
      throw new NotFoundException(
        `Document with ID ${id} is not authorized yet`,
      );
    }

    return this.pdfGenerator.generateInvoicePdf(
      document,
      document.authorization,
    );
  }

  async getQrCode(id: UUID, tenantId: UUID): Promise<string> {
    const document = await this.prisma.fiscalDocument.findUnique({
      where: { id },
      include: {
        pointOfSale: true,
        customer: true,
        authorization: true,
        tenant: { include: { fiscalProfile: true } },
      },
    }) as unknown as QrDocumentData;

    if (!document || (document as any).tenantId !== tenantId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (!document.authorization) {
      throw new NotFoundException(
        `Document with ID ${id} is not authorized. Cannot generate QR.`,
      );
    }

    return this.qrService.generateQrDataUrl(document);
  }

  async authorize(id: UUID, tenantId: UUID) {
    // 1. Verify existence and tenant
    const document = await this.prisma.fiscalDocument.findUnique({
      where: { id },
      include: { authorization: true },
    });

    if (!document || document.tenantId !== tenantId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // 2. Idempotency check: if already authorized, return existing authorization
    if (document.authorization) {
      return document.authorization;
    }

    // 3. Trigger AFIP authorization
    const result = await this.wsfe.authorizeDocument(tenantId, id);

    // 4. Audit result
    await this.audit.recordEvent({
      tenantId,
      fiscalDocumentId: id,
      eventType: AuditEventType.DOCUMENT_AUTHORIZED,
      payload: { cae: result.cae },
    });

    return result;
  }

  async create(createDocumentDto: CreateDocumentDto) {
    // 1. Pre-validation
    await this.fiscalValidator.validateCreate(createDocumentDto);

    const { items, customer, idempotencyKey, ...rest } = createDocumentDto;

    // 2. Internal Idempotency check for create
    if (idempotencyKey) {
      const existing = await this.prisma.fiscalDocument.findFirst({
        where: {
          tenantId: rest.tenantId,
          idempotencyKey,
        },
      });
      if (existing) return existing;
    }

    // 3. Calculation of amounts using Catalogs
    let netAmount = 0;
    let ivaAmount = 0;

    const itemsWithTotals = await Promise.all(
      items.map(async (item) => {
        const rate = await this.catalogs.getIvaRate(
          item.ivaAliquotCode.toString(),
        );
        const itemNet = item.quantity * item.unitPrice;
        const itemIva = itemNet * rate;
        
        netAmount += itemNet;
        ivaAmount += itemIva;

        return {
          ...item,
          discount: item.discount || 0,
          subtotal: itemNet,
        };
      }),
    );

    const totalAmount = netAmount + ivaAmount;

    // 4. Save document
    const document = await this.documentRepo.save({
      ...rest,
      idempotencyKey,
      customerId: customer.docNumber, // Assuming docNumber maps to customerId for now, or fetch actual ID
      exchangeRate: rest.exchangeRate || 1,
      netAmount,
      ivaAmount,
      otherTaxesAmount: 0,
      totalAmount,
      status: FiscalStatus.DRAFT,
      items: itemsWithTotals.map(item => ({
        ...item,
        ivaAliquot: {
          code: item.ivaAliquotCode,
          description: `${item.ivaAliquotCode}%`, 
          rate: item.ivaAliquotCode / 100
        },
        ivaAmount: item.subtotal * (item.ivaAliquotCode / 100),
        total: item.subtotal * (1 + item.ivaAliquotCode / 100)
      })),
      metadata: {},
    });

    // 5. Audit creation
    await this.audit.recordEvent({
      tenantId: rest.tenantId,
      fiscalDocumentId: document.id,
      eventType: AuditEventType.DOCUMENT_CREATED,
    });

    return document;
  }

  async findAll(tenantId: UUID) {
    return this.documentRepo.findAll({ tenantId }, { page: 1, limit: 50 });
  }

  async findOne(id: UUID, tenantId: UUID) {
    const doc = await this.documentRepo.findByIdAndTenant(id, tenantId);
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    const uiContext = this.uiMapper.getUIContext(
      doc.status,
      doc.metadata?.lastAfipResponse || doc.metadata?.error,
    );

    return {
      ...doc,
      uiContext,
    };
  }

  /**
   * Retrieves the full audit trail for a specific fiscal document.
   */
  async getAuditTrail(id: UUID, tenantId: UUID) {
    const document = await this.prisma.fiscalDocument.findUnique({
      where: { id },
      select: { id: true, tenantId: true },
    });

    if (!document || document.tenantId !== tenantId) {
      throw new NotFoundException('Fiscal document not found');
    }

    const events = await this.prisma.fiscalEvent.findMany({
      where: { fiscalDocumentId: id },
      orderBy: { occurredAt: 'desc' },
    });

    return {
      documentId: id,
      events,
    };
  }
}
