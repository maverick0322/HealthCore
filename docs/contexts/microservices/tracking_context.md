# 📊 Microservicio: Tracking Service

## 1. Propósito y Responsabilidades
El `healthcore-tracking-service` es el motor de seguimiento diario y consolidación nutricional del paciente. Su responsabilidad principal es permitir el registro diario de consumos de alimentos y agua, calcular las métricas calóricas y de macronutrientes correspondientes, y servir resúmenes operativos y reportes históricos tanto para el paciente como para el nutriólogo vinculado.

---

## 2. Stack Tecnológico Core
* **Lenguaje/Framework:** Java 21 + Spring Boot 3.x
* **Persistencia:** Spring Data MongoDB (Base de datos lógica `healthcore_tracking` hospedada físicamente en el contenedor `healthcore-mongodb`).
* **Caché:** Spring Data Redis (para almacenamiento en memoria RAM de los alimentos buscados y cacheados bajo el patrón Cache-Aside).
* **Seguridad:** JWT validado a nivel del API Gateway; obtención del usuario autenticado vía `@AuthenticationPrincipal String userId`.
* **Comunicaciones Internas (gRPC Clients):**
  * Cliente hacia `catalog-service` para la traducción de códigos de barras y búsquedas.
  * Cliente hacia `media-service` para enriquecer referencias de fotos con URLs de lectura pre-firmadas.
  * Cliente hacia `clinical-service` para validaciones de vinculación paciente-nutriólogo.

---

## 3. Modelo de Dominio (Entidades y Agregados)
El dominio del microservicio se divide en dos agregados independientes y modelos de consulta:

* **`MealLog` (Aggregate Root):** Representa una comida completa registrada por el usuario.
  * *Atributos:* `id`, `userId`, `mealType` (BREAKFAST, LUNCH, DINNER, SNACK), `consumedAt`, `photoKey` (clave del archivo en R2), `items` (Lista inmutable de MealItem), `totalCalories`, `totalProteins`, `totalCarbs`, `totalFats`.
  * *Comportamiento:* Calcula automáticamente los totales de macronutrientes del log en su constructor de dominio a partir de los ítems hijos.

* **`MealItem` (Child Entity):** Elemento individual que compone una comida.
  * *Atributos:* `barcode` (opcional), `foodName`, `consumedGrams`, y macros/micros prorrateados (`calories`, `proteins`, `carbohydrates`, `fats`, `fiberGrams`, `sodiumMg`, `sugarGrams`, `potassiumMg`).
  * *Comportamiento:* Recibe los nutrientes base (por 100g) y calcula mediante regla de tres los valores exactos consumidos según los gramos introducidos.

* **`WaterLog` (Aggregate Root):** Consumo individual de agua.
  * *Atributos:* `id`, `userId`, `amountMl` (rango validado de 1 a 5000 ml), `consumedAt`.

* **`DailyMacroSummary`:** DTO de lectura acumulado que representa el total diario de un paciente en una fecha específica para renderizar gráficas e históricos.

---

## 4. Estrategia de Caché de Catálogo (Redis)
Para mitigar la latencia de llamadas externas de API nutricional, implementamos el patrón **Cache-Aside** con Redis en el cliente gRPC de catálogo:
1. **Lectura:** Al buscar un alimento por código de barras o texto, se verifica primero en el caché de Redis.
2. **Cache Hit:** Si existe, se devuelve la respuesta en menos de 2ms.
3. **Cache Miss:** Si no existe, se ejecuta la llamada gRPC al `catalog-service` (quien consulta al API externa), y se almacena el resultado en Redis antes de retornar.
4. **TTL:** El TTL está configurado en **24 horas** (`REDIS_TTL_MS:86400000`) para garantizar la frescura de los datos.

---

## 5. API REST Expuesta
La ruta pública expuesta a través del API Gateway es `/api/v1/tracking/**`.

### 5.1. Búsqueda en Catálogo
| Método | Endpoint | Rol | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/catalog/{barcode}` | Paciente | Obtiene detalles de macronutrientes por código de barras. |
| `GET` | `/catalog/search?query=...` | Paciente | Búsqueda libre por texto (mínimo 3 caracteres). |

### 5.2. Registros Diarios de Comida y Agua
| Método | Endpoint | Rol | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/logs/meal` | Paciente | Registra una comida con su lista de alimentos y `photoKey` opcional. |
| `GET` | `/logs/today` | Paciente | Obtiene la lista de comidas registradas para el día de hoy. |
| `GET` | `/logs/daily?date=YYYY-MM-DD` | Paciente | Obtiene los consumos de comidas para una fecha específica. |
| `POST` | `/logs/water` | Paciente | Registra un consumo de agua en mililitros. |

### 5.3. Dashboard y Resúmenes
| Método | Endpoint | Rol | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/today?date=YYYY-MM-DD` | Paciente | Obtiene resumen calórico diario (consumido vs meta clínica gRPC). |
| `GET` | `/dashboard/history?startDate=...&endDate=...` | Paciente | Obtiene lista de históricos de macros diarios en un rango. |

### 5.4. Nutriólogo (Acceso a Expediente de Pacientes Vinculados)
| Método | Endpoint | Rol | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/nutritionist/patients/{patientId}/logs/daily?date=...` | Nutriólogo | Registros de comida del paciente (requiere vínculo activo). |
| `GET` | `/nutritionist/patients/{patientId}/dashboard/today?date=...` | Nutriólogo | Resumen del día actual del paciente vinculado. |
| `GET` | `/nutritionist/patients/{patientId}/dashboard/history?startDate=...&endDate=...` | Nutriólogo | Histórico de macros del paciente vinculado. |

---

## 6. Integración y Comunicaciones gRPC (Cliente)
`tracking-service` consume los siguientes canales gRPC:
1. **`catalog-service` (Puerto 50051):** Llama a `NutritionalCatalog` para resolver alimentos escaneados y realizar búsquedas de texto.
2. **`media-service` (Puerto 9091):** Cuando obtiene un `MealLog` con un `photoKey` no nulo, realiza una llamada a `MediaServiceGrpc` para inyectar dinámicamente la URL pre-firmada de lectura (GET) de Cloudflare R2 antes de responder al frontend.
3. **`clinical-service` (Puerto 50051):** Invocado dinámicamente para validar el vínculo activo entre paciente y nutriólogo en los endpoints de lectura del nutriólogo.

---

## 7. Variables de Entorno Requeridas (`.env`)
```properties
# MongoDB (Conectado al contenedor mongodb en puerto 27018 expuesto)
SPRING_DATA_MONGODB_URI=mongodb://mongodb:27017/healthcore_tracking

# Redis Cache Config
SPRING_DATA_REDIS_HOST=redis
SPRING_DATA_REDIS_PORT=6379
REDIS_TTL_MS=86400000

# Targets gRPC
GRPC_CATALOG_TARGET=catalog-service:50051
GRPC_CLIENT_MEDIA-SERVICE_ADDRESS=static://media-service:9091
GRPC_CLIENT_CLINICAL_ADDRESS=static://clinical-service:50051

# Clave Semilla JWT
JWT_SECRET=super_secret_key_base64_encoded
```