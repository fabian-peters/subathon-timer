import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('bridge', {
  send: (channel: string, data: string) => ['config', 'pause', 'stop'].includes(channel) && ipcRenderer.send(channel, data),
  on: (channel: string, listener: any) => ['config', 'error'].includes(channel) && ipcRenderer.on(channel, (_event, val) => listener(val ?? null))
});
