# HealthCore: Protocolos y comunicacion entre microservicios

## 1. Paradigma de comunicacion

En HealthCore aplicamos estrictamente el patron **Database per Service**. Ningun servicio consulta la base de datos de otro; si necesita informacion o efectos inmediatos, debe pedirlos por red.

La comunicacion del ecosistema se divide en tres canales:

- **REST externo**
- **gRPC interno sincrono**
- **RabbitMQ interno asincrono**

---

## 2. Comunicacion externa

**Tecnologia:** HTTP/REST con JSON  
**Actores:** Frontend -> API Gateway -> Microservicios

REST es la capa publica para operaciones de interfaz. Ningun microservicio se comunica con otro mediante REST.

---

## 3. Comunicacion interna sincrona

**Tecnologia:** gRPC con Protocol Buffers  
**Actores:** Microservicio -> Microservicio

Usamos gRPC cuando un servicio necesita una respuesta inmediata de otro para completar una validacion o enriquecer su respuesta al usuario.

### Mapa de llamadas gRPC actual

1. **`Tracking Service` -> `Catalog Service`** para consultar macronutrientes por codigo de barras o busqueda libre.
2. **`Agenda Service` -> `Clinical Service`** para validar que el paciente tenga un vinculo activo con un nutriologo.
3. **`Tracking Service` -> `Clinical Service`** para solicitar peso actual y metas clinicas del paciente.
4. **`Clinical Service` -> `Catalog Service`** para buscar alimentos y enriquecer ingredientes del plan nutricional.
5. **`Tracking Service` -> `Media Service`** para resolver URLs prefirmadas de lectura de imagenes.
6. **`Clinical Service` -> `Media Service`** para resolver URLs de lectura de fotos de perfil de pacientes y nutriologos.
7. **`Clinical Service` -> `Agenda Service`** para cancelar citas futuras cuando una vinculacion clinica termina.

---

## 4. Comunicacion interna asincrona

**Tecnologia:** AMQP con RabbitMQ  
**Actores:** Publicador -> Broker -> Consumidor

RabbitMQ se usa para disparar consecuencias en segundo plano sin bloquear la respuesta al usuario.

### Contratos de eventos documentados

**Exchange:** `healthcore.identity.events`

1. **`UserRegisteredEvent`**
   - Routing key: `identity.user.registered`
   - Consumidores esperados: `agenda-service`, `notification-service`
   - Nota: en el estado actual del repositorio, `clinical-service` no implementa un consumidor activo para este evento.

2. **`PasswordResetRequestedEvent`**
   - Routing key: `identity.password.reset.requested`
   - Consumidor esperado: `notification-service`

**Exchange:** `healthcore.agenda.events`

1. **`AppointmentConfirmedEvent`**
   - Routing key: `agenda.appointment.confirmed`
   - Consumidor esperado: `notification-service`

2. **`AppointmentCancelledEvent`**
   - Routing key: `agenda.appointment.cancelled`
   - Consumidor esperado: `notification-service`

3. **`AppointmentReminderEvent`**
   - Routing key: `agenda.appointment.reminder`
   - Consumidor esperado: `notification-service`

---

## 5. Casos de uso representativos

### Registro de usuario

1. El usuario se registra en `identity-service`.
2. `identity-service` persiste credenciales y publica un evento en RabbitMQ.
3. La respuesta HTTP vuelve al frontend sin esperar a consumidores posteriores.
4. Servicios consumidores como `notification-service` o `agenda-service` reaccionan en segundo plano. `clinical-service` no consume este evento en el codigo actual.

### Procesamiento multimedia delegado

1. El frontend solicita a `media-service` una URL firmada de subida.
2. El binario se sube directamente a Cloudflare R2.
3. El frontend guarda solo la `photoKey` en el microservicio destino, por ejemplo `tracking-service` o `clinical-service`.
4. Al leer el recurso, el microservicio llama por gRPC a `media-service` para convertir esa key en una URL de lectura temporal.

---

## 6. Regla practica para desarrollo

1. Si el dato lo necesita el usuario en pantalla, crea un endpoint REST.
2. Si otro servicio necesita el dato de inmediato para responder, usa gRPC.
3. Si el usuario no necesita esperar el efecto completo en otros modulos, usa eventos asincronos.
