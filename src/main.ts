import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import {
  exportHistory,
  exportSubHistory,
  resetHistory,
  resetSubHistory,
  sendInit,
  sendPause,
  startServer,
  updateConfigOnServer
} from './server';
import config from './types/config';
import { listenForSubs, reloadListener } from './streamlabs';
import history from './types/history';
import subscription from './types/subscription';

let win: BrowserWindow | undefined;

const createWindow = async () => {
  win = new BrowserWindow({
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    width: 400
  });
  win.removeMenu();
  await win.loadFile(path.join(__dirname, '../resources/index.html'));
  win.webContents.send('config', JSON.parse(JSON.stringify(config)));
  sendStartTimes()
}

export const sendStartTimes = () => {
  if (!win) return;

  // @ts-ignore
  let historyStartTime = new Date(Math.min(...(history.map(value => Date.parse(value.timestamp)))));
  // @ts-ignore
  let subsStartTime = new Date(Math.min(...(subscription.map(value => Date.parse(value.timestamp)))));

  win.webContents.send('update-start-times', {
    history: historyStartTime,
    subs: subsStartTime
  });
}

app.on('ready', () => {
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

startServer();

listenForSubs(config.streamLabsToken);

ipcMain
  .on('pause', sendPause)
  .on('stop', sendInit)
  .on('history-reset', resetHistory)
  .on('history-export', exportHistory)
  .on('subs-reset', resetSubHistory)
  .on('subs-export', exportSubHistory)
  .on('config', (_event, newConfig) => {
    for (let par in newConfig) {
      (config as any)[par] = newConfig[par];
    }
    reloadListener(config.streamLabsToken);
    updateConfigOnServer(newConfig);
  });

export const sendError = (error: string) => win && win.webContents.send('error', error);
