import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FiscalDocumentRepository, FiscalDocumentFilters } from '../../../domain/repositories/fiscal-document.repository';
import { FiscalDocument } from '../../../domain/fiscal-document.entity';
import { UUID, PaginationOptions, PaginatedResult } from '../../../shared';

@Injectable()
export class PrismaFiscalDocumentRepository implements FiscalDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UUID): Promise<FiscalDocument | null> {
    const record = await this.prisma.fiscalDocument.findUnique({
      where: { id },
      include: { 
        items: true,
        authorization: true,
      },
    });
    
    if (!record) return null;
    return record as unknown as FiscalDocument;
  }

  async findByIdAndTenant(id: UUID, tenantId: UUID): Promise<FiscalDocument | null> {
    const record = await this.prisma.fiscalDocument.findFirst({
      where: { id, tenantId },
      include: { 
        items: true,
        authorization: true,
      },
    });
    
    if (!record) return null;
    return record as unknown as FiscalDocument;
  }

  async findAll(
    filters: FiscalDocumentFilters,
    opts: PaginationOptions
  ): Promise<PaginatedResult<FiscalDocument>> {
    const { page, limit } = opts;
    const skip = (page - 1) * limit;
    
    const where: any = {
      tenantId: filters.tenantId,
    };
    
    if (filters.status) where.status = filters.status;
    if (filters.pointOfSaleId) where.pointOfSaleId = filters.pointOfSaleId;

    const [data, total] = await Promise.all([
      this.prisma.fiscalDocument.findMany({
        where,
        skip,
        take: limit,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fiscalDocument.count({ where }),
    ]);

    return {
      data: data as unknown as FiscalDocument[],
      total,
      page,
      limit,
    };
  }

  async save(
    doc: Omit<FiscalDocument, 'id' | 'createdAt' | 'updatedAt' | 'items' | 'associatedVouchers'>
  ): Promise<FiscalDocument> {
    const record = await this.prisma.fiscalDocument.create({
      data: {
        tenantId: doc.tenantId,
        pointOfSaleId: doc.pointOfSaleId,
        customerId: doc.customerId,
        voucherType: doc.voucherType as number,
        concept: doc.concept as number,
        status: doc.status as any,
        currency: (doc.currency === 'PES' ? 'ARS' : doc.currency === 'DOL' ? 'USD' : doc.currency === '060' ? 'EUR' : 'ARS') as any,
        exchangeRate: doc.exchangeRate as any,
        voucherDate: doc.voucherDate,
        serviceFromDate: doc.serviceFromDate,
        serviceToDate: doc.serviceToDate,
        paymentDueDate: doc.paymentDueDate,
        netAmount: doc.netAmount,
        ivaAmount: doc.ivaAmount,
        otherTaxesAmount: doc.otherTaxesAmount,
        totalAmount: doc.totalAmount as any,
        idempotencyKey: doc.idempotencyKey,
        correlationId: doc.correlationId,
      },
    });
    
    return record as unknown as FiscalDocument;
  }

  async update(id: UUID, data: Partial<FiscalDocument>): Promise<FiscalDocument> {
    const record = await this.prisma.fiscalDocument.update({
      where: { id },
      data: {
        status: data.status,
        totalAmount: data.totalAmount,
        // and so on...
      },
    });
    
    return record as unknown as FiscalDocument;
  }
}
