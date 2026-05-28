# HealthCore

HealthCore is a comprehensive health and fitness management platform.

---

## The Velvet Team

This project is a collaborative effort dedicated to building a high-performance, scalable health ecosystem.

- **Core Strategy**: Clean Architecture and gRPC integration

---

## Repository Structure

- `apps/health-core`: Main React web application.
- `apps/health-core-desktop`: Placeholder for the future desktop client.
- `services/`: Backend microservices.
- `docs/`: Technical documentation.

## Getting Started

To get the project running locally, please follow the **[Setup Guide](docs/setup.md)**.

## Ecosistema Backend con Docker Compose

La forma oficial y recomendada de levantar todo el ecosistema backend es a traves de Docker Compose. Ya no es necesario levantar servicios individuales ni configurar entornos virtuales manualmente.

**Servicios principales incluidos:**
- `api-gateway` (NGINX): punto de entrada principal (`localhost:80`)
- `identity-service` (Spring Boot): gestion de usuarios y autenticacion (`localhost:8082`)
- `agenda-service` (Spring Boot): gestion de citas y disponibilidad (`localhost:8083`)
- `clinical-service` (Spring Boot): expediente clinico, vinculacion y planes nutricionales (`localhost:8087`)
- `tracking-service` (Spring Boot): diarios y seguimiento de pacientes (`localhost:8080`)
- `media-service` (Spring Boot): URLs firmadas y archivos multimedia (`localhost:8088`)
- `catalog-service` (Python/FastAPI/gRPC): busqueda de informacion nutricional (`localhost:50051`)
- Bases de datos MongoDB y UIs administrativas.

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

## Documentacion de la API (Swagger)

Cada microservicio expone su propia documentacion interactiva utilizando Swagger/OpenAPI. Una vez levantado el ecosistema, puedes consultar:

- **Identity Service:** [http://localhost:8082/docs](http://localhost:8082/docs)
- **Agenda Service:** [http://localhost:8083/swagger-ui.html](http://localhost:8083/swagger-ui.html)
- **Clinical Service:** [http://localhost:8087/docs](http://localhost:8087/docs)

## Entorno Desktop (Electron)

HealthCore tambien cuenta con una version de escritorio empaquetada con Electron. El entorno desktop consume el mismo codigo de la aplicacion web.

Para probar la version de escritorio mientras desarrollas:

1. Levanta el servidor de desarrollo de la app web:
   ```powershell
   cd apps/health-core
   npm run dev
   ```
2. En otra terminal, navega al proyecto de escritorio y levanta Electron:
   ```powershell
   cd apps/health-core-desktop
   npm install
   npm run dev
   ```

## Variables de entorno locales

Para que el ecosistema funcione correctamente de forma local, debes tener un archivo `.env` en la raiz del proyecto. Puedes copiar el archivo de ejemplo:

```powershell
cp .env.example .env
```

Asegurate de llenar variables criticas como `JWT_SECRET` y credenciales de OAuth2 si planeas probar los flujos completos de autenticacion.

---

## Sobre el frontend

**Compatibility**: When installing new packages, remember to use `--legacy-peer-deps` due to current Vite 8 plugin resolution.

### Pruebas en dispositivos moviles (PWA UI Testing)

Para validar la UI o la instalacion de la PWA en un dispositivo movil real, puedes exponer temporalmente el frontend con un tunel:

1. Asegurate de tener el frontend corriendo en modo desarrollo (`npm run dev` en `apps/health-core`).
2. Abre una nueva terminal y ejecuta Ngrok o Localtunnel:
   ```powershell
   npx ngrok http 5173
   # o alternativamente:
   npx localtunnel --port 5173
   ```
3. Abre el enlace HTTPS generado en el navegador del dispositivo.

> **Nota:** esta tecnica tuneliza unicamente la interfaz de React. Como el backend sigue local en tu maquina, flujos complejos como OAuth2 no funcionaran desde el telefono. Usalo solo para validar UI y la instalacion de la PWA.

## Flujo de trabajo (Git Workflow)

**Nunca trabajes directamente en la rama `main`.**

1. Actualiza tu rama principal: `git checkout main` y luego `git pull origin main`
2. Crea tu rama de trabajo: `git checkout -b feature/nombre-de-tu-tarea`
3. Revisa en que rama estas: `git branch`
4. Revisa que archivos has modificado: `git status`
5. Anade los cambios trabajados: `git add .`
6. Guarda los cambios: `git commit -m "feat: agregue X componente"`
7. Sube tu rama: `git push -u origin feature/nombre-de-tu-tarea`
8. Abre un Pull Request en GitHub con una descripcion clara
9. Una vez mergeado, vuelve a `main` y actualizala

Convenciones utiles de commits:

- `[FEAT]`: nueva funcionalidad
- `[CHORE]`: tarea operativa
- `[FIX]`: correccion de bug
- `[DOC]`: documentacion
- `[PERF]`: optimizacion
- `[REFACTOR]`: refactorizacion
