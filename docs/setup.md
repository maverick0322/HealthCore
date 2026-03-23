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

*(Placeholder)* This project is currently in the scaffolding phase. 
- The folder contains a `.gitkeep` to ensure the structure is tracked in the repository.

---

## ⚙️ Services & Ops

*(Documentation pending specific service additions)*
