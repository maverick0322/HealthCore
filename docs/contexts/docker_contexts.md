# 🐳 HealthCore: Contenedores y Orquestación con Docker

## 1. Filosofía de Contenedores en HealthCore
En este proyecto, tratamos a nuestros microservicios como unidades inmutables. Docker nos permite empaquetar el código, la versión exacta del JDK (Java) o el intérprete de Python, y todas las librerías necesarias en una "imagen". Esto garantiza que el sistema funcione exactamente igual en tu computadora, en la de Eugenio o en el servidor Linux de producción.

## 2. Docker Compose: El Director de Orquesta
Dado que HealthCore no es un solo programa, sino un ecosistema de 6+ servicios, utilizamos **Docker Compose** para gestionarlos. El archivo `docker-compose.yml` en la raíz del proyecto es la definición única de la verdad.

### Funciones de Docker Compose:
* **Levantamiento Multi-servicio:** Con un solo comando (`docker-compose up`), se crean las redes, se montan los volúmenes y se inician todos los contenedores en el orden correcto.
* **Gestión de Dependencias:** Usamos la directiva `depends_on` para asegurar, por ejemplo, que el `identity-service` no intente arrancar antes de que la base de datos `mongodb` esté lista.

## 3. Redes en Docker (Networking)
HealthCore utiliza una red virtual de tipo **Bridge** creada automáticamente por Compose.

### Aislamiento de Red
* **Nombres de Host Internos:** Dentro de la red de Docker, los contenedores se comunican usando su nombre de servicio como dominio. 
    * Ejemplo: El `tracking-service` busca al catálogo en `http://catalog-service:50051`. No necesitamos saber IPs.
* **Exposición vs. Publicación:**
    * **Expose:** Los microservicios "exponen" puertos internamente (ej. 8080, 50051). Solo otros contenedores en la misma red pueden verlos.
    * **Ports:** Solo el `api-gateway` y `mongodb` (en desarrollo) "publican" puertos hacia afuera de Docker para que nosotros podamos acceder desde el navegador o Compass.



## 4. Persistencia con Volúmenes
Los contenedores son efímeros por naturaleza: si un contenedor se borra, sus datos internos desaparecen. Para evitar que perdamos la información de los pacientes cada vez que reiniciamos el sistema, usamos **Volúmenes Nombrados**.

* **`mongo_data`**: Este volumen mapea la carpeta `/data/db` interna de MongoDB a un lugar seguro en el disco duro del servidor Linux.
* **Persistencia de Logs**: (Opcional) Podemos mapear carpetas de logs de los servicios de Java para persistir el historial de errores fuera del contenedor.

## 5. El Proceso de Construcción (Dockerfile)
Cada microservicio de Java cuenta con un `Dockerfile` que sigue una estrategia de **Multi-stage Build**:
1. **Stage 1 (Build):** Usa una imagen de Maven para compilar el código y generar el archivo `.jar`.
2. **Stage 2 (Run):** Toma solo el archivo `.jar` resultante y lo coloca en una imagen ligera de JRE (Java Runtime Environment). Esto reduce el tamaño de la imagen final de ~500MB a ~150MB.

## 6. Guía de Comandos Rápidos
Para el trabajo diario en HealthCore, estos son los comandos esenciales:

* **Levantar todo el sistema:** `docker-compose up -d`
* **Recompilar un servicio específico tras un cambio de código:** `docker-compose up -d --build <nombre-del-servicio>`
* **Ver logs de un servicio en tiempo real:** `docker-compose logs -f <nombre-del-servicio>`
* **Detener y limpiar todo (incluyendo redes):** `docker-compose down`
* **Limpiar volúmenes (¡CUIDADO, BORRA LA BD!):** `docker-compose down -v`

---
**Nota para el equipo:** Nunca guarden secretos (como llaves de AWS) directamente en el `docker-compose.yml`. Usaremos un archivo `.env` que Docker cargará automáticamente para mantener la seguridad.