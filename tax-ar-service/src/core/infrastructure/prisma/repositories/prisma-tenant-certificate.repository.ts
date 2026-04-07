import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TenantCertificateRepository } from '../../../domain/repositories/tenant-certificate.repository';
import { TenantCertificate } from '../../../domain/tenant-certificate.entity';
import { UUID } from '../../../shared';
import { FiscalEnvironment } from '../../../domain/enums';

@Injectable()
export class PrismaTenantCertificateRepository implements TenantCertificateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(
    tenantId: UUID,
    environment: FiscalEnvironment
  ): Promise<TenantCertificate | null> {
    const record = await this.prisma.tenantCertificate.findFirst({
      where: { 
        tenantId, 
        environment: environment as any,
        isActive: true 
      },
    });

    if (!record) return null;
    return record as unknown as TenantCertificate;
  }

  async findById(id: UUID): Promise<TenantCertificate | null> {
    const record = await this.prisma.tenantCertificate.findUnique({
      where: { id },
    });

    if (!record) return null;
    return record as unknown as TenantCertificate;
  }

  async save(
    cert: Omit<TenantCertificate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TenantCertificate> {
    const record = await this.prisma.tenantCertificate.create({
      data: {
        tenantId: cert.tenantId,
        environment: cert.environment as any,
        certificatePem: cert.certificatePem,
        encryptedPrivateKey: cert.encryptedPrivateKey,
        expiresAt: new Date(cert.expiresAt),
        isActive: cert.isActive,
      },
    });

    return record as unknown as TenantCertificate;
  }

  async deactivateAll(tenantId: UUID, environment: FiscalEnvironment): Promise<void> {
    await this.prisma.tenantCertificate.updateMany({
      where: { 
        tenantId, 
        environment: environment as any,
        isActive: true 
      },
      data: { isActive: false },
    });
  }
}
