import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('bridge', {
  send: (channel: string, data: string) => ['config', 'pause', 'stop', 'history-reset', 'history-export', 'subs-reset', 'subs-export', 'settings'].includes(channel) && ipcRenderer.send(channel, data),
  on: (channel: string, listener: any) => ['config', 'error', 'update-start-times'].includes(channel) && ipcRenderer.on(channel, (_event, val) => listener(val ?? null))
});
