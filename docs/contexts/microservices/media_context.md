# 🖼️ Microservicio: Media Service

## 1. Propósito y Responsabilidades
El `healthcore-media-service` es el único encargado de la **Gestión Delegada de Archivos Multimedia**. Su responsabilidad principal es la generación de URLs temporales y criptográficamente seguras para la carga y descarga de recursos en el almacenamiento de objetos.

Aplica el principio de "Offloading": libera a la base de datos de almacenar archivos binarios masivos (BLOBs), y evita que el backend consuma recursos de CPU y ancho de banda al procesar transferencias directas de archivos en formato multipart.

---

## 2. Stack Tecnológico Core
* **Lenguaje/Framework:** Java 21 + Spring Boot 3.x
* **Almacenamiento (Nube):** Cloudflare R2 (S3-compatible) a través de AWS SDK para Java v2.
* **Persistencia Local:** Ninguna (Stateless). Las claves lógicas de los archivos (`photoKey`) se guardan desacopladas en los microservicios destino.
* **Seguridad:** Limitación de tasa (Rate Limiting) integrada por usuario mediante **Bucket4j**, previniendo abusos de facturación en la API de almacenamiento.
* **Comunicaciones Internas:** Servidor gRPC en el puerto 9091 para proveer URLs de lectura temporales.

---

## 3. El Flujo de Carga (Offloading Delegado)
Para optimizar el rendimiento y la escalabilidad, el flujo es completamente desacoplado y directo del cliente al almacenamiento:

1. **Solicitud de Carga:** El cliente (PWA/Frontend) solicita una URL de subida para un archivo específico llamando al REST API del `media-service` en `POST /api/v1/media/upload-request`.
2. **Generación de Firma:** El `media-service` verifica el rate limit del usuario (máximo 3 peticiones por minuto). Si es aceptado, calcula un identificador único (UUID) combinándolo con el ID de usuario para formar una clave segura (`storageKey`). Llama al `S3Presigner` para firmar una petición PUT temporal (validez de 5 minutos).
3. **Carga Directa:** El `media-service` devuelve la URL pre-firmada y la clave segura. El frontend realiza un HTTP PUT directo a Cloudflare R2 cargando el archivo binario.
4. **Vinculación:** Tras finalizar la carga, el frontend envía únicamente la clave segura (`photoKey`/`storageKey`) al microservicio que requiere el recurso (como `tracking-service` al crear un registro de comidas).

---

## 4. Contratos de Comunicación (API REST)
Expone la solicitud de carga segura a través de la ruta `/api/v1/media/**`.

| Método | Endpoint | Descripción | Body de Entrada (JSON) | Salida Exitosa (201) |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/upload-request` | Solicita una URL firmada de subida temporal a Cloudflare R2. | `{"fileName": "mi_foto.jpg"}` | `{"uploadUrl": "https://...", "storageKey": "userId/uuid-mi_foto.jpg"}` |

### Códigos de Respuesta Específicos:
* **201 Created:** URL firmada generada exitosamente.
* **400 Bad Request:** Nombre del archivo inválido o con caracteres maliciosos.
* **401 Unauthorized:** Token JWT ausente, inválido o expirado.
* **429 Too Many Requests:** Se excedió la cuota de rate limit (máximo 3 peticiones/min por usuario).
* **422 Unprocessable Entity:** Error de comunicación o configuración con el SDK de Cloudflare R2.

---

## 5. Comunicación Síncrona gRPC (Servidor)
Otros microservicios no guardan URLs completas en sus bases de datos, sino únicamente la referencia corta (`photoKey`). Cuando un servicio (como `tracking-service`) necesita que el frontend renderice una foto, le pide dinámicamente al `media-service` una URL temporal de lectura.

* **Puerto Interno:** 9091
* **Contrato Proto:** `media.proto`
* **Servicio gRPC:** `MediaServiceGrpc`
* **Operación:** `GetPresignedReadUrl(PresignedReadUrlRequest) returns (PresignedReadUrlResponse)`
  * **Input:** `storageKey`
  * **Output:** `presignedUrl` (válida por 60 minutos) o `errorMessage` en caso de fallo.

---

## 6. Variables de Entorno Requeridas (`.env`)
```properties
# Configuración del Puerto del Servidor
SERVER_PORT=8088

# Puerto de gRPC Server
GRPC_SERVER_PORT=9091

# Parámetros del cliente Cloudflare R2
CLOUDFLARE_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=tu_access_key_aqui
CLOUDFLARE_R2_SECRET_ACCESS_KEY=tu_secret_access_key_aqui
CLOUDFLARE_R2_BUCKET_NAME=healthcore-media-assets
CLOUDFLARE_R2_REGION=auto

# Clave Semilla JWT (para validar tokens del API Gateway)
JWT_SECRET=super_secret_key_base64_encoded
```