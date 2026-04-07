import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FiscalEnvironment } from '../../../core/domain/enums';

export class UploadCertificateDto {
  @ApiProperty({ enum: FiscalEnvironment, example: FiscalEnvironment.HOMOLOGATION })
  @IsEnum(FiscalEnvironment)
  @IsNotEmpty()
  environment: FiscalEnvironment;

  @ApiProperty({
    example: '-----BEGIN CERTIFICATE-----\nMIID...',
    description: 'PEM encoded certificate',
  })
  @IsString()
  @IsNotEmpty()
  certificatePem: string;

  @ApiProperty({
    example: '-----BEGIN PRIVATE KEY-----\nMIIE...',
    description: 'PEM encoded private key',
  })
  @IsString()
  @IsNotEmpty()
  privateKeyPem: string;
}
