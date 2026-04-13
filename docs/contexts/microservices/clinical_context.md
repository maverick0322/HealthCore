# 🏥 Microservicio: Clinical Service

## 1. Propósito y Responsabilidades
El `healthcore-clinical-service` es el custodio de la información confidencial y técnica del paciente. Su responsabilidad es gestionar la **Ficha Clínica y el Historial de Vinculación**, asegurando que los datos de salud estén disponibles de forma segura para los profesionales autorizados.

Este servicio implementa la lógica de cálculo de requerimientos nutricionales y valida la legitimidad de la relación entre un paciente y un nutriólogo a través del **ProfessionalLink**.

## 2. Stack Tecnológico Core
* **Lenguaje/Framework:** Java 21 + Spring Boot 3.x
* **Persistencia:** Spring Data MongoDB (Esquema lógico: `healthcore_clinical`)
* **Comunicaciones Internas:**
    * gRPC Server: Expone validaciones de vínculo y metas calóricas.
    * gRPC Client: Consulta a Identity para resolver nombres de usuarios.
* **Mensajería:** Spring AMQP (RabbitMQ) - Consumidor del evento de registro de usuario.

## 3. Modelo de Dominio (Entidades Propias)
El diseño de datos se centra en la evolución clínica y la autorización:

* **`PatientProfile`:** Documento que almacena datos biométricos (edad, estatura, peso inicial, género, nivel de actividad).
* **`ProfessionalLink`:** Representa la relación activa entre un `patientId` y un `nutritionistId`. Gestiona el estado de la vinculación (PENDIENTE, ACTIVO, FINALIZADO).
* **`Observation`:** Notas técnicas y ajustes al plan nutricional emitidos por el nutriólogo tras revisar el progreso del paciente.
* **`HealthGoal`:** Almacena los objetivos calóricos y de macronutrientes calculados automáticamente o personalizados por el profesional.

## 4. Contratos de Comunicación (API REST)
Expone la gestión clínica a través del API Gateway en la ruta `/api/v1/clinical/**`.

| Método | Endpoint | Descripción | Actor |
| :--- | :--- | :--- | :--- |
| `GET` | `/profile/me` | Obtiene la ficha clínica del paciente logueado. | Paciente |
| `PATCH` | `/profile/biometrics` | Actualiza peso, estatura o nivel de actividad. | Paciente |
| `POST` | `/links/verify` | Procesa el token/QR para vincularse con un nutriólogo. | Paciente |
| `GET` | `/patients/{id}` | Acceso al expediente detallado para el nutriólogo vinculado. | Nutriólogo |
| `POST` | `/observations` | Registra retroalimentación técnica sobre un paciente. | Nutriólogo |

## 5. Integración y Lógica Distribuida

### A. Consumo de Eventos (RabbitMQ)
Este servicio escucha la cola `identity.user.registered`.
* **Acción:** Cuando se registra un nuevo usuario con rol `PATIENT`, el Clinical Service crea automáticamente un `PatientProfile` inicial y un expediente vacío, permitiendo que el flujo de onboarding de Eugenio funcione sin errores.

### B. Servidor gRPC (Síncrono)
* **Para `Tracking Service`:** Provee el método `GetPatientGoals(patientId)`. Es vital para que el servicio de seguimiento sepa contra qué límite comparar las calorías consumidas en el día.
* **Para `Agenda Service`:** Provee `ValidateLink(patientId, nutritionistId)`. Antes de confirmar una cita, el servicio de Agenda valida aquí que el paciente sea realmente parte de la cartera del nutriólogo.

### C. Cliente gRPC
* Invoca a `Identity Service` para obtener el nombre completo y correo electrónico de los pacientes, ya que el Clinical Service solo conoce los `UUID`.

## 6. Variables de Envorno Requeridas (`.env`)
```properties
# MongoDB
SPRING_DATA_MONGODB_URI=mongodb://mongodb:27017/healthcore_clinical

# RabbitMQ
SPRING_RABBITMQ_HOST=rabbitmq

# gRPC Targets
GRPC_CLIENT_IDENTITY_ADDRESS=static://identity-service:50051

Para complementar el microservicio **Clinical**, he preparado un simulador de la lógica interna que este servicio utiliza para determinar las metas nutricionales. Esto ayudará al equipo a entender cómo los datos biométricos (edad, peso, estatura) se transforman en las metas calóricas que el `Tracking Service` consume después por gRPC.

```json?chameleon
{"component":"LlmGeneratedComponent","props":{"height":"700px","prompt":"Generar un simulador lógico de requerimientos nutricionales para el Clinical Service.\n\nObjetivo: Visualizar cómo el microservicio calcula el TDEE (Gasto Energético Total Diario) basándose en parámetros biométricos.\n\nControles:\n1. Sexo (Hombre/Mujer).\n2. Edad (Años).\n3. Peso (kg).\n4. Estatura (cm).\n5. Nivel de Actividad (Sedentario, Ligero, Moderado, Intenso).\n\nVisualización:\n- Mostrar el cálculo en tiempo real de la TMB (Tasa Metabólica Basal) usando la ecuación de Mifflin-St Jeor.\n- Mostrar el TDEE final multiplicando la TMB por el factor de actividad.\n- Mostrar una distribución sugerida de Macronutrientes (Proteínas, Carbohidratos, Grasas) basada en el total calórico.\n\nPropósito educativo: Explicar que estos valores son los que el Clinical Service almacena en la entidad 'HealthGoal' y que el Tracking Service recupera vía gRPC para mostrar el progreso diario del usuario.","id":"im_cf2d48ccd6fd9435"}}