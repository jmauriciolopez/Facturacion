import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FiscalDocumentRepository, FiscalDocumentFilters, CreateFiscalDocumentItemData } from '../../../domain/repositories/fiscal-document.repository';
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
    doc: Omit<
      FiscalDocument,
      'id' | 'createdAt' | 'updatedAt' | 'items' | 'associatedVouchers'
    > & {
      items: CreateFiscalDocumentItemData[];
    },
  ): Promise<FiscalDocument> {
    const { items, ...rest } = doc;

    const record = await this.prisma.fiscalDocument.create({
      data: {
        ...rest,
        items: items
          ? {
              create: items.map((item) => ({
                ivaAliquotCode: item.ivaAliquot.code,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                description: item.description,
                discount: item.discount,
                subtotal: item.subtotal,
              })),
            }
          : undefined,
      },
      include: { items: true },
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
