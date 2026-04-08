# Tax AR Service - Microservicio de Facturación AFIP

Microservicio robusto para la gestión de facturación electrónica con AFIP (Argentina), diseñado para escalabilidad, mantenibilidad y resiliencia.

## Características Principales

- **Gestión de Documentos Fiscales**: Creación, consulta y autorización de facturas (WSFE).
- **Idempotencia Garantizada**: Mecanismo de seguridad para evitar duplicaciones en reintentos de red.
- **Auditoría Completa**: Trail de eventos para cada documento fiscal, permitiendo trazabilidad total.
- **Contexto UI Inteligente**: Mapeo automático de estados técnicos y errores de AFIP en información amigable para la interfaz de usuario.
- **Mantenimiento Automatizado**: Tareas programadas (Cron) para limpieza de registros temporales y tickets expirados.
- **Generación de PDF**: Creación dinámica de comprobantes autorizados.
- **Arquitectura Hexagonal**: Separación clara entre dominio, aplicación e infraestructura.

## Requisitos Previos

- Node.js v18+
- PostgreSQL
- Certificados AFIP (Homologación/Producción)

## Instalación

```bash
$ npm install
```

## Configuración

Configura el archivo `.env` con los siguientes parámetros:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tax_ar_db"
AFIP_CERT_PATH="/path/to/cert.pem"
AFIP_KEY_PATH="/path/to/key.key"
AFIP_CUIT="20XXXXXXXX3"
AFIP_ENVIRONMENT="development"
```

## Ejecución

```bash
# Desarrollo
$ npm run start:dev

# Producción
$ npm run build
$ npm run start:prod
```

## Mantenimiento

El sistema incluye un `CleanupService` que ejecuta automáticamente:
- **Purga de Idempotencia**: Cada 24 horas (ajustable) elimina registros de solicitudes procesadas.
- **Limpieza de Tickets**: Elimina tickets de acceso a AFIP expirados para mantener la base de datos optimizada.

## API Highlights

### Documentos
- `POST /documents`: Crear un nuevo borrador de documento.
- `GET /documents/:id`: Obtener detalles, incluye `uiContext` para visualización.
- `POST /documents/:id/authorize`: Autorizar comprobante ante AFIP (con soporte de idempotencia).
- `GET /documents/:id/audit`: Obtener el historial de eventos del documento.

## Licencia

Propiedad de Mauricio Lopez.
