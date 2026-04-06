# Estándar de Código y Estilo para Microservicios con Java 21, Spring Boot y MongoDB

Este documento define las reglas arquitectónicas, convenciones de codificación y estándares de calidad obligatorios para el desarrollo de microservicios en el proyecto HealthCore. El objetivo es garantizar un ecosistema de código limpio, modular, escalable y preparado para CI/CD.

---

## 1. Principios Generales (Clean Code)

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

## 2. Propósito
Garantizar la consistencia, legibilidad, seguridad y mantenibilidad del código fuente entre todos los miembros del equipo, facilitando la integración continua y el cumplimiento del análisis estático (SonarQube).

## 3. Idioma
Todo el código fuente, base de datos y documentación interna debe aplicar el principio **English First**.
* **Correcto**: `PatientService`, `findByEmail`, `// Checks if user exists`
* **Incorrecto**: `ServicioPaciente`, `buscarPorCorreo`, `// Revisa si existe`

## 4. Estructura del proyecto (Arquitectura Hexagonal)
Para garantizar la separación de responsabilidades y la inversión de dependencias (principios SOLID), los microservicios adoptarán la Arquitectura Hexagonal (Ports and Adapters). El código debe organizarse estrictamente en las siguientes capas, respetando la regla de dependencia hacia adentro (el dominio no conoce a la infraestructura):

* **`domain/`**: Entidades puras de Java, `records`, enumeradores y excepciones de negocio. **Regla de oro:** Cero dependencias de Spring Boot, MongoDB o web.
* **`application/`**: Casos de uso (Services) que orquestan el dominio. Aquí se definen las interfaces (puertos) que indican qué necesita el sistema para funcionar.
* **`infrastructure/`**: Implementaciones técnicas (adaptadores). Aquí viven los repositorios de Spring Data MongoDB, clientes gRPC/HTTP externos y configuraciones de seguridad.
* **`interfaces/`**: Puntos de entrada de comunicación hacia el microservicio (Controladores REST, DTOs de entrada/salida y WebSockets).

## 5. Reglas de nombramiento

### 5.1. Clases
Deben usar `UpperCamelCase` y ser sustantivos descriptivos.
* **Correcto**:
  ```java
  public class UserAuthenticationService { ... }
  ```
* **Incorrecto**:
  ```java
  public class authenticate_user { ... } // Snake case y verbo
  ```

### 5.2. Interfaces
Deben usar `UpperCamelCase`. En Java no se usa el prefijo "I".
* **Correcto**:
  ```java
  public interface PatientRepository { ... }
  ```
* **Incorrecto**:
  ```java
  public interface IPatientRepository { ... }
  ```

### 5.3. Paquetes
 Deben ir en minúsculas y sin guiones o caracteres especiales.
* **Correcto**:
  ```java
  package com.healthcore.identity.domain;
  ```
* **Incorrecto**:
  ```java
  package com.HealthCore.Identity-Service;
  ```

### 5.4. Variables
Deben usar `lowerCamelCase` y tener nombres expresivos. Evitar abreviaturas ambiguas.
* **Correcto**:
  ```java
  int loginAttempts = 0;
  String userEmail = request.email();
  ```
* **Incorrecto**:
  ```java
  int x = 0;
  String eml = request.email();
  ```

### 5.5. Constantes
Deben usar `UPPER_SNAKE_CASE` y el modificador `public static final`. Prohibido usar "números mágicos" sueltos en el código.
* **Correcto**:
  ```java
  public static final int MAX_LOGIN_RETRIES = 3;
  ```
* **Incorrecto**:
  ```java
  public int maxRetries = 3;
  ```

### 5.6. Métodos
Deben usar `lowerCamelCase` y comenzar con un verbo claro que denote la acción.
* **Correcto**:
  ```java
  public User calculateBmi(double weight, double height) { ... }
  ```
* **Incorrecto**:
  ```java
  public User BMI(double weight, double height) { ... }
  ```

### 5.7. Getters y Setters
Se favorecerá el uso de `Records` (inmutables) o anotaciones de Lombok para evitar código repetitivo. Si se escriben manualmente, usar el estándar `getX` / `setX`.
* **Correcto**:
  ```java
  public String getEmail() { return this.email; }
  ```
* **Incorrecto**:
  ```java
  public String email() { return this.email; } // En clases normales (no records)
  ```

### 5.8. Manejadores de eventos
Los métodos que responden a eventos asíncronos o de Spring deben llevar el prefijo `handle` o `on`.
* **Correcto**:
  ```java
  @EventListener
  public void handleUserRegisteredEvent(UserRegisteredEvent event) { ... }
  ```
* **Incorrecto**:
  ```java
  @EventListener
  public void doRegistrationStuff(UserRegisteredEvent event) { ... }
  ```

### 5.9. Uso de expresiones lambda y nombramiento de ámbitos reducidos
En expresiones lambda, evitar bloques grandes de código. Si la lambda supera las 3 líneas, extraerla a un método privado.
* **Correcto**:
  ```java
  users.stream().filter(User::isActive).collect(Collectors.toList());
  ```
* **Incorrecto**:
  ```java
  users.stream().filter(u -> {
      boolean active = u.getStatus().equals("ACTIVE");
      return active;
  }).collect(Collectors.toList());
  ```

### 5.10. Uso de nombres descriptivos concisos en lambdas
Usar una o dos letras si el contexto es extremadamente obvio, de lo contrario, usar el nombre completo de la variable.
* **Correcto**:
  ```java
  patients.forEach(patient -> log.info(patient.getName()));
  ```
* **Incorrecto**:
  ```java
  patients.forEach(p -> log.info(p.getName())); // Evitar si el cuerpo es largo
  ```

## 6. Estilo de código

### 6.1. Indentación
La indentación estricta será de **4 espacios** (no tabulaciones).

### 6.2. Líneas y espacios en blanco
Dejar una línea en blanco entre métodos y espacios alrededor de los operadores matemáticos y lógicos.
* **Correcto**:
  ```java
  int total = a + b;
  ```
* **Incorrecto**:
  ```java
  int total=a+b;
  ```

### 6.3. Uso de llaves
Adoptamos el estilo "Egyptian brackets" (la llave de apertura va en la misma línea de la declaración).
* **Correcto**:
  ```java
  if (isValid) {
      process();
  }
  ```
* **Incorrecto**:
  ```java
  if (isValid)
  {
      process();
  }
  ```

## 7. Comentarios
El código limpio debe explicarse a sí mismo.

### 7.1. Comentarios de línea única
Usar `//` exclusivamente para explicar el *por qué* de una decisión técnica, nunca el *qué*.
* **Correcto**:
  ```java
  // Timeout is 10s because the external API is slow during peak hours
  ```
* **Incorrecto**:
  ```java
  // Loops through the list of users
  ```

### 7.2. Comentarios de bloque
Usar `/* */` está prohibido para comentar bloques de código muerto. El código obsoleto se borra (Git guarda el historial).

### 7.3. Comentarios de documentación
Usar Javadoc `/** */` únicamente en interfaces, contratos y APIs públicas.

## 8. Estructuras de control
Todas las estructuras deben llevar llaves `{}` incluso si contienen una sola línea.

### 8.1. If-Else
* **Correcto**:
  ```java
  if (condition) {
      doSomething();
  } else {
      doOther();
  }
  ```
* **Incorrecto**:
  ```java
  if(condition) doSomething(); else doOther();
  ```

### 8.2. Else-If
Alineado con la llave de cierre del `if` anterior.

### 8.3. Switch
Favorecer el uso del Enhanced Switch de Java 21 para evitar errores de `break` olvidados.
* **Correcto**:
  ```java
  int numLetters = switch (day) {
      case MONDAY, FRIDAY, SUNDAY -> 6;
      case TUESDAY -> 7;
      default -> 0;
  };
  ```

### 8.4. For
* **Correcto**:
  ```java
  for (int i = 0; i < max; i++) { ... }
  ```

### 8.5. While
* **Correcto**:
  ```java
  while (isRunning) { ... }
  ```

### 8.6. Do-While
* **Correcto**:
  ```java
  do {
      execute();
  } while (condition);
  ```

## 9. Sufijos

### 9.1. Capa gráfica
En una API REST, la capa gráfica son las interfaces de comunicación. Deben llevar el sufijo correspondiente a su responsabilidad:
* **Controladores**: `XController` (ej. `PatientController`).
* **Entradas**: `XRequest` (ej. `LoginRequest`).
* **Salidas**: `XResponse` (ej. `TrackingResponse`).

## 10. Manejo de excepciones
El manejo debe ser escalonado, de la excepción más específica a la más general. 
* **Correcto**:
  ```java
  try {
      parse();
  } catch (ExpiredJwtException e) {
      throw new UnauthorizedException("Expired");
  } catch (Exception e) {
      throw new InternalServerException("System error");
  }
  ```
* **Incorrecto**:
  ```java
  try {
      parse();
  } catch (Exception e) {
      e.printStackTrace(); // Nunca usar printStackTrace
  }
  ```

## 11. Bitácora
Usar `SLF4J` (con `@Slf4j` de Lombok). Los niveles se definen así:

### 11.1. Fatal
En SLF4J no existe "FATAL", se usa `log.error()` junto con alarmas de monitoreo para caídas totales del servicio (ej. pérdida de conexión a base de datos).
### 11.2. Error
Para fallos no esperados donde se rompe el flujo del usuario. Requiere imprimir el *stacktrace*.
* **Ejemplo**: `log.error("Failed to process payment", e);`
### 11.3. Warning (Advertencia)
Situaciones anómalas que no detienen el sistema, o vulnerabilidades detectadas.
* **Ejemplo**: `log.warn("Failed login attempt for user: {}", email);`
### 11.4. Trace (Traza/Información)
Para flujo normal del sistema (`log.info()`) y detalles para depuración (`log.debug()`).

## 12. Pruebas
Obligatorio aplicar JUnit 5, Mockito y el patrón AAA (Arrange, Act, Assert).
* **Correcto**:
  ```java
  @Test
  void shouldReturnUser_WhenIdExists() {
      // Arrange
      when(repository.findById(1)).thenReturn(mockUser);
      // Act
      User result = service.getUser(1);
      // Assert
      assertNotNull(result);
  }
  ```

## 13. Seguridad

### 13.1. Consultas parametrizadas
Usar siempre los repositorios de Spring Data MongoDB o consultas parametrizadas explícitas para evitar inyecciones NoSQL.
* **Incorrecto**: Concatenar Strings en consultas de base de datos.

### 13.2. Políticas de contraseñas
Las contraseñas nunca deben viajar legibles ni guardarse en texto plano. Usar siempre `BCryptPasswordEncoder`.

### 13.3. Validación de entradas
Usar `jakarta.validation` (`@Valid`, `@NotBlank`, `@Email`) en los DTOs de entrada antes de tocar la lógica de negocio.

### 13.4. Códigos de mensajes
Las respuestas de la API deben devolver códigos HTTP precisos (`200 OK`, `201 Created`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`).

## 14. Declaración de uso de IA
Se declara que para la configuración, revisión de estándares de la industria (OWASP, SonarQube) y estructuración de este documento se utilizó asistencia de Inteligencia Artificial como herramienta de co-pilotaje y optimización de arquitectura.

## 15. Referencias
* [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
* [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
* [RFC 7807 - Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc7807)