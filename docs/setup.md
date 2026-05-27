# HealthCore Project Setup Guide

This document provides instructions for developers to set up their local environment for the various projects in this repository.

## Prerequisites

- **Node.js**: Version 20.x or higher (recommended).
- **npm**: Version 10.x or higher.

## 🎨 Frontend (`apps/health-core`)

The main web application built with React, Vite, and Tailwind CSS.

### Step-by-Step Setup

1. **Navigate to the app directory**:
   ```bash
   cd apps/health-core
   ```

2. **Install dependencies**:
   > [!IMPORTANT]
   > Due to a peer dependency conflict between Vite 8 and the PWA plugin, you **must** use the `--legacy-peer-deps` flag.
   
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `https://localhost:5173`. 

4. **HTTPS/SSL Trust (First Time Only)**:
   > [!IMPORTANT]
   > For the team: We use the `@vitejs/plugin-basic-ssl` to enable HTTPS in development. This is required for PWA features (like the "Install" prompt) to work on your phone.
   
   - When you first visit the site, your browser will show a **"Your connection is not private"** warning.
   - Click **Advanced** and then **"Proceed to localhost (unsafe)"**. 
   - You only need to do this once per device.

5. **Building for production**:
   ```bash
   npm run build
   ```

---

## 🖥️ Desktop (`apps/health-core-desktop`)

Este proyecto es un contenedor **Electron** completamente configurado que encapsula la PWA de React. Permite empaquetar la aplicación de escritorio y acceder a capacidades nativas del sistema operativo.
* Para ver las instrucciones detalladas de ejecución en desarrollo y compilación para producción en Windows, macOS y Linux, consulta la [Guía de Escritorio](file:///c:/Users/eugen/Documents/DSER/HealthCore/docs/desktop.md).

---

## ⚙️ Services & Ops (Docker)

All backend microservices, databases, and infrastructure tools are containerized using Docker. To ensure security, we use environment variables.

### Initial Setup
1. **Configure Environment Variables**:
   Copy the example environment file and configure your local secrets (including database passwords and JWT secrets).
   ```bash
   cp .env.example .env
   ```
   > [!IMPORTANT]
   > Do NOT commit `.env` to version control.

### SonarQube (Static Analysis & Code Quality)
We use SonarQube v10.8 (Community Edition) with PostgreSQL 17 to maintain our code quality and enforce our style guides.

1. **Start the SonarQube Server**:
   ```bash
   docker compose -f ops/sonarqube-compose.yml up -d
   ```
   The dashboard will be available at `http://localhost:9000`.

2. **First-time Login**:
   - Default credentials are `admin` / `admin`.
   - The system will immediately prompt you to change the password. (It must be at least 12 characters, e.g., `HealthCore2026!`).

3. **Running a Local Scan**:
   To scan the entire monorepo, generate a User Token in the SonarQube UI (`My Account -> Security`). Then, run the official Sonar Scanner CLI container from the root directory:
   
   **Windows (PowerShell):**
   ```powershell
   docker run --rm -v "${PWD}:/usr/src" -e SONAR_HOST_URL="http://host.docker.internal:9000" -e SONAR_TOKEN="tu_token_aqui" sonarsource/sonar-scanner-cli
   ```
   **Linux/Mac:**
   ```bash
   docker run --rm -v "$(pwd):/usr/src" -e SONAR_HOST_URL="http://host.docker.internal:9000" -e SONAR_TOKEN="tu_token_aqui" sonarsource/sonar-scanner-cli
   ```
   The scanner uses the `sonar-project.properties` file located at the root of the repository to identify Java, Python, and TypeScript source directories automatically.
