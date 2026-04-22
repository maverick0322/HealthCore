# Agenda Service - Iteracion 1 (Paciente)

Base inicial del `agenda-service` enfocada en operaciones del paciente con:

- Reserva de citas contra slots predefinidos/editables (modelo hibrido con `TimeSlotOrigin`).
- Prevencion de dobles reservas con `@Version` (optimistic locking) y un indice defensivo unico (`nutritionistId + startTime`).
- Flujo de creacion en `PENDING` y confirmacion asincrona resiliente.
- Validacion de vinculo paciente-nutriologo via cliente de Clinical Service (stub inicial).
- Ejecucion estandar en Docker Compose (`agenda-service` + `agenda-mongodb`).
- Configuracion principal en `application.yml` y logs por `logback-spring.xml`.

## Endpoints incluidos

- `GET /api/v1/agenda/availability/{nutritionistId}?from=...&to=...`
- `POST /api/v1/agenda/appointments`
- `PATCH /api/v1/agenda/appointments/{id}/cancel`
- `GET /api/v1/agenda/appointments/me`

> Seguridad: los endpoints requieren `Authorization: Bearer <JWT>` (excepto Swagger/OpenAPI).

## Variables de entorno

```properties
SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/healthcore_agenda
GRPC_CLIENT_CLINICAL_ADDRESS=static://clinical-service:50051
AGENDA_CLINICAL_ALLOW_ALL=true
AGENDA_CONFIRMATION_RECONCILE_DELAY_MS=30000
JWT_SECRET=<provisto-por-docker-compose-raiz>
AGENDA_SERVICE_PORT=8080
AGENDA_SERVICE_NAME=AGENDA-SVC
```

## Docker Compose

Fuente principal recomendada: `docker-compose.yml` en la raiz del repositorio.

Servicios de Agenda en la raiz:

- `agenda-mongodb`: MongoDB dedicada del microservicio.
- `agenda-mongo-express`: UI grafica para explorar la base de Agenda.
- `agenda-service`: microservicio corriendo en contenedor.

Levantar Agenda desde la raiz:

```powershell
docker compose up -d --build agenda-mongodb agenda-mongo-express agenda-service
```

Apagar contenedores:

```powershell
docker compose down
```

## Estado de integraciones

- `ClinicalServiceClient` esta implementado como `StubClinicalServiceClient` para esta iteracion.
- La integracion gRPC real se conecta en la siguiente iteracion al agregar contratos `.proto` y clases generadas.

## Pruebas (TDD)

Se agregaron pruebas para el flujo paciente en:

- `src/test/java/com/healthcore/agenda_service/application/PatientAppointmentServiceTest.java`
- `src/test/java/com/healthcore/agenda_service/api/PatientAgendaControllerTest.java`

## Configuracion y logs

- `src/main/resources/application.yml` es la fuente de configuracion.
- `src/main/resources/logback-spring.xml` aplica el patron de logs de equipo y soporta `SERVICE_NAME` por variable de entorno.




