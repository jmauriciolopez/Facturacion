import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Global Prefix for all routes: /api/...
  app.setGlobalPrefix('api');

  // URI Versioning: /api/v1/...
  app.enableVersioning({ type: VersioningType.URI });

  // Global DTO Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors();

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Tax AR Service API')
    .setDescription('Microservicio de Facturación Electrónica Argentina (AFIP)')
    .setVersion('1.0')
    .addTag('Tenants', 'Gestión de clientes y perfiles fiscales')
    .addTag('Fiscal Documents', 'Emisión y consulta de comprobantes')
    .addTag('Certificates', 'Gestión de certificados X.509 y llaves privadas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`[tax-ar-service] Running on: http://localhost:${port}/api/v1`);
  logger.log(
    `[tax-ar-service] Swagger Docs: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
