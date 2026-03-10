import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron';
import * as path from 'path';

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
    frame: process.platform !== 'darwin',
    skipTaskbar: process.platform === 'darwin',
    autoHideMenuBar: process.platform === 'darwin',
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

electronApp.injectMenu = function (menu: Electron.MenuItemConstructorOptions[]) {
  try {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  } catch (err) {
    console.warn('Cannot inject menu.');
  }
};

// IPC for renderer (replaces deprecated remote)
ipcMain.handle('inject-menu', (_event, menu: Electron.MenuItemConstructorOptions[]) => {
  electronApp.injectMenu?.(menu);
});
ipcMain.handle('toggle-fullscreen', () => electronApp.toggleFullscreen?.());
ipcMain.handle('toggle-visible', () => electronApp.toggleVisible?.());
ipcMain.handle('toggle-menubar', () => electronApp.toggleMenubar?.());
ipcMain.handle('inspect', () => electronApp.inspect?.());
ipcMain.handle('open-external', (_event, url: string) => shell.openExternal(url));
