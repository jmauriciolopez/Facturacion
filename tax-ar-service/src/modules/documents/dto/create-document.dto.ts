import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  VoucherType,
  DocumentConcept,
  CurrencyCode,
  CustomerDocType,
  IvaCondition,
} from '../../../core/domain/enums';
import { UUID } from '../../../core/shared';

export class CreateDocumentItemDto {
  @ApiProperty({ example: 'PROD-001' })
  @IsString()
  @IsOptional()
  productCode?: string;

  @ApiProperty({ example: 'Servicios de consultoría' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiProperty({ example: 5, description: 'AFIP Iva Aliquot Code' })
  @IsNumber()
  ivaAliquotCode: number;
}

export class CustomerDto {
  @ApiProperty({ enum: CustomerDocType, example: CustomerDocType.CUIT })
  @IsEnum(CustomerDocType)
  docType: CustomerDocType;

  @ApiProperty({ example: '30711122233' })
  @IsString()
  @IsNotEmpty()
  docNumber: string;

  @ApiProperty({ example: 'Cliente de Prueba SA' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({
    enum: IvaCondition,
    example: IvaCondition.RESPONSABLE_INSCRIPTO,
  })
  @IsEnum(IvaCondition)
  ivaCondition: IvaCondition;

  @ApiProperty({ example: 'Calle Falsa 123' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'cliente@ejemplo.com' })
  @IsString()
  @IsOptional()
  email?: string;
}

export class CreateDocumentDto {
  @ApiProperty({ example: 'uuid-del-tenant' })
  @IsUUID()
  @IsNotEmpty()
  tenantId: UUID;

  @ApiProperty({ example: 'uuid-del-pos' })
  @IsUUID()
  @IsNotEmpty()
  pointOfSaleId: UUID;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ApiProperty({ enum: VoucherType, example: VoucherType.FACTURA_A })
  @IsEnum(VoucherType)
  voucherType: VoucherType;

  @ApiProperty({ enum: DocumentConcept, example: DocumentConcept.SERVICES })
  @IsEnum(DocumentConcept)
  concept: DocumentConcept;

  @ApiProperty({ enum: CurrencyCode, default: CurrencyCode.ARS })
  @IsEnum(CurrencyCode)
  currency: CurrencyCode;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  exchangeRate?: number;

  @ApiProperty({ example: '20231027', description: 'YYYYMMDD' })
  @IsString()
  @IsNotEmpty()
  voucherDate: string;

  @ApiProperty({ example: '20231001', description: 'YYYYMMDD' })
  @IsString()
  @IsOptional()
  serviceFromDate?: string;

  @ApiProperty({ example: '20231031', description: 'YYYYMMDD' })
  @IsString()
  @IsOptional()
  serviceToDate?: string;

  @ApiProperty({ example: '20231115', description: 'YYYYMMDD' })
  @IsString()
  @IsOptional()
  paymentDueDate?: string;

  @ApiProperty({ type: [CreateDocumentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentItemDto)
  items: CreateDocumentItemDto[];

  @ApiProperty({ example: 'my-unique-order-id' })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
