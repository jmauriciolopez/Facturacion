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
  ) {}

  async getPdf(id: UUID, tenantId: UUID): Promise<Buffer> {
    const document = await this.prisma.fiscalDocument.findUnique({
      where: { id: id as any },
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

  async authorize(id: UUID, tenantId: UUID) {
    // 1. Verify existence and tenant
    const document = await this.prisma.fiscalDocument.findUnique({
      where: { id: id as any },
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
      customer: {
        docType: customer.docType,
        docNumber: customer.docNumber,
        businessName: customer.businessName,
        ivaCondition: customer.ivaCondition,
        address: customer.address,
        email: customer.email,
      },
      netAmount,
      ivaAmount,
      otherTaxesAmount: 0,
      totalAmount,
      status: FiscalStatus.DRAFT,
      items: itemsWithTotals,
      metadata: {},
    } as any);

    // 5. Audit creation
    await this.audit.recordEvent({
      tenantId: rest.tenantId,
      fiscalDocumentId: (document as { id: string }).id,
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
    return doc;
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
