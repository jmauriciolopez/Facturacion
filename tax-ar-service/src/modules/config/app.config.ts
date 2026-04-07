import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),

  database: {
    url: process.env.DATABASE_URL ?? '',
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },

  // API keys de los sistemas clientes que consumen este microservicio
  security: {
    apiKeyHeader: process.env.API_KEY_HEADER ?? 'x-api-key',
    validApiKeys: (process.env.VALID_API_KEYS ?? '').split(',').filter(Boolean),
  },

  // Endpoints AFIP/ARCA por ambiente
  fiscal: {
    homologation: process.env.FISCAL_HOMOLOGATION === 'true',
    wsaaUrlHomologation: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsaaUrlProduction: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    wsfev1UrlHomologation: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
    wsfev1UrlProduction: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
  },

  encryption: {
    secret: process.env.ENCRYPTION_SECRET ?? '',
  },
}));
