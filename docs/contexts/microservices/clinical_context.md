# Microservicio: Clinical Service

## 1. Propósito y responsabilidades
El `healthcore-clinical-service` es el custodio del expediente clínico del paciente dentro de HealthCore.

Sus responsabilidades actuales son:

* gestionar el perfil clínico del paciente
* calcular metas nutricionales derivadas del perfil biométrico
* registrar y mantener el historial de peso
* administrar la vinculación entre paciente y nutriólogo
* exponer el expediente del paciente al nutriólogo autorizado
* almacenar observaciones clínicas del nutriólogo
* administrar planes nutricionales autogestionados y asignados por el nutriólogo
* exponer reportes clínicos consolidados para el nutriólogo
* resolver datos de referencia para la clínica, como códigos postales

Este servicio no implementa tiempo real para la interfaz. Su contrato con frontend es REST síncrono; la sincronización visual depende de reconsultas del cliente.

## 2. Stack tecnológico core
* **Lenguaje/Framework:** Java 21 + Spring Boot 3.x
* **Persistencia:** Spring Data MongoDB
* **Base lógica:** `healthcore_clinical`
* **Seguridad:** JWT validado en el backend; el usuario autenticado se obtiene desde `Authentication.getName()`
* **Comunicaciones internas:**
  * gRPC server para validaciones clínicas consumidas por otros microservicios
  * gRPC client hacia `identity-service`
  * gRPC client hacia `catalog-service`
  * gRPC client hacia `agenda-service` para limpieza de citas futuras al desvincular
* **Mensajería:** Spring AMQP (RabbitMQ) para integraciones asíncronas del ecosistema

## 3. Modelo de dominio
Las piezas principales del dominio hoy son:

* **`PatientProfile`**
  Guarda identidad clínica, biométricos, objetivo, dieta, alergias, alimentos excluidos, vínculo profesional y evolución de peso.

* **`WeightRecord`**
  Representa un registro de peso por fecha. Es la fuente de verdad para la evolución de peso y para recalcular metas derivadas.

* **`NutritionistProfile`**
  Guarda el perfil profesional público del nutriólogo, incluyendo especialidades, tipos de consulta, cédula, contacto, dirección y biografía.

* **`ClinicalObservation`**
  Nota clínica emitida por el nutriólogo para un paciente vinculado.

* **`NutritionPlan` / `NutritionPlanView`**
  Modelo del plan nutricional, tanto para pacientes autogestionados como para pacientes vinculados a un nutriólogo.

* **`LinkingCode`**
  Código temporal usado para vincular pacientes con nutriólogos.

* **`HealthGoal`**
  Metas diarias derivadas del perfil clínico: calorías, proteína, carbohidratos, grasas y agua.

## 4. Reglas clínicas importantes
### 4.1. Perfil y metas
* El perfil clínico del paciente es la base para calcular IMC y metas nutricionales.
* Si cambia el peso o la altura, cambian también el IMC y las metas derivadas.
* El backend calcula usando la zona horaria clínica definida para evitar desfases de fecha.

### 4.2. Historial de peso
* El peso se registra con fecha explícita.
* Solo puede existir un registro por fecha.
* Si se registra nuevamente una fecha ya existente, el valor se reemplaza.
* No se permiten fechas futuras.
* El rango válido de peso es `40.0` a `200.0 kg`.
* El peso admite máximo un decimal.
* Al editar o eliminar un peso, el perfil actual y las metas se recalculan según el registro más reciente resultante.

### 4.3. Modificación clínica por nutriólogo
* El nutriólogo puede actualizar peso y altura del paciente vinculado desde el expediente.
* Si cambia el peso, el backend registra o reemplaza el peso del día actual y recalcula metas.
* Si cambia la altura, actualiza el perfil biométrico y recalcula métricas derivadas.

### 4.4. Vínculo profesional
* El acceso del nutriólogo al expediente depende de una vinculación activa con el paciente.
* Al desvincular:
  * se termina la relación clínica
  * se limpian observaciones asociadas a esa relación
  * se cancelan citas futuras vía integración con `agenda-service`

## 5. Seguridad y autenticación
El servicio usa JWT como fuente de identidad del usuario autenticado.

Reglas:

* los endpoints protegidos usan `@PreAuthorize`
* el `userId` se deriva del principal autenticado
* el backend no debe confiar en encabezados del cliente para decidir a qué perfil afecta una operación clínica

En otras palabras, las operaciones clínicas trabajan sobre el usuario autenticado o sobre un paciente validado contra el nutriólogo autenticado.

## 6. API REST expuesta
Base pública vía API Gateway:

* `/api/v1/clinical/**`

### 6.1. Perfil del paciente
| Método | Endpoint | Actor | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/profile` | Paciente | Crea el perfil clínico inicial |
| `PUT` | `/profile/me` | Paciente | Actualiza el perfil clínico completo |
| `GET` | `/profile/me` | Paciente | Obtiene el perfil clínico propio |
| `GET` | `/goals/me` | Paciente | Obtiene metas nutricionales derivadas |
| `GET` | `/profile/me/nutritionist` | Paciente | Obtiene el perfil del nutriólogo vinculado |

### 6.2. Historial de peso
| Método | Endpoint | Actor | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/weight` | Paciente | Registra un peso con fecha |
| `PUT` | `/weight/{originalDate}` | Paciente | Edita un registro de peso |
| `DELETE` | `/weight/{date}` | Paciente | Elimina un registro de peso |
| `GET` | `/weight/history` | Paciente | Obtiene su historial de peso |
| `GET` | `/nutritionist/patients/{patientId}/weight-history` | Nutriólogo | Obtiene el historial de peso de un paciente vinculado |

### 6.3. Perfil del nutriólogo y expediente de pacientes
| Método | Endpoint | Actor | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/nutritionist/profile` | Nutriólogo | Crea perfil profesional |
| `PUT` | `/nutritionist/profile/me` | Nutriólogo | Actualiza perfil profesional |
| `GET` | `/nutritionist/profile/me` | Nutriólogo | Obtiene perfil profesional propio |
| `GET` | `/nutritionist/patients` | Nutriólogo | Lista pacientes vinculados |
| `GET` | `/nutritionist/patients/{patientId}` | Nutriólogo | Obtiene el expediente base del paciente |
| `PUT` | `/nutritionist/patients/{patientId}/metrics` | Nutriólogo | Actualiza peso y altura del paciente vinculado |

### 6.4. Reportes clínicos para nutriólogo
| Método | Endpoint | Actor | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/nutritionist/reports/weight-progress?from=YYYY-MM-DD&to=YYYY-MM-DD` | Nutriólogo | Reporte consolidado de progreso de peso por paciente |

Este endpoint devuelve un contrato específico de reportes con:

* `activePatients`
* `patientsWithoutWeightInRange`
* `rows`

Cada fila incluye:

* `patientId`
* `fullName`
* `latestRecordDateInRange`
* `startWeightKg`
* `currentWeightKg`
* `netChangeKg`
* `hasRecordsInRange`

### 6.5. Vinculación paciente-nutriólogo
| Método | Endpoint | Actor | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/linking/generate` | Nutriólogo | Genera código de vinculación |
| `GET` | `/linking/current` | Nutriólogo | Obtiene código vigente |
| `POST` | `/linking/connect` | Paciente | Se vincula con un código |
| `POST` | `/linking/disconnect/patient` | Paciente | Se desvincula de su nutriólogo |
| `POST` | `/linking/disconnect/nutritionist/{patientId}` | Nutriólogo | Desvincula a un paciente |

### 6.6. Observaciones clínicas
| Método | Endpoint | Actor | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/observations` | Nutriólogo | Crea una observación |
| `PUT` | `/observations/{observationId}` | Nutriólogo | Edita una observación |
| `DELETE` | `/observations/{observationId}` | Nutriólogo | Elimina una observación |
| `GET` | `/observations/patient/{patientId}` | Nutriólogo | Lista observaciones del paciente vinculado |
| `GET` | `/observations/me` | Paciente | Lista sus observaciones clínicas |

### 6.7. Plan nutricional
| Método | Endpoint | Actor | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/nutrition-plan/me` | Paciente | Obtiene su plan nutricional |
| `PUT` | `/nutrition-plan/me` | Paciente | Crea o actualiza su plan autogestionado |
| `GET` | `/nutritionist/patients/{patientId}/nutrition-plan` | Nutriólogo | Obtiene el plan de un paciente vinculado |
| `PUT` | `/nutritionist/patients/{patientId}/nutrition-plan` | Nutriólogo | Crea o actualiza el plan del paciente vinculado |
| `GET` | `/catalog/foods/search?query=...` | Paciente/Nutriólogo | Busca alimentos del catálogo nutricional |

### 6.8. Referencias
| Método | Endpoint | Actor | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/reference/postal-codes/{postalCode}` | Paciente/Nutriólogo | Resuelve datos de SEPOMEX para dirección de clínica |

## 7. Integraciones distribuidas
### 7.1. gRPC server
El servicio expone validaciones clínicas a otros microservicios.

Casos principales:

* validar vínculo activo paciente-nutriólogo para `agenda-service`
* proveer metas clínicas requeridas por otros servicios

### 7.2. gRPC clients
`clinical-service` consume otros servicios cuando necesita datos o efectos inmediatos:

* **`identity-service`**
  para resolver identidad visible de pacientes y nutriólogos

* **`catalog-service`**
  para buscar alimentos y validar ingredientes del plan nutricional

* **`agenda-service`**
  para cancelar citas futuras cuando una vinculación clínica termina

### 7.3. RabbitMQ
El servicio participa en flujos asíncronos del ecosistema. El caso base documentado y esperado es el alta inicial de usuarios para preparar el expediente clínico.

## 8. Contrato esperado con frontend
El backend clínico expone datos por REST. No existe contrato de sincronización en vivo por WebSocket o SSE.

Por lo tanto, en frontend el comportamiento esperado es:

* la vista que guarda un cambio debe actualizar su estado local inmediatamente
* otras vistas clínicas pueden refrescarse al volver al foco o al reingresar
* no se debe asumir actualización instantánea entre dos sesiones abiertas sin una capa de realtime adicional

Esto está alineado con la arquitectura actual del proyecto.

## 9. Variables de entorno principales
```properties
# HTTP
SERVER_PORT=8083

# MongoDB (Conectado al contenedor clinical-mongodb en Docker)
SPRING_DATA_MONGODB_URI=mongodb://clinical-mongodb:27017/healthcore_clinical

# RabbitMQ
SPRING_RABBITMQ_HOST=rabbitmq

# JWT
JWT_SECRET=<secret>

# gRPC server
GRPC_CLINICAL_PORT=50051

# gRPC clients (En Docker)
GRPC_CLIENT_IDENTITY_ADDRESS=static://identity-service:9090
GRPC_CATALOG_TARGET=catalog-service:50051
GRPC_CLIENT_AGENDA_TARGET=agenda-service:50052
```

## 10. Notas para mantenimiento
* Si se agregan más reglas de peso, este documento debe actualizarse junto con `PatientProfile` y `ProfileFieldValidator`.
* Si en el futuro se introduce realtime real para frontend, esa decisión debe documentarse aquí y en `docs/contexts/communication_contexts.md`.
* Si cambian contratos del expediente del nutriólogo o de reportes, este contexto debe mantenerse sincronizado con `nutritionist_reports_context.md`.
