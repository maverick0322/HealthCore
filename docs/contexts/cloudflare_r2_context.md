# ☁️ Infraestructura: Cloudflare R2 (Object Storage)

## 1. Justificación Arquitectónica (El Patrón de Offloading Delegado)
En arquitecturas monolíticas antiguas, los archivos subidos por el usuario solían guardarse directamente en el disco duro del servidor o convertidos en Base64 dentro de la base de datos. En HealthCore, implementamos el patrón de **Offloading de Recursos Estáticos Delegado**.

Utilizamos **Cloudflare R2** (almacenamiento de objetos compatible con la API de Amazon S3) para delegar completamente la responsabilidad de almacenar, servir y respaldar archivos pesados (fotografías de progreso, avatares, fotos de comidas). 
* **Ventajas:** Mantiene a nuestras bases de datos MongoDB ligeras y rápidas, ahorra espacio en disco y ancho de banda en nuestro servidor Linux host, y evita costes de transferencia de datos de salida (egress fees) gracias a la política de Cloudflare R2.

---

## 2. Integración en HealthCore y gRPC
Por diseño de arquitectura, **ningún microservicio tiene credenciales para comunicarse directamente con Cloudflare R2 para la subida de archivos, a excepción del `media-service`**.

El `media-service` actúa como el único puente de seguridad y utiliza el **AWS SDK para Java v2** adaptado para Cloudflare R2. 

### Flujo de Operaciones:
1. **Solicitud de Subida (PUT Pre-signed URL):** El frontend (PWA) solicita una URL de subida criptográfica de un solo uso llamando a `media-service` (`POST /api/v1/media/upload-request`).
2. **Subida Directa:** El cliente sube el archivo binario directamente a Cloudflare R2 usando la URL pre-firmada por HTTP PUT, liberando al backend de procesar flujos de bytes multipart concurrentes.
3. **Persistencia del Key:** El cliente guarda únicamente la clave del objeto (`photoKey`) en la entidad correspondiente (ej. en un registro de comidas en `tracking-service` o en el expediente de `clinical-service`).
4. **Solicitud de Lectura (GET Pre-signed URL via gRPC):** Cuando un microservicio (como `tracking-service`) necesita devolver un registro al usuario, solicita a `media-service` a través de **gRPC** en el puerto 9091 (`getPresignedReadUrl`) una URL temporal de lectura. El `media-service` la genera y el microservicio la inyecta enriqueciendo su respuesta REST.

---

## 3. Estructura y Organización del Bucket
En R2, los archivos se guardan bajo una estructura de carpetas lógicas simuladas utilizando prefijos en las claves (Keys) de los objetos:

* **Estructura general:** `{userId}/{uniqueUUID}-{originalFileName}`

Esta separación asegura que las claves sean únicas y estén organizadas por el identificador del usuario que realizó la carga.

---

## 4. Seguridad de Datos Sensibles (Pre-Signed URLs)
Dado que HealthCore es una aplicación de salud, las fotos de progreso, comidas y avatares son información estrictamente confidencial. **El bucket de R2 NO ES PÚBLICO.**

Implementamos firmas criptográficas temporales según la acción:
1. **URLs de Escritura (Upload):** Válidas por **5 minutos**. Solo permiten una petición HTTP PUT para almacenar el archivo exacto configurado.
2. **URLs de Lectura (Download):** Válidas por **60 minutos** (1 hora). Generadas bajo demanda mediante gRPC por los microservicios autorizados y devueltas de forma dinámica al frontend. Si alguien roba esa URL y la intenta abrir después de una hora, R2 le denegará el acceso.

---

## 5. Variables de Entorno Requeridas (`.env`)
Estas variables son inyectadas al contenedor del `media-service` por Docker.
**¡ATENCIÓN EQUIPO!: Las llaves de R2 (`CLOUDFLARE_R2_ACCESS_KEY_ID` y `CLOUDFLARE_R2_SECRET_ACCESS_KEY`) son secretos críticos. JAMÁS deben escribirse directamente en el código fuente ni subirse a GitHub.**

```properties
# Configuración del Cliente Cloudflare R2
CLOUDFLARE_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=tu_access_key_aqui
CLOUDFLARE_R2_SECRET_ACCESS_KEY=tu_secret_access_key_aqui
CLOUDFLARE_R2_BUCKET_NAME=healthcore-media-assets
CLOUDFLARE_R2_REGION=auto
```
