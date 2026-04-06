# Sesión completa — Microservicio aislado de facturación electrónica Argentina para usar con Google Antigravity

Este archivo está pensado para construir un **microservicio fiscal independiente** que luego puedas 
conectar desde varios SaaS o sistemas distintos.

La idea es que este servicio sea el **motor único de facturación electrónica argentina** de tu ecosistema.

No es un módulo embebido en una app principal.  
Es un servicio aparte, con su propia base, su propia API y su propia responsabilidad.

---

## Objetivo del microservicio

Construir un servicio independiente que permita:

1. administrar emisores fiscales por tenant
2. almacenar certificados y claves de forma segura
3. autenticarse contra WSAA
4. emitir comprobantes por `wsfev1`
5. consultar estados de comprobantes
6. generar CAE
7. generar QR
8. generar PDF
9. guardar auditoría completa
10. ser consumido por múltiples sistemas vía API

---

## Casos de uso esperados

Este microservicio debería servir para:

- software odontológico
- ERP liviano
- sistema de alquileres
- hotelería
- guarderías náuticas
- corralones
- talleres
- cualquier vertical que necesite facturación argentina

---

## Principio arquitectónico

Este servicio debe ser tratado como:

- **infraestructura compartida**
- **dominio fiscal aislado**
- **API centralizada**
- **multi-tenant**
- **idempotente**
- **auditado**

---

## Cómo usar esta sesión en Antigravity

- pegá primero el **Prompt maestro**
- después ejecutá las etapas una por una
- no pidas todo junto
- validá compilación y tests en cada etapa
- si la respuesta es demasiado grande, pedile que genere solo los archivos de esa etapa

---

## Stack sugerido

### Backend
- NestJS
- PostgreSQL
- Prisma
- Redis para locks/cache
- cliente SOAP/XML
- almacenamiento seguro de secretos

### Infraestructura
- Docker
- Docker Compose para desarrollo
- OpenAPI / Swagger
- logs estructurados
- health checks
- métricas

### Opcional
- cola para emisión async
- object storage para PDFs
- secret manager real
- tracing distribuido

---

## Arquitectura deseada

```text
clients / apps externas
        |
        v
   API REST del microservicio fiscal
        |
        v
  application layer / use cases
        |
        v
  domain fiscal argentino
        |
        v
  infrastructure
   - wsaa
   - wsfev1
   - persistencia
   - certificados
   - qr
   - pdf
   - auditoría
```

---

## Responsabilidades del microservicio

Debe resolver:

- alta y mantenimiento de emisores
- configuración fiscal por tenant
- autenticación contra ARCA/AFIP
- emisión de comprobantes
- validación previa
- trazabilidad completa
- numeración fiscal segura
- reintentos controlados
- consulta posterior del comprobante

No debe resolver:

- ventas
- stock
- agenda
- pacientes
- reservas
- UX de negocio del SaaS cliente

Eso queda en las apps consumidoras.

---

# Prompt maestro

Pegá esto primero en Antigravity para fijar el contexto global.

```md
Quiero construir un microservicio aislado de facturación electrónica argentina usando NestJS.

Contexto:
- Este servicio será compartido por varios productos SaaS distintos.
- Debe ser multi-tenant.
- Cada tenant representa una empresa emisora diferente.
- El servicio debe exponer una API propia.
- Debe integrar autenticación WSAA y emisión de comprobantes por wsfev1.
- Debe guardar auditoría completa, request/response crudos, CAE, QR y PDF.
- Debe ser escalable, mantenible e independiente del resto de los sistemas.
- Las apps clientes consumirán este servicio por HTTP/API y no compartirán lógica fiscal internamente.

Lineamientos obligatorios:
- separar dominio, aplicación e infraestructura
- no mezclar lógica fiscal con controllers de negocio ajeno
- diseñar el servicio para idempotencia y concurrencia segura
- contemplar multi-tenant desde la base
- contemplar observabilidad, health checks y seguridad
- generar código limpio, testeable y listo para crecer
- no reescribir archivos no relacionados
- generar únicamente lo pedido en cada etapa
```

---

# ETAPA 1 — Estructura inicial del microservicio

## Objetivo
Crear la base del proyecto NestJS como servicio aislado.

## Prompt para Antigravity

```md
Quiero que generes la estructura inicial de un microservicio NestJS llamado `tax-ar-service`.

Necesito:
- estructura por capas: `application`, `domain`, `infrastructure`, `presentation`
- módulo raíz del servicio
- configuración inicial del proyecto
- módulo fiscal principal
- módulo de health
- módulo de config
- módulo de observabilidad base
- carpetas organizadas para tests
- árbol de archivos creado

Requisitos:
- TypeScript estricto
- código compilable
- sin lógica de negocio todavía
- arquitectura preparada para crecer
- estilo limpio y consistente
```

---

# ETAPA 2 — Diseño del dominio fiscal

## Objetivo
Modelar el núcleo del dominio.

## Prompt para Antigravity

```md
Quiero que implementes el dominio base del microservicio fiscal argentino.

Necesito entidades, tipos y value objects para:
- Tenant
- FiscalProfile
- PointOfSale
- CustomerFiscalData
- FiscalDocument
- FiscalDocumentItem
- FiscalAuthorization
- FiscalEvent
- TenantCertificate
- AccessTicket
- IdempotencyRecord

También definí enums o types para:
- FiscalEnvironment
- FiscalStatus
- DocumentConcept
- CurrencyCode
- CustomerDocType
- VoucherType
- AuditEventType

Requisitos:
- el dominio no debe depender de NestJS ni del ORM
- usar clases o interfaces limpias
- agregar exports ordenados
- no generar controllers todavía
```

---

# ETAPA 3 — Persistencia y modelo de base de datos

## Objetivo
Diseñar la base del servicio.

## Prompt para Antigravity

```md
Quiero que generes la persistencia para el microservicio fiscal.

Necesito un esquema para PostgreSQL que contemple:
- tenants
- fiscal_profiles
- points_of_sale
- customers
- fiscal_documents
- fiscal_document_items
- fiscal_authorizations
- fiscal_events
- tenant_certificates
- access_tickets
- idempotency_keys
- parameter_tables_cache
- generated_files o tabla equivalente para PDFs/artefactos

Si el proyecto usa Prisma:
- generá `schema.prisma`

Si usa TypeORM:
- generá entities y migraciones iniciales

Requisitos:
- contemplar multi-tenant
- índices y unique constraints correctos
- soporte para CAE, vencimiento, raw_request, raw_response, errores, correlation_id, numeración fiscal
- comentar brevemente índices críticos
- generar interfaces repository para el dominio
```

---

# ETAPA 4 — API pública del microservicio

## Objetivo
Definir el contrato externo del servicio.

## Prompt para Antigravity

```md
Quiero que diseñes la API pública REST del microservicio fiscal.

Necesito controllers, DTOs y endpoints para:
- gestión de tenant fiscal
- configuración fiscal
- puntos de venta
- certificados
- comprobantes
- emisión
- reintentos
- auditoría
- descarga de PDF
- consulta de QR
- health checks

Proponé rutas REST consistentes, por ejemplo:
- /api/tenants
- /api/tenants/:tenantId/fiscal-profile
- /api/tenants/:tenantId/points-of-sale
- /api/tenants/:tenantId/certificates
- /api/fiscal-documents
- /api/fiscal-documents/:id/issue
- /api/fiscal-documents/:id/retry
- /api/fiscal-documents/:id/audit
- /api/fiscal-documents/:id/pdf

Requisitos:
- DTOs claros
- validaciones
- responses consistentes
- base para Swagger/OpenAPI
- no implementar todavía toda la lógica interna si no corresponde
```

---

# ETAPA 5 — Seguridad y autenticación del microservicio

## Objetivo
Proteger el servicio para uso interno o B2B.

## Prompt para Antigravity

```md
Quiero que implementes la seguridad base del microservicio fiscal.

Necesito una estrategia inicial para proteger la API usando una de estas opciones:
- API keys por cliente
- Bearer token interno
- guard configurable

Quiero:
- middleware o guard
- validación de credenciales
- separación entre autenticación del cliente del microservicio y autenticación contra ARCA
- soporte para contexto de tenant
- errores consistentes
- posibilidad de evolucionar a JWT o mTLS más adelante

Requisitos:
- no mezclar esto con WSAA
- generar configuración por entorno
- dejar ejemplos de variables de entorno
```

---

# ETAPA 6 — Gestión de certificados y secretos

## Objetivo
Persistir y usar certificados por tenant de forma segura.

## Prompt para Antigravity

```md
Quiero que implementes la gestión segura de certificados y claves privadas por tenant.

Necesito:
- endpoint de carga de certificado y private key
- endpoint de estado del certificado
- servicio de cifrado y descifrado
- interfaz de secret provider
- persistencia segura
- validación mínima del contenido cargado

Requisitos:
- jamás guardar la private key en texto plano
- permitir luego reemplazar la implementación por un secret manager real
- tests unitarios del cifrado
- diseño desacoplado del ORM donde sea posible
```

---

# ETAPA 7 — WSAA: autenticación externa

## Objetivo
Obtener token y sign para cada tenant.

## Prompt para Antigravity

```md
Quiero que implementes la autenticación WSAA dentro del microservicio fiscal.

Necesito:
- `WsaaAuthService`
- generación del TRA XML
- firmado del TRA
- cliente hacia login CMS
- parser de la respuesta
- cache/persistencia del access ticket por tenant, ambiente y servicio
- método principal `getAccessTicket`

Requisitos:
- reusar ticket vigente
- contemplar expiración
- diseño testeable
- no acoplar a controller
- agregar tests del armado del TRA y parser de respuesta
- soportar homologación y producción
```

---

# ETAPA 8 — Cliente hacia wsfev1

## Objetivo
Construir la integración fiscal real.

## Prompt para Antigravity

```md
Quiero que implementes el gateway `wsfev1` del microservicio fiscal argentino.

Necesito:
- interfaz `TaxAuthorityGateway`
- implementación concreta para wsfev1
- métodos:
  - getLastAuthorized
  - authorizeInvoice
  - getVoucherInfo opcional
  - consulta de parámetros si aplica

El gateway debe:
- consumir `WsaaAuthService`
- armar requests SOAP
- parsear responses SOAP
- mapear errores, eventos y observaciones
- diferenciar homologación y producción

Requisitos:
- transporte SOAP desacoplado del dominio
- types internos claros
- diseño mockeable
- tests del mapper de respuestas
```

---

# ETAPA 9 — Catálogos y tablas paramétricas

## Objetivo
Centralizar parámetros fiscales.

## Prompt para Antigravity

```md
Quiero que implementes el subsistema de tablas paramétricas fiscales.

Necesito soporte para:
- tipos de comprobante
- tipos de documento
- IVA
- monedas
- tributos
- conceptos

Quiero:
- almacenamiento local/cache persistente
- servicio de sincronización
- endpoint de refresco manual
- endpoint de consulta
- fecha de última actualización

Requisitos:
- no dejar todo hardcodeado
- permitir refrescos periódicos más adelante
- que otros módulos puedan consultarlo fácilmente
```

---

# ETAPA 10 — Validaciones fiscales previas

## Objetivo
Detectar errores antes de llamar al web service externo.

## Prompt para Antigravity

```md
Quiero que implementes un motor de validaciones fiscales dentro del microservicio.

Debe validar:
- existencia del tenant y perfil fiscal
- punto de venta válido
- receptor con datos mínimos
- tipo de comprobante compatible
- importes consistentes
- moneda y cotización
- comprobantes asociados cuando aplique
- estados del comprobante
- integridad mínima de los datos necesarios para emitir

Necesito:
- `FiscalValidationService`
- estructura de errores de dominio
- tests con escenarios reales
- salida reutilizable por casos de uso y controllers

Requisitos:
- no usar excepciones genéricas para todo
- mensajes claros para logs y API
```

---

# ETAPA 11 — Alta de comprobantes internos

## Objetivo
Permitir que las apps cliente creen comprobantes pendientes de emisión.

## Prompt para Antigravity

```md
Quiero que implementes la creación y consulta de comprobantes fiscales internos.

Necesito:
- endpoint para alta de comprobantes
- items del comprobante
- cálculo inicial de totales
- persistencia del borrador
- consulta por id
- listado con filtros por tenant, estado, fechas, tipo y punto de venta

Requisitos:
- el comprobante debe poder quedar en estado draft
- separar aggregate de dominio y persistencia
- contemplar multi-tenant
- generar tests del cálculo de totales
```

---

# ETAPA 12 — Emisión idempotente y numeración segura

## Objetivo
Resolver la parte crítica del servicio.

## Prompt para Antigravity

```md
Quiero que implementes el caso de uso de emisión fiscal idempotente.

Necesito un `IssueFiscalDocumentUseCase` que haga:
1. cargar comprobante
2. validar estado
3. correr validaciones fiscales
4. tomar lock por tenant + punto de venta + tipo
5. consultar último autorizado
6. asignar siguiente numeración fiscal
7. llamar a authorizeInvoice
8. guardar request y response crudos
9. guardar CAE y vencimiento
10. actualizar estado
11. devolver respuesta estructurada

También necesito:
- soporte para `Idempotency-Key`
- tabla o repositorio para idempotencia
- manejo de errores transitorios vs rechazos fiscales
- observaciones
- logs estructurados

Requisitos:
- no duplicar numeración
- soportar concurrencia
- tests unitarios y tests de concurrencia básicos si es viable
```

---

# ETAPA 13 — Reintentos controlados

## Objetivo
Permitir retries seguros.

## Prompt para Antigravity

```md
Quiero que implementes reintentos controlados para comprobantes fiscales.

Necesito:
- endpoint `POST /api/fiscal-documents/:id/retry`
- permitir retry solo en estados compatibles
- mantener trazabilidad completa
- reutilizar la lógica de emisión
- respetar idempotencia y numeración segura

Requisitos:
- registrar cada intento en auditoría
- no autorizar dos veces el mismo comprobante
- generar tests unitarios del flujo
```

---

# ETAPA 14 — Auditoría y trazabilidad completa

## Objetivo
Hacer el servicio operable y soportable.

## Prompt para Antigravity

```md
Quiero que implementes la auditoría completa del microservicio fiscal.

Necesito:
- registro de eventos de dominio y técnicos
- request/response crudos
- errores y observaciones
- actor o cliente que invocó la API si aplica
- correlationId
- timestamps
- endpoint de auditoría por comprobante

Diseñá:
- `FiscalAuditService`
- tabla `fiscal_events`
- mappers de eventos técnicos a eventos internos

Requisitos:
- útil para soporte técnico y debugging
- legible desde la API
- no perder trazabilidad en retries
```

---

# ETAPA 15 — QR fiscal

## Objetivo
Generar el QR del comprobante autorizado.

## Prompt para Antigravity

```md
Quiero que implementes la generación del QR fiscal para comprobantes autorizados.

Necesito:
- `QrService`
- armado del payload
- persistencia del JSON generado
- generación de data URL o imagen QR
- endpoint para obtener el QR del comprobante

Requisitos:
- solo generar QR para comprobantes autorizados
- desacoplar de la generación PDF
- tests unitarios del payload
```

---

# ETAPA 16 — PDF fiscal

## Objetivo
Entregar un comprobante descargable desde el servicio.

## Prompt para Antigravity

```md
Quiero que implementes la generación de PDF para comprobantes fiscales autorizados.

Necesito:
- `PdfInvoiceService`
- template simple y profesional
- datos del emisor
- datos del receptor
- comprobante, punto de venta y numeración
- items
- importes
- CAE
- vencimiento del CAE
- QR
- endpoint de descarga

Requisitos:
- generación desde backend
- posibilidad de persistir o regenerar el PDF
- encapsular la librería de PDF
- devolver stream o buffer correctamente
```

---

# ETAPA 17 — Health checks, métricas y observabilidad

## Objetivo
Preparar el servicio para operación real.

## Prompt para Antigravity

```md
Quiero que implementes observabilidad base para el microservicio fiscal.

Necesito:
- health checks
- readiness y liveness
- chequeo de base de datos
- chequeo de Redis si existe
- chequeo básico del subsistema fiscal
- logs estructurados
- correlationId por request
- puntos de métricas o hooks para Prometheus/OpenTelemetry

Requisitos:
- diseño simple pero productivo
- fácil de extender
- no mezclar la lógica de observabilidad con el dominio
```

---

# ETAPA 18 — Dockerización y entorno local

## Objetivo
Tener un servicio ejecutable de forma aislada.

## Prompt para Antigravity

```md
Quiero que prepares el microservicio fiscal para correr localmente con Docker.

Necesito:
- Dockerfile
- docker-compose para desarrollo
- PostgreSQL
- Redis opcional
- variables de entorno
- scripts de arranque
- README corto de setup local

Requisitos:
- entorno reproducible
- comandos claros
- soporte para desarrollo local rápido
```

---

# ETAPA 19 — SDK cliente para otros proyectos

## Objetivo
Facilitar el consumo del microservicio desde tus otros SaaS.

## Prompt para Antigravity

```md
Quiero que generes un SDK TypeScript liviano para consumir el microservicio fiscal desde otros proyectos.

Necesito:
- cliente HTTP tipado
- métodos para:
  - crear comprobante
  - emitir
  - reintentar
  - consultar estado
  - descargar PDF
  - consultar auditoría
  - gestionar perfil fiscal
- manejo básico de errores
- types compartidos

Requisitos:
- separar este SDK del microservicio principal
- diseño reutilizable
- compatible con Node y apps backend
- README de uso básico
```

---

# ETAPA 20 — Hardening final y README técnico

## Objetivo
Cerrar el servicio con criterio de producción.

## Prompt para Antigravity

```md
Quiero que hagas el hardening técnico final del microservicio fiscal.

Revisá e implementá donde falte:
- separación estricta por tenant
- guards y validaciones de acceso
- masking de secretos
- manejo consistente de errores
- timeouts y políticas de retry de infraestructura
- límites razonables
- sane defaults
- documentación OpenAPI
- README técnico completo
- variables de entorno documentadas
- riesgos conocidos
- recomendaciones operativas

Requisitos:
- dejar el servicio listo para evolucionar a producción
- mantener código limpio y desacoplado
```

---

# API sugerida del microservicio

Tomalo como referencia para orientar a Antigravity.

```text
POST   /api/tenants
GET    /api/tenants/:tenantId
POST   /api/tenants/:tenantId/fiscal-profile
GET    /api/tenants/:tenantId/fiscal-profile
PATCH  /api/tenants/:tenantId/fiscal-profile

POST   /api/tenants/:tenantId/points-of-sale
GET    /api/tenants/:tenantId/points-of-sale
PATCH  /api/tenants/:tenantId/points-of-sale/:posId

POST   /api/tenants/:tenantId/certificates
GET    /api/tenants/:tenantId/certificates/status

POST   /api/fiscal-documents
GET    /api/fiscal-documents
GET    /api/fiscal-documents/:id
POST   /api/fiscal-documents/:id/issue
POST   /api/fiscal-documents/:id/retry
GET    /api/fiscal-documents/:id/audit
GET    /api/fiscal-documents/:id/pdf
GET    /api/fiscal-documents/:id/qr

GET    /health
GET    /health/live
GET    /health/ready
```

---

# Estructura de carpetas sugerida

```text
tax-ar-service/
  src/
    app.module.ts
    main.ts
    modules/
      config/
      health/
      auth/
      tenants/
      fiscal/
      certificates/
      documents/
      audit/
      qr/
      pdf/
      observability/
    core/
      application/
      domain/
      infrastructure/
      shared/
  test/
  prisma/ o database/
  docker/
```

---

# Recomendación de implementación real

Orden sugerido:

1. Etapa 1 a 4
2. Etapa 5 y 6
3. Etapa 7 y 8
4. Etapa 9 y 10
5. Etapa 11 y 12
6. Etapa 13 a 16
7. Etapa 17 a 20

---

# Recomendación práctica para vos

Como querés compartir esto entre varios proyectos, el camino más sólido es:

- construir este microservicio como repo aparte
- exponer API REST bien definida
- crear SDK cliente aparte
- integrar cada SaaS consumidor por HTTP
- dejar el dominio fiscal centralizado en un solo lugar

---

# Cierre

Este archivo está pensado para que puedas usar Google Antigravity como copiloto de construcción de un microservicio fiscal serio, separado y reutilizable.

No busca meter toda la lógica en una sola corrida.
Busca ayudarte a construirlo con etapas controladas, de manera profesional y mantenible.
