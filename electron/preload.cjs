const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getBacklog: () => ipcRenderer.invoke('get-backlog'),
  saveBacklog: (data) => ipcRenderer.invoke('save-backlog', data),
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
});
