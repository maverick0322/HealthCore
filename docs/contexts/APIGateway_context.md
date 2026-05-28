# HealthCore: API Gateway (NGINX)

## 1. El problema que resolvemos

En una arquitectura de microservicios pura, cada aplicacion corre en su propio puerto. Si el frontend tuviera que conocer todas esas URLs, quedaria acoplado a la topologia interna y aumentaria la superficie de error y seguridad.

## 2. Nuestro patron API Gateway

HealthCore implementa un **API Gateway** con **NGINX** como reverse proxy. Este componente centraliza:

1. **Unificacion de dominio:** el cliente web consume un unico punto de entrada.
2. **Enrutamiento inteligente:** NGINX redirige cada peticion al contenedor correcto.
3. **Politicas CORS:** las cabeceras necesarias se aplican desde el gateway.
4. **Separacion de responsabilidades:** frontend no necesita conocer la red privada Docker.

## 3. Mapa de enrutamiento

| Ruta de entrada | Destino interno | Microservicio |
| :--- | :--- | :--- |
| `/api/v1/auth/**` | `http://healthcore-identity-service:8082` | Identity Service |
| `/api/v1/tracking/**` | `http://healthcore-tracking-service:8080` | Tracking Service |
| `/api/v1/agenda/**` | `http://healthcore-agenda-service:8080` | Agenda Service |
| `/api/v1/clinical/**` | `http://healthcore-clinical-service:8083` | Clinical Service |
| `/api/v1/media/**` | `http://healthcore-media-service:8088` | Media Service |

> Nota arquitectonica: `catalog-service` no tiene ruta REST publica en el gateway. Su acceso es interno via gRPC.

## 4. Puertos y acceso local

El API Gateway sigue siendo el punto de entrada principal para frontend. Sin embargo, en desarrollo local algunos microservicios tambien publican puertos directos al host para depuracion y consulta de Swagger.

En particular:

- `clinical-service` atiende REST internamente en `8083`
- `clinical-service` publica Swagger localmente en `http://localhost:8087/docs`
- el trafico funcional de frontend sigue entrando por `/api/v1/clinical/**` a traves de NGINX

Esto permite validar documentacion OpenAPI sin cambiar la ruta oficial consumida por la aplicacion web.

## 5. Gestion de CORS

Para evitar errores de navegador por politica CORS, NGINX intercepta las peticiones `OPTIONS` y responde con las cabeceras correspondientes antes de enviar trafico al microservicio destino.

## 6. Referencia de configuracion

La estructura base del `nginx.conf` sigue este patron:

```nginx
server {
    listen 80;
    server_name localhost;

    location /api/v1/auth/ {
        proxy_pass http://identity-service:8082/api/v1/auth/;
    }

    location /api/v1/clinical/ {
        proxy_pass http://clinical-service:8083;
    }
}
```
