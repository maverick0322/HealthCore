# Estándar de Código y Estilo para Microservicios con Python, FastAPI y gRPC

Este documento define las reglas y buenas prácticas para el desarrollo de microservicios con Python, FastAPI (para APIs REST) y gRPC (para comunicación interna), siguiendo los mismos principios de calidad, consistencia y profesionalismo establecidos para Java/Spring Boot.

---

## 1. Introducción

### 1.1 Propósito
Establecer un conjunto de normas obligatorias para todos los desarrolladores del equipo que trabajen con Python, facilitando la colaboración, revisión de código y el mantenimiento del software en microservicios basados en FastAPI y gRPC.

### 1.2 Alcance
Aplica a todo el código fuente, pruebas, configuración y documentación técnica de los microservicios desarrollados con:
- **Python 3.11+** (versión LTS recomendada)
- **FastAPI** para APIs REST
- **gRPC** con Protocol Buffers para comunicación entre servicios
- **Pydantic** para validación y serialización
- **SQLAlchemy** o **MongoDB** como persistencia
- **Poetry** o **pip** con entornos virtuales para gestión de dependencias
- **pytest** para pruebas
- **SonarQube** para análisis estático de código

### 1.3 Referencias
Este estándar se basa en:
- [PEP 8 – Style Guide for Python Code](https://peps.python.org/pep-0008/)
- [PEP 257 – Docstring Conventions](https://peps.python.org/pep-0257/)
- [FastAPI Official Documentation](https://fastapi.tiangolo.com/)
- [gRPC Python Documentation](https://grpc.io/docs/languages/python/)
- [Protocol Buffers Style Guide](https://protobuf.dev/programming-guides/style/)
- [The Twelve-Factor App](https://12factor.net/)
- [SonarQube Python Rules](https://rules.sonarsource.com/python/)

---

## 2. Principios Generales

- **Type Hints en todo lugar**: Python es tipado dinámicamente, pero usaremos type hints obligatoriamente para facilitar el mantenimiento y la detección temprana de errores .
- **Inmutabilidad preferente**: Usar `frozen=True` en Pydantic models cuando sea posible.
- **Explícito sobre implícito**: Favorecer código claro y legible.
- **DRY (Don't Repeat Yourself)**: Extraer lógica común a funciones o clases reutilizables.
- **Seguridad por defecto**: Validar toda entrada, sanitizar salidas.
- **Rendimiento consciente**: Usar `async/await` para operaciones I/O-bound .

---

## 3. Estructura del Proyecto

### 3.1 Organización de Paquetes (Estructura Modular)

```
servicio-usuarios/
├── pyproject.toml              # Dependencias con Poetry o pip
├── .pre-commit-config.yaml     # Hooks de calidad
├── Dockerfile                   # Containerización
├── README.md
├── src/
│   └── usuarios/                # Paquete principal (nombre del servicio)
│       ├── __init__.py
│       ├── main.py              # Punto de entrada FastAPI
│       ├── grpc_server.py       # Punto de entrada gRPC (si aplica)
│       ├── api/                  # Capa HTTP (REST)
│       │   ├── __init__.py
│       │   ├── dependencies.py   # Dependencias compartidas
│       │   ├── v1/                # Versionado de API
│       │   │   ├── __init__.py
│       │   │   ├── endpoints/
│       │   │   │   ├── __init__.py
│       │   │   │   ├── users.py
│       │   │   │   └── health.py
│       │   │   └── models/        # DTOs para API (Pydantic)
│       │   │       ├── __init__.py
│       │   │       └── user.py
│       ├── grpc/                  # Capa gRPC
│       │   ├── __init__.py
│       │   ├── proto/              # Archivos .proto
│       │   │   ├── user_service.proto
│       │   │   └── health.proto
│       │   ├── generated/          # Código generado (no versionado)
│       │   ├── services/           # Implementación de servicios gRPC
│       │   │   ├── __init__.py
│       │   │   └── user_service.py
│       │   └── interceptors/       # Interceptores gRPC 
│       │       └── logging.py
│       ├── core/                    # Lógica de negocio compartida
│       │   ├── __init__.py
│       │   ├── config.py             # Configuración (Pydantic Settings)
│       │   ├── exceptions.py         # Excepciones personalizadas
│       │   └── security.py           # Autenticación, CORS, etc.
│       ├── models/                   # Modelos de base de datos (ORM)
│       │   ├── __init__.py
│       │   └── user.py
│       ├── repositories/             # Capa de acceso a datos
│       │   ├── __init__.py
│       │   └── user_repository.py
│       ├── services/                  # Lógica de negocio (inyección de dependencias)
│       │   ├── __init__.py
│       │   └── user_service.py
│       └── utils/                     # Utilidades
│           ├── __init__.py
│           ├── logging.py              # Configuración de logs
│           └── grpc_converters.py      # Conversión Pydantic <-> Protobuf 
├── tests/
│   ├── __init__.py
│   ├── conftest.py                     # Fixtures de pytest
│   ├── unit/
│   │   ├── test_user_service.py
│   │   └── test_converters.py
│   ├── integration/
│   │   ├── test_api_users.py
│   │   └── test_grpc_user_service.py
│   └── fixtures/                        # Datos de prueba
└── scripts/                              # Scripts útiles (generar proto, etc.)
```

**Justificación**: Esta estructura separa claramente las responsabilidades (API, gRPC, negocio, datos) y facilita la navegación. Es escalable y sigue las recomendaciones de proyectos Python profesionales.

### 3.2 Archivos de Configuración

- **`pyproject.toml`**: Centralizar configuración de herramientas (black, isort, pytest, mypy).
- **`Dockerfile`**: Multi-stage para reducir tamaño de imagen.
- **`.env.example`**: Variables de entorno de ejemplo.

---

## 4. Estilo de Código Python

### 4.1 Formato Básico (PEP 8)
- **Indentación**: 4 espacios (no tabs).
- **Longitud de línea**: máximo 88 caracteres (recomendación Black) o 100 (PEP 8).
- **Líneas en blanco**: 2 líneas entre funciones de nivel superior, 1 entre métodos de clase.
- **Imports**: orden estándar: 1) módulos de la biblioteca estándar, 2) terceros, 3) locales. Usar `isort` para automatizar.

**Ejemplo Correcto**:
```python
import json
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from usuarios.core.config import settings
from usuarios.services.user_service import UserService
```

**Ejemplo Incorrecto**:
```python
from usuarios.services.user_service import UserService
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from usuarios.core.config import settings
```

### 4.2 Type Hints (Obligatorios)
- Usar type hints para todos los parámetros de función y valores de retorno.
- Usar `Optional[T]` o `T | None` (Python 3.10+).
- Usar `from __future__ import annotations` para referencias adelantadas.

**Ejemplo Correcto**:
```python
from __future__ import annotations
from typing import Optional

def find_user_by_id(user_id: int, include_inactive: bool = False) -> Optional[User]:
    # ...
```

**Ejemplo Incorrecto**:
```python
def find_user_by_id(user_id, include_inactive=False):
    # ... sin tipos
```

### 4.3 Nombres (PEP 8)
- **Clases**: `UpperCamelCase` (ej: `UserService`, `CreateUserRequest`).
- **Funciones y variables**: `lowercase_with_underscores` (snake_case).
- **Constantes**: `UPPER_SNAKE_CASE`.
- **Métodos privados/protegidos**: prefijo `_` (ej: `_validate_user`).
- **Paquetes**: `lowercase_with_underscores` (corto, sin guiones).

### 4.4 Docstrings (PEP 257)
- Usar docstrings triples (`"""`).
- Para clases y métodos públicos, describir qué hace, args, returns, raises.
- Formato recomendado: Google style o Sphinx.

**Ejemplo Correcto (Google Style)**:
```python
def calculate_discount(price: float, percentage: float) -> float:
    """Calcula el precio con descuento aplicado.
    
    Args:
        price: Precio original.
        percentage: Porcentaje de descuento (0-100).
        
    Returns:
        Precio con descuento.
        
    Raises:
        ValueError: Si el porcentaje está fuera de rango.
    """
    if not 0 <= percentage <= 100:
        raise ValueError("Percentage must be between 0 and 100")
    return price * (1 - percentage / 100)
```

### 4.5 Anotaciones
- Usar decoradores de FastAPI, Pydantic, etc., en líneas separadas.

**Ejemplo Correcto**:
```python
@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service)
) -> UserResponse:
    return await service.get_user(user_id)
```

---

## 5. Diseño de APIs REST con FastAPI

### 5.1 Nomenclatura de Endpoints
- Seguir mismos principios que Java: sustantivos en plural, minúsculas, guiones para separar palabras.
- Versionado en URL: `/api/v1/users`.

### 5.2 Métodos HTTP y Códigos de Estado
- Igual que en Java (sección 5.2 del estándar anterior).
- Usar `HTTPException` de FastAPI o excepciones personalizadas manejadas globalmente.

### 5.3 Modelos Pydantic (DTOs)
- Definir modelos de request y response como clases que heredan de `pydantic.BaseModel`.
- Usar `ConfigDict` para configuración (ej: `from_attributes=True` para ORM).
- Validaciones con `Field(..., description=..., ge=1, etc.)`.
- Inmutables: usar `frozen=True`.

**Ejemplo Correcto**:
```python
from pydantic import BaseModel, Field, EmailStr

class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    age: int = Field(..., ge=18, le=120)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    
    model_config = {
        "from_attributes": True
    }
```

**Ejemplo Incorrecto**:
```python
class CreateUserRequest:
    def __init__(self, username, email, age):
        self.username = username
        self.email = email
        self.age = age
```

### 5.4 Dependencias
- Usar sistema de dependencias de FastAPI para inyectar servicios, repositorios, etc.
- Definir dependencias reutilizables en `dependencies.py`.

**Ejemplo**:
```python
# dependencies.py
async def get_user_service() -> UserService:
    return UserService(repository=UserRepository())
    
# endpoints/users.py
@app.get("/users/{user_id}")
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service)
):
    return await service.get_user(user_id)
```

### 5.5 Documentación Automática
- FastAPI genera automáticamente OpenAPI (Swagger). Asegurar descripciones claras en modelos y endpoints.
- Usar `tags` para agrupar endpoints.

---

## 6. gRPC: Definición e Implementación

### 6.1 Estilo de Protocol Buffers (.proto)
- **Sintaxis**: usar `proto3`.
- **Nombres de mensajes**: `UpperCamelCase`.
- **Nombres de campos**: `snake_case`.
- **Nombres de servicios**: `UpperCamelCase`.
- **Nombres de métodos RPC**: `UpperCamelCase` (verbos).
- **Numeración de campos**: mantener consistencia, no reutilizar números eliminados.

**Ejemplo Correcto** :
```protobuf
syntax = "proto3";

package user.v1;

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);
}

message GetUserRequest {
  string user_id = 1;
}

message User {
  string id = 1;
  string username = 2;
  string email = 3;
}
```

### 6.2 Generación de Código Python
- Usar `grpcio-tools` para generar stubs.
- Incluir comando en `scripts/generate_proto.sh`.
- El código generado **no** se versiona; se genera en build.

**Comando típico** :
```bash
python -m grpc_tools.protoc \
    -I./src/usuarios/grpc/proto \
    --python_out=./src/usuarios/grpc/generated \
    --grpc_python_out=./src/usuarios/grpc/generated \
    --pyi_out=./src/usuarios/grpc/generated \
    ./src/usuarios/grpc/proto/*.proto
```

### 6.3 Implementación del Servidor gRPC
- Crear clase que hereda del Servicer generado.
- Usar async/await si el servicio es asíncrono (`grpcio.aio`) .
- Convertir entre Protobuf y Pydantic en una capa separada .

**Ejemplo** :
```python
# grpc/services/user_service.py
import grpc
from usuarios.grpc.generated import user_pb2, user_pb2_grpc
from usuarios.services.user_service import UserService as CoreUserService
from usuarios.utils.grpc_converters import user_to_proto, proto_to_create_request

class UserGrpcService(user_pb2_grpc.UserServiceServicer):
    def __init__(self, core_service: CoreUserService):
        self.core_service = core_service
    
    async def GetUser(self, request: user_pb2.GetUserRequest, context: grpc.aio.ServicerContext) -> user_pb2.User:
        try:
            user = await self.core_service.get_user(request.user_id)
            return user_to_proto(user)
        except UserNotFoundError:
            await context.abort(grpc.StatusCode.NOT_FOUND, f"User {request.user_id} not found")
```

### 6.4 Cliente gRPC
- Crear stubs reutilizables con manejo de conexiones.
- Usar `async with` para canales asíncronos .

**Ejemplo**:
```python
# grpc/clients/user_client.py
import grpc
from usuarios.grpc.generated import user_pb2, user_pb2_grpc

class UserGrpcClient:
    def __init__(self, endpoint: str):
        self.endpoint = endpoint
        self.channel = grpc.aio.insecure_channel(endpoint)
        self.stub = user_pb2_grpc.UserServiceStub(self.channel)
    
    async def get_user(self, user_id: str) -> user_pb2.User:
        request = user_pb2.GetUserRequest(user_id=user_id)
        return await self.stub.GetUser(request)
```

### 6.5 Interceptores gRPC
- Para logging, autenticación, tracing, usar interceptores .

**Ejemplo de interceptor de logging** :
```python
class LoggingInterceptor(grpc.aio.ServerInterceptor):
    async def intercept_service(self, continuation, handler_call_details):
        method = handler_call_details.method
        logger.info(f"gRPC call started: {method}")
        response = await continuation(handler_call_details)
        logger.info(f"gRPC call completed: {method}")
        return response
```

### 6.6 Manejo de Errores en gRPC
- Usar códigos de estado estándar de gRPC: `NOT_FOUND`, `INVALID_ARGUMENT`, `INTERNAL`, etc.
- Abortar con `context.abort(code, details)`.

---

## 7. Persistencia (SQLAlchemy / MongoDB)

### 7.1 Modelos SQLAlchemy (si se usa SQL)
- Definir modelos heredando de `declarative_base()`.
- Usar `Mapped` y `mapped_column` (SQLAlchemy 2.0 style).
- Nombres de tablas en plural y snake_case.

**Ejemplo**:
```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True, index=True)
    email: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
```

### 7.2 Repositorios
- Abstraer acceso a datos en repositorios.
- Usar inyección de dependencias.

**Ejemplo**:
```python
class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        return await self.session.get(User, user_id)
```

### 7.3 Conexión a MongoDB
- Usar `motor` para driver asíncrono.
- Definir colecciones y modelos Pydantic para documentos.

---

## 8. Manejo de Excepciones y Logging

### 8.1 Excepciones Personalizadas
- Definir excepciones específicas del dominio en `core/exceptions.py`.

**Ejemplo**:
```python
class UserNotFoundError(Exception):
    pass

class BusinessRuleViolation(Exception):
    pass
```

### 8.2 Manejadores Globales en FastAPI
- Usar `@app.exception_handler` para formatear respuestas de error consistentes.

**Ejemplo**:
```python
@app.exception_handler(UserNotFoundError)
async def user_not_found_handler(request, exc: UserNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"code": "USER_NOT_FOUND", "message": str(exc)}
    )
```

### 8.3 Logging
- Usar `structlog` o `logging` con formato JSON para entornos cloud.
- Incluir correlation ID en logs (similar a Java).
- Niveles: DEBUG (desarrollo), INFO (eventos relevantes), WARNING (anomalías), ERROR (fallos).

**Ejemplo de configuración**:
```python
import structlog

logger = structlog.get_logger()
logger.info("user.created", user_id=user.id, username=user.username)
```

### 8.4 Middleware para Correlation ID 
```python
from starlette.middleware.base import BaseHTTPMiddleware
import uuid

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        with structlog.contextvars.bind_contextvars(correlation_id=correlation_id):
            response = await call_next(request)
            response.headers["X-Correlation-ID"] = correlation_id
            return response
```

---

## 9. Seguridad

### 9.1 Autenticación y Autorización
- Usar OAuth2 con JWT (FastAPI proporciona herramientas).
- Para gRPC, transmitir tokens en metadatos.

**Ejemplo FastAPI**:
```python
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    # validar token y retornar usuario
```

### 9.2 Validación de Entrada
- Pydantic valida automáticamente requests HTTP.
- Para gRPC, validar en la capa de servicio antes de procesar.

### 9.3 CORS
- Configurar explícitamente orígenes permitidos.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontend.example.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 9.4 Secretos y Configuración
- Usar `pydantic-settings` con variables de entorno.
- Nunca hardcodear secretos.

**Ejemplo**:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    grpc_port: int = 50051
    
    class Config:
        env_file = ".env"
```

---

## 10. Pruebas

### 10.1 Framework: pytest
- Usar `pytest` con plugins: `pytest-asyncio`, `pytest-cov`.

### 10.2 Estructura de Pruebas
- Pruebas unitarias en `tests/unit/`.
- Pruebas de integración en `tests/integration/`.
- Nombrar archivos `test_*.py`.

### 10.3 Pruebas Unitarias
- Mockear dependencias externas.
- Usar `pytest.fixture` para objetos comunes.

**Ejemplo**:
```python
import pytest
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_get_user_returns_user():
    # given
    repo = AsyncMock()
    repo.get_by_id.return_value = User(id=1, username="test")
    service = UserService(repository=repo)
    
    # when
    result = await service.get_user(1)
    
    # then
    assert result.username == "test"
    repo.get_by_id.assert_called_once_with(1)
```

### 10.4 Pruebas de Integración con FastAPI
- Usar `TestClient` de FastAPI.
- Para gRPC, usar `grpc.aio.insecure_channel` con servidor de pruebas.

**Ejemplo API**:
```python
from fastapi.testclient import TestClient

def test_create_user(client: TestClient):
    response = client.post("/api/v1/users", json={"username": "test", "email": "test@example.com", "age": 25})
    assert response.status_code == 201
```

### 10.5 Pruebas de Integración con gRPC 
- Levantar servidor gRPC en pruebas.
- Usar `unittest.IsolatedAsyncioTestCase` o pytest-asyncio.

### 10.6 Cobertura
- Mantener cobertura mínima del 70%.
- Usar `pytest-cov` y reportar a SonarQube.

---

## 11. Rendimiento y Escalabilidad

### 11.1 Asincronía
- Usar `async/await` en toda la pila: FastAPI, controladores de gRPC, drivers de BD (asyncpg, motor).
- No bloquear el event loop con operaciones síncronas .

### 11.2 Concurrencia en gRPC
- Configurar número de workers en servidor gRPC: `grpc.aio.server(ThreadPoolExecutor(max_workers=10))`.

### 11.3 Caché
- Usar `aiocache` o `redis` con `redis.asyncio`.
- Cachear respuestas de endpoints GET que cambian poco.

### 11.4 Conexiones a Base de Datos
- Usar pool de conexiones (SQLAlchemy, motor).
- Configurar límites según carga esperada.

### 11.5 Métricas
- Exponer métricas con `prometheus-client`.
- Integrar con FastAPI mediante middleware.

---

## 12. Herramientas de Calidad y Análisis Estático

### 12.1 Herramientas Obligatorias
- **Black**: formateador automático de código.
- **isort**: ordenador de imports.
- **mypy**: verificación estática de tipos.
- **ruff** o **flake8**: linter rápido.
- **pre-commit**: hooks para validar antes de commit.

**Ejemplo de `.pre-commit-config.yaml`**:
```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort
  - repo: https://github.com/charliermarsh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
```

### 12.2 Configuración en pyproject.toml
```toml
[tool.black]
line-length = 88
target-version = ['py311']

[tool.isort]
profile = "black"
line_length = 88

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
ignore_missing_imports = true

[tool.ruff]
line-length = 88
select = ["E", "F", "W", "C", "N", "D"]
ignore = ["D100", "D104"]  # Ejemplo
```

### 12.3 SonarQube
- Ejecutar análisis en CI.
- Quality Gate: cobertura ≥ 70%, duplicación ≤ 3%, complejidad por función ≤ 10, sin vulnerabilidades críticas.
- Reglas personalizadas: exigir type hints, prohibir imports relativos, etc.

**Comando típico**:
```bash
sonar-scanner \
  -Dsonar.projectKey=servicio-usuarios \
  -Dsonar.sources=src \
  -Dsonar.tests=tests \
  -Dsonar.python.coverage.reportPaths=coverage.xml
```

### 12.4 Complejidad Ciclomática
- Límite: 10 por función/método.
- SonarQube marcará funciones con alta complejidad.
- Refactorizar extrayendo funciones más pequeñas.

---

## 13. Gestión de Dependencias y Construcción

### 13.1 Poetry (recomendado)
- Usar `pyproject.toml` con Poetry para gestionar dependencias y entornos virtuales.
- Separar dependencias principales y de desarrollo.

**Ejemplo de sección**:
```toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.0"
grpcio = "^1.60.0"
pydantic = "^2.5.0"
sqlalchemy = "^2.0.0"
asyncpg = "^0.29.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
black = "^23.12.0"
mypy = "^1.8.0"
```

### 13.2 Docker
- Usar imagen base oficial `python:3.11-slim`.
- Multi-stage build para reducir tamaño.

**Ejemplo Dockerfile**:
```dockerfile
FROM python:3.11-slim as builder
WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry export -f requirements.txt --output requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ ./src
CMD ["uvicorn", "src.usuarios.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 14. Integración Continua y Despliegue

- Ejecutar en cada PR:
  1. `pre-commit run --all-files`
  2. `mypy src`
  3. `pytest --cov=src tests/`
  4. Escaneo con SonarQube
- El merge solo si pasa el Quality Gate.

---

## Apéndice A: Resumen de Reglas Clave

| Categoría               | Regla                                                                 |
|-------------------------|-----------------------------------------------------------------------|
| Indentación             | 4 espacios, sin tabs                                                  |
| Longitud línea          | 88 caracteres (Black)                                                 |
| Type Hints              | Obligatorios en todos los métodos públicos                            |
| Nombres                 | snake_case para funciones/variables, UpperCamelCase para clases      |
| Imports                 | Orden: stdlib, terceros, locales; usar isort                          |
| Docstrings              | Google style obligatorio en módulos, clases, métodos públicos         |
| DTOs                    | Pydantic models con validación                                        |
| gRPC                    | Definir .proto, generar stubs, implementar servicers asíncronos       |
| Logging                 | Estructurado con correlation ID                                       |
| Seguridad               | JWT, validación entrada, CORS restrictivo                             |
| Pruebas                 | pytest, cobertura ≥70%, tests unitarios y de integración              |
| Complejidad ciclomática | ≤ 10 por función                                                      |
| Herramientas            | Black, isort, mypy, ruff, pre-commit, SonarQube                       |
| Dependencias            | Poetry con pyproject.toml                                             |

---
