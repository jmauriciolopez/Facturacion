import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccessTicketRepository } from '../../../domain/repositories/access-ticket.repository';
import { AccessTicket } from '../../../domain/access-ticket.entity';
import { UUID } from '../../../shared';
import { FiscalEnvironment } from '../../../domain/enums';

@Injectable()
export class PrismaAccessTicketRepository implements AccessTicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findValid(
    tenantId: UUID,
    environment: FiscalEnvironment,
    service: string,
  ): Promise<AccessTicket | null> {
    const record = await this.prisma.accessTicket.findFirst({
      where: {
        tenantId,
        environment: environment as any,
        service,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) return null;
    return record as unknown as AccessTicket;
  }

  async save(ticket: Omit<AccessTicket, 'id' | 'createdAt'>): Promise<AccessTicket> {
    const record = await this.prisma.accessTicket.create({
      data: {
        tenantId: ticket.tenantId,
        environment: ticket.environment as any,
        service: ticket.service,
        token: ticket.token,
        sign: ticket.sign,
        generatedAt: new Date(ticket.generatedAt),
        expiresAt: new Date(ticket.expiresAt),
      },
    });

    return record as unknown as AccessTicket;
  }

  async invalidate(
    tenantId: UUID,
    environment: FiscalEnvironment,
    service: string,
  ): Promise<void> {
    await this.prisma.accessTicket.updateMany({
      where: {
        tenantId,
        environment: environment as any,
        service,
      },
      data: {
        expiresAt: new Date(0), // Set to past
      },
    });
  }
}
