import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/infrastructure/prisma/prisma.service';
import { AuditEventType } from '../../core/domain/enums';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records a fiscal event in the audit trail.
   */
  async recordEvent(params: {
    tenantId: string;
    fiscalDocumentId?: string;
    eventType: AuditEventType;
    actor?: string;
    correlationId?: string;
    payload?: any;
    errorMessage?: string;
    errorStack?: string;
  }) {
    try {
      return await this.prisma.fiscalEvent.create({
        data: {
          tenantId: params.tenantId,
          fiscalDocumentId: params.fiscalDocumentId,
          eventType: params.eventType,
          actor: params.actor,
          correlationId: params.correlationId,
          payload: params.payload,
          errorMessage: params.errorMessage,
          errorStack: params.errorStack,
        },
      });
    } catch (error: any) {
      // We don't want audit failures to block business transactions, but we must log them.
      this.logger.error(
        `Failed to record audit event ${params.eventType}: ${error.message}`,
      );
    }
  }
}
