"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
let isShown = true;
const electronApp = electron_1.app;
function createWindow() {
    electronApp.win = new electron_1.BrowserWindow({
        width: 780,
        height: 462,
        minWidth: 380,
        minHeight: 360,
        backgroundColor: '#000',
        icon: path.join(__dirname, { darwin: 'icon.icns', linux: 'icon.png', win32: 'icon.ico' }[process.platform] || 'icon.ico'),
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
        electron_1.app.quit();
    });
    electronApp.win.on('hide', () => {
        isShown = false;
    });
    electronApp.win.on('show', () => {
        isShown = true;
    });
}
electronApp.win = null;
electron_1.app.on('ready', () => {
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    electron_1.app.quit();
});
electron_1.app.on('activate', () => {
    if (electronApp.win === null) {
        createWindow();
    }
    else {
        electronApp.win.show();
    }
});
electronApp.inspect = function () {
    if (electronApp.win)
        electronApp.win.webContents.toggleDevTools();
};
electronApp.toggleFullscreen = function () {
    if (electronApp.win)
        electronApp.win.setFullScreen(!electronApp.win.isFullScreen());
};
electronApp.toggleMenubar = function () {
    if (electronApp.win)
        electronApp.win.setMenuBarVisibility(!electronApp.win.isMenuBarVisible());
};
electronApp.toggleVisible = function () {
    if (!electronApp.win)
        return;
    if (process.platform !== 'darwin') {
        if (!electronApp.win.isMinimized()) {
            electronApp.win.minimize();
        }
        else {
            electronApp.win.restore();
        }
    }
    else {
        if (isShown && !electronApp.win.isFullScreen()) {
            electronApp.win.hide();
        }
        else {
            electronApp.win.show();
        }
    }
};
electronApp.injectMenu = function (menu) {
    try {
        electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(menu));
    }
    catch (err) {
        console.warn('Cannot inject menu.');
    }
};
// IPC for renderer (replaces deprecated remote)
electron_1.ipcMain.handle('inject-menu', (_event, menu) => {
    electronApp.injectMenu?.(menu);
});
electron_1.ipcMain.handle('toggle-fullscreen', () => electronApp.toggleFullscreen?.());
electron_1.ipcMain.handle('toggle-visible', () => electronApp.toggleVisible?.());
electron_1.ipcMain.handle('toggle-menubar', () => electronApp.toggleMenubar?.());
electron_1.ipcMain.handle('inspect', () => electronApp.inspect?.());
electron_1.ipcMain.handle('open-external', (_event, url) => electron_1.shell.openExternal(url));
