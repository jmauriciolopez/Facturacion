import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IvaCondition } from '../../../core/domain/enums';

export class UpdateFiscalProfileDto {
  @ApiProperty({ example: '30711122233' })
  @IsString()
  @IsNotEmpty()
  cuit: string;

  @ApiProperty({ example: 'Empresa Demo SA' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ example: 'Demo Fantasy' })
  @IsString()
  @IsOptional()
  fantasyName?: string;

  @ApiProperty({
    enum: IvaCondition,
    example: IvaCondition.RESPONSABLE_INSCRIPTO,
  })
  @IsEnum(IvaCondition)
  ivaCondition: IvaCondition;

  @ApiProperty({ example: 'Av. Corrientes 1234' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'CABA' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Buenos Aires' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ example: '1043' })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({ example: '20230101', description: 'YYYYMMDD' })
  @IsString()
  @IsNotEmpty()
  activityStartDate: string;
}
