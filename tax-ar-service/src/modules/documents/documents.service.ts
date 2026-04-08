import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { REPOSITORY_TOKENS } from '../../core/domain/repositories/tokens';
import { FiscalDocumentRepository } from '../../core/domain/repositories/fiscal-document.repository';
import { UUID } from '../../core/shared';
import { FiscalStatus } from '../../core/domain/enums';
import { WsfeService } from '../../core/infrastructure/afip/wsfe.service';
import { InvoiceGeneratorService } from '../../core/infrastructure/pdf/invoice.generator.service';
import { PrismaService } from '../../core/infrastructure/prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(REPOSITORY_TOKENS.FISCAL_DOCUMENT)
    private readonly documentRepo: FiscalDocumentRepository,
    private readonly wsfe: WsfeService,
    private readonly pdfGenerator: InvoiceGeneratorService,
    private readonly prisma: PrismaService,
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
    await this.findOne(id, tenantId);

    // 2. Trigger AFIP authorization
    return this.wsfe.authorizeDocument(tenantId, id);
  }

  async create(createDocumentDto: CreateDocumentDto) {
    const { items, customer, ...rest } = createDocumentDto;

    // Basic calculation of amounts from items
    const netAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const ivaAmount = items.reduce(
      (sum, item) => {
        const aliquot = item.ivaAliquotCode === 5 ? 0.21 : 0.105;
        return sum + item.quantity * item.unitPrice * aliquot;
      },
      0,
    );
    const totalAmount = netAmount + ivaAmount;

    return this.documentRepo.save({
      ...rest,
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
      items: items.map((item) => ({
        ...item,
        discount: item.discount || 0,
        subtotal: item.quantity * item.unitPrice,
      })),
      metadata: {},
    } as any);
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
}
