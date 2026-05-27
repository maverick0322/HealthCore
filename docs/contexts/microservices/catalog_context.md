# 🍎 Microservicio: Catalog Service (Python)

## 1. Propósito y Responsabilidades
El `healthcore-catalog-service` actúa como el "Traductor" y "Buscador" oficial de la plataforma. Su única responsabilidad es recibir códigos de barras o búsquedas por texto libre de alimentos, ir a buscar la información al catálogo externo (FatSecret) y devolver los macronutrientes y micronutrientes limpios y estandarizados.

Implementa un patrón de diseño avanzado llamado **Anti-Corruption Layer (Capa de Anticorrupción)**. La API de FatSecret o de cualquier proveedor externo puede devolver JSONs gigantes, desordenados y con campos nulos. Este servicio filtra toda esa complejidad para que no contamine a nuestros microservicios internos de Java.

---

## 2. Stack Tecnológico Core
A diferencia del resto del sistema, este microservicio es ultraligero y puramente transaccional.
* **Lenguaje:** Python 3.13 (en Docker container ligero base `python:3.13-slim`).
* **Framework RPC:** `grpcio` y `grpcio-tools` para el servidor gRPC.
* **Persistencia:** **Ninguna.** Es un servicio *Stateless* (sin estado). No tiene base de datos propia.
* **Integración Externa:** Consume la API de FatSecret mediante OAuth 2.0 Client Credentials Grant, traduciendo las peticiones del backend de HealthCore.

---

## 3. Contratos de Comunicación (El Archivo `catalog.proto`)
Este servicio **NO expone una API REST en producción** (la REST API que contiene es únicamente para pruebas locales) y no es accesible desde el API Gateway. Su único canal de comunicación productivo es el puerto interno 50051 que escucha peticiones gRPC.

El contrato estricto que lo une con el ecosistema de Java está definido en `protos/catalog.proto`:

```protobuf
syntax = "proto3";

option java_multiple_files = true;
option java_package = "com.healthcore.catalog.grpc";
option java_outer_classname = "CatalogProto";

package catalog;

// Definición del Servicio
service NutritionalCatalog {
  // Obtiene un alimento por código de barras
  rpc GetFoodItem (FoodRequest) returns (FoodResponse) {}
  
  // Búsqueda libre por texto de alimentos
  rpc SearchFood (SearchRequest) returns (SearchResponse) {}
}

// Mensaje de Entrada para código de barras
message FoodRequest {
  string barcode = 1; 
}

// Estructura de Alimento Estandarizada
message FoodResponse {
  string barcode = 1;
  string name = 2;
  string brand = 3;
  string image_url = 4;
  float calories_per_100g = 5;
  float proteins_per_100g = 6;
  float carbs_per_100g = 7;
  float fats_per_100g = 8;
  string source = 9;
  float fiber_grams_per_100g = 10;
  float sodium_mg_per_100g = 11;
  float sugar_grams_per_100g = 12;
  float potassium_mg_per_100g = 13;
} 

// Mensaje de Entrada para búsqueda de texto
message SearchRequest {
  string query = 1;
  int32 limit = 2;
}

// Lista de resultados
message SearchResponse {
  repeated FoodResponse items = 1; 
}
```

---

## 4. El Flujo de Ejecución (Ciclo de Vida de una Petición)
1. **Recepción:** El servidor gRPC en Python recibe un `FoodRequest` (código de barras) o un `SearchRequest` (búsqueda de texto) del `tracking-service` o de `clinical-service`.
2. **Consulta Externa:** Python autentica sus credenciales de FatSecret, realiza la llamada a su API REST y mapea la respuesta.
3. **Capa de Anticorrupción:** Si un alimento no tiene registrada la cantidad de un macro o micro en FatSecret, Python le asigna por defecto el valor `0.0` para evitar que Java sufra excepciones de desempaquetado o nulos al realizar sus cálculos matemáticos.
4. **Respuesta:** Retorna la información serializada en el binario de Protobuf a máxima velocidad.

---

## 5. Resiliencia y Tolerancia a Fallos
* **Timeouts:** Las peticiones a la API externa de FatSecret tienen un límite de tiempo estricto. Si excede el tiempo límite, Python corta la conexión y lanza una excepción gRPC de tipo `DEADLINE_EXCEEDED` a Java.
* **Caché en Java:** Aunque este servicio no tiene estado, el `tracking-service` implementa un caché Redis (Cache-Aside) sobre los métodos que llaman a gRPC, evitando repetir consultas idénticas.

---

## 6. Variables de Entorno Requeridas (`.env`)
```properties
# Puerto de gRPC Server
GRPC_PORT=50051

# Base de datos local (Opcional, en caso de cache local directo en Mongo)
MONGO_URI=mongodb://mongodb:27017/
MONGO_DB_NAME=healthcore_catalog

# Credenciales de Plataforma FatSecret (OAuth 2.0)
FATSECRET_CLIENT_ID=tu_client_id_aqui
FATSECRET_CLIENT_SECRET=tu_client_secret_aqui
```