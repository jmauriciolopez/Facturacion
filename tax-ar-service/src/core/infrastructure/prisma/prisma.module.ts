import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { REPOSITORY_TOKENS } from '../../domain/repositories/tokens';
import { PrismaTenantRepository } from './repositories/prisma-tenant.repository';
import { PrismaFiscalDocumentRepository } from './repositories/prisma-fiscal-document.repository';
import { PrismaTenantCertificateRepository } from './repositories/prisma-tenant-certificate.repository';
import { PrismaAccessTicketRepository } from './repositories/prisma-access-ticket.repository';
import { PrismaFiscalEventRepository } from './repositories/prisma-fiscal-event.repository';
import { PrismaIdempotencyRepository } from './repositories/prisma-idempotency.repository';

const repositories = [
  {
    provide: REPOSITORY_TOKENS.TENANT,
    useClass: PrismaTenantRepository,
  },
  {
    provide: REPOSITORY_TOKENS.FISCAL_DOCUMENT,
    useClass: PrismaFiscalDocumentRepository,
  },
  {
    provide: REPOSITORY_TOKENS.TENANT_CERTIFICATE,
    useClass: PrismaTenantCertificateRepository,
  },
  {
    provide: REPOSITORY_TOKENS.ACCESS_TICKET,
    useClass: PrismaAccessTicketRepository,
  },
  {
    provide: REPOSITORY_TOKENS.FISCAL_EVENT,
    useClass: PrismaFiscalEventRepository,
  },
  {
    provide: REPOSITORY_TOKENS.IDEMPOTENCY,
    useClass: PrismaIdempotencyRepository,
  },
];

@Global()
@Module({
  providers: [PrismaService, ...repositories],
  exports: [PrismaService, ...repositories],
})
export class PrismaModule {}
