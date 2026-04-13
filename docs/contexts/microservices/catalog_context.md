# 🍎 Microservicio: Catalog Service (Python)

## 1. Propósito y Responsabilidades
El `healthcore-catalog-service` actúa como el "Traductor" y "Buscador" oficial de la plataforma. Su única responsabilidad es recibir códigos de barras, ir a buscar la información al mundo exterior (Internet) y devolver los macronutrientes limpios y estandarizados.

Implementa un patrón de diseño avanzado llamado **Anti-Corruption Layer (Capa de Anticorrupción)**. La API de Open Food Facts devuelve JSONs gigantes, desordenados y a veces con campos nulos. Este servicio filtra toda esa "basura" externa para que la suciedad no contamine a nuestros microservicios internos de Java.

## 2. Stack Tecnológico Core
A diferencia del resto del sistema, este microservicio es ultraligero y puramente transaccional.
* **Lenguaje:** Python 3.11+
* **Framework RPC:** `grpcio` y `grpcio-tools`
* **Cliente HTTP:** `requests` o `httpx` (para consumir la API pública)
* **Persistencia:** **Ninguna.** Es un servicio *Stateless* (sin estado). No tiene base de datos propia.
* **Caché:** No maneja caché internamente (esa responsabilidad se la delegamos al `tracking-service` con Redis).

## 3. Contratos de Comunicación (El Archivo `.proto`)
Este servicio **NO expone una API REST** y no es accesible desde el API Gateway. Su único canal de comunicación es un puerto interno (50051) que escucha peticiones gRPC.

El contrato estricto que lo une con el mundo de Java está definido en un archivo `catalog.proto`:

```protobuf
syntax = "proto3";

package healthcore.catalog;

// Definición del Servicio
service FoodCatalog {
  // El método que Java invocará
  rpc GetFoodItem (FoodRequest) returns (FoodResponse);
}

// Lo que entra (El código de barras escaneado)
message FoodRequest {
  string barcode = 1;
}

// Lo que sale (Los datos limpios y estandarizados)
message FoodResponse {
  string barcode = 1;
  string name = 2;
  string brand = 3;
  double calories_per_100g = 4;
  double protein_g = 5;
  double carbs_g = 6;
  double fat_g = 7;
  bool is_found = 8; // Bandera para saber si el producto existe
}

## 4. El Flujo de Ejecución (Ciclo de Vida de una Petición)
1. **Recepción:** El servidor gRPC en Python recibe un `FoodRequest` del `tracking-service`.
2. **Petición Externa:** Python hace un `GET` a la URL: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
3. **Mapeo (Anti-Corrupción):** * Si la API externa devuelve un `404 Not Found`, Python arma un `FoodResponse` con `is_found = false` y se lo regresa a Java.
   * Si devuelve un `200 OK`, Python extrae únicamente los campos `product_name`, `brands` y el nodo `nutriments` (calorías, proteínas, etc.).
4. **Respuesta:** Empaqueta esos datos matemáticos en el binario de Protobuf y se los devuelve al `tracking-service` a máxima velocidad.

## 5. Resiliencia y Manejo de Errores
Dado que este microservicio depende de una red externa que no controlamos (Open Food Facts), está programado con tolerancia a fallos:
* **Timeouts:** Las peticiones a la API externa tienen un límite de tiempo estricto (ej. 2 segundos). Si Open Food Facts tarda más de eso, Python corta la conexión y devuelve un error gRPC de tipo `DEADLINE_EXCEEDED` a Java.
* **Datos Incompletos:** Si un alimento en Open Food Facts no tiene registrada la cantidad de proteínas, Python le asigna por defecto el valor `0.0` para evitar que Java sufra un `NullPointerException` al intentar hacer cálculos matemáticos.

## 6. Variables de Entorno Requeridas (`.env`)
Para levantar este contenedor en Docker, la configuración es mínima:
```properties
# Puerto donde levantará el servidor gRPC
GRPC_SERVER_PORT=50051

# URL base de la API externa (configurable por si cambia en el futuro)
EXTERNAL_API_BASE_URL=[https://world.openfoodfacts.org/api/v2/product/](https://world.openfoodfacts.org/api/v2/product/)
```