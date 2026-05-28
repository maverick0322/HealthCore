import { app, BrowserWindow, Menu, shell } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'

const isDev = !app.isPackaged

if (isDev) {
  // Ignore certificate errors for the self-signed cert in development
  app.commandLine.appendSwitch('ignore-certificate-errors')
}

function createWindow(): void {
  const iconPath = join(app.getAppPath(), 'build', 'icons', 'icon.png')
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'HealthCore',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
    ...(existsSync(iconPath) ? { icon: iconPath } : {}),
  }

  const mainWindow = new BrowserWindow(windowOptions)
  mainWindow.setMenu(null)

  // Open external links in the default browser instead of a new Electron window
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev) {
    // In development: load the Vite dev server from health-core
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // In production: load the renderer built by electron-vite
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
