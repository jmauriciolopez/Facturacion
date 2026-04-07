import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { AfipSignerService } from './afip-signer.service';

@Global()
@Module({
  providers: [EncryptionService, AfipSignerService],
  exports: [EncryptionService, AfipSignerService],
})
export class SecurityModule {}
