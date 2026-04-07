import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { REPOSITORY_TOKENS } from '../../core/domain/repositories/tokens';
import { TenantCertificateRepository } from '../../core/domain/repositories/tenant-certificate.repository';
import { UUID } from '../../core/shared';
import { FiscalEnvironment } from '../../core/domain/enums';
import { TenantCertificate } from '../../core/domain/tenant-certificate.entity';

@Injectable()
export class CertificatesService {
  constructor(
    @Inject(REPOSITORY_TOKENS.TENANT_CERTIFICATE)
    private readonly certificateRepo: TenantCertificateRepository,
  ) {}

  async findActive(tenantId: UUID, environment: FiscalEnvironment): Promise<TenantCertificate> {
    const cert = await this.certificateRepo.findActive(tenantId, environment);
    if (!cert) {
      throw new NotFoundException(`Active certificate not found for tenant ${tenantId} in ${environment} environment`);
    }
    return cert;
  }

  async upload(
    tenantId: UUID,
    environment: FiscalEnvironment,
    certificatePem: string,
    privateKey: string, // In a real scenario, this would be encrypted before saving
    expiresAt: Date,
  ): Promise<TenantCertificate> {
    // Stage 4: Deactivate previous certificates and save new one
    await this.certificateRepo.deactivateAll(tenantId, environment);

    return this.certificateRepo.save({
      tenantId,
      environment,
      certificatePem,
      encryptedPrivateKey: privateKey, // TODO: Implement encryption in Stage 5/6
      expiresAt: expiresAt.toISOString(),
      isActive: true,
    });
  }

  async findById(id: UUID): Promise<TenantCertificate> {
    const cert = await this.certificateRepo.findById(id);
    if (!cert) {
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    }
    return cert;
  }
}
