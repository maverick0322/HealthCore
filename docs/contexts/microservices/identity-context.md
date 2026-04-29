# 🔐 Microservicio: Identity Service

## 1. Propósito y Responsabilidades
El `healthcore-identity-service` es el Guardián de la plataforma. Su responsabilidad única y exclusiva es la **Gestión de Identidades, Autenticación y Autorización**. 

Ningún otro microservicio de HealthCore debe manejar contraseñas ni validar sesiones. Si un servicio necesita saber "quién" está haciendo una petición, debe confiar en el token emitido por Identity.

## 2. Stack Tecnológico Core
* **Lenguaje/Framework:** Java 21 + Spring Boot 3.x
* **Seguridad:** Spring Security + JSON Web Tokens (JWT)
* **Persistencia:** Spring Data MongoDB
* **Mensajería:** Spring AMQP (RabbitMQ)
* **Comunicaciones Internas:** gRPC Server (grpc-spring-boot-starter)

## 3. Modelo de Dominio (Entidades Propias)
Este servicio es el "dueño" absoluto de las siguientes entidades. Se persisten en el esquema lógico `healthcore_identity` en MongoDB:

* **`User` (Abstracta/Documento Principal):** Contiene `id` (UUID), `email`, `passwordHash`, `role` (PATIENT, NUTRITIONIST, ADMIN), `isActive`, `createdAt`.
* **Subtipos lógicos:** Aunque la tabla sea única, el sistema diferencia lógicamente entre Pacientes y Nutriólogos para temas de roles y permisos.
* *(Nota: El peso, la edad o el número de cédula profesional NO viven aquí, pertenecen al Clinical Service).*

## 4. Contratos de Comunicación (API REST)
Expone los endpoints públicos consumidos directamente por la aplicación Web/Móvil (a través del API Gateway en la ruta `/api/v1/auth/**`).

| Método | Endpoint | Descripción | Body de Entrada (Ejemplo) | Salida Exitosa |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | Registra un nuevo usuario y encripta su contraseña (BCrypt). | `{"email": "x@x.com", "password": "...", "role": "PATIENT"}` | `201 Created` |
| `POST` | `/login` | Valida credenciales y emite tokens de sesión. | `{"email": "x@x.com", "password": "..."}` | `200 OK` + `{ "accessToken": "eyJ...", "refreshToken": "..." }` |
| `POST` | `/password-reset/request` | Genera y envía un código de recuperación por correo. | `{"email": "x@x.com"}` | `200 OK` |
| `POST` | `/password-reset/confirm` | Valida el código temporal para restaurar contraseña. | `{"email": "x@x.com", "code": "123456", "newPassword": "..."}` | `200 OK` |

## 5. El Flujo de Seguridad (JWT)
1. El usuario envía credenciales a `/login`.
2. Spring Security verifica el hash de la contraseña contra MongoDB.
3. Si es correcto, el servicio genera un **Access Token (JWT)** firmado criptográficamente con un `JWT_SECRET`.
4. El token incluye en su "Payload" el `UUID` del usuario y su `Role`.
5. A partir de ese momento, el cliente (Frontend) debe enviar este token en la cabecera HTTP (`Authorization: Bearer <token>`) en cada petición subsecuente al API Gateway.

## 6. Integración y Comunicación Interna

### A. Como Productor de Eventos (RabbitMQ)
El `identity-service` es el origen del ciclo de vida del usuario. Cuando ocurre un registro exitoso, no hace peticiones síncronas para no hacer esperar al cliente. En su lugar, publica eventos asíncronos:
* **Evento:** `UserRegisteredEvent`
* **Payload:** `{ "userId": "UUID", "email": "x@x.com", "role": "PATIENT" }`
* **Consumidores esperados:** `clinical-service` (para crear el expediente clínico vacío) y `agenda-service` (para perfiles de nutriólogos).

* **Evento:** `PasswordResetRequestedEvent`
* **Payload:** `{ "email": "x@x.com", "resetCode": "123456", "expiresAt": "2026-04-28T10:15:00Z" }`
* **Consumidores esperados:** `notification-service` (para enviar correo de recuperación).

### B. Como Servidor gRPC (Síncrono)
Otros microservicios conocen a los usuarios solo por su `UUID`. Cuando el `clinical-service` necesita mostrar el nombre real del paciente en el expediente, le pregunta a Identity vía gRPC.
* **Operación Protobuf:** `GetUserInfo(UserRequest) returns (UserResponse)`
* **Datos expuestos:** Solo datos no sensibles (Nombre, Apellidos, Email). ¡NUNCA expone el password hash!

## 7. Variables de Entorno Requeridas (`.env`)
Para levantar este contenedor, Docker inyecta las siguientes variables:
```properties
# Base de Datos
SPRING_DATA_MONGODB_URI=mongodb://mongodb:27017/healthcore_identity

# Seguridad (Semilla para firmar los tokens - NO SUBIR A GITHUB)
JWT_SECRET_KEY=super_secret_key_base64_encoded_minimum_256_bits
JWT_EXPIRATION_MS=86400000 # 1 día

# Broker de Mensajes
SPRING_RABBITMQ_HOST=rabbitmq
SPRING_RABBITMQ_PORT=5672
SPRING_RABBITMQ_USERNAME=healthcore
SPRING_RABBITMQ_PASSWORD=healthcore