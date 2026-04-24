# HealthCore

HealthCore is a comprehensive health and fitness management platform. 

---

## 👥 The Velvet Team
This project is a collaborative effort dedicated to building a high-performance, scalable health ecosystem.
- **Core Strategy**: Clean Architecture & gRPC Integration

---

## 📂 Repository Structure

- `apps/health-core`: Main React web application.
- `apps/health-core-desktop`: Placeholder for the future desktop client.
- `services/`: Backend microservices (pending).
- `docs/`: Technical documentation.

## 🛠️ Getting Started

To get the project running locally, please follow the **[Setup Guide](docs/setup.md)**.

## 🐳 Ecosistema Backend con Docker Compose

La forma oficial y recomendada de levantar todo el ecosistema backend (bases de datos, microservicios, frontend web y gateway) es a través de Docker Compose. Ya no es necesario levantar servicios individuales o configurar entornos virtuales manualmente.

**Servicios principales incluidos:**
- `api-gateway` (NGINX): Punto de entrada principal (`localhost:80`)
- `identity-service` (Spring Boot): Gestión de usuarios y Auth (`localhost:8082`)
- `agenda-service` (Spring Boot): Gestión de citas y disponibilidad (`localhost:8083`)
- `tracking-service` (Spring Boot): Diarios y seguimiento de pacientes (`localhost:8080`)
- `catalog-service` (Python/FastAPI/gRPC): Búsqueda de información nutricional (`localhost:50051`)
- Bases de datos (MongoDB) y UIs administrativas (Mongo Express).

**Levantar todo el ecosistema:**
```powershell
docker compose up -d --build
```

**Ver el estado de los contenedores:**
```powershell
docker compose ps
```

**Apagar el ecosistema:**
```powershell
docker compose down
```

## 📖 Documentación de la API (Swagger)

Cada microservicio expone su propia documentación interactiva utilizando Swagger/OpenAPI. Una vez que hayas levantado el ecosistema con Docker Compose, puedes consultar los endpoints en las siguientes URLs:

- **Identity Service:** 👉 [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html)
- **Agenda Service:** 👉 [http://localhost:8083/swagger-ui.html](http://localhost:8083/swagger-ui.html)

## 💻 Entorno Desktop (Electron)

HealthCore también cuenta con una versión de escritorio empaquetada con Electron. **No es necesario duplicar el código.** El entorno de escritorio está configurado para consumir el código de la aplicación web directamente.

Para probar la versión de escritorio mientras desarrollas:

1. Levanta el servidor de desarrollo de la app web normalmente:
   ```powershell
   cd apps/health-core
   npm run dev
   ```
   *(Esto levantará Vite en el puerto 5173).*
2. En otra terminal, navega al proyecto de escritorio y levanta Electron:
   ```powershell
   cd apps/health-core-desktop
   npm install
   npm run dev
   ```
El proyecto de Electron cargará automáticamente `http://localhost:5173` y mostrará la misma aplicación web dentro de una ventana nativa.

## ⚙️ Variables de entorno locales

Para que el ecosistema funcione correctamente de forma local, debes tener un archivo `.env` en la raíz del proyecto. Puedes copiar el archivo de ejemplo:

```powershell
cp .env.example .env
```
Asegúrate de llenar variables críticas como `JWT_SECRET` y credenciales de OAuth2 (Auth0) si planeas probar los flujos de autenticación completos.

---
## Sobre el frontend
 **Compatibility**: When installing new packages, remember to use `--legacy-peer-deps` due to current Vite 8 plugin resolution.

### 📱 Pruebas en Dispositivos Móviles (PWA UI Testing)

Para visualizar cómo se comporta la UI o probar la instalación de la PWA en un dispositivo móvil real sin complicaciones de red local o certificados, puedes exponer el frontend a internet usando un túnel temporal.

1. Asegúrate de tener el frontend corriendo en modo desarrollo (`npm run dev` en `apps/health-core`).
2. Abre una nueva terminal y ejecuta Ngrok o Localtunnel:
   ```powershell
   npx ngrok http 5173
   # o alternativamente: npx localtunnel --port 5173
   ```
3. Abre el enlace HTTPS generado en el navegador de tu celular. Podrás ver la interfaz y el navegador te ofrecerá instalar la PWA.

> **Nota:** Esta técnica tuneliza únicamente la interfaz de React. Como el backend (Identity, Agenda, Gateway) sigue estando local en tu máquina, las funcionalidades complejas como el inicio de sesión OAuth2 fallarán si interactúas desde el teléfono. Usa esto **solo** para validar vistas de UI y la correcta instalación de la PWA.
## 🌿 Flujo de Trabajo (Git Workflow)

**NUNCA trabajes directamente en la rama `main`.**

1. Actualiza tu rama principal: `git checkout main` y luego `git pull origin main`
2. Crea tu rama de trabajo: `git checkout -b feature/nombre-de-tu-tarea`
* **`[FEAT]`**: Para añadir funcionalidades, describe lo que añadiste en el commit.
* **`[CHORE]`**: Para tareas, describe la tarea hecha en el commit.
* **`[FIX]`**: Para arreglar, describe el problema que arreglaste en el commit.
* **`[DOC]`**: para documentación, describe la documentación agregada en el commit.
* **`[PERF]`**: Para optimización, describe lo que optimizaste en el commit.
* **`[REFACTOR]`**: para refactorización, describe lo que refactorizaste en el commit.
3. Revisamos en qué rama nos encontramos: `git branch`
4. Revisamos qué archivos hemos modificado: `git status`
5. Añade todos los cambios trabajados en memoria: `git add .`
6. Guarda los cambios: `git commit -m "feat: agregué X componente"`
7. Sube tu rama: `git push -u origin feature/nombre-de-tu-tarea`
8. Ve a GitHub y abre un **Pull Request** para revisión, agrega una descripción clara y crea el pull request.
9. Cuando se apruebe el merge regresa a la rama principal y actualízala: `git checkout main` y luego `git pull origin main`
