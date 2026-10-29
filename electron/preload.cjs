const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  getJson: (url, headers) => ipcRenderer.invoke('get-json', url, headers),
});
