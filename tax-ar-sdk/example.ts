import { TaxArClient, VoucherType, CurrencyCode, DocumentConcept, CustomerDocType, IvaCondition } from './src';

async function example() {
  const client = new TaxArClient({
    baseUrl: 'http://localhost:3000',
    tenantId: 'd290f1ee-6c54-4b01-90e6-d701748f0851', // ID de ejemplo
  });

  try {
    // 1. Verificar salud del servicio
    console.log('Verificando conexión...');
    await client.healthCheck();

    // 2. Crear y emitir una Factura A
    console.log('Emitiendo factura...');
    const document = await client.createDocument({
      pointOfSaleId: '6fa459ea-ee8a-3ca4-894e-db77e160355e',
      voucherType: VoucherType.FACTURA_A,
      concept: DocumentConcept.PRODUCTS,
      currency: CurrencyCode.ARS,
      voucherDate: '20231027',
      customer: {
        docType: CustomerDocType.CUIT,
        docNumber: '30711122233',
        businessName: 'CLIENTE PRUEBA S.A.',
        ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
      },
      items: [
        {
          description: 'Producto de prueba SDK',
          quantity: 2,
          unitPrice: 500,
          ivaAliquotCode: 5, // 21%
        }
      ]
    });

    console.log('Documento creado ID:', document.id);

    // 3. Autorizar (si no se hizo automáticamente en el flujo)
    const authorized = await client.authorizeDocument(document.id);
    console.log('CAE obtenido:', authorized.cae);

    // 4. Obtener QR
    const { qrDataUrl } = await client.getQrCode(document.id);
    console.log('QR Generado (Base64):', qrDataUrl.substring(0, 50) + '...');

  } catch (error: any) {
    console.error('Error en la integración:', error.response?.data || error.message);
  }
}

// example();
