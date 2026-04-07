import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FiscalEventRepository } from '../../../domain/repositories/fiscal-event.repository';
import { FiscalEvent } from '../../../domain/fiscal-event.entity';
import { UUID } from '../../../shared';

@Injectable()
export class PrismaFiscalEventRepository implements FiscalEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDocument(fiscalDocumentId: UUID): Promise<FiscalEvent[]> {
    const records = await this.prisma.fiscalEvent.findMany({
      where: { fiscalDocumentId },
      orderBy: { occurredAt: 'asc' },
    });

    return records as unknown as FiscalEvent[];
  }

  async findByTenant(tenantId: UUID, limit = 50): Promise<FiscalEvent[]> {
    const records = await this.prisma.fiscalEvent.findMany({
      where: { tenantId },
      take: limit,
      orderBy: { occurredAt: 'desc' },
    });

    return records as unknown as FiscalEvent[];
  }

  async save(event: Omit<FiscalEvent, 'id' | 'occurredAt'>): Promise<FiscalEvent> {
    const record = await this.prisma.fiscalEvent.create({
      data: {
        tenantId: event.tenantId,
        fiscalDocumentId: event.fiscalDocumentId,
        eventType: event.eventType as any,
        actor: event.actor,
        correlationId: event.correlationId,
        payload: event.payload as any,
        errorMessage: event.errorMessage,
        errorStack: event.errorStack,
      },
    });

    return record as unknown as FiscalEvent;
  }

  async saveMany(events: Omit<FiscalEvent, 'id' | 'occurredAt'>[]): Promise<void> {
    await this.prisma.fiscalEvent.createMany({
      data: events.map((event) => ({
        tenantId: event.tenantId,
        fiscalDocumentId: event.fiscalDocumentId,
        eventType: event.eventType as any,
        actor: event.actor,
        correlationId: event.correlationId,
        payload: event.payload as any,
        errorMessage: event.errorMessage,
        errorStack: event.errorStack,
      })),
    });
  }
}
