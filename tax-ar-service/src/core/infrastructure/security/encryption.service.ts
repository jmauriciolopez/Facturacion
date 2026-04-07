import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const secret = process.env.PRIVATE_KEY_ENCRYPTION_SECRET;
    if (!secret) {
      // In production, this should throw or fail. For now, we'll log a warning or use a development fallback.
      // But for security-first, let's enforce it if not in development?
      // Actually, let's use a derivation if the secret is provided, or a hard error.
      throw new InternalServerErrorException('PRIVATE_KEY_ENCRYPTION_SECRET is not defined in environment variables');
    }

    // Ensure the key is exactly 32 bytes (256 bits).
    // If the secret is not 32 chars, we use scrypt to derive a 32-byte key.
    this.key = scryptSync(secret, 'salt-tax-ar', 32);
  }

  encrypt(text: string): string {
    const iv = randomBytes(12); // GCM standard IV size
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag().toString('base64');

    // Format: iv:authTag:encryptedContent (all in base64)
    return `${iv.toString('base64')}:${authTag}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    try {
      const [ivPart, authTagPart, encryptedPart] = encryptedData.split(':');
      if (!ivPart || !authTagPart || !encryptedPart) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(ivPart, 'base64');
      const authTag = Buffer.from(authTagPart, 'base64');
      const decipher = createDecipheriv(this.algorithm, this.key, iv);

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedPart, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new InternalServerErrorException('Failed to decrypt private key. Check ENCRYPTION_SECRET.');
    }
  }
}
