# Estándar de Código y Estilo para Microservicios con Java 21, Spring Boot y MongoDB

Este documento define las reglas arquitectónicas, convenciones de codificación y estándares de calidad obligatorios para el desarrollo de microservicios en el proyecto HealthCore. El objetivo es garantizar un ecosistema de código limpio, modular, escalable y preparado para CI/CD.

---

## 1. Introducción

### 1.1 Propósito
Establecer un conjunto de normas obligatorias para todos los desarrolladores del equipo, facilitando la colaboración, revisión de código y el mantenimiento del software, así como asegurar la calidad mediante herramientas automatizadas.

### 1.2 Alcance
Aplica a todo el código fuente, pruebas, configuración y documentación técnica de los microservicios desarrollados con:
- Java 21 (LTS)
- Spring Boot 3.x
- MongoDB (con Spring Data MongoDB)
- Maven como herramienta de construcción
- SonarQube para análisis estático de código

### 1.3 Referencias
Este estándar se basa en:
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
- [Spring Data MongoDB Reference](https://docs.spring.io/spring-data/mongodb/docs/current/reference/html/)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [REST API Design Rulebook](https://www.oreilly.com/library/view/rest-api-design/9781449317904/)
- [SonarQube Documentation](https://docs.sonarqube.org/latest/)
- [Maven Apache](https://maven.apache.org/guides/index.html)

---

## 2. Principios Generales (Clean Code)

- **Consistencia**: El código debe verse como si hubiera sido escrito por una sola persona.
- **Legibilidad**: El código se escribe para ser leído por humanos, no solo para que la máquina lo ejecute.
- **Mantenibilidad**: Favorecer la claridad y la simplicidad sobre la complejidad innecesaria.
- **Testabilidad**: Diseñar pensando en pruebas unitarias y de integración.
- **Seguridad por defecto**: Incorporar prácticas seguras desde el diseño.
- **Calidad automatizada**: El análisis estático y las métricas son parte integral del proceso de desarrollo.
- **English First**: Absolutamente todo el código fuente (clases, variables, métodos), esquemas de base de datos, URIs y comentarios internos deben escribirse en inglés.
- **SOLID y Responsabilidad Única**: Cada clase debe tener una única razón para cambiar. Favorecer la composición sobre la herencia.
- **Inyección de Dependencias**: Obligatoria por constructor. Queda estrictamente prohibido el uso de `@Autowired` en campos (field injection).
- **Fail-Fast**: Validar entradas y estados lo antes posible. Si algo va a fallar, debe hacerlo en las primeras líneas de ejecución.

---

## 3. Arquitectura de Software

Se implementará **Arquitectura Hexagonal (Ports and Adapters)** para aislar la lógica de negocio de los frameworks y detalles de infraestructura.

**Estructura de Paquetes Estándar:**
```text
com.healthcore.servicename/
├── domain/           # Entidades puras (Java Records/Classes), Enums, Excepciones de negocio (Cero Spring/Mongo)
├── application/      # Casos de uso (Services) que orquestan las entidades del dominio
├── infrastructure/   # Implementaciones de repositorios (MongoDB), adaptadores externos, configs
└── interfaces/       # Controladores REST (Controllers), DTOs, WebSockets, gRPC endpoints
```

---

## 4. Estilo de Código y Nomenclatura

- **Indentación**: 4 espacios (no tabs).
- **Clases/Interfaces**: `UpperCamelCase` (Sustantivos, ej: `UserRepository`).
- **Métodos**: `lowerCamelCase` (Verbos, ej: `findUserById`).
- **Variables**: `lowerCamelCase`. Nombres expresivos (prohibido usar `x`, `lst`, `data`).
- **Constantes**: `UPPER_SNAKE_CASE` (`public static final`).
- **Paquetes**: Todo en minúsculas, sin guiones (`com.healthcore.identity.domain`).

### 4.1 Erradicación de Números Mágicos
Cualquier literal numérico o de texto que defina una regla debe ser extraído a una constante o `enum`.

```java
// CORRECTO
public class SecurityConstants {
    public static final int MAX_LOGIN_ATTEMPTS = 3;
    public static final long TOKEN_EXPIRATION_MILLIS = 300000L;
}
```

### 4.2 Política de Comentarios
El código debe explicarse a sí mismo.
1. **Javadoc (`/** ... */`)**: Requerido **únicamente** para contratos de interfaces (`public interface`) y APIs públicas. No documentar métodos autoexplicativos.
2. **Comentarios de línea (`//`)**: Reservados **estrictamente** para explicar el *por qué* de una decisión de diseño inusual, nunca el *qué*.

---

## 5. Diseño de APIs REST y DTOs

### 5.1 Endpoints
- Usar sustantivos en plural y en minúsculas: `GET /api/v1/patients`.
- Versionar siempre en la URL.

### 5.2 DTOs (Data Transfer Objects)
Los modelos de base de datos (`@Document`) NUNCA deben exponerse al cliente.
- Usar `record` de Java 21 para garantizar inmutabilidad.
- Aplicar validaciones de `jakarta.validation`.

```java
public record RegisterPatientRequest(
    @NotBlank(message = "Email is required") 
    @Email(message = "Invalid format") 
    String email,
    
    @NotBlank 
    @Size(min = 8, message = "Min 8 characters required") 
    String password
) {}
```

---

## 6. Manejo de Excepciones

Las arquitecturas robustas capturan errores en cascada (de lo específico a lo general).

### 6.1 Jerarquía Escalonada
```java
try {
    return jwtUtil.parseToken(token);
} catch (ExpiredJwtException e) {
    // Nivel 1: Error de negocio específico
    throw new UnauthorizedException("Token has expired");
} catch (SignatureException e) {
    // Nivel 2: Intento de vulneración
    throw new ForbiddenException("Invalid signature");
} catch (Exception e) {
    // Nivel 3: Error sistémico general
    throw new InternalServerException("Service unavailable");
}
```

### 6.2 Manejo Global
Utilizar `@RestControllerAdvice` para interceptar excepciones de negocio en la capa de *interfaces* y devolver un JSON estándar con el código HTTP correcto (400, 401, 403, 404, 500).

---

## 7. Pruebas Automatizadas (Testing)

Uso obligatorio de **JUnit 5, Mockito y AssertJ**.

### 7.1 Pruebas Unitarias
- **Nomenclatura**: `should_Action_When_Condition()`.
- **Estructura**: Aplicar el patrón AAA (Arrange, Act, Assert).

```java
@Test
void shouldThrowException_WhenEmailAlreadyExists() {
    // Arrange
    String email = "test@healthcore.com";
    when(repository.existsByEmail(email)).thenReturn(true);

    // Act & Assert
    assertThatThrownBy(() -> service.register(email))
        .isInstanceOf(ConflictException.class)
        .hasMessageContaining("Email already registered");
}
```

### 7.2 Pruebas de Integración (Base de Datos)
Las pruebas que requieran MongoDB deben usar **Testcontainers** (`@Testcontainers`, `@Container`) para levantar instancias efímeras de Docker, garantizando un entorno reproducible en CI/CD.

---

## 8. Rendimiento y Escalabilidad

- **Evitar N+1 Queries**: En MongoDB, usar agregaciones o refactorizar el modelo en lugar de cargar relaciones en bucles iterativos.
- **Conexiones**: Usar `spring.data.mongodb.uri` para dejar que Spring Boot gestione el pool de conexiones (`maxPoolSize`). No abrir ni cerrar conexiones manualmente.
- **Procesamiento Asíncrono**: Para tareas de fondo (ej. envío de correos), usar `@Async` con un `Executor` configurado correctamente.
- **Caché**: Utilizar Spring Cache (`@Cacheable`) para endpoints de lectura frecuente y actualización escasa.

---

## 9. Configuración CI/CD, Maven y SonarQube

### 9.1 Gestión de Construcción (Maven)
- Utilizar `spring-boot-starter-parent` como base.
- Configurar plugins de calidad en la fase de validación: `jacoco-maven-plugin` (cobertura), `maven-checkstyle-plugin` y `spotbugs-maven-plugin`.

### 9.2 SonarQube (Quality Gate)
Todo el código debe integrarse a SonarQube mediante: `mvn clean verify sonar:sonar`.
El *Quality Gate* bloqueante de HealthCore exige:
- **Cobertura de Pruebas**: ≥ 80% en lógica de negocio.
- **Complejidad Ciclomática**: ≤ 10 por método.
- **Vulnerabilidades y Bugs**: 0.
- **Code Smells**: Resolución obligatoria de olores críticos/mayores.