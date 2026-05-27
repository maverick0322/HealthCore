# 🔐 Microservicio: Identity Service

## 1. Propósito y Responsabilidades
El `healthcore-identity-service` es el Guardián de la plataforma. Su responsabilidad única y exclusiva es la **Gestión de Identidades, Autenticación, Ciclo de Vida de Sesión y Autorización**. 

Ningún otro microservicio de HealthCore debe manejar contraseñas ni validar sesiones de forma directa. Si un servicio necesita saber "quién" está haciendo una petición o validar sus permisos, debe confiar en los tokens JWT emitidos y validados por este servicio.

---

## 2. Stack Tecnológico Core
* **Lenguaje/Framework:** Java 21 + Spring Boot 3.x
* **Seguridad:** Spring Security + JSON Web Tokens (JWT) con rotación de Refresh Tokens.
* **Persistencia:** Spring Data MongoDB (Base lógica `healthcore_identity` hospedada físicamente en el contenedor `healthcore-mongodb`).
* **Mensajería:** Spring AMQP (RabbitMQ) - Emisor de eventos.
* **Comunicaciones Internas (gRPC Server):** Servidor expuesto en el puerto 9090 para resolver datos de contacto e información de perfil para otros servicios.

---

## 3. Modelo de Dominio (Entidades Propias)
* **`User`:** Contiene `id` (UUID), `email`, `passwordHash` (BCrypt), `role` (PATIENT, NUTRITIONIST, ADMIN), `provider` (LOCAL, AUTH0), `emailVerified`, `verifiedAt`, `enabled`, `createdAt`.
* **`VerificationCode`:** Código de 6 dígitos temporal para confirmación de email en altas locales.
* **`PasswordResetCode`:** Código de recuperación de contraseña.
* **`RefreshTokenOwnership`:** Registro del Refresh Token activo por usuario para rotación/logout seguro.

---

## 4. Contratos de Comunicación (API REST)
La ruta expuesta a través del API Gateway es `/api/v1/auth/**`.

### 4.1. Endpoints Públicos / Autenticación
| Método | Endpoint | Descripción | Body de Entrada | Respuesta Exitosa |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | Registra un nuevo usuario local y encripta su contraseña. | `{"email": "x@x.com", "password": "...", "role": "PATIENT", "locale": "es"}` | `201 Created` |
| `POST` | `/login` | Valida credenciales locales y emite un par Access/Refresh Token. | `{"email": "x@x.com", "password": "..."}` | `200 OK` + Tokens JSON |
| `POST` | `/verify-code` | Valida el código de 6 dígitos enviado por correo para activar la cuenta. | `{"email": "x@x.com", "code": "123456"}` | `200 OK` |
| `POST` | `/refresh` | Rotación de Refresh Token para obtener un nuevo Access Token. | `{"refreshToken": "..."}` | `200 OK` + Nuevos Tokens |
| `POST` | `/password-reset/request`| Solicita el envío de un código de recuperación por correo. | `{"email": "x@x.com", "locale": "es"}` | `200 OK` |
| `POST` | `/password-reset/confirm`| Restablece la contraseña enviando el código y la nueva clave. | `{"email": "x@x.com", "code": "123456", "newPassword": "...", "locale": "es"}` | `200 OK` |
| `GET` | `/me` | Obtiene el perfil de autenticación del token JWT activo. | N/A | `200 OK` + JSON Perfil |
| `POST` | `/logout` | Invalida el Refresh Token para cerrar la sesión de forma segura. | `{"refreshToken": "..."}` | `200 OK` |

### 4.2. Endpoints de Administración (`/api/v1/admin/users/**`)
Requieren que el solicitante cuente con el rol `ADMIN`.
| Método | Endpoint | Descripción | Parámetros / Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Provee un nuevo usuario directamente desde el panel de admin. | JSON `AdminCreateUserRequest` |
| `GET` | `/` | Obtiene la lista completa de todos los usuarios registrados. | N/A |
| `PATCH` | `/{userId}/status` | Habilita o deshabilita la cuenta de un usuario (`enabled`). | URL Query: `?enabled=true/false` |

---

## 5. Integración y Comunicación Interna

### A. Como Productor de Eventos (RabbitMQ)
* **`UserRegisteredEvent`** (`identity.user.registered`): Publicado en el exchange `healthcore.identity.events`.
  * *Consumidores:* `clinical-service` (crear expediente vacío), `agenda-service` (crear perfil de nutriólogo si aplica), y `notification-service` (enviar correo de bienvenida/código de verificación).
* **`PasswordResetRequestedEvent`** (`identity.password.reset.requested`): Publicado en el exchange `healthcore.identity.events`.
  * *Consumidores:* `notification-service` (despachar correo con código de recuperación).

### B. Como Servidor gRPC (Síncrono)
* **Puerto Interno:** 9090
* **Operaciones:**
  * `GetUserInfo(UserRequest) returns (UserResponse)` -> Resuelve nombre, apellidos e email para el expediente clínico en `clinical-service`.
  * `GetUserContacts(UserContactsRequest) returns (UserContactsResponse)` -> Resuelve correos electrónicos de pacientes/nutriólogos para `notification-service` a partir de sus IDs de dominio.

---

## 6. Variables de Entorno Requeridas (`.env`)
```properties
# HTTP Port
SERVER_PORT=8082

# gRPC Port
GRPC_IDENTITY_PORT=9090

# MongoDB (Contenedor principal de datos compartidos)
SPRING_DATA_MONGODB_URI=mongodb://mongodb:27017/healthcore_identity

# Seguridad JWT
JWT_SECRET=super_secret_key_base64_encoded_minimum_256_bits
JWT_ACCESS_TOKEN_VALIDITY_MS=300000
JWT_REFRESH_TOKEN_VALIDITY_MS=86400000

# Broker de Mensajería
SPRING_RABBITMQ_HOST=rabbitmq
SPRING_RABBITMQ_PORT=5672
SPRING_RABBITMQ_USERNAME=healthcore
SPRING_RABBITMQ_PASSWORD=healthcore
```