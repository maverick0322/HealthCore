# Agenda Service

El `agenda-service` gestiona la disponibilidad de los nutriólogos y las citas médicas de los pacientes de la plataforma HealthCore.

## Funcionalidades principales

- **Gestión del Paciente (CU-05):** Permite reservar, cancelar, consultar y **reprogramar** citas en base a los horarios disponibles de su nutriólogo asociado.
- **Gestión del Nutriólogo (CU-08):** Permite **configurar su disponibilidad**, generar horarios (slots) en bloque, desactivar horarios (respetando la regla de 24 horas) y visualizar su agenda de citas.
- **Manejo de Concurrencia:** Prevención de dobles reservas usando `Optimistic Locking` (`@Version` en MongoDB) y control transaccional simulado mediante `TimeSlotVersion`.
- **Integración Clínica (Stub):** Validación del vínculo paciente-nutriólogo mediante gRPC. (Actualmente utilizando un Stub a la espera de la implementación final del `.proto`).
- **Arquitectura Limpia:** Separación estricta entre API, Dominio y Aplicación.

## Documentación de la API (Swagger)

La API está completamente documentada utilizando OpenAPI/Swagger. Cuando el servicio está levantado localmente a través de Docker Compose, puedes consultar la documentación interactiva en:
👉 **[http://localhost:8083/swagger-ui.html](http://localhost:8083/swagger-ui.html)**

## Endpoints

### Paciente (`/api/v1/agenda`)
- `GET /availability/{nutritionistId}?from=...&to=...`: Consultar disponibilidad.
- `POST /appointments`: Crear una nueva cita.
- `PATCH /appointments/{id}/cancel`: Cancelar una cita.
- `PUT /appointments/{id}/reschedule`: Reprogramar una cita.
- `GET /appointments/me`: Listar citas del paciente actual.

### Nutriólogo (`/api/v1/agenda/nutritionist`)
- `POST /slots/generate`: Generar horarios en bloque.
- `GET /slots?from=...&to=...`: Consultar mis horarios.
- `PATCH /slots/{id}/deactivate`: Desactivar un horario (aplica política de > 24 hrs y cancelación automática).
- `GET /appointments?from=...&to=...`: Consultar citas de mis pacientes.

> **Seguridad:** Todos los endpoints (excepto Swagger) requieren el header `Authorization: Bearer <JWT>`.

## Ejecución y Docker Compose

La fuente principal para ejecutar este servicio es el `docker-compose.yml` en la raíz del repositorio.

**Levantar el servicio:**
```powershell
docker compose up -d --build agenda-service
```
El contenedor expone el servicio en el puerto `8083` de tu host, dirigido al puerto interno `8080` de Tomcat.

**Dependencias:**
- `agenda-mongodb`: Base de datos aislada.
- `agenda-mongo-express`: Interfaz gráfica (`http://localhost:8084`).

## Pruebas (TDD & AAA)

La suite de pruebas persigue un mínimo de 70% de cobertura, enfocándose en la filosofía AAA (Arrange, Act, Assert) con aserciones individuales:
- `NutritionistAvailabilityServiceTest` y `PatientAppointmentServiceTest` (Pruebas unitarias de dominio).
- `NutritionistAgendaControllerTest` y `PatientAgendaControllerTest` (Pruebas de integración con MockMvc).

Para correr los tests en un entorno aislado con maven:
```powershell
docker run --rm -v "%cd%:/app" -w /app maven:3.9.9-eclipse-temurin-21 ./mvnw clean test
```
