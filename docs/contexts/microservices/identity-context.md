# Microservicio: Identity Service

## 1. Proposito y responsabilidades

El `healthcore-identity-service` es el guardian de la plataforma. Su responsabilidad exclusiva es la gestion de identidades, autenticacion, ciclo de vida de sesion y autorizacion.

Ningun otro microservicio debe manejar contraseñas ni validar sesiones por cuenta propia. Los demas servicios confian en los JWT emitidos por Identity.

## 2. Stack tecnologico core

- **Lenguaje/Framework:** Java 21 + Spring Boot 3.x
- **Seguridad:** Spring Security + JWT con rotacion de refresh token
- **Persistencia:** Spring Data MongoDB (`healthcore_identity`)
- **Mensajeria:** Spring AMQP (RabbitMQ) como emisor de eventos
- **Comunicacion interna:** gRPC server en puerto `9090`

## 3. Modelo de dominio

- **`User`**: correo, hash de contraseña, rol, proveedor, estado y metadatos de verificacion
- **`VerificationCode`**: codigo temporal para validar correo
- **`PasswordResetCode`**: codigo temporal para recuperacion de contraseña
- **`RefreshTokenOwnership`**: ownership del refresh token activo por usuario

## 4. Contratos REST

Ruta principal expuesta via gateway: `/api/v1/auth/**`

### 4.1 Endpoints de autenticacion

| Metodo | Endpoint | Descripcion |
| :--- | :--- | :--- |
| `POST` | `/register` | Registra un nuevo usuario local |
| `POST` | `/login` | Valida credenciales y emite access/refresh token |
| `POST` | `/verify-code` | Verifica codigo de correo |
| `POST` | `/refresh` | Rota el refresh token |
| `POST` | `/password-reset/request` | Solicita recuperacion de contraseña |
| `POST` | `/password-reset/confirm` | Confirma recuperacion de contraseña |
| `GET` | `/me` | Devuelve el perfil del token actual |
| `POST` | `/logout` | Invalida el refresh token actual |

### 4.2 Endpoints de administracion

Base: `/api/v1/admin/users/**`

| Metodo | Endpoint | Descripcion |
| :--- | :--- | :--- |
| `POST` | `/` | Crea usuario desde panel admin |
| `GET` | `/` | Lista usuarios registrados |
| `PATCH` | `/{userId}/status` | Habilita o deshabilita una cuenta |

## 5. Integracion y comunicacion interna

### A. Productor de eventos RabbitMQ

- **`UserRegisteredEvent`** (`identity.user.registered`)
  - Consumidores esperados: `agenda-service`, `notification-service`
  - Nota: en el estado actual del repositorio, `clinical-service` no implementa un consumidor activo para este evento.
- **`PasswordResetRequestedEvent`** (`identity.password.reset.requested`)
  - Consumidor esperado: `notification-service`

### B. Servidor gRPC

- **Puerto interno:** `9090`
- **Operacion relevante documentada actualmente:**
  - `GetUserContacts(UserContactsRequest) returns (UserContactsResponse)` para resolver correos de pacientes y nutriologos usados por `notification-service`

## 6. Variables de entorno requeridas

```properties
SERVER_PORT=8082
GRPC_IDENTITY_PORT=9090
SPRING_DATA_MONGODB_URI=mongodb://mongodb:27017/healthcore_identity
JWT_SECRET=super_secret_key_base64_encoded_minimum_256_bits
JWT_ACCESS_TOKEN_VALIDITY_MS=300000
JWT_REFRESH_TOKEN_VALIDITY_MS=86400000
SPRING_RABBITMQ_HOST=rabbitmq
SPRING_RABBITMQ_PORT=5672
SPRING_RABBITMQ_USERNAME=healthcore
SPRING_RABBITMQ_PASSWORD=healthcore
```
