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
const fs = __importStar(require("fs"));
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
    const ses = electronApp.win.webContents.session;
    ses.setPermissionCheckHandler((_webContents, permission) => {
        return permission === 'midi' || permission === 'midiSysex';
    });
    ses.setPermissionRequestHandler((_webContents, permission, callback) => {
        callback(permission === 'midi' || permission === 'midiSysex');
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
        console.warn('Cannot inject menu.', err);
    }
};
function attachMenuClicks(items, sender) {
    return items.map((item) => {
        const out = {};
        if (item.label !== undefined)
            out.label = item.label;
        if (item.role !== undefined)
            out.role = item.role;
        if (item.accelerator !== undefined)
            out.accelerator = item.accelerator;
        if (item.type !== undefined)
            out.type = item.type;
        if (item.clickId) {
            const clickId = item.clickId;
            out.click = () => {
                // Invoke renderer handlers directly — more reliable than ipc send for menu actions.
                const code = `void(window.__orcaMenuHandlers&&window.__orcaMenuHandlers[${JSON.stringify(clickId)}]&&window.__orcaMenuHandlers[${JSON.stringify(clickId)}]())`;
                sender.executeJavaScript(code).catch(() => { });
            };
        }
        if (item.submenu) {
            out.submenu = attachMenuClicks(item.submenu, sender);
        }
        return out;
    });
}
// IPC for renderer (replaces deprecated remote)
electron_1.ipcMain.handle('inject-menu', (event, menu) => {
    electronApp.injectMenu?.(attachMenuClicks(menu, event.sender));
});
electron_1.ipcMain.handle('toggle-fullscreen', () => electronApp.toggleFullscreen?.());
electron_1.ipcMain.handle('toggle-visible', () => electronApp.toggleVisible?.());
electron_1.ipcMain.handle('toggle-menubar', () => electronApp.toggleMenubar?.());
electron_1.ipcMain.handle('inspect', () => electronApp.inspect?.());
electron_1.ipcMain.handle('open-external', (_event, url) => electron_1.shell.openExternal(url));
electron_1.ipcMain.handle('open-theme-file', async () => {
    if (!electronApp.win)
        return null;
    const result = await electron_1.dialog.showOpenDialog(electronApp.win, {
        title: 'Import Palette',
        filters: [
            { name: 'Palettes', extensions: ['json', 'svg'] },
            { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0])
        return null;
    try {
        return fs.readFileSync(result.filePaths[0], 'utf8');
    }
    catch (err) {
        console.warn('Cannot read theme file.', err);
        return null;
    }
});
electron_1.ipcMain.handle('save-theme-file', async (_event, content) => {
    if (!electronApp.win)
        return false;
    const result = await electron_1.dialog.showSaveDialog(electronApp.win, {
        title: 'Export Palette',
        defaultPath: 'orca-palette.json',
        filters: [
            { name: 'JSON Palette', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    });
    if (result.canceled || !result.filePath)
        return false;
    try {
        fs.writeFileSync(result.filePath, content, 'utf8');
        return true;
    }
    catch (err) {
        console.warn('Cannot write theme file.', err);
        return false;
    }
});
const extensionsDir = path.join(electron_1.app.getPath('userData'), 'Extensions');
electron_1.ipcMain.handle('get-extensions-path', () => {
    const fs = require('fs');
    if (!fs.existsSync(extensionsDir))
        fs.mkdirSync(extensionsDir, { recursive: true });
    return extensionsDir;
});
electron_1.ipcMain.handle('open-extensions-folder', () => {
    const fs = require('fs');
    const { exec } = require('child_process');
    if (!fs.existsSync(extensionsDir))
        fs.mkdirSync(extensionsDir, { recursive: true });
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
    exec(`${cmd} "${extensionsDir.replace(/"/g, '\\"')}"`);
});
