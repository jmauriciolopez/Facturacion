import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { REPOSITORY_TOKENS } from '../../core/domain/repositories/tokens';
import { TenantRepository } from '../../core/domain/repositories/tenant.repository';
import { UUID } from '../../core/shared';
import { FiscalEnvironment } from '../../core/domain/enums';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(REPOSITORY_TOKENS.TENANT)
    private readonly tenantRepo: TenantRepository,
  ) {}

  async create(createTenantDto: CreateTenantDto) {
    const existing = await this.tenantRepo.findByCuit(createTenantDto.clientCuit);
    if (existing) {
      throw new ConflictException(`Tenant with CUIT ${createTenantDto.clientCuit} already exists`);
    }

    return this.tenantRepo.save({
      name: createTenantDto.name,
      clientCuit: createTenantDto.clientCuit,
      fiscalEnvironment: createTenantDto.fiscalEnvironment || FiscalEnvironment.HOMOLOGATION,
      apiKeyHash: `sk_live_${Math.random().toString(36).substring(2)}`, // TODO: Implement proper key generation and hashing
      isActive: true,
    });
  }

  async findAll() {
    const result = await this.tenantRepo.findAll({ page: 1, limit: 100 });
    return result;
  }

  async findOne(id: UUID) {
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async update(id: UUID, updateTenantDto: UpdateTenantDto) {
    await this.findOne(id);
    return this.tenantRepo.update(id, updateTenantDto as any);
  }

  async remove(id: UUID) {
    await this.findOne(id);
    return this.tenantRepo.update(id, { isActive: false });
  }
}
