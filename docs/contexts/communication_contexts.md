# 🗣️ HealthCore: Protocolos y Comunicación entre Microservicios

## 1. El Paradigma de Comunicación
En HealthCore aplicamos estrictamente el patrón **Database per Service** (una base de datos aislada por microservicio). Esto significa que un servicio **nunca** puede consultar directamente las tablas de otro. Si el `agenda-service` necesita datos del paciente, tiene que pedírselos amablemente al `clinical-service` a través de la red.

Para lograr esto sin sacrificar el rendimiento, hemos dividido nuestra comunicación en tres grandes autopistas: **Externa (REST)**, **Interna Síncrona (gRPC)** e **Interna Asíncrona (RabbitMQ)**.

---

## 2. Comunicación Externa (Síncrona)
**Tecnología:** HTTP/REST con JSON.
**Actores:** Frontend (React/Electron) ➔ API Gateway ➔ Microservicios (Spring Boot).

Esta es la capa pública. Utilizamos REST porque es el estándar universal que los navegadores y dispositivos móviles entienden nativamente. 
* **Características:** Textual (JSON), legible para humanos, ideal para operaciones CRUD directas desde la interfaz de usuario.
* **Regla de Oro:** Ningún microservicio se comunica con otro microservicio utilizando REST. REST es exclusivo para hablar con el mundo exterior.

---

## 3. Comunicación Interna Síncrona (Backend a Backend)
**Tecnología:** gRPC con Protocol Buffers (Protobuf) sobre HTTP/2.
**Actores:** Microservicio ➔ Microservicio (Ej. Java ➔ Python).

Cuando un microservicio necesita información de otro *inmediatamente* para poder responderle al usuario, usamos gRPC. 
* **¿Por qué gRPC?** A diferencia de JSON, Protobuf comprime los datos en formato **binario**. Esto lo hace hasta 10 veces más rápido que REST y consume menos CPU. Además, los archivos `.proto` actúan como contratos estrictos; si un servicio cambia una variable, el código del otro servicio no compilará, evitando errores en producción.

### Mapa de Llamadas gRPC en HealthCore:
1. **`Tracking Service` ➔ `Catalog Service` (Python):** Para consultar macronutrientes de un código de barras en tiempo real.
2. **`Agenda Service` ➔ `Clinical Service`:** Para verificar si un paciente tiene un vínculo activo (`ProfessionalLink`) con un nutriólogo antes de permitir agendar una cita.
3. **`Tracking Service` ➔ `Clinical Service`:** Para solicitar la meta calórica y el peso actual del paciente y así calcular sus gráficas de progreso diario.
4. **`Clinical Service` ➔ `Identity Service`:** Para obtener el nombre, apellido y correo del paciente (datos que solo Identity posee) al momento de armar el expediente clínico en pantalla.

---

## 4. Comunicación Interna Asíncrona (Coreografía de Eventos)
**Tecnología:** AMQP con RabbitMQ.
**Actores:** Microservicio (Publicador) ➔ Broker de Mensajes ➔ Microservicio (Consumidor).

Usamos RabbitMQ para acciones tipo "dispara y olvida" (*Fire-and-forget*). Cuando una acción en un servicio debe desencadenar consecuencias en otros, pero **no necesitamos esperar** a que terminen para responderle al usuario.

### Contratos de Eventos (RabbitMQ)
**Exchange:** `healthcore.identity.events` (tipo `topic`)

1. **`UserRegisteredEvent`**
   - **Routing key:** `identity.user.registered`
   - **Payload:**
     ```json
     {
       "userId": "UUID",
       "email": "user@healthcore.com",
       "role": "PATIENT",
      "registeredAt": "2026-04-28T10:00:00Z",
      "emailVerificationRequired": true,
      "verificationCode": "123456",
      "verificationExpiresAt": "2026-04-28T10:15:00Z"
     }
     ```
   - **Consumidores esperados:** `clinical-service`, `agenda-service`, `notification-service`

2. **`PasswordResetRequestedEvent`**
   - **Routing key:** `identity.password.reset.requested`
   - **Payload:**
     ```json
     {
       "email": "user@healthcore.com",
       "resetCode": "123456",
       "expiresAt": "2026-04-28T10:15:00Z"
     }
     ```
   - **Consumidores esperados:** `notification-service`

**Notification Service (Resend):** Este consumidor usa el SDK oficial de Resend. Configura `RESEND_API_KEY`, `RESEND_FROM_EMAIL` y `RESEND_FROM_NAME` como variables de entorno (no se hardcodean).

### Casos de Uso en HealthCore:
* **El Registro de Pacientes:** 1. El usuario se registra en `identity-service`.
  2. `Identity` guarda las credenciales y lanza un evento a RabbitMQ: *"¡Usuario Registrado (ID: 123)!"*.
  3. `Identity` le responde HTTP 200 OK al frontend de inmediato (el usuario ya puede usar la app).
  4. En segundo plano, `clinical-service` escucha el mensaje en RabbitMQ y crea un expediente clínico vacío para el ID 123. `Agenda` también podría escucharlo para mandarle un correo de bienvenida.
* **Procesamiento Multimedia:**
  1. El `media-service` sube una foto a AWS S3.
  2. Publica un evento: *"¡Foto subida con URL 'x.jpg' para el paciente Y!"*.
  3. El `clinical-service` escucha esto y anexa la URL al expediente del paciente de forma silenciosa.

---

## 5. Resumen de Reglas para Desarrolladores
Si estás programando una nueva funcionalidad, hazte esta pregunta:
1. ¿El dato lo pide el usuario desde la pantalla? ➔ **Crea un endpoint REST.**
2. ¿Necesitas el dato de otro servicio ¡YA MISMO! para poder hacer un cálculo o validación? ➔ **Usa un cliente gRPC.**
3. ¿Ocurrió algo importante pero el usuario no necesita esperar a ver el resultado final de los otros módulos? ➔ **Publica un evento en RabbitMQ.**