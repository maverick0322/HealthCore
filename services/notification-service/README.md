# Notification Service

## Overview
Notification service consumes async events from RabbitMQ and sends transactional emails via Resend. It follows clean architecture with a clear split between domain, application, and infrastructure layers.

## Responsibilities
- Send welcome emails on `UserRegisteredEvent` (local/admin users receive a 6-digit verification code; social users receive a friendly welcome)
- Send password reset codes on `PasswordResetRequestedEvent`
- Send appointment confirmations, cancellations, and 24-hour reminders from agenda events

## Event Contracts
**Exchange:** `healthcore.identity.events`

| Event | Routing Key | Payload |
| --- | --- | --- |
| UserRegisteredEvent | identity.user.registered | `{ "userId": "UUID", "email": "x@x.com", "role": "PATIENT", "registeredAt": "ISO-8601", "emailVerificationRequired": true, "verificationCode": "123456", "verificationExpiresAt": "ISO-8601" }` |
| PasswordResetRequestedEvent | identity.password.reset.requested | `{ "email": "x@x.com", "resetCode": "123456", "expiresAt": "ISO-8601" }` |
| AppointmentConfirmedEvent | agenda.appointment.confirmed | `{ "appointmentId": "UUID", "patientId": "UUID", "nutritionistId": "UUID", "startTime": "ISO-8601", "endTime": "ISO-8601" }` |
| AppointmentCancelledEvent | agenda.appointment.cancelled | `{ "appointmentId": "UUID", "patientId": "UUID", "nutritionistId": "UUID", "startTime": "ISO-8601", "endTime": "ISO-8601" }` |
| AppointmentReminderEvent | agenda.appointment.reminder | `{ "appointmentId": "UUID", "patientId": "UUID", "nutritionistId": "UUID", "startTime": "ISO-8601", "endTime": "ISO-8601" }` |

## Configuration
Set these environment variables (do not hardcode secrets):
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `SPRING_RABBITMQ_HOST`
- `SPRING_RABBITMQ_PORT`
- `SPRING_RABBITMQ_USERNAME`
- `SPRING_RABBITMQ_PASSWORD`
- `GRPC_IDENTITY_TARGET`

The service resolves recipient emails via gRPC against identity-service using `GRPC_IDENTITY_TARGET`.

## Local Run
- Use `docker-compose up --build` from the repo root.
- Ensure RabbitMQ and identity-service are running so events are published.

## Tests
Run locally:
- `mvn -pl services/notification-service -am test`

Run in a container:
- `docker-compose run --rm notification-service ./mvnw test`
