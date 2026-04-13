# 🧪 HealthCore: Estrategia de Pruebas en Java (Spring Boot)

## 1. Filosofía de Calidad
En HealthCore, el código no está terminado cuando "funciona en mi máquina", está terminado cuando está respaldado por pruebas automatizadas. Tenemos un requerimiento no funcional estricto: **Alcanzar al menos un 70% de cobertura de código en la capa de servicios**. 

Dado que somos un sistema de salud (cálculo de calorías, expedientes, dobles reservas), un error matemático o de concurrencia puede afectar gravemente a un paciente o al trabajo del nutriólogo.

## 2. La Pirámide de Pruebas en nuestro Stack
Utilizamos el ecosistema estándar de Spring Boot (`spring-boot-starter-test`) y dividimos nuestras pruebas en dos niveles principales:

### A. Pruebas Unitarias (Unit Testing)
* **Objetivo:** Probar la lógica de negocio (la carpeta `services`) en total aislamiento.
* **Herramientas:** **JUnit 5** (para la ejecución) y **Mockito** (para simular/burlar dependencias).
* **Regla:** Una prueba unitaria **NUNCA** debe conectarse a una base de datos real, a RabbitMQ ni hacer llamadas gRPC por internet. Todo debe ser simulado (Mockeado). Son pruebas que se ejecutan en milisegundos.

### B. Pruebas de Integración (Integration Testing)
* **Objetivo:** Probar que nuestro código de Java se comunica correctamente con la base de datos o el broker de mensajes.
* **Herramientas:** **Testcontainers** y `@SpringBootTest`.
* **Regla:** Usamos contenedores Docker desechables. Al correr `mvn test`, Testcontainers levanta un MongoDB real en Docker, corre la prueba contra él y luego lo destruye. Esto garantiza que las pruebas no ensucien la base de datos de desarrollo.

---

## 3. Guía de Pruebas Unitarias (Ejemplo Práctico)
Para mantener el código limpio, usamos el patrón **BDD (Behavior-Driven Development)** estructurando cada prueba en tres bloques: `Given` (Dado que), `When` (Cuando), `Then` (Entonces).

*Ejemplo de cómo Arturo debería probar la validación de una cita en el `AgendaService`:*

```java
@ExtendWith(MockitoExtension.class)
class AgendaServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository; // Simulamos la BD

    @Mock
    private ClinicalGrpcClient clinicalGrpcClient; // Simulamos la llamada a otro microservicio

    @InjectMocks
    private AgendaService agendaService; // El servicio real que estamos probando

    @Test
    @DisplayName("Debe lanzar excepción si el paciente no está vinculado al nutriólogo")
    void shouldThrowExceptionWhenPatientNotLinked() {
        // GIVEN (Preparación)
        UUID patientId = UUID.randomUUID();
        UUID nutritionistId = UUID.randomUUID();
        
        // Le decimos al mock de gRPC qué responder (simulamos que NO están vinculados)
        when(clinicalGrpcClient.isPatientLinked(patientId, nutritionistId)).thenReturn(false);

        // WHEN & THEN (Acción y Verificación)
        assertThrows(UnlinkedPatientException.class, () -> {
            agendaService.scheduleAppointment(patientId, nutritionistId, LocalDateTime.now());
        });
        
        // Verificamos que NUNCA se haya intentado guardar en base de datos
        verify(appointmentRepository, never()).save(any());
    }
}

## 4. Guía de Pruebas de Integración con Testcontainers
Cuando necesitamos probar un `Repository` para asegurar que las consultas de MongoDB (ej. búsquedas personalizadas) funcionan de verdad, usamos Testcontainers.

```java
@DataMongoTest // Carga solo el contexto de MongoDB
@Testcontainers // Habilita el uso de contenedores Docker para la prueba
class PatientRepositoryTest {

    // Levantamos un Mongo 7.0 desechable solo para esta clase de pruebas
    @Container
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:7.0");

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        // Le inyectamos la URL del Mongo desechable a Spring Boot
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }

    @Autowired
    private PatientRepository patientRepository;

    @Test
    void shouldSaveAndFindPatientByEmail() {
        // Esta prueba SÍ toca una base de datos real (la del contenedor desechable)
        Patient patient = new Patient("Juan", "Perez", "juan@test.com");
        patientRepository.save(patient);

        Optional<Patient> found = patientRepository.findByEmail("juan@test.com");
        assertTrue(found.isPresent());
    }
}
```

---

## 5. Medición de Cobertura (JaCoCo)
Para asegurarnos de cumplir el 70% requerido, hemos integrado el plugin **JaCoCo** (Java Code Coverage) en nuestro `pom.xml`.

**¿Cómo verificar tu cobertura antes de hacer Commit?**
1. Abre la terminal en el microservicio que modificaste.
2. Ejecuta: `mvn clean test`
3. JaCoCo generará un reporte visual. Abre en tu navegador el archivo: `target/site/jacoco/index.html`.
4. Verás en verde las líneas de código que tus pruebas ejecutaron, en amarillo las ramas condicionales (Ifs) evaluadas a medias, y en rojo el código que jamás se probó.

**Criterios de Aceptación del Equipo:**
* **`controllers`:** Cobertura opcional (son solo pasarelas al servicio).
* **`entities` / `dtos`:** No requieren pruebas lógicas (son POJOs sin lógica).
* **`services`:** **Obligatorio ≥ 70%.** Aquí vive el negocio; aquí no se permiten descuidos.