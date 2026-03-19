# HealthCore

HealthCore is a comprehensive health and fitness management platform. 

## 📂 Repository Structure

- `apps/health-core`: Main React web application.
- `apps/health-core-desktop`: Placeholder for the future desktop client.
- `services/`: Backend microservices (pending).
- `docs/`: Technical documentation.

## 🛠️ Getting Started

To get the project running locally, please follow the **[Setup Guide](docs/setup.md)**.

## 🏗️ Architecture

For a deep dive into our technology stack and the reasons behind our architecture, see **[Architecture & Decisions](docs/architecture.md)**.

---

## 📜 Developer Guidelines

1. **Follow Clean Architecture**: Ensure logic is separated into `core`, `features`, and `shared`.
2. **Use Aliases**: Always use `@/` for internal imports.
3. **Compatibility**: When installing new packages, remember to use `--legacy-peer-deps` due to current Vite 8 plugin resolution.

# 🚀 Guía de Pruebas Locales: Ecosistema Backend (HealthCore)

Actualmente, el ecosistema cuenta con dos microservicios comunicados a través de un puente de alto rendimiento **gRPC**. Para probar la extracción de datos nutricionales desde la base de datos mundial, sigue estos pasos:

## 📋 Prerrequisitos
* **Java 21** instalado.
* **Python 3.10+** instalado.
* **Maven** configurado (o usar el wrapper/IDE).
* Entorno de desarrollo recomendado: IntelliJ IDEA (para Java) y VS Code (para Python).

---

## 🐍 Paso 1: Levantar el Catálogo de Alimentos (Python)
Este servicio se conecta a *Open Food Facts* y expone los datos mediante gRPC.

1. Abre una terminal y navega a la carpeta del servicio:
   `cd services/catalog-service`
2. Activa el entorno virtual (Windows):
   `venv\Scripts\activate`
   *(Si alguien no tiene las dependencias, puede instalarlas con: `pip install fastapi uvicorn requests pydantic grpcio grpcio-tools`)*
3. Levanta el servidor **gRPC**:
   `python -m src.grpc_server`
   ✅ *Deberías ver el mensaje: 🚀 Servidor gRPC de Catalog-Service iniciado en el puerto 50051...*

---

## ☕ Paso 2: Levantar el Tracking Service (Java / Spring Boot)
Este servicio actúa como cliente gRPC y será el encargado de gestionar los diarios de los pacientes.

1. Abre la carpeta `services/tracking-service` en **IntelliJ IDEA**.
2. **Importante:** Haz clic en recargar Maven (Load Maven Changes) y luego ejecuta el ciclo `compile` desde el panel derecho de Maven. Esto autogenerará las clases de comunicación binaria a partir del archivo `.proto`.
3. Ejecuta la clase principal `TrackingServiceApplication.java` (botón de Play en IntelliJ).

⚠️ **Nota esperada:** Verás un error en la consola indicando `MongoSocketOpenException: Connection refused`. **Es completamente normal** en esta etapa, ya que aún no hemos levantado la base de datos MongoDB. El servidor web arrancará de todos modos en el puerto 8080.

---

## 🌉 Paso 3: Probar el Puente gRPC (El momento de la verdad)
Con ambos servidores corriendo (Python en el puerto 50051 y Java en el 8080), vamos a pedirle a Java que busque un producto y este viajará a Python en milisegundos para traerlo.

1. Abre tu navegador web.
2. Pega la siguiente URL (puedes cambiar los números finales por cualquier código de barras real):
   `http://localhost:8080/api/v1/tracking/test-grpc/7501045403915`

🎉 **Resultado esperado:**
Deberías ver un JSON en tu navegador con los macronutrientes extraídos, similar a esto:

{
  "mensaje": "¡Conexión gRPC Java -> Python exitosa!",
  "marca": "Dolores",
  "calorias": 80.0,
  "producto": "Atún en agua",
  "origen": "Open Food Facts"
}
