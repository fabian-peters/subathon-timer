import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { sendPause, startServer, updateConfigOnServer } from './server';
import config from './config';
import { listenForSubs, reloadListener } from './streamlabs';

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
};

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

listenForSubs(config.StreamLabsToken);

ipcMain
  .on('pause', () => sendPause())
  .on('config', (_event, newConfig) => {
    for (let par in newConfig) {
      (config as any)[par] = newConfig[par];
    }
    reloadListener(config.StreamLabsToken);
    updateConfigOnServer(newConfig);
  });

export const sendError = (error: string) => win && win.webContents.send('error', error);
