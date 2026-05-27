# 📅 Microservicio: Agenda Service

## 1. Propósito y Responsabilidades
El `healthcore-agenda-service` es el gestor de tiempo y disponibilidad de la plataforma. Su responsabilidad es controlar los horarios de atención de los nutriólogos, publicar slots de tiempo disponibles para citas, gestionar el ciclo de vida de las reservas (creación, reprogramación, cancelación) y emitir recordatorios preventivos.

Su desafío arquitectónico principal es la **Concurrencia**. Debe garantizar que es imposible que dos pacientes reserven el mismo bloque de tiempo (TimeSlot) con el mismo profesional.

---

## 2. Stack Tecnológico Core
* **Lenguaje/Framework:** Java 21 + Spring Boot 3.x
* **Persistencia:** Spring Data MongoDB (Base de datos lógica `healthcore_agenda` hospedada en el contenedor dedicado `healthcore-agenda-mongodb`).
* **Mensajería:** Spring AMQP (RabbitMQ) - Publicador de eventos en el exchange `healthcore.agenda.events`.
* **Comunicaciones Internas:**
  * Servidor gRPC en el puerto 50052 (expone la cancelación de citas al desvincular).
  * Cliente gRPC hacia `clinical-service` para verificar vínculos profesional-paciente antes de agendar.
* **Manejo de Transacciones:** Optimistic Locking (Bloqueo Optimista a nivel de base de datos con `@Version`).

---

## 3. Modelo de Dominio (Entidades Propias)
* **`TimeSlot`:** Define un bloque de tiempo de atención (ej. 30 minutos). Puede estar disponible, reservado o desactivado, y cuenta con un número de versión (`version`) para control de concurrencia.
* **`Appointment` (Aggregate Root):** La cita agendada de forma efectiva. Contiene `id`, `slotId`, `nutritionistId`, `patientId`, `startTime`, `endTime`, `status` (PENDING, CONFIRMED, CANCELLED, ATTENDED) y `version`.

---

## 4. Contratos de Comunicación (API REST)
La ruta expuesta a través del API Gateway es `/api/v1/agenda/**`.

### 4.1. Endpoints para Pacientes
| Método | Endpoint | Rol | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/availability/{nutritionistId}` | Paciente | Retorna los slots libres de un nutriólogo en un rango de fechas. |
| `POST` | `/appointments` | Paciente | Reserva un slot de tiempo. |
| `PATCH` | `/appointments/{id}/cancel` | Paciente | Cancela una cita y libera el slot correspondiente. |
| `PUT` | `/appointments/{id}/reschedule` | Paciente | Reprograma una cita existente liberando el slot anterior y reservando uno nuevo. |
| `GET` | `/appointments/me` | Paciente | Lista las próximas citas activas del paciente autenticado. |
| `GET` | `/appointments/history` | Paciente | Historial de citas del paciente por rango y estados. |

### 4.2. Endpoints para Nutriólogos (`/api/v1/agenda/nutritionist/**`)
| Método | Endpoint | Rol | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/slots/generate` | Nutriólogo | Genera en bloque los horarios de atención (slots) para rango o días explícitos. |
| `GET` | `/slots` | Nutriólogo | Consulta los slots configurados en un rango de fechas. |
| `PATCH` | `/slots/{id}/deactivate` | Nutriólogo | Desactiva un slot (si está reservado a más de 24h, cancela la cita). |
| `GET` | `/appointments` | Nutriólogo | Lista las citas programadas con el nutriólogo autenticado. |
| `GET` | `/reports/appointments` | Nutriólogo | Reporte auditable de citas filtradas por rango, estado o paciente. |
| `GET` | `/reports/slots` | Nutriólogo | Reporte de slots configurados (incluyendo slots inactivos). |

---

## 5. Prevención de Colisiones (Bloqueo Optimista)
Para evitar "dobles reservas" de forma concurrente, el sistema delega la atomicidad a MongoDB mediante **Bloqueo Optimista**:
1. Los slots se leen con una `versión = 1`.
2. Dos pacientes intentan reservar el mismo slot simultáneamente.
3. El primer proceso en llegar guarda el registro y actualiza la `versión a 2`.
4. El segundo proceso intenta guardar usando la `versión 1`. MongoDB detecta el desfase de versión y arroja un `OptimisticLockingFailureException`.
5. Spring Boot intercepta la excepción y devuelve al segundo cliente un error HTTP 409 (Conflict) amigable.

---

## 6. Integración de Eventos y gRPC

### A. Publicación en RabbitMQ (Asíncrono)
El servicio publica eventos en el exchange `healthcore.agenda.events` bajo las siguientes routing keys:
* `agenda.appointment.confirmed` -> Al confirmar una nueva cita.
* `agenda.appointment.cancelled` -> Al cancelar una cita.
* `agenda.appointment.reminder` -> Recordatorio emitido automáticamente.

### B. Scheduler de Recordatorios (24h de anticipación)
Una tarea programada en segundo plano (`AppointmentReminderScheduler`) se ejecuta cada 24 horas. Busca citas confirmadas en la ventana de `tiempo_actual + 24h` hasta `tiempo_actual + 48h` y publica un `AppointmentReminderEvent` en RabbitMQ, el cual es consumido por `notification-service`.

### C. Servidor gRPC (Síncrono)
* **Puerto Interno:** 50052
* **Operación:** `CancelFutureAppointments`
* **Consumidor:** `clinical-service`. Cuando un paciente y un nutriólogo terminan su vínculo profesional (`unlink`), el clinical-service invoca esta llamada gRPC para limpiar automáticamente todas las citas agendadas entre ambos.

---

## 7. Variables de Entorno Requeridas (`.env`)
```properties
# HTTP Port
SERVER_PORT=8083

# MongoDB (Contenedor de base de datos dedicada)
SPRING_DATA_MONGODB_URI=mongodb://agenda-mongodb:27017/healthcore_agenda

# RabbitMQ
SPRING_RABBITMQ_HOST=rabbitmq
SPRING_RABBITMQ_PORT=5672
SPRING_RABBITMQ_USERNAME=healthcore
SPRING_RABBITMQ_PASSWORD=healthcore

# gRPC Config
GRPC_AGENDA_PORT=50052
GRPC_CLIENT_CLINICAL_TARGET=clinical-service:50051

# Clave Semilla JWT
JWT_SECRET=super_secret_key_base64_encoded
```