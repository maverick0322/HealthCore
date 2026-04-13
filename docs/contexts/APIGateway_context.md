# 🚪 HealthCore: API Gateway (NGINX)

## 1. El Problema que Resolvemos
En una arquitectura de microservicios pura, tenemos múltiples aplicaciones corriendo en diferentes puertos (ej. Identity en `8082`, Tracking en `8080`). Si el frontend (React/Electron) tuviera que comunicarse directamente con ellos, tendría que memorizar todas estas URLs y puertos, exponiendo la topología interna de nuestra red y abriendo vulnerabilidades de seguridad.

## 2. Nuestro "Cadenero": El Patrón API Gateway
Para solucionar esto, HealthCore implementa un **API Gateway** utilizando **NGINX** (versión Alpine por su ligereza). Este componente actúa como el *Reverse Proxy* (Proxy Inverso) y es el **único** punto de entrada público a todo nuestro clúster de backend.

### Responsabilidades Clave:
1. **Unificación de Dominio:** El cliente web solo hace peticiones a un único lugar (ej. `http://api.healthcore.com` o `http://localhost:80`).
2. **Enrutamiento Inteligente:** NGINX lee la URL solicitada y redirige el tráfico silenciosamente al contenedor Docker correspondiente.
3. **Terminación SSL:** (En producción) NGINX descifra el certificado HTTPS y envía tráfico HTTP plano hacia adentro de la red Docker, quitando esa carga de procesamiento a las apps de Java.
4. **Manejo Centralizado de CORS:** Evita que el frontend sea bloqueado por el navegador, inyectando las cabeceras necesarias sin modificar el código de Spring Boot.

## 3. Mapa de Enrutamiento (Routing Rules)
El Gateway decide a qué microservicio enviar la petición basándose en el prefijo de la URL. Este es el mapeo oficial de HealthCore:

| Ruta de Entrada (Petición Frontend) | Destino Interno (Docker Network) | Microservicio Responsable |
| :--- | :--- | :--- |
| `/api/v1/auth/**` | `http://healthcore-identity-service:8082` | Identity Service |
| `/api/v1/tracking/**` | `http://healthcore-tracking-service:8080` | Tracking Service |
| `/api/v1/agenda/**` | `http://healthcore-agenda-service:XXXX` | Agenda Service |
| `/api/v1/clinical/**` | `http://healthcore-clinical-service:XXXX` | Clinical Service |
| `/api/v1/media/**` | `http://healthcore-media-service:XXXX` | Media Service |

*Nota Arquitectónica: El `Catalog Service` (Python) NO tiene una ruta pública aquí. Su acceso es estrictamente interno (gRPC) y solo el `Tracking Service` puede hablar con él.*

## 4. Aislamiento de Puertos (Seguridad Docker)
Gracias a NGINX, podemos aplicar un principio de "Confianza Cero" (Zero Trust) en nuestra red de Docker. 

En nuestro archivo `docker-compose.yml`, los microservicios de Spring Boot **no exponen** sus puertos hacia la máquina host (no usan la directiva `ports: ["8080:8080"]`). Solo usan el puerto interno del contenedor (`expose: 8080`). El único contenedor que tiene permiso de abrir un puerto hacia tu computadora o hacia internet es el API Gateway (`ports: ["80:80"]`).

## 5. Gestión de CORS (Cross-Origin Resource Sharing)
Para que las pantallas desarrolladas en React puedan consumir las APIs sin el temido error de "CORS Policy Blocked", NGINX interceptará las peticiones del navegador (peticiones `OPTIONS` o *Preflight*) y responderá automáticamente con éxito, inyectando las cabeceras:
* `Access-Control-Allow-Origin: *` (Se restringirá al dominio de producción posteriormente).
* `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
* `Access-Control-Allow-Headers: Authorization, Content-Type`

## 6. Fragmento de Configuración Base (`nginx.conf`)
Para referencia del equipo de desarrollo, así luce la estructura lógica que rige el enrutamiento dentro de nuestro archivo de configuración:

```nginx
server {
    listen 80;
    server_name localhost;

    # Regla para Identity
    location /api/v1/auth/ {
        proxy_pass http://healthcore-identity-service:8082/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Regla para Tracking
    location /api/v1/tracking/ {
        proxy_pass http://healthcore-tracking-service:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # ... otras reglas de servicios
}