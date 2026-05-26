# 🗺️ HealthCore: Estrategia de Despliegue e Infraestructura

## 1. Visión General del Sistema
HealthCore opera bajo una arquitectura distribuida de microservicios. Para garantizar la portabilidad, el aislamiento y la consistencia entre los entornos de desarrollo y producción, todo el ecosistema de backend está contenerizado utilizando Docker. 

La infraestructura se despliega sobre un servidor host Linux, actuando como el cerebro central que orquesta la comunicación entre los servicios internos, las bases de datos lógicas y los proveedores de nube externos.

## 2. Topología de Red y Nodos Físicos
El sistema se divide lógicamente en tres grandes fronteras:

* **El Borde (Edge / Clientes):** Aplicaciones cliente heterogéneas que consumen el sistema a través de internet (HTTPS). Esto incluye la Progressive Web App (PWA) construida en React y la aplicación de escritorio empaquetada con Electron.
* **La Zona Desmilitarizada (DMZ / Gateway):** El único punto de entrada público a nuestra red de contenedores. Expuesto en el puerto 80/443.
* **La Red Privada Virtual (Docker Network):** Un entorno aislado donde los microservicios se comunican entre sí y con sus bases de datos sin exposición directa a internet.

## 3. Entornos de Ejecución (Contenedores)
El servidor host ejecuta múltiples contenedores aislados, cada uno con una responsabilidad única (Single Responsibility Principle):

### Microservicios Core
* `healthcore-identity-service`: (Spring Boot / Java 21). Gestiona la autenticación, autorización y emisión de tokens JWT.
* `healthcore-tracking-service`: (Spring Boot / Java 21). Coordina el registro diario de alimentos y progreso biométrico.
* `healthcore-agenda-service`: (Spring Boot / Java 21). Controla la disponibilidad de los nutriólogos y previene colisiones en citas mediante bloqueo optimista.
* `healthcore-clinical-service`: (Spring Boot / Java 21). Custodia el expediente clínico, observaciones y vinculaciones profesionales (`ProfessionalLink`).
* `healthcore-media-service`: (Spring Boot / Java 21). Servicio utilitario para el procesamiento y carga de recursos multimedia.
* `healthcore-catalog-service`: (Python). Adaptador y caché proxy para la comunicación con APIs nutricionales externas.

### Infraestructura de Soporte
* `healthcore-api-gateway`: (NGINX). Enrutador inverso y manejador de políticas CORS.
* `healthcore-mongodb`: Motor de base de datos NoSQL central.
* `healthcore-redis`: Almacén en memoria para mitigación de latencia.
* `healthcore-rabbitmq`: Broker de mensajería para coreografía de eventos asíncronos.

## 4. Estrategia de Persistencia y Aislamiento de Datos
Para respetar el patrón *Database per Service*, se utiliza una estrategia de **Aislamiento Físico** de base de datos en entornos de ejecución. 

En lugar de compartir un único contenedor, se despliegan **tres instancias físicas independientes de MongoDB** ejecutándose en contenedores y volúmenes separados:
* `mongodb` (puerto de host 27018) para las bases de datos lógicas `healthcore_identity` y `healthcore_tracking`.
* `agenda-mongodb` (puerto de host 27019) para la base de datos `healthcore_agenda`.
* `clinical-mongodb` (puerto de host 27020) para la base de datos `healthcore_clinical`.

Si un servicio requiere información custodiada por otro, debe solicitarla a través de la red (vía gRPC) y nunca mediante consultas directas a la base de datos ajena (evitando el antipatrón de Base de Datos Compartida).

## 5. Servicios y Nubes Externas
El ecosistema HealthCore delega responsabilidades no centrales a servicios de terceros de alta disponibilidad:
* **Cloudflare R2 (Object Storage):** Almacenamiento de objetos compatible con S3. El frontend sube los archivos directamente a través de URLs de subida PUT pre-firmadas generadas por `media-service`. La descarga se realiza mediante URLs GET pre-firmadas generadas bajo demanda por gRPC.
* **FatSecret API:** El `catalog-service` consulta esta base de datos nutricional de terceros mediante OAuth 2.0 para resolver alimentos y sus macronutrientes correspondientes.