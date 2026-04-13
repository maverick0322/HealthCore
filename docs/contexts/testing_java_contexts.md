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