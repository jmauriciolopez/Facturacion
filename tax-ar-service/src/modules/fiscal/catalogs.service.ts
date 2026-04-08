import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/infrastructure/prisma/prisma.service';

export enum CatalogTableType {
  VOUCHER_TYPE = 'voucher_type',
  IVA_ALIQUOT = 'iva_aliquot',
  CURRENCY = 'currency',
  DOCUMENT_TYPE = 'document_type',
  CONCEPT = 'concept',
}

@Injectable()
export class CatalogsService implements OnModuleInit {
  private readonly logger = new Logger(CatalogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultsIfNeeded();
  }

  /**
   * Returns all items for a specific catalog table.
   */
  async getItems(tableType: CatalogTableType) {
    return await this.prisma.parameterTableCache.findMany({
      where: { tableType },
    });
  }

  /**
   * Returns a specific item from a catalog.
   */
  async getItem(tableType: CatalogTableType, code: string) {
    return await this.prisma.parameterTableCache.findUnique({
      where: {
        tableType_code: { tableType, code },
      },
    });
  }

  /**
   * Returns the numeric rate for an IVA aliquot code.
   */
  async getIvaRate(code: string): Promise<number> {
    const item = await this.getItem(CatalogTableType.IVA_ALIQUOT, code);
    if (!item || !item.jsonData) return 0;
    const data = item.jsonData as { rate?: number };
    return data.rate ?? 0;
  }

  /**
   * Seeds default AFIP values if the cache is empty.
   * This ensures the system works even without an initial sync.
   */
  private async seedDefaultsIfNeeded() {
    const count = await this.prisma.parameterTableCache.count();
    if (count > 0) return;

    this.logger.log('Seeding initial AFIP catalogs...');

    const defaults = [
      // Voucher Types
      { type: CatalogTableType.VOUCHER_TYPE, code: '1', desc: 'Factura A' },
      { type: CatalogTableType.VOUCHER_TYPE, code: '6', desc: 'Factura B' },
      { type: CatalogTableType.VOUCHER_TYPE, code: '11', desc: 'Factura C' },

      // IVA Aliquots
      {
        type: CatalogTableType.IVA_ALIQUOT,
        code: '5',
        desc: '21%',
        data: { rate: 0.21 },
      },
      {
        type: CatalogTableType.IVA_ALIQUOT,
        code: '4',
        desc: '10.5%',
        data: { rate: 0.105 },
      },
      {
        type: CatalogTableType.IVA_ALIQUOT,
        code: '3',
        desc: '0%',
        data: { rate: 0 },
      },

      // Document Types
      { type: CatalogTableType.DOCUMENT_TYPE, code: '80', desc: 'CUIT' },
      { type: CatalogTableType.DOCUMENT_TYPE, code: '96', desc: 'DNI' },
      {
        type: CatalogTableType.DOCUMENT_TYPE,
        code: '99',
        desc: 'Consumidor Final',
      },

      // Concepts
      { type: CatalogTableType.CONCEPT, code: '1', desc: 'Productos' },
      { type: CatalogTableType.CONCEPT, code: '2', desc: 'Servicios' },
      {
        type: CatalogTableType.CONCEPT,
        code: '3',
        desc: 'Productos y Servicios',
      },
    ];

    for (const d of defaults) {
      await this.prisma.parameterTableCache.upsert({
        where: { tableType_code: { tableType: d.type, code: d.code } },
        update: {},
        create: {
          tableType: d.type,
          code: d.code,
          description: d.desc,
          jsonData: (d as any).data || {},
          lastSync: new Date(),
        },
      });
    }
  }
}
