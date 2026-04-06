# Sesión completa — Facturación electrónica Argentina para SaaS NestJS + React

Este archivo está pensado para usar **etapa por etapa** en un IDE tipo **Google Antigravity**.

La idea es que no le pidas “todo junto”, sino que lo lleves por bloques controlados.
Cada prompt está orientado a **generar código real**, no explicación teórica.

---

## Cómo usar esta sesión

- Ejecutá **un prompt por vez**.
- Antes de pasar al siguiente, revisá que el código compiló.
- Si Antigravity devuelve demasiado contenido, pedile que:
  - respete la estructura existente
  - no reescriba archivos no relacionados
  - genere solo los archivos de la etapa actual
- Si algo ya existe en tu repo, pedile que **adapte** y no reemplace.

---

## Stack objetivo

### Backend
- NestJS
- PostgreSQL
- Prisma o TypeORM
- Redis para cache/locks opcional
- XML/SOAP client

### Frontend
- React + TypeScript
- React Query / TanStack Query
- React Hook Form
- Zod

### Dominio
- SaaS multi-tenant
- un tenant = una empresa emisora
- integración con facturación electrónica Argentina
- autenticación WSAA
- autorización de comprobantes por `wsfev1`
- QR + PDF + auditoría

---

## Resultado esperado al terminar

El sistema debe permitir:

1. Configurar datos fiscales por tenant
2. Subir certificado y clave privada
3. Validar conectividad con homologación
4. Crear comprobantes internos
5. Emitir comprobantes fiscales por backend
6. Obtener CAE
7. Guardar request/response crudos
8. Generar QR
9. Generar PDF descargable
10. Mostrar auditoría y estados en React

---

# ETAPA 1 — Estructura base del módulo fiscal

## Objetivo
Crear la base del módulo `tax-ar` en NestJS, aislado del resto del negocio.

## Prompt para Antigravity

```md
Quiero que generes la estructura inicial de un módulo NestJS llamado `tax-ar` para facturación electrónica de Argentina dentro de un SaaS multi-tenant.

Contexto:
- El proyecto usa NestJS.
- Quiero separar completamente la lógica fiscal del resto del sistema.
- No mezclar reglas fiscales con ventas ni con frontend.

Necesito que generes:
- módulo `tax-ar`
- subcarpetas `application`, `domain`, `infrastructure`, `presentation`
- archivos base para servicios, interfaces y controladores
- un `TaxArModule` bien organizado
- providers vacíos o stubs para:
  - FiscalProfileService
  - WsaaAuthService
  - WsfeService
  - FiscalDocumentService
  - FiscalAuditService

Requisitos:
- usar TypeScript estricto
- nombres claros
- código compilable
- no inventar lógica todavía, solo estructura y contratos iniciales
- mostrar el árbol de archivos creado
```

---

# ETAPA 2 — Modelo de dominio fiscal

## Objetivo
Definir entidades y tipos del dominio fiscal argentino.

## Prompt para Antigravity

```md
Quiero que implementes el modelo de dominio para facturación electrónica argentina en NestJS.

Generá entidades, tipos y value objects base para:
- FiscalProfile
- PointOfSale
- CustomerFiscalData
- FiscalDocument
- FiscalDocumentItem
- FiscalAuthorization
- FiscalEvent
- TenantCertificate

También definí enums o union types para:
- FiscalEnvironment: `testing | production`
- FiscalStatus: `draft | pending_validation | pending_authorization | authorized | authorized_with_observations | rejected | retryable_error`
- tipos de concepto
- tipos de moneda
- tipos de documento

Requisitos:
- el dominio debe ser independiente de Prisma/TypeORM
- usar interfaces o clases de dominio limpias
- incluir comentarios breves solo donde agreguen valor
- no generar controladores todavía
- exportar todo desde índices para importación limpia
```

---

# ETAPA 3 — Persistencia: esquema de base de datos

## Objetivo
Generar el esquema inicial de DB para soportar el módulo fiscal.

## Prompt para Antigravity

```md
Quiero que generes la capa de persistencia para el módulo de facturación electrónica argentina.

Necesito un esquema inicial para PostgreSQL con las tablas:
- tenants
- fiscal_profiles
- points_of_sale
- customers
- fiscal_documents
- fiscal_document_items
- fiscal_authorizations
- fiscal_events
- arca_tokens
- tenant_certificates

Instrucciones:
- si el proyecto usa Prisma, generá `schema.prisma`
- si usa TypeORM, generá entities y migraciones iniciales
- cada tabla debe contemplar multi-tenant
- agregar índices y unique constraints clave
- contemplar:
  - CAE
  - vencimiento CAE
  - estado fiscal
  - raw_request
  - raw_response
  - error_code
  - error_message
  - punto de venta
  - tipo de comprobante
  - numeración fiscal

Además:
- generá repositorios o interfaces repository para el dominio
- explicá con comentarios cortos por qué existen los índices críticos
```

---

# ETAPA 4 — Configuración fiscal del tenant

## Objetivo
Crear endpoints y servicios para administrar el perfil fiscal.

## Prompt para Antigravity

```md
Quiero que implementes la gestión de configuración fiscal por tenant en NestJS.

Necesito:
- DTOs de creación y actualización de perfil fiscal
- controller REST
- service de aplicación
- validaciones de campos
- endpoints como:
  - POST /api/fiscal/config
  - GET /api/fiscal/config
  - PATCH /api/fiscal/config

Campos mínimos del perfil fiscal:
- tenantId
- cuit
- razonSocial
- ivaCondition
- iibb opcional
- environment (`testing` o `production`)

También necesito CRUD básico de puntos de venta:
- alta de punto de venta
- listado
- activación/desactivación

Requisitos:
- usar class-validator o Zod según stack actual
- devolver errores claros
- no integrar todavía con AFIP/ARCA
- dejar listo para usar desde React
```

---

# ETAPA 5 — Certificados y secretos

## Objetivo
Soportar carga segura de certificado y private key por tenant.

## Prompt para Antigravity

```md
Quiero que implementes la gestión segura de certificados para facturación electrónica argentina.

Necesito:
- endpoint para subir certificado y clave privada por tenant
- servicio `CertificateService`
- persistencia de certificados cifrados
- abstracción para secreto maestro del sistema
- validación básica del formato de certificado y private key
- lectura posterior segura para consumo de WSAA

Requisitos:
- no guardar la private key en texto plano
- diseñar una interfaz para cifrado/desifrado
- si no existe secret manager real, usar una implementación local desacoplada
- generar archivos y servicios con nombres claros
- incluir pruebas unitarias mínimas del servicio de cifrado

Endpoints sugeridos:
- POST /api/fiscal/certificates
- GET /api/fiscal/certificates/status
```

---

# ETAPA 6 — WSAA: autenticación con ticket de acceso

## Objetivo
Implementar autenticación WSAA con cache de token/sign.

## Prompt para Antigravity

```md
Quiero que implementes el servicio de autenticación WSAA para facturación electrónica argentina en NestJS.

Necesito:
- `WsaaAuthService`
- generación del TRA XML
- firmado del TRA con certificado y private key del tenant
- cliente SOAP o HTTP necesario para login CMS
- parseo de respuesta
- persistencia/cache de token y sign por tenant, ambiente y servicio
- método principal:
  - `getAccessTicket(tenantId: string, service?: string)`

Requisitos:
- diseñar el código para testing
- no acoplar el firmado al controller
- abstraer clock y cache si hace falta
- si ya existe token válido, reutilizarlo
- registrar expiración
- devolver una estructura clara con token, sign y expirationTime

También generá:
- tests unitarios del armado del TRA
- tests del parser de respuesta
- un endpoint de prueba de conectividad si corresponde
```

---

# ETAPA 7 — Cliente `wsfev1`

## Objetivo
Implementar el gateway hacia facturación electrónica.

## Prompt para Antigravity

```md
Quiero que implementes un gateway NestJS para el web service `wsfev1` de facturación electrónica argentina.

Necesito una interfaz `TaxAuthorityGateway` y una implementación concreta `ArcaWsfeGateway`.

Debe soportar al menos estos métodos:
- `getLastAuthorized`
- `authorizeInvoice`
- `getVoucherInfo` opcional
- consulta de tablas paramétricas si decidís incluirla

El gateway debe:
- usar `WsaaAuthService`
- armar requests SOAP limpios
- parsear respuestas SOAP
- mapear errores, eventos y observaciones a estructuras internas
- separar homologación y producción por configuración del tenant

Requisitos:
- no mezclar lógica de negocio con transporte SOAP
- generar types para request/response internos
- dejar todo mockeable para tests
- incluir tests unitarios del mapper de respuestas
```

---

# ETAPA 8 — Tablas paramétricas fiscales

## Objetivo
Sincronizar catálogos fiscales y exponerlos internamente.

## Prompt para Antigravity

```md
Quiero que implementes la sincronización y consulta de tablas paramétricas fiscales para Argentina.

Necesito soporte para catálogos como:
- tipos de comprobante
- tipos de documento
- tipos de IVA
- monedas
- tributos
- conceptos

Quiero:
- entidades o tablas para cache local
- servicio de sincronización
- método para refresco manual
- método para consulta desde otros módulos
- endpoint interno para listar catálogos

Requisitos:
- diseñar esto como caché persistente
- no hardcodear todo en constantes sueltas
- contemplar fecha de actualización
- dejar lista la estructura para refrescos periódicos
```

---

# ETAPA 9 — Motor de validaciones fiscales

## Objetivo
Validar localmente antes de enviar a ARCA.

## Prompt para Antigravity

```md
Quiero que implementes un motor de validaciones fiscales previo al envío de comprobantes.

Debe validar al menos:
- existencia de perfil fiscal del tenant
- punto de venta habilitado
- tipo de comprobante soportado
- datos mínimos del receptor
- consistencia de importes
- suma de neto + IVA + tributos + exento = total
- moneda y cotización válidas
- fecha de emisión
- existencia de comprobantes asociados cuando corresponda (por ejemplo nota de crédito)

Necesito:
- `FiscalValidationService`
- estructura de errores de validación de dominio
- tests unitarios con varios escenarios
- mensajes claros para UI y logs

Requisitos:
- esta validación debe correr antes de cualquier request SOAP
- no usar excepciones genéricas
- devolver una estructura reutilizable por controller y service
```

---

# ETAPA 10 — Creación de comprobante fiscal interno

## Objetivo
Crear borradores fiscales en la base antes de emitir.

## Prompt para Antigravity

```md
Quiero que implementes la creación de comprobantes fiscales internos en NestJS.

Necesito:
- endpoint para crear `fiscal_documents` en estado borrador
- DTOs de alta
- items del comprobante
- cálculo inicial de totales
- persistencia del borrador
- lectura por id
- listado filtrable por tenant y estado

Requisitos:
- todavía no emitir a ARCA en esta etapa
- permitir que el comprobante quede en `draft`
- separar el aggregate de dominio de la entidad de persistencia
- contemplar multi-tenant
- generar tests del cálculo de totales

Endpoints sugeridos:
- POST /api/fiscal-documents
- GET /api/fiscal-documents
- GET /api/fiscal-documents/:id
```

---

# ETAPA 11 — Emisión idempotente del comprobante

## Objetivo
Implementar el flujo real de emisión con CAE.

## Prompt para Antigravity

```md
Quiero que implementes el flujo de emisión fiscal idempotente para un comprobante interno.

Necesito un caso de uso `IssueFiscalDocumentUseCase` que haga:
1. buscar comprobante
2. validar estado
3. validar datos fiscales
4. aplicar lock por tenant + punto de venta + tipo de comprobante
5. consultar último autorizado
6. asignar siguiente número fiscal
7. llamar a `authorizeInvoice`
8. persistir request y response crudos
9. actualizar estado final
10. devolver resultado estructurado

Requisitos:
- endpoint `POST /api/fiscal-documents/:id/issue`
- soportar `Idempotency-Key`
- si ya está autorizado, devolver el mismo resultado
- si hay error transitorio, dejar `retryable_error`
- si hay rechazo fiscal, dejar `rejected`
- contemplar observaciones
- agregar logs estructurados

También quiero:
- un mecanismo simple de lock (DB o Redis)
- tests unitarios del caso de uso
- tests de concurrencia básicos si son viables
```

---

# ETAPA 12 — Auditoría y trazabilidad

## Objetivo
Registrar toda la historia fiscal del documento.

## Prompt para Antigravity

```md
Quiero que implementes la auditoría del módulo fiscal.

Necesito:
- registrar eventos por comprobante
- guardar request y response crudos
- guardar errores, observaciones y eventos del web service
- guardar timestamps y actor si aplica
- endpoint para consultar auditoría de un comprobante

Diseñá:
- `FiscalAuditService`
- `fiscal_events`
- mappers entre eventos técnicos y eventos de dominio

Endpoints sugeridos:
- GET /api/fiscal-documents/:id/audit

Requisitos:
- la auditoría debe servir para soporte técnico
- no perder trazabilidad en reintentos
- incluir correlationId
- generar respuestas legibles para frontend
```

---

# ETAPA 13 — Generación de QR fiscal

## Objetivo
Generar el QR requerido para comprobantes electrónicos.

## Prompt para Antigravity

```md
Quiero que implementes la generación del QR fiscal argentino para comprobantes electrónicos autorizados.

Necesito:
- servicio `QrService`
- método para construir el payload del QR a partir de un comprobante autorizado
- persistencia del payload JSON generado
- generación de imagen QR o data URL reutilizable por PDF y frontend

Requisitos:
- solo generar QR si el comprobante está autorizado
- dejar el servicio desacoplado del renderer PDF
- incluir tests unitarios del payload
- exponer endpoint o método para obtener el QR del comprobante
```

---

# ETAPA 14 — PDF del comprobante

## Objetivo
Generar un PDF presentable con CAE y QR.

## Prompt para Antigravity

```md
Quiero que implementes la generación de PDF para comprobantes fiscales autorizados.

Necesito:
- `PdfInvoiceService`
- template claro y simple
- incluir:
  - datos del emisor
  - datos del receptor
  - tipo de comprobante
  - punto de venta y número
  - detalle de items
  - importes
  - CAE
  - vencimiento del CAE
  - QR
- endpoint de descarga

Requisitos:
- el PDF debe generarse desde backend
- no hardcodear datos de ejemplo
- separar armado de datos del render final
- si usás librería PDF, encapsularla detrás de un servicio
- devolver stream o buffer correctamente

Endpoint sugerido:
- GET /api/fiscal-documents/:id/pdf
```

---

# ETAPA 15 — Reintentos controlados

## Objetivo
Permitir reintentar errores transitorios sin romper consistencia.

## Prompt para Antigravity

```md
Quiero que implementes reintentos controlados de emisión fiscal.

Necesito:
- endpoint `POST /api/fiscal-documents/:id/retry`
- solo permitir retry sobre estados compatibles, por ejemplo `retryable_error`
- mantener trazabilidad del intento anterior
- reutilizar lógica del caso de uso de emisión
- respetar idempotencia

Requisitos:
- no duplicar numeración fiscal si ya hubo autorización
- registrar cada intento en auditoría
- devolver estado final y motivo del cambio
- generar tests unitarios de este flujo
```

---

# ETAPA 16 — Frontend React: configuración fiscal

## Objetivo
Construir la UI operativa para configurar el módulo.

## Prompt para Antigravity

```md
Quiero que implementes en React + TypeScript la UI de configuración fiscal para el SaaS.

Necesito pantallas o componentes para:
- formulario de perfil fiscal
- gestión de puntos de venta
- carga de certificado y clave privada
- test de conectividad
- visualización de estado de configuración

Requisitos:
- usar React Hook Form
- validación con Zod si está disponible
- usar TanStack Query para fetch/mutations
- componentes limpios, orientados a backoffice
- mostrar errores de API de forma clara
- no mezclar esta pantalla con la de emisión de comprobantes

Además:
- crear hooks para consumir el backend
- centralizar tipos TypeScript del módulo fiscal
```

---

# ETAPA 17 — Frontend React: comprobantes y emisión

## Objetivo
Operar comprobantes desde la UI.

## Prompt para Antigravity

```md
Quiero que implementes en React + TypeScript la UI de comprobantes fiscales.

Necesito:
- listado de comprobantes con filtros por estado, fecha, tipo y punto de venta
- vista detalle del comprobante
- botón emitir
- botón reintentar si corresponde
- descarga de PDF
- visualización de CAE y fecha de vencimiento
- estado fiscal visible con badges claros

Requisitos:
- usar TanStack Query
- invalidar cachés correctamente después de emitir o reintentar
- deshabilitar acciones cuando el estado no lo permita
- contemplar estados loading, success y error
- diseño simple de panel administrativo
```

---

# ETAPA 18 — Frontend React: auditoría y soporte

## Objetivo
Dar visibilidad técnica del proceso de emisión.

## Prompt para Antigravity

```md
Quiero que implementes la pantalla de auditoría fiscal en React + TypeScript.

Necesito mostrar:
- historial de eventos del comprobante
- request/response crudos resumidos o expandibles
- errores y observaciones
- correlationId
- timestamps
- resultado de cada intento

Requisitos:
- vista orientada a soporte interno
- ocultar datos sensibles si corresponde
- permitir copiar correlationId o mensajes de error
- mantener UI clara aunque haya mucho contenido técnico
```

---

# ETAPA 19 — Tests integrados y fixtures

## Objetivo
Dejar una base robusta para evolución futura.

## Prompt para Antigravity

```md
Quiero que agregues una base de testing seria para este módulo fiscal.

Necesito:
- fixtures de tenants, perfiles fiscales, puntos de venta y comprobantes
- tests unitarios clave
- tests de integración para emisión mockeada
- helpers para mockear WSAA y wsfev1
- ejemplos de request/response SOAP para usar como fixtures

Requisitos:
- no depender de servicios reales externos en los tests
- dejar el módulo preparado para homologación futura
- organizar carpetas de test con criterio
- agregar README corto de cómo correr los tests del módulo fiscal
```

---

# ETAPA 20 — Hardening para SaaS multi-tenant

## Objetivo
Cerrar la implementación con criterios de producción.

## Prompt para Antigravity

```md
Quiero que hagas un hardening técnico del módulo fiscal para producción en un SaaS multi-tenant.

Necesito revisar e implementar donde falte:
- separación estricta por tenant
- guards o validaciones de acceso
- logs estructurados
- masking de secretos
- manejo consistente de errores
- timeouts y retry policy de infraestructura
- métricas o puntos de observabilidad
- health checks del módulo fiscal
- configuración por ambiente

Además:
- crear un README técnico del módulo `tax-ar`
- documentar variables de entorno necesarias
- listar riesgos conocidos y recomendaciones de operación
```

---

# Prompt maestro opcional

Usalo solo si querés que Antigravity entienda el contexto completo antes de ejecutar las etapas.

```md
Estoy construyendo un SaaS multi-tenant con NestJS + React + PostgreSQL.
Quiero incorporar un módulo de facturación electrónica para Argentina de forma profesional, desacoplada y evolutiva.

Arquitectura deseada:
- backend NestJS
- frontend React + TypeScript
- módulo fiscal separado del core de negocio
- configuración fiscal por tenant
- certificados por tenant
- autenticación WSAA
- emisión por wsfev1
- auditoría completa
- QR y PDF
- idempotencia y locks para numeración fiscal

Reglas importantes:
- no mezclar lógica fiscal en React
- no acoplar SOAP al dominio
- no generar código desordenado
- respetar multi-tenant
- priorizar código limpio, testeable y extensible
- generar solo lo pedido en cada etapa
- no reescribir archivos no relacionados

A partir de ahora voy a darte prompts por etapas. Quiero que cumplas cada una de forma precisa y generes código real listo para integrar.
```

---

# Orden recomendado de ejecución

1. Etapa 1
2. Etapa 2
3. Etapa 3
4. Etapa 4
5. Etapa 5
6. Etapa 6
7. Etapa 7
8. Etapa 8
9. Etapa 9
10. Etapa 10
11. Etapa 11
12. Etapa 12
13. Etapa 13
14. Etapa 14
15. Etapa 15
16. Etapa 16
17. Etapa 17
18. Etapa 18
19. Etapa 19
20. Etapa 20

---

# Recomendación práctica

Para que Antigravity rinda mejor:

- pegá primero el **Prompt maestro opcional**
- después ejecutá las etapas una por una
- si una etapa devuelve demasiado, repreguntá:
  - “generá solo backend”
  - “generá solo DTOs y controller”
  - “generá solo tests”
  - “mostrá únicamente los archivos nuevos y modificados”

---

# Cierre

Este archivo está pensado como guía operativa de construcción.
No busca resolver toda la normativa en un único paso, sino ayudarte a generar una implementación sólida, controlada y mantenible.
