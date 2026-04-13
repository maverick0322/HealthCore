# 📅 Microservicio: Agenda Service

## 1. Propósito y Responsabilidades
El `healthcore-agenda-service` es el gestor de tiempo de la plataforma. Su responsabilidad es controlar la disponibilidad de los nutriólogos, publicar sus horarios de atención y gestionar el ciclo de vida de las citas (creación, cancelación, reprogramación).

Su desafío arquitectónico principal es la **Concurrencia**. Debe garantizar matemáticamente que es imposible que dos pacientes reserven el mismo bloque de tiempo con el mismo profesional.

## 2. Stack Tecnológico Core
* **Lenguaje/Framework:** Java 21 + Spring Boot 3.x
* **Persistencia:** Spring Data MongoDB (Esquema lógico: `healthcore_agenda`)
* **Comunicaciones Internas:** gRPC Client (Consulta al `Clinical Service` para validación de vínculos).
* **Manejo de Transacciones:** Optimistic Locking (Bloqueo Optimista a nivel de base de datos).

## 3. Modelo de Dominio (Entidades Propias)
El diseño se divide en reglas de disponibilidad y las reservas efectivas:

* **`AvailabilityRule`:** Define los horarios de trabajo de un nutriólogo (Ej. Lunes a Viernes de 09:00 a 14:00 y de 16:00 a 19:00, con slots de 30 minutos).
* **`Appointment`:** El documento transaccional principal. Contiene `id`, `nutritionistId`, `patientId`, `startTime`, `endTime`, `status` (PENDING, CONFIRMED, CANCELLED, ATTENDED).
    * **`@Version Long version;`** -> El atributo mágico para el control de concurrencia.

## 4. Contratos de Comunicación (API REST)
Expone la gestión de citas a través del API Gateway en la ruta `/api/v1/agenda/**`.

| Método | Endpoint | Descripción | Actor |
| :--- | :--- | :--- | :--- |
| `GET` | `/availability/{nutritionistId}` | Retorna los slots libres de un nutriólogo en un rango de fechas. | Paciente |
| `POST` | `/appointments` | Intenta reservar un slot de tiempo. | Paciente |
| `PATCH` | `/appointments/{id}/cancel` | Cancela una cita (liberando el slot). | Ambos |
| `GET` | `/appointments/me` | Lista las próximas citas del usuario logueado. | Ambos |

## 5. Regla de Negocio Crítica: Prevención de Colisiones (Optimistic Locking)
Para cumplir la meta de "0 dobles reservas", no dependemos de validaciones lógicas simples (un `if` en Java), ya que en milisegundos dos peticiones podrían pasar el `if` al mismo tiempo. Delegamos esto a MongoDB mediante **Bloqueo Optimista**:

1. Cuando el paciente solicita ver los horarios, el servicio devuelve los slots disponibles con una `versión = 1`.
2. El **Paciente A** y el **Paciente B** ven el mismo slot libre a las 10:00 AM (Versión 1).
3. Ambos presionan "Reservar" casi al mismo tiempo.
4. El **Paciente A** llega primero por milisegundos. MongoDB guarda la cita, le asigna su `patientId` y automáticamente sube la `versión a 2`.
5. El **Paciente B** llega un milisegundo después intentando guardar su cita sobre la `versión 1`.
6. MongoDB detecta la discrepancia (1 != 2) y rechaza la transacción arrojando un error. Spring Boot intercepta esto como un `OptimisticLockingFailureException` y le devuelve al Paciente B un mensaje amigable: *"El horario acaba de ser ocupado, por favor elige otro"*.

## 6. Integración y Dependencias gRPC
Un paciente no puede agendar una cita con un nutriólogo al azar en la plataforma. 
* **Hacia `Clinical Service`:** Antes de guardar cualquier cita, el `agenda-service` llama al método gRPC `ValidateLink(patientId, nutritionistId)`. Si el Clinical Service responde que no existe un vínculo profesional activo, el Agenda Service aborta la operación con un error `403 Forbidden`.

## 7. Variables de Entorno Requeridas (`.env`)
```properties
# MongoDB
SPRING_DATA_MONGODB_URI=mongodb://mongodb:27017/healthcore_agenda

# gRPC Targets
GRPC_CLIENT_CLINICAL_ADDRESS=static://clinical-service:50051

Dado que el concepto de **Bloqueo Optimista (Optimistic Locking)** que se menciona en el punto 5 puede ser un poco abstracto para visualizarlo solo con texto, he generado este simulador interactivo. Te recomiendo mostrárselo a Arturo y al resto del equipo para que comprendan exactamente cómo el campo `@Version` nos salvará de las colisiones en producción.

```json?chameleon
{"component":"LlmGeneratedComponent","props":{"height":"600px","prompt":"Generar un simulador interactivo de Bloqueo Optimista (Optimistic Locking) para el Agenda Service.\n\nObjetivo: Demostrar cómo el campo '@Version' previene dobles reservas cuando dos pacientes intentan agendar el mismo horario simultáneamente.\n\nControles:\n- Botón 'Paso 1: Ambos pacientes leen el horario (Versión 1)'.\n- Botón 'Paso 2: Paciente A confirma reserva'.\n- Botón 'Paso 3: Paciente B intenta confirmar reserva'.\n- Botón 'Reiniciar Escenario'.\n\nVisualización:\n- Mostrar un panel central que represente la Base de Datos (MongoDB) con el estado del 'Slot 10:00 AM', 'Estado: Disponible/Ocupado', y su 'Versión: X'.\n- Mostrar dos paneles de cliente (Paciente A y Paciente B) con los datos que han extraído de la base de datos (Estado y Versión leída).\n- Al ejecutar el Paso 2, animar o indicar visualmente que el Paciente A envía su petición. La BD se actualiza a 'Ocupado por Paciente A' y 'Versión 2'. Mostrar éxito para el Paciente A.\n- Al ejecutar el Paso 3, mostrar al Paciente B enviando su petición (que lleva la Versión 1). Simular el rechazo de la base de datos arrojando 'OptimisticLockingFailureException' porque la BD ya está en la Versión 2. Mostrar error al Paciente B.","id":"im_9cb08cca3de16f64"}}