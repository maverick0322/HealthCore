"use strict";
const electron = require("electron");
const fs = require("fs");
const path = require("path");
const isDev = !electron.app.isPackaged;
if (isDev) {
  electron.app.commandLine.appendSwitch("ignore-certificate-errors");
}
function createWindow() {
  const iconPath = path.join(electron.app.getAppPath(), "build", "icons", "icon.png");
  const windowOptions = {
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "HealthCore",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    },
    ...fs.existsSync(iconPath) ? { icon: iconPath } : {}
  };
  const mainWindow = new electron.BrowserWindow(windowOptions);
  mainWindow.setMenu(null);
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  electron.Menu.setApplicationMenu(null);
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
