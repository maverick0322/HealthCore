# 🖼️ Microservicio: Media Service

## 1. Propósito y Responsabilidades
El `healthcore-media-service` es el único encargado de la **Gestión de Archivos Multimedia**. Su responsabilidad es recibir imágenes (fotos de progreso del paciente, avatares, evidencias para observaciones), validarlas, comprimirlas si es necesario, y enviarlas de forma segura a un almacenamiento en la nube.

Aplica el principio de "Offloading": libera a la base de datos de la carga de almacenar archivos binarios masivos (BLOBs), mejorando drásticamente el rendimiento general del sistema.

## 2. Stack Tecnológico Core
* **Lenguaje/Framework:** Java 21 + Spring Boot 3.x
* **Almacenamiento (Nube):** AWS SDK (Amazon Simple Storage Service - S3)
* **Persistencia Local:** Ninguna (Stateless). Las URLs finales se guardan en el `clinical-service`.
* **Mensajería:** Spring AMQP (RabbitMQ) - Productor de eventos.
* **Seguridad:** Validación de formatos MIME (solo `.jpg`, `.png`) y límite de tamaño por archivo.

## 3. El Flujo de Carga (Ciclo de Vida de una Imagen)
Para mantener la respuesta al usuario lo más rápida posible y la arquitectura desacoplada, el flujo es semi-asíncrono:

1. **Recepción:** El paciente sube una "Foto de Progreso" desde la PWA (React). El archivo multipart pasa por el API Gateway y llega al `media-service`.
2. **Validación y Carga (Síncrono):** El servicio verifica que sea una imagen válida y la sube al bucket de AWS S3. S3 responde con una URL pública o firmada (Ej. `https://healthcore-bucket.s3.amazonaws.com/paciente-123/foto1.jpg`).
3. **Respuesta Rápida:** El `media-service` le responde un HTTP 202 (Accepted) al frontend de Eugenio casi de inmediato, indicando que el archivo se procesó con éxito.
4. **Notificación (Asíncrono):** El `media-service` no sabe qué hacer con esa URL. Por lo tanto, publica un mensaje en RabbitMQ: *"¡Foto subida! Pertenece al paciente X y esta es la URL"*.
5. **Consolidación:** El `clinical-service` escucha ese mensaje en segundo plano y anexa la URL al expediente clínico del paciente.

## 4. Contratos de Comunicación (API REST)
Expone la subida de archivos a través del API Gateway en la ruta `/api/v1/media/**`.

| Método | Endpoint | Descripción | Body de Entrada |
| :--- | :--- | :--- | :--- |
| `POST` | `/upload/progress-photo` | Sube una foto de evidencia física. | `multipart/form-data` (file) |
| `POST` | `/upload/avatar` | Sube la foto de perfil del usuario. | `multipart/form-data` (file) |
| `DELETE`| `/files/{fileId}` | Elimina un archivo físicamente de AWS S3. | N/A |

*Nota: La lectura o descarga de imágenes generalmente no pasa por este servicio; el frontend consume directamente las URLs de S3 o de un CDN asociado (CloudFront) para no consumir ancho de banda de nuestro servidor Linux.*

## 5. Eventos Publicados (RabbitMQ)
Este servicio es un publicador puro. Emite eventos que otros microservicios pueden elegir escuchar:

* **Evento:** `ProgressPhotoUploadedEvent`
    * **Payload:** `{ "patientId": "UUID", "photoUrl": "https://...", "timestamp": "2026-04-13T..." }`
    * **Consumidor:** `clinical-service` (para atarlo a un log de peso de ese día).
* **Evento:** `AvatarUploadedEvent`
    * **Payload:** `{ "userId": "UUID", "avatarUrl": "https://..." }`
    * **Consumidor:** `identity-service` y `clinical-service`.

## 6. Variables de Entorno Requeridas (`.env`)
Dado que este servicio se conecta a Amazon Web Services, requiere credenciales estrictamente secretas que **jamás deben subirse a GitHub**.

```properties
# RabbitMQ
SPRING_RABBITMQ_HOST=rabbitmq
SPRING_RABBITMQ_PORT=5672

# Límites de Spring Boot (Para evitar OutOfMemory Errors)
SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=5MB
SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE=5MB

# AWS S3 Configuración
AWS_ACCESS_KEY_ID=tu_access_key_aqui
AWS_SECRET_ACCESS_KEY=tu_secret_key_aqui
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=healthcore-media-assets
```