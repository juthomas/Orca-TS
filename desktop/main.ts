import { app, BrowserWindow, Menu, ipcMain, shell, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let isShown = true;

declare global {
  interface ElectronApp {
    win: BrowserWindow | null;
    inspect?: () => void;
    toggleFullscreen?: () => void;
    toggleMenubar?: () => void;
    toggleVisible?: () => void;
    injectMenu?: (menu: Electron.MenuItemConstructorOptions[]) => void;
  }
}

const electronApp = app as unknown as ElectronApp;

function createWindow(): void {
  electronApp.win = new BrowserWindow({
    width: 780,
    height: 462,
    minWidth: 380,
    minHeight: 360,
    backgroundColor: '#000',
    icon: path.join(__dirname, ({ darwin: 'icon.icns', linux: 'icon.png', win32: 'icon.ico' } as Record<string, string>)[process.platform] || 'icon.ico'),
    resizable: true,
    frame: true,
    skipTaskbar: process.platform === 'darwin',
    autoHideMenuBar: false,
    webPreferences: {
      zoomFactor: 1.0,
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
    },
  });

  electronApp.win.loadURL(`file://${path.join(__dirname, 'sources', 'index.html')}`);

  electronApp.win.on('closed', () => {
    app.quit();
  });

  electronApp.win.on('hide', () => {
    isShown = false;
  });

  electronApp.win.on('show', () => {
    isShown = true;
  });
}

electronApp.win = null;

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (electronApp.win === null) {
    createWindow();
  } else {
    electronApp.win.show();
  }
});

electronApp.inspect = function () {
  if (electronApp.win) electronApp.win.webContents.toggleDevTools();
};

electronApp.toggleFullscreen = function () {
  if (electronApp.win) electronApp.win.setFullScreen(!electronApp.win.isFullScreen());
};

electronApp.toggleMenubar = function () {
  if (electronApp.win) electronApp.win.setMenuBarVisibility(!electronApp.win.isMenuBarVisible());
};

electronApp.toggleVisible = function () {
  if (!electronApp.win) return;
  if (process.platform !== 'darwin') {
    if (!electronApp.win.isMinimized()) {
      electronApp.win.minimize();
    } else {
      electronApp.win.restore();
    }
  } else {
    if (isShown && !electronApp.win.isFullScreen()) {
      electronApp.win.hide();
    } else {
      electronApp.win.show();
    }
  }
};

type SerializableMenuItem = {
  label?: string;
  submenu?: SerializableMenuItem[];
  role?: string;
  accelerator?: string;
  type?: string;
  clickId?: string;
};

electronApp.injectMenu = function (menu: Electron.MenuItemConstructorOptions[]) {
  try {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  } catch (err) {
    console.warn('Cannot inject menu.', err);
  }
};

function attachMenuClicks(
  items: SerializableMenuItem[],
  sender: Electron.WebContents
): Electron.MenuItemConstructorOptions[] {
  return items.map((item) => {
    const out: Electron.MenuItemConstructorOptions = {};
    if (item.label !== undefined) out.label = item.label;
    if (item.role !== undefined) out.role = item.role as Electron.MenuItemConstructorOptions['role'];
    if (item.accelerator !== undefined) out.accelerator = item.accelerator;
    if (item.type !== undefined) out.type = item.type as Electron.MenuItemConstructorOptions['type'];
    if (item.clickId) {
      const clickId = item.clickId;
      out.click = () => {
        // Invoke renderer handlers directly — more reliable than ipc send for menu actions.
        const code = `void(window.__orcaMenuHandlers&&window.__orcaMenuHandlers[${JSON.stringify(clickId)}]&&window.__orcaMenuHandlers[${JSON.stringify(clickId)}]())`;
        sender.executeJavaScript(code).catch(() => {});
      };
    }
    if (item.submenu) {
      out.submenu = attachMenuClicks(item.submenu, sender);
    }
    return out;
  });
}

// IPC for renderer (replaces deprecated remote)
ipcMain.handle('inject-menu', (event, menu: SerializableMenuItem[]) => {
  electronApp.injectMenu?.(attachMenuClicks(menu, event.sender));
});
ipcMain.handle('toggle-fullscreen', () => electronApp.toggleFullscreen?.());
ipcMain.handle('toggle-visible', () => electronApp.toggleVisible?.());
ipcMain.handle('toggle-menubar', () => electronApp.toggleMenubar?.());
ipcMain.handle('inspect', () => electronApp.inspect?.());
ipcMain.handle('open-external', (_event, url: string) => shell.openExternal(url));
ipcMain.handle('open-theme-file', async () => {
  if (!electronApp.win) return null;
  const result = await dialog.showOpenDialog(electronApp.win, {
    title: 'Open Theme',
    filters: [
      { name: 'Themes', extensions: ['svg', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  try {
    return fs.readFileSync(result.filePaths[0], 'utf8');
  } catch (err) {
    console.warn('Cannot read theme file.', err);
    return null;
  }
});

const extensionsDir = path.join(app.getPath('userData'), 'Extensions');
ipcMain.handle('get-extensions-path', () => {
  const fs = require('fs');
  if (!fs.existsSync(extensionsDir)) fs.mkdirSync(extensionsDir, { recursive: true });
  return extensionsDir;
});
ipcMain.handle('open-extensions-folder', () => {
  const fs = require('fs');
  const { exec } = require('child_process');
  if (!fs.existsSync(extensionsDir)) fs.mkdirSync(extensionsDir, { recursive: true });
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
  exec(`${cmd} "${extensionsDir.replace(/"/g, '\\"')}"`);
});
