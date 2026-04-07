import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TenantRepository } from '../../../domain/repositories/tenant.repository';
import { Tenant } from '../../../domain/tenant.entity';
import { UUID, PaginationOptions, PaginatedResult } from '../../../shared';

@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UUID): Promise<Tenant | null> {
    const record = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        fiscalProfiles: true,
        pointsOfSale: true,
      },
    });

    if (!record) return null;
    return record as unknown as Tenant;
  }

  async findByCuit(clientCuit: string): Promise<Tenant | null> {
    const record = await this.prisma.tenant.findFirst({
      where: { clientCuit },
    });

    if (!record) return null;
    return record as unknown as Tenant;
  }

  async findByApiKeyHash(hash: string): Promise<Tenant | null> {
    const record = await this.prisma.tenant.findFirst({
      where: { apiKeyHash: hash },
    });

    if (!record) return null;
    return record as unknown as Tenant;
  }

  async findAll(opts: PaginationOptions): Promise<PaginatedResult<Tenant>> {
    const { page, limit } = opts;
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count(),
    ]);

    return {
      data: data as unknown as Tenant[],
      total,
      page,
      limit,
    };
  }

  async save(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    const record = await this.prisma.tenant.create({
      data: {
        name: tenant.name,
        clientCuit: tenant.clientCuit,
        apiKeyHash: tenant.apiKeyHash, // Usually hashed before
        fiscalEnvironment: tenant.fiscalEnvironment,
        isActive: tenant.isActive,
      },
    });
    
    return record as unknown as Tenant;
  }

  async update(id: UUID, data: Partial<Tenant>): Promise<Tenant> {
    const record = await this.prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        isActive: data.isActive,
        fiscalEnvironment: data.fiscalEnvironment,
      },
    });
    
    return record as unknown as Tenant;
  }
}
