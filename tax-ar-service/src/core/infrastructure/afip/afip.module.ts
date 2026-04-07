import { Module, Global } from '@nestjs/common';
import { WsaaService } from './wsaa.service';
import { WsfeService } from './wsfe.service';
import { SecurityModule } from '../security/security.module';
import { CertificatesModule } from '../../../modules/certificates/certificates.module';

@Global()
@Module({
  imports: [SecurityModule, CertificatesModule],
  providers: [WsaaService, WsfeService],
  exports: [WsaaService, WsfeService],
})
export class AfipModule {}
