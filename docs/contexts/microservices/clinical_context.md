# Microservicio: Clinical Service

## 1. Proposito y responsabilidades

El `healthcore-clinical-service` es el custodio del expediente clinico dentro de HealthCore.

Responsabilidades actuales:

- gestionar el perfil clinico del paciente
- calcular metas nutricionales derivadas del perfil biometrico
- registrar y mantener el historial de peso
- gestionar fotos de perfil de pacientes y nutriologos usando `media-service`
- administrar la vinculacion entre paciente y nutriologo
- exponer el expediente base del paciente al nutriologo autorizado
- almacenar observaciones clinicas
- administrar planes nutricionales autogestionados y administrados por nutriologos
- exponer reportes clinicos consolidados
- resolver datos de referencia como codigos postales SEPOMEX

El contrato con frontend es REST sin sincronizacion en tiempo real.

## 2. Stack tecnologico

- **Lenguaje/Framework:** Java 21 + Spring Boot 3.x
- **Persistencia:** Spring Data MongoDB
- **Base logica:** `healthcore_clinical`
- **Seguridad:** JWT backend; identidad obtenida desde `Authentication.getName()`
- **Documentacion API:** Springdoc OpenAPI (`/docs`, `/api-docs`, compat `/v3/api-docs`)
- **Comunicacion interna actual:**
  - gRPC server para validaciones clinicas
  - gRPC client hacia `catalog-service`
  - gRPC client hacia `media-service`
  - gRPC client hacia `agenda-service`
- **Mensajeria:** no hay publicadores ni consumidores RabbitMQ activos en el codigo actual del servicio

## 3. Modelo de dominio

- **`PatientProfile`**: identidad clinica, biometria, objetivo, dieta, alergias, alimentos excluidos, foto, vinculacion profesional e historial de peso.
- **`WeightRecord`**: registro historico de peso por fecha.
- **`NutritionistProfile`**: perfil publico del nutriologo, especialidades, cedula, contacto, direccion, biografia y foto.
- **`ClinicalObservation`**: nota clinica emitida por el nutriologo para un paciente vinculado.
- **`NutritionPlan` / `NutritionPlanView`**: modelo del plan nutricional autogestionado o administrado.
- **`LinkingCode`**: codigo temporal de vinculacion.
- **`HealthGoal`**: metas diarias derivadas del expediente clinico.

## 4. Reglas clinicas importantes

### 4.1 Perfil y metas

- el perfil clinico es la base para IMC y metas nutricionales
- si cambia peso o altura, tambien cambian las metas derivadas

### 4.2 Historial de peso

- el peso se registra con fecha explicita
- solo puede existir un registro por fecha
- no se permiten fechas futuras
- rango valido de peso: `40.0` a `200.0 kg`
- rango valido de altura: `100.0` a `250.0 cm`
- al editar o eliminar un peso, se recalculan perfil actual y metas

### 4.3 Modificacion clinica por nutriologo

- el nutriologo puede actualizar peso y altura del paciente vinculado
- si cambia el peso, el backend registra o reemplaza el peso del dia actual

### 4.4 Vinculo profesional

- el acceso del nutriologo depende de una vinculacion activa
- al desvincular:
  - se termina la relacion clinica
  - se limpian observaciones asociadas
  - se cancelan citas futuras via `agenda-service`

## 5. Seguridad y autenticacion

- los endpoints funcionales usan `@PreAuthorize`
- el `userId` se deriva del principal autenticado
- el backend no confia en headers del cliente para decidir sobre que expediente opera
- Swagger y OpenAPI se publican sin autenticacion en `/docs`, `/api-docs` y `/v3/api-docs`

## 6. API REST expuesta

Base publica:

- `/api/v1/clinical/**`

### 6.1 Perfil del paciente

| Metodo | Endpoint | Actor | Descripcion |
| :--- | :--- | :--- | :--- |
| `POST` | `/profile` | Paciente | Crea el perfil clinico inicial |
| `PUT` | `/profile/me` | Paciente | Actualiza el perfil clinico completo |
| `PUT` | `/profile/me/photo` | Paciente | Actualiza la foto de perfil |
| `GET` | `/profile/me` | Paciente | Obtiene el perfil clinico propio |
| `GET` | `/goals/me` | Paciente | Obtiene metas nutricionales derivadas |
| `GET` | `/profile/me/nutritionist` | Paciente | Obtiene el perfil del nutriologo vinculado |

### 6.2 Historial de peso

| Metodo | Endpoint | Actor | Descripcion |
| :--- | :--- | :--- | :--- |
| `POST` | `/weight` | Paciente | Registra un peso con fecha |
| `PUT` | `/weight/{originalDate}` | Paciente | Edita un registro de peso |
| `DELETE` | `/weight/{date}` | Paciente | Elimina un registro de peso |
| `GET` | `/weight/history` | Paciente | Obtiene su historial de peso |
| `GET` | `/nutritionist/patients/{patientId}/weight-history` | Nutriologo | Obtiene el historial de peso de un paciente vinculado |

### 6.3 Perfil del nutriologo y expediente de pacientes

| Metodo | Endpoint | Actor | Descripcion |
| :--- | :--- | :--- | :--- |
| `POST` | `/nutritionist/profile` | Nutriologo | Crea perfil profesional |
| `PUT` | `/nutritionist/profile/me` | Nutriologo | Actualiza perfil profesional |
| `PUT` | `/nutritionist/profile/me/photo` | Nutriologo | Actualiza la foto de perfil |
| `GET` | `/nutritionist/profile/me` | Nutriologo | Obtiene perfil profesional propio |
| `GET` | `/nutritionist/patients` | Nutriologo | Lista pacientes vinculados |
| `GET` | `/nutritionist/patients/{patientId}` | Nutriologo | Obtiene el expediente base del paciente |
| `PUT` | `/nutritionist/patients/{patientId}/metrics` | Nutriologo | Actualiza peso y altura del paciente vinculado |

### 6.4 Reportes clinicos

| Metodo | Endpoint | Actor | Descripcion |
| :--- | :--- | :--- | :--- |
| `GET` | `/nutritionist/reports/weight-progress?from=YYYY-MM-DD&to=YYYY-MM-DD` | Nutriologo | Reporte consolidado de progreso de peso por paciente |

### 6.5 Vinculacion paciente-nutriologo

| Metodo | Endpoint | Actor | Descripcion |
| :--- | :--- | :--- | :--- |
| `POST` | `/linking/generate` | Nutriologo | Genera codigo de vinculacion |
| `GET` | `/linking/current` | Nutriologo | Obtiene codigo vigente o `204 No Content` |
| `POST` | `/linking/connect` | Paciente | Se vincula con un codigo |
| `POST` | `/linking/disconnect/patient` | Paciente | Se desvincula de su nutriologo |
| `POST` | `/linking/disconnect/nutritionist/{patientId}` | Nutriologo | Desvincula a un paciente |

### 6.6 Observaciones clinicas

| Metodo | Endpoint | Actor | Descripcion |
| :--- | :--- | :--- | :--- |
| `POST` | `/observations` | Nutriologo | Crea una observacion |
| `PUT` | `/observations/{observationId}` | Nutriologo | Edita una observacion |
| `DELETE` | `/observations/{observationId}` | Nutriologo | Elimina una observacion |
| `GET` | `/observations/patient/{patientId}` | Nutriologo | Lista observaciones del paciente vinculado |
| `GET` | `/observations/me` | Paciente | Lista sus observaciones clinicas |

### 6.7 Plan nutricional

| Metodo | Endpoint | Actor | Descripcion |
| :--- | :--- | :--- | :--- |
| `GET` | `/nutrition-plan/me` | Paciente | Obtiene su plan nutricional |
| `PUT` | `/nutrition-plan/me` | Paciente | Crea o actualiza su plan autogestionado |
| `GET` | `/nutritionist/patients/{patientId}/nutrition-plan` | Nutriologo | Obtiene el plan de un paciente vinculado |
| `PUT` | `/nutritionist/patients/{patientId}/nutrition-plan` | Nutriologo | Crea o actualiza el plan del paciente vinculado |
| `GET` | `/catalog/foods/search?query=...` | Paciente/Nutriologo | Busca alimentos del catalogo nutricional |

### 6.8 Referencias

| Metodo | Endpoint | Actor | Descripcion |
| :--- | :--- | :--- | :--- |
| `GET` | `/reference/postal-codes/{postalCode}` | Paciente/Nutriologo | Resuelve datos SEPOMEX para direccion de clinica |

## 7. Integraciones distribuidas

### 7.1 gRPC server

El servicio expone validaciones clinicas a otros microservicios, principalmente para validar vinculos paciente-nutriologo.

### 7.2 gRPC clients activos

- **`catalog-service`** para buscar alimentos y enriquecer ingredientes del plan nutricional
- **`media-service`** para resolver URLs de lectura de fotos de perfil
- **`agenda-service`** para cancelar citas futuras al finalizar una vinculacion

### 7.3 RabbitMQ

Existe configuracion base en `application.yml`, pero no hay publicadores ni consumidores activos de RabbitMQ en el codigo actual de `clinical-service`.

## 8. Contrato esperado con frontend

- la vista que guarda un cambio debe actualizar su estado local inmediatamente
- otras vistas clinicas pueden refrescarse al volver al foco o al reingresar
- no se debe asumir actualizacion instantanea entre sesiones sin una capa de realtime adicional

## 9. Variables de entorno principales

```properties
# HTTP interno del servicio
SERVER_PORT=8083

# HTTP publicado al host para desarrollo local
SERVER_PORT_CLINICAL=8087

# MongoDB
SPRING_DATA_MONGODB_URI=mongodb://clinical-mongodb:27017/healthcore_clinical

# JWT
JWT_SECRET=<secret>

# gRPC server
GRPC_CLINICAL_PORT=50051

# gRPC clients
GRPC_CATALOG_TARGET=catalog-service:50051
GRPC_MEDIA_TARGET=media-service:9091
GRPC_CLIENT_AGENDA_TARGET=agenda-service:50052

# OpenAPI
APP_OPENAPI_TITLE=HealthCore Clinical Service API
APP_OPENAPI_VERSION=1.0.0
APP_OPENAPI_DESCRIPTION=Clinical records, professional linking, observations and nutrition plans
APP_OPENAPI_SERVER_URL=http://localhost:8087
```

## 10. Notas de mantenimiento

- si cambian reglas de peso o altura, actualiza este documento junto con DTOs y validadores
- si se agregan integraciones RabbitMQ reales, documentalas explicitamente aqui y en `docs/contexts/communication_contexts.md`
- si cambian contratos de reportes o del plan nutricional, manten sincronizado este contexto y Swagger
