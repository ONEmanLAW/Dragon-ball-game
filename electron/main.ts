import { app, BrowserWindow, globalShortcut } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Si tu veux: mets true/false manuellement pour forcer l'ouverture des devtools
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      // contextIsolation: true, // à activer si tu ajoutes un preload
    },
  });

  // __dirname === "<...>/dist/electron"
  const indexPath = path.join(__dirname, "../index.html");

  if (existsSync(indexPath)) {
    win.loadFile(indexPath);
  } else {
    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    win.loadURL(devUrl);
  }

  // ❌ On n’ouvre plus automatiquement les DevTools
  // if (isDev) win.webContents.openDevTools({ mode: "detach" });

  // ✅ Raccourcis pour ouvrir au besoin
  // F12 : toggle devtools
  globalShortcut.register("F12", () => {
    const focused = BrowserWindow.getFocusedWindow();
    focused?.webContents.toggleDevTools();
  });
  // Ctrl/Cmd + Shift + I : idem
  globalShortcut.register(process.platform === "darwin" ? "Command+Option+I" : "Control+Shift+I", () => {
    const focused = BrowserWindow.getFocusedWindow();
    focused?.webContents.toggleDevTools();
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  // Nettoie les raccourcis
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
