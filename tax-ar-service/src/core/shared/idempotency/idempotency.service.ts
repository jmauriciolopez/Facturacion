import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves a cached response for a given idempotency key and tenant.
   */
  async getRecord(tenantId: string, idempotencyKey: string) {
    return await this.prisma.idempotencyRecord.findUnique({
      where: {
        tenantId_idempotencyKey: {
          tenantId,
          idempotencyKey,
        },
      },
    });
  }

  /**
   * Saves a response for a given idempotency key and tenant.
   */
  async saveRecord(params: {
    tenantId: string;
    idempotencyKey: string;
    method: string;
    path: string;
    statusCode: number;
    responseBody: any;
  }) {
    return await this.prisma.idempotencyRecord.upsert({
      where: {
        tenantId_idempotencyKey: {
          tenantId: params.tenantId,
          idempotencyKey: params.idempotencyKey,
        },
      },
      update: {
        statusCode: params.statusCode,
        responseBody: params.responseBody,
      },
      create: {
        tenantId: params.tenantId,
        idempotencyKey: params.idempotencyKey,
        method: params.method,
        path: params.path,
        statusCode: params.statusCode,
        responseBody: params.responseBody,
      },
    });
  }
}
