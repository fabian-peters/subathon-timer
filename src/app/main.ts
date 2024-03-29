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
import { initTimer, resumeTimerFrom, togglePause, updateAppTimerConfig } from './timer';
import { convertToTimeString } from '../utils';

let mainWindow: BrowserWindow | undefined;
let settingsWindow: BrowserWindow | undefined;

const webPreferences = {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  enableRemoteModule: false,
  nodeIntegration: false
};

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    show: false,
    webPreferences: webPreferences
  });
  mainWindow.loadFile(path.join(__dirname, '../../ui/index.html'));
  mainWindow.removeMenu();

  mainWindow.once('ready-to-show', () => {
    sendStartTimes();

    mainWindow.show();

    // initialize timer (time will be overwritten if continued from history)
    initTimer();

    // continue timer from history?
    let lastSavedTime = history.map(item => {
      // @ts-ignore
      const timestamp = Date.parse(item.timestamp); // parse date to a number
      return { ...item, timestamp };
    }).sort((a, b) => b.timestamp - a.timestamp)[0];
    if (lastSavedTime) {
      const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['Yes', 'No'],
        defaultId: 1,
        title: 'Continue from history?',
        message: 'Do you want to continue the timer from the stored history?',
        detail: `Last time saved in history: ${convertToTimeString(lastSavedTime.time)} on ${new Date(lastSavedTime.timestamp).toLocaleString()}`
      });
      if (response === 0) {
        resumeTimerFrom(lastSavedTime.time);
      }
    }
  });
}

export const sendStartTimes = () => {
  if (!mainWindow) return;

  // @ts-ignore
  let historyStartTime = new Date(Math.min(...(history.map(value => Date.parse(value.timestamp)))));
  // @ts-ignore
  let subsStartTime = new Date(Math.min(...(subscription.map(value => Date.parse(value.timestamp)))));

  mainWindow.webContents.send('update-start-times', {
    history: historyStartTime,
    subs: subsStartTime
  });
}

export const updateAppTimer = (timeString: string) => {
  mainWindow.webContents.send('update-timer', timeString);
}

app.on('ready', () => {
  createMainWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createMainWindow());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

startServer();

reloadListener(config.streamLabsTokens);

const createSettingsWindow = () => {
  settingsWindow = new BrowserWindow({
    modal: true,
    parent: mainWindow,
    width: 430,
    height: 430,
    show: false,
    webPreferences: webPreferences
  });
  settingsWindow.loadFile(path.join(__dirname, '../../ui/settings.html'));
  settingsWindow.removeMenu();

  settingsWindow.once('ready-to-show', () => {
    // load config from file into new window
    settingsWindow.webContents.send('load-config', JSON.parse(JSON.stringify(config)));

    settingsWindow.show();
  });
};

ipcMain
  .on('pause', togglePause)
  .on('stop', () => initTimer())
  .on('history-reset', resetHistory)
  .on('history-export', exportHistory)
  .on('subs-reset', resetSubHistory)
  .on('subs-export', exportSubHistory)
  .on('open-settings', createSettingsWindow)
  .on('close-settings', () => settingsWindow.close())
  .on('save-config', (_event, newConfig) => {
    for (let par in newConfig) {
      (config as any)[par] = newConfig[par];
    }

    reloadListener(config.streamLabsTokens);
    updateAppTimerConfig();

    updateConfigOnServer(newConfig); // TODO filter sensitive information before sending it out to widgets

    // close window after config is saved
    settingsWindow.close();
    console.log("Config updated.")
  });
