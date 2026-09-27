const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getBacklog: () => ipcRenderer.invoke('get-backlog'),
  saveBacklog: (data) => ipcRenderer.invoke('save-backlog', data),
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  ensureFocus: () => ipcRenderer.send('ensure-window-focus'),
});

window.addEventListener(
  'mousedown',
  (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
      ipcRenderer.send('ensure-window-focus');
    }
  },
  true
);
