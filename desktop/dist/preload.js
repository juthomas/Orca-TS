"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electronAPI = {
    injectMenu: (menu) => electron_1.ipcRenderer.invoke('inject-menu', menu),
    openThemeFile: () => electron_1.ipcRenderer.invoke('open-theme-file'),
    saveThemeFile: (content) => electron_1.ipcRenderer.invoke('save-theme-file', content),
    toggleFullscreen: () => electron_1.ipcRenderer.invoke('toggle-fullscreen'),
    toggleVisible: () => electron_1.ipcRenderer.invoke('toggle-visible'),
    toggleMenubar: () => electron_1.ipcRenderer.invoke('toggle-menubar'),
    inspect: () => electron_1.ipcRenderer.invoke('inspect'),
    openExternal: (url) => electron_1.ipcRenderer.invoke('open-external', url),
    getExtensionsPath: () => electron_1.ipcRenderer.invoke('get-extensions-path'),
    openExtensionsFolder: () => electron_1.ipcRenderer.invoke('open-extensions-folder'),
};
if (typeof window !== 'undefined') {
    window.electronAPI = electronAPI;
}
