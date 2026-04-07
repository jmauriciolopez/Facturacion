import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FiscalEnvironment } from '../../../core/domain/enums';

export class CreateTenantDto {
  @ApiProperty({ example: 'Empresa Demo SA' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '30711122233' })
  @IsString()
  @IsNotEmpty()
  clientCuit: string;

  @ApiProperty({
    example: 'my-super-secret-key',
    description: 'API key for the client system',
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({
    enum: FiscalEnvironment,
    default: FiscalEnvironment.HOMOLOGATION,
  })
  @IsEnum(FiscalEnvironment)
  @IsOptional()
  fiscalEnvironment?: FiscalEnvironment;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
