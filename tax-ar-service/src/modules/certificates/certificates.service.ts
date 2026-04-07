import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { REPOSITORY_TOKENS } from '../../core/domain/repositories/tokens';
import { TenantCertificateRepository } from '../../core/domain/repositories/tenant-certificate.repository';
import { UUID } from '../../core/shared';
import { FiscalEnvironment } from '../../core/domain/enums';
import { TenantCertificate } from '../../core/domain/tenant-certificate.entity';
import { EncryptionService } from '../../core/infrastructure/security/encryption.service';

@Injectable()
export class CertificatesService {
  constructor(
    @Inject(REPOSITORY_TOKENS.TENANT_CERTIFICATE)
    private readonly certificateRepo: TenantCertificateRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async findActive(
    tenantId: UUID,
    environment: FiscalEnvironment,
  ): Promise<TenantCertificate> {
    const cert = await this.certificateRepo.findActive(tenantId, environment);
    if (!cert) {
      throw new NotFoundException(
        `Active certificate not found for tenant ${tenantId} in ${environment} environment`,
      );
    }
    return cert;
  }

  /**
   * Decrypts the private key of a certificate for use in signing operations.
   */
  async getDecryptedPrivateKey(
    certId: UUID | TenantCertificate,
  ): Promise<string> {
    const cert =
      typeof certId === 'string' ? await this.findById(certId) : certId;
    return this.encryptionService.decrypt(cert.encryptedPrivateKey);
  }

  async upload(
    tenantId: UUID,
    environment: FiscalEnvironment,
    certificatePem: string,
    privateKey: string,
    expiresAt: Date,
  ): Promise<TenantCertificate> {
    // Stage 4/5: Deactivate previous certificates and save new one with encryption
    await this.certificateRepo.deactivateAll(tenantId, environment);

    return this.certificateRepo.save({
      tenantId,
      environment,
      certificatePem,
      encryptedPrivateKey: this.encryptionService.encrypt(privateKey),
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
