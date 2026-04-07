import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as forge from 'node-forge';

@Injectable()
export class AfipSignerService {
  /**
   * Generates a CMS (PKCS#7) signature for a Login Ticket Request (TRA).
   *
   * @param xmlContent The XML content to sign (TRA).
   * @param certificatePem The PEM formatted certificate.
   * @param privateKeyPem The PEM formatted (decrypted) private key.
   * @returns Base64 encoded PKCS#7 signature.
   */
  sign(
    xmlContent: string,
    certificatePem: string,
    privateKeyPem: string,
  ): string {
    try {
      const cert = forge.pki.certificateFromPem(certificatePem);
      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

      const p7 = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(xmlContent, 'utf8');
      p7.addCertificate(cert);
      p7.addSigner({
        key: privateKey,
        certificate: cert,
        digestAlgorithm: forge.pki.oids.sha256,
        authenticatedAttributes: [
          {
            type: forge.pki.oids.contentType,
            value: forge.pki.oids.data,
          },
          {
            type: forge.pki.oids.messageDigest,
            // forge will calculate the message digest
          },
          {
            type: forge.pki.oids.signingTime,
            // forge will add the current time
          },
        ],
      });

      // Sign (detached: false for AFIP CMS)
      p7.sign({ detached: false });

      // Convert to DER and then Base64
      const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
      return forge.util.encode64(der);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        'Failed to generate AFIP PKCS#7 signature: ' + message,
      );
    }
  }
}
