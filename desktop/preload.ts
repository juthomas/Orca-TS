import { ipcRenderer } from 'electron';

const electronAPI = {
  injectMenu: (menu: unknown) => ipcRenderer.invoke('inject-menu', menu),
  openThemeFile: () => ipcRenderer.invoke('open-theme-file') as Promise<string | null>,
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  toggleVisible: () => ipcRenderer.invoke('toggle-visible'),
  toggleMenubar: () => ipcRenderer.invoke('toggle-menubar'),
  inspect: () => ipcRenderer.invoke('inspect'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getExtensionsPath: () => ipcRenderer.invoke('get-extensions-path') as Promise<string>,
  openExtensionsFolder: () => ipcRenderer.invoke('open-extensions-folder') as Promise<void>,
};

if (typeof window !== 'undefined') {
  (window as unknown as { electronAPI: typeof electronAPI }).electronAPI = electronAPI;
}
