# ⚡ HealthCore: Caché Distribuido con Redis

## 1. El Problema del Rendimiento y las APIs Externas
En la arquitectura de HealthCore, nuestro `tracking-service` (Java) se comunica por gRPC con el `catalog-service` (Python), el cual a su vez consulta la API de **FatSecret** para obtener los macronutrientes de los alimentos.

Si no tuviéramos un caché, enfrentaríamos tres problemas críticos:
1. **Latencia:** Cada búsqueda tomaría entre 300ms y 1 segundo en viajar por internet.
2. **Rate Limiting:** FatSecret puede limitar cuotas si cientos de pacientes buscan alimentos al mismo tiempo.
3. **Disponibilidad:** Si la API externa se cae, nuestros pacientes no podrían registrar sus comidas.

## 2. La Solución: Redis in-memory data store
**Redis** es una base de datos ultrarrápida que guarda la información en la **Memoria RAM** en lugar de en un disco duro (como lo hace MongoDB). En HealthCore, lo utilizamos exclusivamente como un **Caché Distribuido**.

Mientras que MongoDB guarda la "Verdad Absoluta" (los expedientes clínicos), Redis guarda "Atajos Temporales" (respuestas de consultas frecuentes).

## 3. El Flujo de Caché (Patrón Cache-Aside)
Cuando un paciente escanea un código de barras (ej. `75010001` para unas galletas), el sistema sigue este flujo exacto:

1. **Lectura Rápida (Hit / Miss):** El `tracking-service` le pregunta a Redis: *"¿Tienes los datos del código 75010001?"*. (Tiempo de respuesta: ~1 milisegundo).
2. **Cache Hit (Éxito):** Si Redis lo tiene, devuelve la información inmediatamente al frontend. Fin del proceso.
3. **Cache Miss (Fallo):** Si Redis NO lo tiene, el `tracking-service` hace la llamada gRPC al `catalog-service` (Python).
4. **Almacenamiento (Write):** Una vez que Python devuelve la información, el `tracking-service` la **guarda en Redis** antes de enviarla al cliente. La próxima vez que alguien busque esas galletas, será un *Cache Hit*.

## 4. Estrategia de Evicción (TTL)
La memoria RAM es cara y limitada, por lo que Redis no puede crecer infinitamente. Implementamos una política de **TTL (Time To Live)**. 

Cuando guardamos un alimento en Redis, le decimos: *"Conserva este dato por 24 horas"*. Una vez cumplido ese tiempo, Redis borra el dato automáticamente. Esto asegura que:
* La memoria no se sature.
* Si la tabla nutricional del alimento cambia en la vida real, nuestro sistema se actualizará al día siguiente.

## 5. Implementación Práctica en Spring Boot
Para los desarrolladores (como Arturo) que toquen el código de Java, la implementación de Redis en Spring Boot es casi transparente gracias a las anotaciones.

No necesitamos escribir lógica compleja de "If/Else". Simplemente agregamos la dependencia de *Spring Data Redis* y anotamos el método que hace la llamada a Python:

```java
@Service
public class FoodCatalogService {

    // Al poner esta anotación, Spring Boot intercepta la llamada.
    // Si el 'barcode' ya existe en Redis, este método NI SIQUIERA se ejecuta.
    @Cacheable(value = "foodItemCache", key = "#barcode")
    public FoodResponse getFoodFromCatalog(String barcode) {
        // Lógica de llamada gRPC hacia el servicio de Python...
        return grpcClient.fetchFood(barcode);
    }
}

## 6. Diferencia Clave: Redis vs RabbitMQ
Dado que usamos ambos en la infraestructura, es vital no confundirlos:

Redis (Puerto 6379): Se usa para Lecturas Síncronas Ultrarrápidas. Es un almacén de datos (Ej. "Dime cuántas calorías tiene esto ¡YA!").

RabbitMQ (Puerto 5672): Se usa para Escrituras Asíncronas. Es una oficina de correos (Ej. "Manda un correo de bienvenida cuando puedas, no me importa cuánto tardes").

