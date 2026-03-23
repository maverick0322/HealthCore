# Desktop App Guide (Electron)

## Overview

The `apps/health-core-desktop` project is an **Electron shell** that wraps the existing HealthCore React web application. Rather than duplicating the UI code, it loads the same React app — from the local Vite dev server in development, or from the built `dist/` folder in production.

```
apps/
├── health-core/           ← The actual React app (source of truth)
└── health-core-desktop/   ← Electron shell that loads health-core
    ├── src/
    │   ├── main/          ← Electron main process (Node.js)
    │   └── preload/       ← Preload script (renderer bridge)
    ├── package.json
    └── electron.vite.config.ts
```

---

## Why this Architecture?

By separating the Electron shell from the React app, we ensure:
- The web app continues to work standalone (browser + PWA)
- The Electron shell can add native OS features (notifications, file system, tray icon) without polluting the web codebase
- Only one UI codebase to maintain

---

## Prerequisites

```bash
# Install dependencies for the desktop project
cd apps/health-core-desktop
npm install
```

---

## Development Mode

> [!IMPORTANT]  
> The `health-core` Vite dev server **must be running first**, because the Electron window loads from `http://localhost:5173`.

**Terminal 1** — Start the React web app:
```bash
cd apps/health-core
npm run dev
```

**Terminal 2** — Launch the Electron window:
```bash
cd apps/health-core-desktop
npm run dev
```

A native desktop window will open loading your React app. The DevTools will open automatically in dev mode.

---

## Production Build

This produces a distributable installer for the target platform.

### Windows (`.exe`)
```bash
cd apps/health-core

# 1. Build the React web app first
npm run build

# 2. Build the Electron installer
cd ../health-core-desktop
npm run build:win
```
The installer will appear in `apps/health-core-desktop/release/`.

### macOS (`.dmg`)
```bash
cd apps/health-core
npm run build

cd ../health-core-desktop
npm run build:mac
```

### Linux
```bash
cd apps/health-core
npm run build

cd ../health-core-desktop
npm run build:linux
```

> [!NOTE]  
> To build for macOS, you need to run the command on a macOS machine. Windows builds can be cross-compiled from Windows only.

---

## Adding Native Features

To expose Node.js / OS APIs to the React app, use the **preload script** (`src/preload/index.ts`) with Electron's `contextBridge`:

```ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose specific, controlled APIs to the renderer
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', { title, body }),
})
```

This keeps the bridge secure and the React app unaware of whether it's running in a browser or Electron.
