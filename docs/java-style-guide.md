# Estándar de Código y Estilo para Microservicios con Java 21, Spring Boot y MongoDB

Este documento define las reglas y buenas prácticas para el desarrollo de microservicios REST con Java 21, Spring Boot y MongoDB, utilizando Maven como herramienta de construcción y SonarQube para análisis estático de código. El objetivo es garantizar un código consistente, legible, mantenible, seguro y de alta calidad.

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

## 2. Principios Generales

- **Consistencia**: El código debe verse como si hubiera sido escrito por una sola persona.
- **Legibilidad**: El código se escribe para ser leído por humanos, no solo para que la máquina lo ejecute.
- **Mantenibilidad**: Favorecer la claridad y la simplicidad sobre la complejidad innecesaria.
- **Testabilidad**: Diseñar pensando en pruebas unitarias y de integración.
- **Seguridad por defecto**: Incorporar prácticas seguras desde el diseño.
- **Calidad automatizada**: El análisis estático y las métricas son parte integral del proceso de desarrollo.

---

## 3. Estructura del Proyecto

### 3.1 Organización de Paquetes
Usar **estructura basada en funcionalidades** (features) en lugar de capas técnicas globales, pero manteniendo subpaquetes por capa dentro de cada feature.

```
com.empresa.proyecto/
├── Application.java
├── feature1/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── dto/
│   ├── exception/
│   └── mapper/
├── feature2/
│   └── ...
├── config/          # Configuraciones globales (seguridad, MongoDB, etc.)
├── common/          # Utilidades, constantes, excepciones globales
└── infrastructure/  # Clientes HTTP, adaptadores externos, etc.
```

**Justificación**: Favorece la cohesión y facilita la navegación; cada feature es casi un módulo independiente, lo que mejora la escalabilidad y el mantenimiento.

### 3.2 Estructura de Archivos
- Un archivo fuente por clase de nivel superior.
- Codificación UTF-8.
- Línea de orden: 1) licencia/copyright, 2) package, 3) imports, 4) clase.
- Imports ordenados: estáticos primero, luego no estáticos, agrupados por paquete (sin wildcards).

**Ejemplo Correcto**:
```java
package com.empresa.proyecto.feature1.service;

import static org.junit.jupiter.api.Assertions.*;

import com.empresa.proyecto.feature1.dto.UserDto;
import com.empresa.proyecto.feature1.entity.User;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
```

**Ejemplo Incorrecto**:
```java
package com.empresa.proyecto.feature1.service;
import java.util.*;
import com.empresa.proyecto.feature1.dto.*;
import lombok.*;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.stereotype.Service;
```

---

## 4. Estilo de Código

Adoptamos las convenciones de Google Java Style con algunas adaptaciones.

### 4.1 Formato Básico
- **Indentación**: 2 espacios (no tabs).
- **Longitud de línea**: máximo 120 caracteres.
- **Saltos de línea**: antes de operadores binarios, alineación con punto de apertura.
- **Llaves**: estilo "Egyptian brackets" (la llave de apertura en la misma línea).

**Ejemplo Correcto**:
```java
public class UserService {
    public User findById(String id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        return repository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }
}
```

**Ejemplo Incorrecto**:
```java
public class UserService
{
    public User findById(String id) 
    {
        if (id == null) 
        {
            throw new IllegalArgumentException("ID cannot be null");
        }
        return repository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
    }
}
```

### 4.2 Nombres
- **Clases/interfaces/enums**: `UpperCamelCase` (sustantivos).
- **Métodos**: `lowerCamelCase` (verbos).
- **Variables y campos**: `lowerCamelCase`.
- **Constantes**: `UPPER_SNAKE_CASE` (static final).
- **Paquetes**: `minúsculas`, sin guiones bajos (ej: `com.empresa.producto`).
- **Genéricos**: una letra mayúscula por convención (T, U, E, etc.) o nombres descriptivos cortos.

**Justificación**: Las convenciones de nombres son ampliamente reconocidas y mejoran la legibilidad.

### 4.3 Anotaciones
- Colocar anotaciones sobre la línea del elemento (no en la misma línea si son varias).
- Orden sugerido: anotaciones de Spring, Lombok, Java (como `@Override`), etc., sin mezclar.

**Ejemplo Correcto**:
```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable String id) {
        return ResponseEntity.ok(userService.findById(id));
    }
}
```

**Ejemplo Incorrecto**:
```java
@RestController @RequestMapping("/api/users") public class UserController {
    @Autowired private UserService userService;

    @GetMapping("/{id}") public ResponseEntity<UserDto> getUser(@PathVariable String id) {
        return ResponseEntity.ok(userService.findById(id));
    }
}
```

### 4.4 Javadoc
- Toda clase pública, método público protegido, y constante debe tener Javadoc (excepto getters/setters simples y métodos de test).
- Usar párrafos, etiquetas `@param`, `@return`, `@throws`.
- Mantener el Javadoc actualizado.

**Ejemplo Correcto**:
```java
/**
 * Servicio para gestionar operaciones relacionadas con usuarios.
 */
@Service
public class UserService {
    /**
     * Busca un usuario por su identificador único.
     *
     * @param id identificador del usuario (no puede ser nulo)
     * @return el usuario encontrado
     * @throws UserNotFoundException si no existe un usuario con ese id
     */
    public User findById(String id) {
        // ...
    }
}
```

---

## 5. Complejidad Ciclomática y Métricas de Código

### 5.1 Definición
La complejidad ciclomática mide la cantidad de caminos linealmente independientes a través del código. Un valor alto indica código difícil de probar, entender y mantener.

### 5.2 Límites Aceptables
- **Métodos**: complejidad ciclomática ≤ 10.
- **Clases**: complejidad ciclomática total ≤ 50 (suma de métodos).
- Excepciones justificadas para métodos de mapeo o generación de reportes muy complejos, pero deben ser aprobadas en revisión de código.

### 5.3 Cómo Reducir la Complejidad
- Extraer bloques condicionales a métodos privados.
- Usar polimorfismo en lugar de largas cadenas if/else o switch.
- Aplicar patrones de diseño como Strategy, State.
- Dividir métodos largos en varios más pequeños.

**Ejemplo de alta complejidad (evitar)**:
```java
public double calculatePrice(Order order) {
    if (order.getType() == Type.STANDARD) {
        // 10 líneas
    } else if (order.getType() == Type.PREMIUM) {
        // 15 líneas
    } else if (order.getType() == Type.VIP) {
        // 20 líneas
    } else {
        // 5 líneas
    }
    // más lógica con más condicionales...
}
```

**Ejemplo refactorizado**:
```java
public double calculatePrice(Order order) {
    return priceStrategyFactory.getStrategy(order.getType()).calculate(order);
}
```

### 5.4 Medición con SonarQube
SonarQube reporta la complejidad ciclomática por método y por clase, y marca como "code smell" aquellos métodos que excedan el umbral configurado (por defecto 10). Se debe cumplir con el Quality Gate que incluye esta métrica.

---

## 6. Diseño de APIs REST

### 6.1 Nomenclatura de Endpoints
- Usar sustantivos en plural: `/api/users`, `/api/orders`.
- Separar palabras con guiones: `/api/user-profiles`.
- No usar verbos en la URL: `/api/getUsers` (mal) – usar método HTTP: `GET /api/users`.
- Usar minúsculas consistentemente.

### 6.2 Métodos HTTP y Códigos de Estado
- `GET` – obtener recurso(s): 200 OK, 404 Not Found.
- `POST` – crear nuevo recurso: 201 Created (con Location), 400 Bad Request.
- `PUT` – reemplazar completo: 200 OK o 204 No Content, 404 si no existe.
- `PATCH` – actualización parcial: 200 OK o 204 No Content.
- `DELETE` – eliminar: 204 No Content, 404 si no existe.
- Para errores de validación de negocio usar 422 Unprocessable Entity.

### 6.3 DTOs (Data Transfer Objects)
- Inmutables: usar `record` de Java (preferido) o clases con Lombok `@Value`.
- Validaciones con Bean Validation (`@NotNull`, `@Size`, etc.) en los DTOs de entrada.
- No exponer entidades de JPA/Mongo directamente como respuesta.

**Ejemplo Correcto** (record):
```java
public record CreateUserRequest(
    @NotBlank String username,
    @Email String email,
    @Min(18) int age
) {}
```

**Ejemplo Incorrecto**:
```java
public class CreateUserRequest {
    private String username;
    private String email;
    private int age;
    // getters y setters mutables, sin validaciones
}
```

### 6.4 Versionado de API
- Incluir versión en la URL: `/api/v1/users`, `/api/v2/users`.
- Mantener compatibilidad hacia atrás en lo posible; de lo contrario, versionar.

### 6.5 Documentación con OpenAPI
- Anotar controladores y DTOs con `@Operation`, `@ApiResponse`, etc., de springdoc-openapi.
- Asegurar que la documentación se genere automáticamente y esté actualizada.

**Ejemplo**:
```java
@Operation(summary = "Obtener usuario por ID")
@ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "Usuario encontrado"),
    @ApiResponse(responseCode = "404", description = "Usuario no existe")
})
@GetMapping("/{id}")
public ResponseEntity<UserDto> getUser(@PathVariable String id) {
    // ...
}
```

---

## 7. Persistencia con MongoDB

### 7.1 Entidades (Documentos)
- Anotar con `@Document(collection = "nombre")`.
- Usar `@Id` para el identificador (String u ObjectId).
- Nombrar campos en camelCase (ej: `firstName`).
- Usar índices con `@Indexed`, `@CompoundIndex` cuando sea necesario.
- Incluir campos de auditoría: `@CreatedDate`, `@LastModifiedDate` con `@EnableMongoAuditing`.

**Ejemplo Correcto**:
```java
@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String username;
    
    private String email;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
}
```

**Ejemplo Incorrecto**:
```java
@Document(collection="user")
public class user {
    private ObjectId _id;
    private String UserName;  // No camelCase
    // sin índices ni auditoría
}
```

### 7.2 Repositorios
- Extender `MongoRepository<T, ID>` o `ReactiveMongoRepository`.
- Definir métodos de consulta derivados del nombre.
- Para consultas complejas, usar `@Query` con JSON de MongoDB o Criteria API.

**Ejemplo**:
```java
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);
    
    @Query("{ 'email' : ?0 }")
    Optional<User> findByEmailAddress(String email);
}
```

### 7.3 Transacciones
- Usar `@Transactional` en métodos de servicio solo si se requiere atomicidad entre múltiples operaciones en MongoDB (requiere replica set).
- Preferir operaciones atómicas a nivel de documento cuando sea posible.

### 7.4 Auditoría
- Activar `@EnableMongoAuditing` en clase de configuración.
- Anotar campos con `@CreatedBy`, `@LastModifiedBy` si se requiere auditoría de usuario.

---

## 8. Manejo de Excepciones y Logging

### 8.1 Excepciones
- Usar excepciones personalizadas para errores de negocio (extienden `RuntimeException`).
- Para errores técnicos, usar excepciones estándar (ej: `IllegalArgumentException`).
- Manejo centralizado con `@ControllerAdvice`.

**Ejemplo de excepción personalizada**:
```java
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String id) {
        super("Usuario no encontrado con id: " + id);
    }
}
```

**Ejemplo de `@ControllerAdvice`**:
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
        ErrorResponse error = new ErrorResponse("USER_NOT_FOUND", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getAllErrors().stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .collect(Collectors.toList());
        ErrorResponse error = new ErrorResponse("VALIDATION_FAILED", errors.toString());
        return ResponseEntity.badRequest().body(error);
    }
}
```

**Estructura de respuesta de error estándar**:
```java
public record ErrorResponse(String code, String message) {}
```

### 8.2 Logging
- Usar SLF4J con `@Slf4j` de Lombok.
- Niveles: ERROR (fallos graves), WARN (situaciones anómalas no críticas), INFO (eventos relevantes), DEBUG (detalles para troubleshooting).
- Incluir identificadores de correlación (correlation ID) en logs usando MDC.
- No loguear información sensible (contraseñas, tokens, datos personales).

**Ejemplo**:
```java
@Slf4j
@Service
public class UserService {
    public User createUser(CreateUserRequest request) {
        log.info("Creando usuario: {}", request.username());
        // ...
        log.debug("Usuario creado con id: {}", user.getId());
    }
}
```

**Configuración MDC con filtro**:
```java
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String correlationId = request.getHeader("X-Correlation-Id");
        if (correlationId == null) {
            correlationId = UUID.randomUUID().toString();
        }
        MDC.put("correlationId", correlationId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
```

---

## 9. Seguridad

### 9.1 Autenticación y Autorización
- Usar Spring Security.
- Para microservicios, preferir autenticación basada en JWT (OAuth2 / OpenID Connect).
- Configurar protección CSRF desactivada si se usan tokens (stateless).
- Definir roles y permisos; usar `@PreAuthorize` en métodos.

**Ejemplo de configuración JWT**:
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(OAuth2ResourceServerConfigurer::jwt);
        return http.build();
    }
}
```

**Ejemplo de autorización a nivel de método**:
```java
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
@GetMapping("/users/{userId}")
public UserDto getUser(@PathVariable String userId) {
    // ...
}
```

### 9.2 Prácticas de Codificación Segura
- **Validar toda entrada**: usar Bean Validation y sanitización.
- **Escapar salida** en respuestas para evitar inyección (no aplica directamente en JSON, pero tener cuidado con datos generados por el usuario).
- **CORS** configurado explícitamente: solo orígenes confiables.
- **Headers de seguridad**: agregar `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, etc., con `SecurityHeadersWriter` o similar.
- **Almacenamiento de secretos**: usar variables de entorno, config server o vault; nunca en código fuente.

### 9.3 Protección de Datos Sensibles
- Encriptar datos sensibles en la base de datos (ej: con `@Encrypted` de MongoDB si es necesario).
- Usar TLS para todas las comunicaciones (HTTP y drivers de BD).
- No exponer IDs internos (ej: usar UUIDs públicos en lugar de ObjectId secuenciales).

---

## 10. Pruebas

### 10.1 Tipos de Pruebas
- **Unitarias**: JUnit 5 + Mockito + AssertJ.
- **Integración**: `@SpringBootTest` con Testcontainers para MongoDB, o `@DataMongoTest`.
- **API (slice)**: `@WebMvcTest` para controladores, `@DataMongoTest` para repositorios.

### 10.2 Estructura de Pruebas
- Nombre de clase de test: `{Clase}Test` (ej: `UserServiceTest`).
- Métodos de test: nombre descriptivo separado por guiones bajos: `should_throwException_whenUserNotFound()` o en español `debeLanzarExcepcion_cuandoUsuarioNoExiste()` (elegir uno y mantener).
- Usar patrón given/when/then con comentarios o métodos auxiliares.

**Ejemplo Correcto**:
```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    void shouldThrowException_whenUserNotFound() {
        // given
        String userId = "123";
        given(userRepository.findById(userId)).willReturn(Optional.empty());
        
        // when / then
        assertThatThrownBy(() -> userService.findById(userId))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessageContaining(userId);
    }
}
```

### 10.3 Pruebas de Integración con MongoDB
- Usar Testcontainers para levantar una instancia real de MongoDB.
- Anotar con `@Testcontainers` y `@Container`.

**Ejemplo**:
```java
@Testcontainers
@SpringBootTest
class UserRepositoryIT {
    
    @Container
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:6.0");
    
    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void shouldSaveAndFindUser() {
        User user = User.builder().username("john").build();
        User saved = userRepository.save(user);
        assertThat(saved.getId()).isNotNull();
        Optional<User> found = userRepository.findByUsername("john");
        assertThat(found).isPresent();
    }
}
```

### 10.4 Cobertura de Código
- Mantener cobertura mínima del 70% en líneas nuevas (JaCoCo).
- Las pruebas deben ser independientes y no depender del orden de ejecución.

---

## 11. Rendimiento y Escalabilidad

### 11.1 Conexiones a MongoDB
- Usar `spring.data.mongodb.uri` con parámetros de pool: `maxPoolSize`, `minPoolSize`, etc.
- No abrir/cerrar conexiones manualmente; dejar que Spring Data gestione.

### 11.2 Procesamiento Asíncrono
- Para tareas largas o que no requieren respuesta inmediata, usar `@Async` con un `Executor` configurado.
- Considerar `WebFlux` si se necesita alta concurrencia y programación reactiva, pero mantener el equipo capacitado.

**Ejemplo**:
```java
@Async
@EventListener
public CompletableFuture<Void> handleUserCreatedEvent(UserCreatedEvent event) {
    // enviar email, etc.
    return CompletableFuture.completedFuture(null);
}
```

### 11.3 Caché
- Usar Spring Cache con `@Cacheable`, `@CacheEvict`.
- Elegir un proveedor: Caffeine para cachés locales, Redis para distribuido.
- Anotar métodos que son costosos y cuyos datos cambian poco.

### 11.4 Evitar N+1 Queries
- En MongoDB, usar agregaciones con `$lookup` o referencias manuales, no cargar relaciones en bucle.
- Para documentos embebidos, diseñar según patrones de acceso.

### 11.5 Métricas
- Exponer métricas con Micrometer (actuator) para monitoreo (Prometheus, Grafana).
- Crear métricas personalizadas para eventos de negocio importantes.

---

## 12. Maven: Gestión de Construcción y Dependencias

### 12.1 Estructura del POM
- Usar `spring-boot-starter-parent` como parent para heredar configuraciones por defecto.
- Definir propiedades: `java.version` (21), `project.build.sourceEncoding` (UTF-8), versiones de dependencias clave.
- Organizar dependencias: primero starters de Spring Boot, luego otras, luego test.
- Usar `dependencyManagement` para centralizar versiones de dependencias no gestionadas por Spring Boot.

**Ejemplo de pom.xml**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.2</version>
    </parent>
    
    <groupId>com.empresa</groupId>
    <artifactId>microservicio-usuarios</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    
    <properties>
        <java.version>21</java.version>
        <testcontainers.version>1.19.3</testcontainers.version>
        <sonar.organization>empresa</sonar.organization>
        <sonar.host.url>https://sonarcloud.io</sonar.host.url>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-mongodb</artifactId>
        </dependency>
        <!-- ... más dependencias ... -->
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <version>0.8.11</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>prepare-agent</goal>
                        </goals>
                    </execution>
                    <execution>
                        <id>report</id>
                        <phase>test</phase>
                        <goals>
                            <goal>report</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### 12.2 Plugins de Calidad y Análisis
Incluir plugins para verificar estilo y calidad antes de SonarQube:

- **maven-checkstyle-plugin**: para validar estilo Google Java.
- **spotbugs-maven-plugin**: análisis de bugs.
- **maven-pmd-plugin**: análisis de código (incluye reglas de complejidad).
- **jacoco-maven-plugin**: cobertura de pruebas.

**Ejemplo de configuración**:
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <version>3.3.1</version>
    <configuration>
        <configLocation>google_checks.xml</configLocation>
        <consoleOutput>true</consoleOutput>
        <failsOnError>true</failsOnError>
    </configuration>
    <executions>
        <execution>
            <phase>validate</phase>
            <goals>
                <goal>check</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

### 12.3 Perfiles de Maven
Usar perfiles para diferentes entornos (dev, test, prod) si es necesario, pero mantener la configuración mínima en el POM principal y sobrescribir propiedades en perfiles.

---

## 13. SonarQube: Análisis Estático de Código

### 13.1 Integración Continua
- El análisis con SonarQube debe ejecutarse en cada push a la rama principal y en pull requests.
- Usar el plugin de Maven `sonar-maven-plugin` para ejecutar el análisis.

**Ejemplo de comando**:
```bash
mvn clean verify sonar:sonar
```

### 13.2 Configuración del Proyecto en SonarQube
Definir en el pom.xml las propiedades básicas de SonarQube o pasarlas por línea de comandos:

```xml
<properties>
    <sonar.projectKey>com.empresa:microservicio-usuarios</sonar.projectKey>
    <sonar.organization>empresa</sonar.organization>
    <sonar.host.url>https://sonarcloud.io</sonar.host.url>
    <sonar.coverage.jacoco.xmlReportPaths>target/site/jacoco/jacoco.xml</sonar.coverage.jacoco.xmlReportPaths>
</properties>
```

### 13.3 Quality Gate (Puerta de Calidad)
El proyecto debe pasar el Quality Gate definido en SonarQube, que incluye al menos:
- Cobertura de código ≥ 70%
- Complejidad ciclomática por método ≤ 10
- Duplicación de código ≤ 3%
- Sin vulnerabilidades críticas o bloqueantes
- Sin code smells de alta severidad

### 13.4 Reglas Personalizadas
Se puede ajustar el perfil de calidad de SonarQube para incluir reglas específicas de nuestro estándar, como:
- Prohibir el uso de `@Autowired` en campos (usar constructor injection).
- Exigir que los métodos públicos tengan Javadoc.
- Limitar el número de parámetros en métodos (máx. 5).
- Forzar el uso de `final` en variables de instancia inmutables.

### 13.5 Análisis en Pull Requests
Configurar el análisis para que comente en el PR los problemas detectados y bloquee el merge si no se supera el Quality Gate.

---

## 14. Aplicación del Estándar

- Automatizar la verificación de estilo en el build (CI/CD) para que falle si no se cumple.
- Incluir hooks de pre-commit para formateo (Spotless).
- Realizar revisiones de código (pull requests) donde se verifique el cumplimiento.
- El análisis de SonarQube debe pasar antes de fusionar cualquier rama.

---

## 15. Fuentes y Justificaciones

Las decisiones aquí presentadas se basan en:

1. **Google Java Style Guide** – Ampliamente adoptado, mejora la legibilidad y consistencia.
2. **Spring Boot Reference** – Prácticas recomendadas por el equipo de Spring.
3. **MongoDB Best Practices** – Rendimiento y escalabilidad en bases de datos documentales.
4. **OWASP Top Ten** – Para garantizar la seguridad de las aplicaciones.
5. **Clean Code (Robert C. Martin)** – Principios de código limpio aplicados a nuestro contexto.
6. **RESTful Web APIs** – Para diseño de APIs coherente y predecible.
7. **SonarQube Documentation** – Para definir umbrales de calidad y análisis continuo.
8. **Maven Best Practices** – Gestión de dependencias y construcción reproducible.

La combinación de estas fuentes asegura que nuestro estándar esté alineado con la industria y sea pragmático para nuestro stack.

---

## Apéndice A: Resumen de Reglas Clave

| Categoría               | Regla                                                                 |
|-------------------------|-----------------------------------------------------------------------|
| Indentación             | 2 espacios, sin tabs                                                  |
| Longitud línea          | 120 caracteres máximo                                                 |
| Nombres clases          | UpperCamelCase                                                        |
| Nombres métodos         | lowerCamelCase                                                        |
| Constantes              | UPPER_SNAKE_CASE                                                      |
| Anotaciones             | En líneas separadas                                                   |
| Javadoc                 | Obligatorio en APIs públicas                                          |
| DTOs                    | Inmutables (record o @Value)                                          |
| Excepciones             | Personalizadas para negocio, manejador global                         |
| Logging                 | Usar MDC para correlación, no datos sensibles                         |
| Seguridad               | JWT + Spring Security, validación de entrada, CORS restrictivo        |
| Pruebas                 | Unitarias + Integración con Testcontainers, cobertura >70%            |
| MongoDB                 | Índices necesarios, auditoría, evitar N+1                             |
| Complejidad ciclomática | ≤ 10 por método                                                       |
| Maven                   | Uso de spring-boot-starter-parent, plugins de calidad                 |
| SonarQube               | Quality Gate: cobertura ≥70%, complejidad ≤10, duplicación ≤3%        |

---
