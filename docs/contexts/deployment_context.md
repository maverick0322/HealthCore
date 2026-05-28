# HealthCore: Estrategia de despliegue e infraestructura

## 1. Vision general

HealthCore opera bajo una arquitectura distribuida de microservicios contenerizados con Docker. El objetivo es mantener aislamiento, portabilidad y consistencia entre entornos locales y productivos.

## 2. Fronteras del sistema

- **Clientes:** PWA en React y aplicacion desktop basada en Electron.
- **Gateway / DMZ:** NGINX como punto de entrada publico.
- **Red privada Docker:** microservicios, bases de datos y componentes internos sin exposicion directa obligatoria al exterior.

## 3. Contenedores principales

### Microservicios core

- `healthcore-identity-service`: autenticacion, autorizacion y emision de JWT.
- `healthcore-tracking-service`: diarios de consumo, agua y progreso biometrico.
- `healthcore-agenda-service`: disponibilidad de nutriologos, slots y citas.
- `healthcore-clinical-service`: expediente clinico, perfiles de paciente y nutriologo, observaciones, vinculacion profesional, planes nutricionales y enriquecimiento de fotos de perfil mediante `media-service`.
- `healthcore-media-service`: generacion de URLs firmadas y acceso a almacenamiento de objetos.
- `healthcore-catalog-service`: adaptador Python hacia proveedores externos de informacion nutricional.

### Infraestructura de soporte

- `healthcore-api-gateway`: reverse proxy y manejo centralizado de CORS.
- `mongodb`: base compartida solo para modulos que hoy la usan en ese contenedor.
- `agenda-mongodb`: MongoDB dedicada para agenda.
- `clinical-mongodb`: MongoDB dedicada para clinical.
- `redis`: soporte de rendimiento y caching donde aplica.
- `rabbitmq`: broker para eventos asincronos del ecosistema.

## 4. Persistencia y aislamiento

Para respetar **Database per Service**, cada dominio operativo consulta exclusivamente su propia base. Cuando otro servicio necesita informacion clinica, de agenda o identidad, la solicita por red en lugar de consultar Mongo directamente.

Instancias Mongo actualmente relevantes:

- `mongodb` en host `27018`
- `agenda-mongodb` en host `27019`
- `clinical-mongodb` en host `27020`

## 5. Servicios externos

- **Cloudflare R2:** almacenamiento de objetos usado a traves de `media-service`.
- **FatSecret API:** fuente de informacion nutricional consultada por `catalog-service`.

## 6. Nota de desarrollo local

Aunque el API Gateway es el punto de entrada principal para frontend, algunos servicios publican puertos directos al host para depuracion y Swagger. `clinical-service`, por ejemplo, se documenta localmente en `http://localhost:8087/docs` mientras su puerto interno de aplicacion sigue siendo `8083`.
