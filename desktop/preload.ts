import { ipcRenderer } from 'electron';

const electronAPI = {
  injectMenu: (menu: Electron.MenuItemConstructorOptions[]) =>
    ipcRenderer.invoke('inject-menu', menu),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  toggleVisible: () => ipcRenderer.invoke('toggle-visible'),
  toggleMenubar: () => ipcRenderer.invoke('toggle-menubar'),
  inspect: () => ipcRenderer.invoke('inspect'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
};

if (typeof window !== 'undefined') {
  (window as unknown as { electronAPI: typeof electronAPI }).electronAPI = electronAPI;
}
