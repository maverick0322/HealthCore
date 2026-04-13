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
Para respetar el patrón *Database per Service* sin agotar los recursos de hardware, se utiliza una estrategia de **Aislamiento Lógico**. 

Existe un único contenedor físico de MongoDB, pero los microservicios no comparten información. Cada servicio de Spring Boot se conecta a un esquema/base de datos lógica independiente a través de su propia cadena de conexión (Connection String):
* `mongodb://mongodb:27017/healthcore_identity`
* `mongodb://mongodb:27017/healthcore_tracking`
* `...`

Si un servicio requiere información custodiada por otro, debe solicitarla a través de la red (vía gRPC) y nunca mediante consultas directas a la base de datos ajena (evitando el antipatrón de Base de Datos Compartida).

## 5. Servicios y Nubes Externas
El ecosistema HealthCore delega responsabilidades no centrales a servicios de terceros de alta disponibilidad:
* **AWS S3 (Amazon Web Services):** El `media-service` transfiere toda la carga de almacenamiento estático (fotografías de progreso, avatares) hacia buckets de S3 vía HTTPS. El sistema interno solo almacena las URLs resultantes.
* **Open Food Facts API:** El `catalog-service` consulta esta base de datos global de código abierto para resolver códigos de barras de alimentos comerciales, alimentando el seguimiento nutricional de los pacientes.