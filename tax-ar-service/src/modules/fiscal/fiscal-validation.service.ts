import { Injectable, BadRequestException } from '@nestjs/common';
import { CatalogsService, CatalogTableType } from './catalogs.service';
import { CreateDocumentDto } from '../documents/dto/create-document.dto';

@Injectable()
export class FiscalValidationService {
  constructor(private readonly catalogs: CatalogsService) {}

  /**
   * Validates a document creation request before persistence.
   */
  async validateCreate(dto: CreateDocumentDto) {
    await this.validateCodes(dto);
    this.validateAmounts(dto);
  }

  /**
   * Validates that all fiscal codes (voucher type, IVA, currency, doc type) exist in catalogs.
   */
  private async validateCodes(dto: CreateDocumentDto) {
    // 1. Voucher Type
    const voucherType = await this.catalogs.getItem(
      CatalogTableType.VOUCHER_TYPE,
      dto.voucherType.toString(),
    );
    if (!voucherType) {
      throw new BadRequestException(`Invalid voucher type: ${dto.voucherType}`);
    }

    // 2. Document Type
    const docType = await this.catalogs.getItem(
      CatalogTableType.DOCUMENT_TYPE,
      dto.customer.docType.toString(),
    );
    if (!docType) {
      throw new BadRequestException(
        `Invalid customer document type: ${dto.customer.docType}`,
      );
    }

    // 3. IVA Aliquots
    for (const item of dto.items) {
      const iva = await this.catalogs.getItem(
        CatalogTableType.IVA_ALIQUOT,
        item.ivaAliquotCode.toString(),
      );
      if (!iva) {
        throw new BadRequestException(
          `Invalid IVA aliquot code: ${item.ivaAliquotCode} for item ${item.description}`,
        );
      }
    }
  }

  /**
   * Validates internal consistency of amounts and taxes.
   */
  private validateAmounts(dto: CreateDocumentDto) {
    const netAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    
    // We don't validate the final total here if the DocumentsService recalculates it, 
    // but we should ensure the input isn't absurdly inconsistent if provided.
    if (netAmount <= 0) {
      throw new BadRequestException('Total net amount must be greater than zero');
    }

    for (const item of dto.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(`Quantity for ${item.description} must be positive`);
      }
      if (item.unitPrice < 0) {
        throw new BadRequestException(`Unit price for ${item.description} cannot be negative`);
      }
    }
  }
}
