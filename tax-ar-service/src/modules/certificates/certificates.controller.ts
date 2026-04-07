import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Version,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UploadCertificateDto } from './dto/upload-certificate.dto';
import { UUID } from '../../core/shared';
import { CertificatesService } from './certificates.service';
import { FiscalEnvironment } from '../../core/domain/enums';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Version('1')
  @Post('tenants/:tenantId')
  @ApiOperation({ summary: 'Upload certificate and key for a tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Certificate uploaded and encrypted',
  })
  async upload(
    @Param('tenantId', ParseUUIDPipe) tenantId: UUID,
    @Body() uploadDto: UploadCertificateDto,
  ) {
    const cert = await this.certificatesService.upload(
      tenantId,
      uploadDto.environment,
      uploadDto.certificatePem,
      uploadDto.privateKeyPem,
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year for now
    );

    return {
      success: true,
      message: 'Certificate stored for tenant ' + tenantId,
      data: cert,
    };
  }

  @Version('1')
  @Get('tenants/:tenantId/:environment/status')
  @ApiOperation({ summary: 'Check certificate status and expiration' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'environment', enum: FiscalEnvironment })
  async getStatus(
    @Param('tenantId', ParseUUIDPipe) tenantId: UUID,
    @Param('environment') environment: FiscalEnvironment,
  ) {
    const cert = await this.certificatesService.findActive(tenantId, environment);
    
    const now = new Date();
    const expiresAt = new Date(cert.expiresAt);
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      success: true,
      data: {
        id: cert.id,
        tenantId: cert.tenantId,
        environment: cert.environment,
        isActive: cert.isActive,
        expiresAt: cert.expiresAt,
        daysRemaining,
      },
    };
  }
}
