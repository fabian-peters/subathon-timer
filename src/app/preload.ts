import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('bridge', {
  send: (channel: string, data: string) => ['pause', 'stop', 'open-settings', 'close-settings', 'save-config', 'history-reset', 'history-export', 'subs-reset', 'subs-export'].includes(channel) && ipcRenderer.send(channel, data),
  on: (channel: string, listener: any) => ['load-config', 'update-start-times', 'update-timer'].includes(channel) && ipcRenderer.on(channel, (_event, val) => listener(val ?? null))
});
