# Notification Service

## Overview
Notification service consumes async events from RabbitMQ and sends transactional emails via Resend. It follows clean architecture with a clear split between domain, application, and infrastructure layers.

## Responsibilities
- Send welcome emails on `UserRegisteredEvent`
- Send password reset codes on `PasswordResetRequestedEvent`

## Event Contracts
**Exchange:** `healthcore.identity.events`

| Event | Routing Key | Payload |
| --- | --- | --- |
| UserRegisteredEvent | identity.user.registered | `{ "userId": "UUID", "email": "x@x.com", "role": "PATIENT", "registeredAt": "ISO-8601" }` |
| PasswordResetRequestedEvent | identity.password.reset.requested | `{ "email": "x@x.com", "resetCode": "123456", "expiresAt": "ISO-8601" }` |

## Configuration
Set these environment variables (do not hardcode secrets):
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `SPRING_RABBITMQ_HOST`
- `SPRING_RABBITMQ_PORT`
- `SPRING_RABBITMQ_USERNAME`
- `SPRING_RABBITMQ_PASSWORD`

## Local Run
- Use `docker-compose up --build` from the repo root.
- Ensure RabbitMQ and identity-service are running so events are published.

## Tests
Run locally:
- `mvn -pl services/notification-service -am test`

Run in a container:
- `docker-compose run --rm notification-service ./mvnw test`
