# Clinical Service

El `clinical-service` custodia el expediente clinico de pacientes y nutriologos dentro de HealthCore. Su responsabilidad actual cubre perfiles clinicos, metas derivadas, historial de peso, observaciones, vinculacion profesional, planes nutricionales y datos de referencia para direcciones de clinica.

## Funcionalidades principales

- **Perfil clinico del paciente:** alta, consulta, actualizacion completa, foto de perfil y metas nutricionales derivadas.
- **Perfil profesional del nutriologo:** alta, consulta, actualizacion completa, foto de perfil y acceso al expediente base de pacientes vinculados.
- **Historial de peso y metricas clinicas:** registro, edicion, eliminacion, consulta de historial y reporte consolidado de progreso de peso.
- **Vinculacion clinica:** generacion de codigos, vinculacion paciente-nutriologo y desvinculacion con limpieza de citas futuras via `agenda-service`.
- **Plan nutricional:** planes autogestionados del paciente, planes administrados por nutriologos y consulta de alimentos via `catalog-service`.
- **Referencia postal:** resolucion de datos SEPOMEX para direcciones de clinica.

## Arquitectura e integraciones

- **REST publico:** expone `/api/v1/clinical/**`.
- **gRPC server:** valida vinculos clinicos para otros microservicios.
- **gRPC clients activos:**
  - `agenda-service` para cancelar citas futuras al desvincular.
  - `catalog-service` para busqueda y validacion de alimentos del plan nutricional.
  - `media-service` para resolver URLs de lectura de fotos de perfil.
- **Seguridad:** JWT stateless; el usuario autenticado se obtiene del principal (`Authentication.getName()`).
- **Persistencia:** MongoDB (`healthcore_clinical`).

## Documentacion de la API (Swagger)

La documentacion interactiva queda disponible localmente cuando el servicio esta levantado:

- Swagger UI: `http://localhost:8087/docs`
- OpenAPI JSON: `http://localhost:8087/api-docs`
- OpenAPI JSON (compat): `http://localhost:8087/v3/api-docs`

Si el servicio se publica detras de un API Gateway, ajusta `APP_OPENAPI_SERVER_URL` para que Swagger apunte a la URL consumible por frontend.

## Endpoints

### Paciente
- `POST /api/v1/clinical/profile`
- `PUT /api/v1/clinical/profile/me`
- `PUT /api/v1/clinical/profile/me/photo`
- `GET /api/v1/clinical/profile/me`
- `GET /api/v1/clinical/goals/me`
- `GET /api/v1/clinical/profile/me/nutritionist`
- `POST /api/v1/clinical/weight`
- `PUT /api/v1/clinical/weight/{originalDate}`
- `DELETE /api/v1/clinical/weight/{date}`
- `GET /api/v1/clinical/weight/history`
- `GET /api/v1/clinical/nutrition-plan/me`
- `PUT /api/v1/clinical/nutrition-plan/me`
- `GET /api/v1/clinical/observations/me`
- `POST /api/v1/clinical/linking/connect`
- `POST /api/v1/clinical/linking/disconnect/patient`

### Nutriologo
- `POST /api/v1/clinical/nutritionist/profile`
- `PUT /api/v1/clinical/nutritionist/profile/me`
- `PUT /api/v1/clinical/nutritionist/profile/me/photo`
- `GET /api/v1/clinical/nutritionist/profile/me`
- `GET /api/v1/clinical/nutritionist/patients`
- `GET /api/v1/clinical/nutritionist/patients/{patientId}`
- `PUT /api/v1/clinical/nutritionist/patients/{patientId}/metrics`
- `GET /api/v1/clinical/nutritionist/patients/{patientId}/weight-history`
- `GET /api/v1/clinical/nutritionist/patients/{patientId}/nutrition-plan`
- `PUT /api/v1/clinical/nutritionist/patients/{patientId}/nutrition-plan`
- `GET /api/v1/clinical/nutritionist/reports/weight-progress?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/v1/clinical/observations`
- `PUT /api/v1/clinical/observations/{observationId}`
- `DELETE /api/v1/clinical/observations/{observationId}`
- `GET /api/v1/clinical/observations/patient/{patientId}`
- `POST /api/v1/clinical/linking/generate`
- `GET /api/v1/clinical/linking/current`
- `POST /api/v1/clinical/linking/disconnect/nutritionist/{patientId}`

### Compartidos entre paciente y nutriologo
- `GET /api/v1/clinical/catalog/foods/search?query=...`
- `GET /api/v1/clinical/reference/postal-codes/{postalCode}`

> **Seguridad:** todos los endpoints funcionales requieren `Authorization: Bearer <JWT>`. Solo Swagger/OpenAPI y rutas tecnicas publicas quedan sin autenticacion.

## Ejecucion local

Levantar solo el servicio y su base de datos:

```powershell
docker compose up -d --build clinical-mongodb clinical-service
```

El contenedor escucha internamente en `8083` y se publica al host en `http://localhost:8087`.

## Variables de entorno relevantes

```dotenv
SERVER_PORT=8083
SERVER_PORT_CLINICAL=8087
SPRING_DATA_MONGODB_URI=mongodb://clinical-mongodb:27017/healthcore_clinical
JWT_SECRET=REPLACE_WITH_STRONG_32B_PLUS_SECRET
GRPC_CLINICAL_PORT=50051
GRPC_CLIENT_AGENDA_TARGET=agenda-service:50052
GRPC_CATALOG_TARGET=catalog-service:50051
GRPC_MEDIA_TARGET=media-service:9091
APP_OPENAPI_TITLE=HealthCore Clinical Service API
APP_OPENAPI_VERSION=1.0.0
APP_OPENAPI_DESCRIPTION=Clinical records, professional linking, observations and nutrition plans
APP_OPENAPI_SERVER_URL=http://localhost:8087
```

## Pruebas

Para correr la suite del servicio:

```powershell
Set-Location services/clinical-service
.\mvnw.cmd test
```
