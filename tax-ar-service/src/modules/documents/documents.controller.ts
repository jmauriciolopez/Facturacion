import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Version,
  ParseUUIDPipe,
  UseGuards,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentsService } from './documents.service';
import { UUID } from '../../core/shared';
import { TenantGuard } from '../../core/infrastructure/security/guards/tenant.guard';
import { CurrentTenant } from '../../core/infrastructure/security/decorators/current-tenant.decorator';
import { IdempotencyInterceptor } from '../../core/shared/idempotency/idempotency.interceptor';

@ApiTags('Fiscal Documents')
@ApiHeader({
  name: 'X-Tenant-ID',
  description: 'The unique identifier of the tenant',
  required: true,
})
@UseGuards(TenantGuard)
@Controller('fiscal-documents')
export class FiscalDocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Version('1')
  @UseInterceptors(IdempotencyInterceptor)
  @Post()
  @ApiOperation({ summary: 'Create a draft fiscal document' })
  @ApiResponse({ status: 201, description: 'Document draft created' })
  create(
    @CurrentTenant() tenantId: UUID,
    @Body() createDto: CreateDocumentDto,
  ) {
    // Override body tenantId with the one from the trusted context/header
    createDto.tenantId = tenantId;
    return this.documentsService.create(createDto);
  }

  @Version('1')
  @UseInterceptors(IdempotencyInterceptor)
  @Post(':id/issue')
  @ApiOperation({ summary: 'Issue/Authorize a fiscal document with AFIP' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  issue(@Param('id', ParseUUIDPipe) id: UUID, @CurrentTenant() tenantId: UUID) {
    return this.documentsService.authorize(id, tenantId);
  }

  @Version('1')
  @UseInterceptors(IdempotencyInterceptor)
  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed or pending document issuance' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  retry(@Param('id', ParseUUIDPipe) id: UUID, @CurrentTenant() tenantId: UUID) {
    return this.documentsService.authorize(id, tenantId);
  }

  @Version('1')
  @Get(':id')
  @ApiOperation({ summary: 'Get fiscal document status and data' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(
    @Param('id', ParseUUIDPipe) id: UUID,
    @CurrentTenant() tenantId: UUID,
  ) {
    return this.documentsService.findOne(id, tenantId);
  }

  @Version('1')
  @Get(':id/audit')
  @ApiOperation({ summary: 'Get full audit trail for a document' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  getAudit(
    @Param('id', ParseUUIDPipe) id: UUID,
    @CurrentTenant() tenantId: UUID,
  ) {
    return this.documentsService.getAuditTrail(id, tenantId);
  }

  @Version('1')
  @Get(':id/pdf')
  @ApiOperation({
    summary: 'Get PDF representation of the authorized document',
  })
  async getPdf(
    @Param('id', ParseUUIDPipe) id: UUID,
    @CurrentTenant() tenantId: UUID,
    @Res() res: Response,
  ) {
    const buffer = await this.documentsService.getPdf(id, tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=comprobante-${id}.pdf`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Version('1')
  @Get(':id/qr')
  @ApiOperation({ summary: 'Get QR Data URL for an authorized document' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getQr(
    @Param('id', ParseUUIDPipe) id: UUID,
    @CurrentTenant() tenantId: UUID,
  ) {
    const qrDataUrl = await this.documentsService.getQrCode(id, tenantId);
    return { qrDataUrl };
  }

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'Search and list fiscal documents' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@CurrentTenant() tenantId: UUID) {
    return this.documentsService.findAll(tenantId);
  }
}
