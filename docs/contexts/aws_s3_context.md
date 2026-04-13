# ☁️ Infraestructura: AWS S3 (Simple Storage Service)

## 1. Justificación Arquitectónica (El Patrón de Offloading)
En arquitecturas monolíticas antiguas, los archivos subidos por el usuario solían guardarse directamente en el disco duro del servidor o convertidos en Base64 dentro de la base de datos. En HealthCore, implementamos el patrón de **Offloading de Recursos Estáticos**.

Utilizamos **Amazon S3** para delegar completamente la responsabilidad de almacenar, servir y respaldar archivos pesados (fotografías). 
* **Ventajas:** Mantiene a nuestra base de datos MongoDB ligera y rápida, ahorra costos de almacenamiento en nuestro servidor Linux host, y delega el ancho de banda de descarga a la infraestructura global de Amazon.

## 2. Integración en HealthCore
Por diseño de arquitectura, **ningún microservicio tiene permiso para comunicarse con AWS S3 a excepción del `media-service`**. 

El `media-service` utiliza el **AWS SDK para Java v2** para actuar como el único puente seguro entre nuestro clúster local y la nube de Amazon. Si el `clinical-service` necesita borrar una foto, debe pedírselo al `media-service` por API, no puede ir a S3 directamente.

## 3. Estructura y Organización del Bucket
En S3, los archivos se guardan en un contenedor global llamado "Bucket" (ej. `healthcore-media-assets`). Para mantener el orden, simulamos carpetas lógicas utilizando prefijos en las claves (Keys) de los objetos:

* **Avatares:** `avatars/{userId}/profile.jpg`
* **Fotos de Progreso:** `progress-photos/{patientId}/{fecha_uuid}.jpg`

Esta estructura facilita la creación de políticas de ciclo de vida (por ejemplo, mover fotos muy antiguas a un almacenamiento más barato como S3 Glacier si fuera necesario en el futuro).

## 4. Seguridad de Datos Sensibles (Pre-Signed URLs vs Public Read)
Dado que HealthCore es una aplicación de salud, las fotos de progreso en ropa interior o básculas son información altamente confidencial. **El bucket de S3 NO ES PÚBLICO.**

Implementamos dos estrategias de seguridad según el tipo de archivo:
1. **Avatares (Públicos):** Las fotos de perfil pueden tener una política de lectura pública (Public Read). El `media-service` guarda y devuelve una URL estándar: `https://healthcore-media-assets.s3.amazonaws.com/avatars/123/profile.jpg`.
2. **Fotos de Progreso (Privadas):** Las evidencias clínicas son estrictamente privadas. El `media-service` las sube sin acceso público. Cuando el frontend necesita mostrar la foto, el backend genera una **Pre-Signed URL (URL Pre-firmada)**. Esta es una URL temporal generada criptográficamente que caduca en X minutos (ej. 15 minutos). Si alguien roba esa URL y la intenta abrir mañana, AWS le denegará el acceso.

## 5. Gestión de Permisos (Políticas IAM)
Para cumplir con el principio de "Menor Privilegio", el `media-service` no utiliza las credenciales de la cuenta "Root" de AWS. En su lugar, se crea un usuario IAM específico (`healthcore-media-bot`) que tiene una política JSON adherida que SOLO le permite realizar acciones de inserción y borrado en nuestro bucket específico:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::healthcore-media-assets/*"
        }
    ]
}
```

## 6. Variables de Entorno Requeridas (`.env`)
Estas variables son inyectadas al contenedor del `media-service` por Docker.
**¡ATENCIÓN EQUIPO!: Las llaves de AWS (`AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`) son el equivalente a la tarjeta de crédito de la empresa. JAMÁS deben escribirse directamente en el código fuente ni subirse a GitHub.**

```properties
# Configuración del Bucket
AWS_S3_BUCKET_NAME=healthcore-media-assets
AWS_REGION=us-east-1

# Credenciales de Servicio (IAM User)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```