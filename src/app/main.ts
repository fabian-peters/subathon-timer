import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import {
  exportHistory,
  exportSubHistory,
  resetHistory,
  resetSubHistory,
  startServer,
  updateConfigOnServer
} from './server';
import config from '../types/config';
import { reloadListener } from './streamlabs';
import history from '../types/history';
import subscription from '../types/subscription';
import { initTimer, togglePause } from './timer';
import { convertToTimeString } from './utils';

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
  await win.loadFile(path.join(__dirname, '../../index.html'));
  sendStartTimes();

  let initialTime = config.inTime;

  // continue timer from history?
  let lastSavedTime = history.map(item => {
    // @ts-ignore
    const timestamp = Date.parse(item.timestamp); // parse date to a number
    return { ...item, timestamp };
  }).sort((a, b) => b.timestamp - a.timestamp)[0];
  if (lastSavedTime) {
    const response = dialog.showMessageBoxSync(win, {
      type: 'question',
      buttons: ['Yes', 'No'],
      defaultId: 1,
      title: 'Continue from history?',
      message: 'Do you want to continue the timer from the stored history?',
      detail: `Last time saved in history: ${convertToTimeString(lastSavedTime.time)} on ${new Date(lastSavedTime.timestamp).toLocaleString()}`
    });
    if (response === 0) {
      initialTime = lastSavedTime.time / 60;
    }
  }

  // init timer
  initTimer(initialTime);
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

reloadListener(config.streamLabsTokens);

ipcMain
  .on('pause', togglePause)
  .on('stop', () => initTimer())
  .on('history-reset', resetHistory)
  .on('history-export', exportHistory)
  .on('subs-reset', resetSubHistory)
  .on('subs-export', exportSubHistory)
  .on('settings', (event) => {
    event.reply('config', JSON.parse(JSON.stringify(config)));
  })
  .on('config', (_event, newConfig) => {
    for (let par in newConfig) {
      (config as any)[par] = newConfig[par];
    }
    reloadListener(config.streamLabsTokens);
    updateConfigOnServer(newConfig);
    // TODO init timer if not started
  });

export const sendError = (error: string) => win && win.webContents.send('error', error);
