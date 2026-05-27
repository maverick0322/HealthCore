= Estándar de Código y Estilo para Microservicios con Python 3.11+, gRPC y APIs REST

Este documento define las reglas arquitectónicas, convenciones de codificación y estándares de calidad obligatorios para el desarrollo de microservicios en Python dentro del proyecto HealthCore (específicamente el `catalog-service`). El objetivo es garantizar un ecosistema de código limpio, modular, escalable y preparado para CI/CD.

'''

== 1. Principios Generales (Clean Code)

* *Consistencia*: El código debe verse como si hubiera sido escrito por una sola persona.
* *Legibilidad*: El código se escribe para ser leído por humanos, no solo para que la máquina lo ejecute.
* *Mantenibilidad*: Favorecer la claridad y la simplicidad sobre la complejidad innecesaria.
* *Testabilidad*: Diseñar pensando en pruebas unitarias (`pytest`) y de integración.
* *Seguridad por defecto*: Incorporar prácticas seguras desde el diseño.
* *Calidad automatizada*: El uso de linters (`flake8`), formateadores (`black`) y analizadores de tipos (`mypy`) son parte integral del proceso.
* *English First*: Absolutamente todo el código fuente (clases, variables, funciones), esquemas, URIs y comentarios internos deben escribirse en inglés.
* *SOLID y Responsabilidad Única*: Cada clase o módulo debe tener una única razón para cambiar. Favorecer la composición sobre la herencia.
* *Inyección de Dependencias*: Obligatoria por constructor (`__init__`). Queda estrictamente prohibido el uso de variables globales para instanciar servicios.
* *Fail-Fast y Type Hinting*: Validar entradas lo antes posible. *Es obligatorio el uso de Type Hints (PEP 484)* en todas las firmas de funciones y métodos.

'''

== 2. Propósito
Garantizar la consistencia, legibilidad, seguridad y mantenibilidad del código fuente entre todos los miembros del equipo, facilitando la integración continua y el cumplimiento del análisis estático (SonarQube / MyPy).

== 3. Idioma
Todo el código fuente, bases de datos y documentación interna debe aplicar el principio *English First*.

* *Correcto*: `FoodCatalogService`, `find_by_barcode`, `# Checks if item exists`
* *Incorrecto*: `ServicioCatalogo`, `buscar_por_codigo`, `# Revisa si existe`

== 4. Estructura del proyecto (Arquitectura Hexagonal)
Para garantizar la separación de responsabilidades y la inversión de dependencias, el código debe organizarse estrictamente en los siguientes paquetes (módulos), respetando la regla de dependencia hacia adentro:

* *`domain/`*: Entidades puras (`dataclasses` o modelos de `Pydantic`), enumeradores (`Enum`) y excepciones de negocio. *Regla de oro:* Cero dependencias de frameworks externos o librerías de infraestructura.
* *`application/`*: Casos de uso (Services) que orquestan el dominio. Aquí se definen las interfaces (Abstract Base Classes - ABC) que indican qué necesita el sistema.
* *`infrastructure/`*: Implementaciones técnicas (adaptadores). Clientes HTTP externos (ej. llamadas a FatSecret con `httpx` o `requests`), conexión a bases de datos y configuraciones.
* *`interfaces/`*: Puntos de entrada hacia el microservicio (Servidores gRPC, Controladores REST, DTOs).

== 5. Reglas de nombramiento (Basado en PEP 8)

=== 5.1. Clases
Deben usar `PascalCase` (UpperCamelCase) y ser sustantivos descriptivos.

* *Correcto*:
+
[source,python]
----
class FoodCatalogService:
    pass
----

* *Incorrecto*:
+
[source,python]
----
class food_catalog_service:  # snake_case
    pass
----

=== 5.2. Interfaces (Abstract Base Classes)
En Python se utilizan las clases base abstractas (`ABC`). Deben usar `PascalCase`. No se usa el prefijo "I".

* *Correcto*:
+
[source,python]
----
class FoodCatalogPort(ABC):
    pass
----

* *Incorrecto*:
+
[source,python]
----
class IFoodCatalogPort(ABC):
    pass
----

=== 5.3. Paquetes y Módulos (Archivos)
Deben ir en minúsculas y usar guiones bajos (`snake_case`).

* *Correcto*: `catalog_service.py`, `models/`, `grpc_server.py`
* *Incorrecto*: `CatalogService.py`, `grpc-server.py`

=== 5.4. Variables y Funciones
Deben usar `snake_case` y tener nombres expresivos. Evitar abreviaturas ambiguas.

* *Correcto*:
+
[source,python]
----
login_attempts: int = 0
user_email: str = request.email
----

* *Incorrecto*:
+
[source,python]
----
loginAttempts: int = 0  # camelCase no es nativo de Python
eml: str = request.email
----

=== 5.5. Constantes
Deben usar `UPPER_SNAKE_CASE`. Prohibido usar "números mágicos" sueltos en el código.

* *Correcto*:
+
[source,python]
----
MAX_LOGIN_RETRIES: int = 3
EXTERNAL_API_URL: str = "https://world.openfoodfacts.org"
----

* *Incorrecto*:
+
[source,python]
----
max_retries = 3
----

=== 5.6. Métodos
Deben usar `snake_case` y comenzar con un verbo claro que denote la acción. Siempre deben incluir _Type Hints_.

* *Correcto*:
+
[source,python]
----
def calculate_macros(self, weight: float, height: float) -> dict:
    pass
----

* *Incorrecto*:
+
[source,python]
----
def Macros(self, weight, height):
    pass
----

=== 5.7. Getters y Setters
Python no usa getters y setters tradicionales como Java. Se debe acceder a los atributos directamente. Si se requiere lógica adicional, se debe usar el decorador `@property`.

* *Correcto*:
+
[source,python]
----
@property
def email(self) -> str:
    return self._email
----

* *Incorrecto*:
+
[source,python]
----
def get_email(self) -> str:
    return self._email
----

=== 5.8. Manejadores de eventos
Los métodos que responden a eventos o handlers gRPC deben llevar el prefijo `handle_` o `on_`.

* *Correcto*:
+
[source,python]
----
def handle_food_request(self, request, context):
    pass
----

=== 5.9. Uso de List Comprehensions y Lambdas
Favorecer las _List Comprehensions_ sobre `map()` y `filter()` anidados o lambdas complejas. Si la lógica es compleja, extraer a una función.

* *Correcto*:
+
[source,python]
----
active_users = [user for user in users if user.is_active]
----

* *Incorrecto*:
+
[source,python]
----
active_users = list(filter(lambda u: u.status == "ACTIVE", users))
----

== 6. Estilo de código

=== 6.1. Indentación
La indentación estricta será de *4 espacios* (no tabulaciones). Esto es crítico en Python ya que define la estructura del programa.

=== 6.2. Líneas y espacios en blanco
Dejar *dos líneas en blanco* antes de definiciones de clases y funciones de nivel superior. *Una línea en blanco* para métodos dentro de una clase. Espacios alrededor de operadores.

* *Correcto*:
+
[source,python]
----
total_calories = carbs * 4 + fat * 9
----

* *Incorrecto*:
+
[source,python]
----
total_calories=carbs*4+fat*9
----

== 7. Comentarios
El código limpio debe explicarse a sí mismo.

=== 7.1. Comentarios de línea única
Usar `#` exclusivamente para explicar el _por qué_ de una decisión técnica, nunca el _qué_.

* *Correcto*:
+
[source,python]
----
# Timeout is 10s because the FatSecret API can be slow during peak hours
----

* *Incorrecto*:
+
[source,python]
----
# Loops through the list of nutrients
----

=== 7.2. Docstrings (Comentarios de documentación)
Usar Docstrings `""" """` (PEP 257) únicamente debajo de la definición de módulos, clases o funciones públicas para documentar su comportamiento, parámetros y retornos.

* *Correcto*:
+
[source,python]
----
def fetch_food(barcode: str) -> FoodResponse:
    """
    Fetches nutritional information from external API.
    
    Args:
        barcode (str): The product's EAN/UPC code.
    Returns:
        FoodResponse: DTO containing parsed macronutrients.
    """
----

== 8. Estructuras de control

=== 8.1. If-Else
* *Correcto*:
+
[source,python]
----
if condition:
    do_something()
else:
    do_other()
----

=== 8.2. Else-If (`elif`)
* *Correcto*:
+
[source,python]
----
if score >= 90:
    grade = 'A'
elif score >= 80:
    grade = 'B'
----

=== 8.3. Switch (Structural Pattern Matching)
Favorecer el uso de `match / case` introducido en Python 3.10.

* *Correcto*:
+
[source,python]
----
match day:
    case "MONDAY" | "FRIDAY" | "SUNDAY":
        return 6
    case "TUESDAY":
        return 7
    case _:
        return 0
----

== 9. Sufijos

=== 9.1. Archivos y Clases de Arquitectura
* *Controladores/Servicios gRPC*: `x_controller.py` o `x_servicer.py` (ej. `catalog_servicer.py`).
* *Modelos de Entrada/Salida (Pydantic)*: `XRequest`, `XResponse` (ej. `FoodRequest`).
* *Excepciones*: `XError` o `XException` (ej. `FoodNotFoundError`).

== 10. Manejo de excepciones
El manejo debe ser escalonado, de la excepción más específica a la más general. Prohibido usar un `except:` desnudo.

* *Correcto*:
+
[source,python]
----
try:
    parse_data()
except httpx.TimeoutException:
    raise ExternalServiceError("API is down")
except Exception as e:
    raise InternalServerError(f"System error: {str(e)}")
----

* *Incorrecto*:
+
[source,python]
----
try:
    parse_data()
except Exception as e:
    print(e)  # Nunca usar print en producción
----

== 11. Bitácora
Usar el módulo nativo `logging`. Los niveles se definen así:

=== 11.1. Critical (`logging.critical()`)
Para caídas totales del servicio (ej. no se pudo levantar el servidor gRPC).

=== 11.2. Error (`logging.error()`)
Para fallos no esperados donde se rompe el flujo. Opcionalmente usar `logging.exception()` para imprimir el _stacktrace_.
* *Ejemplo*: `logger.exception("Failed to connect to FatSecret")`

=== 11.3. Warning (`logging.warning()`)
Situaciones anómalas que no detienen el sistema, como un código de barras no encontrado.

=== 11.4. Info / Debug (`logging.info()`, `logging.debug()`)
Para flujo normal del sistema y detalles para depuración.

== 12. Pruebas
Obligatorio aplicar `pytest`, `unittest.mock` y el patrón AAA (Arrange, Act, Assert).

* *Correcto*:
+
[source,python]
----
def test_should_return_food_when_barcode_exists(mocker):
    # Arrange
    mocker.patch('infrastructure.api.fetch', return_value=mock_food)
    service = CatalogService()
    
    # Act
    result = service.get_food("123456")
    
    # Assert
    assert result is not None
    assert result.calories == 100
----

== 13. Seguridad

=== 13.1. Validación de entradas
Usar `Pydantic` en los modelos de entrada para validar tipos y restricciones antes de que toquen la lógica de negocio.

=== 13.2. Prohibición de funciones peligrosas
Estrictamente prohibido el uso de `eval()`, `exec()`, o inyecciones crudas en comandos del sistema (`os.system`).

=== 13.3. Códigos de mensajes gRPC / HTTP
Mapear correctamente las excepciones de dominio a códigos de estado gRPC (ej. `grpc.StatusCode.NOT_FOUND`, `grpc.StatusCode.UNAVAILABLE`) o HTTP (`404`, `500`).

== 14. Declaración de uso de IA
Se declara que para la configuración, revisión de estándares de la industria (PEP 8) y estructuración de este documento se utilizó asistencia de Inteligencia Artificial como herramienta de co-pilotaje y optimización de arquitectura.

== 15. Referencias
* https://peps.python.org/pep-0008/[PEP 8 – Style Guide for Python Code]
* https://peps.python.org/pep-0484/[PEP 484 – Type Hints]
* https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/[OWASP Secure Coding Practices]
