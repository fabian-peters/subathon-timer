import * as express from 'express';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import * as http from 'http';
import * as path from 'path';
import type { Config } from './types/config';
import config from './types/config';
import type { History } from './types/history';
import history from './types/history';
import { dialog } from 'electron';
import * as fs from 'fs';
import subscription, { Subscription } from './types/subscription';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let inTime = config.inTime;
let addTimeTier1 = config.addTimeTier1;
let addTimeTier2 = config.addTimeTier2;
let addTimeTier3 = config.addTimeTier3;

export const startServer = () => {
  if (server.listening) {
    if ((server.address() as any).port === config.port) {
      // already running on correct port
      return;
    } else {
      console.log(`Restarting server on new port '${config.port}...'`);
      if (socketTimer) socketTimer.disconnect();
      if (socketHistory) socketHistory.disconnect();
      server.close(() => {
        server.listen(config.port) // restart on new port when server is closed
        console.log('Restarted server on ', server.address());
      });
    }
  } else {
    server.listen(config.port);
    console.log('Started server on ', server.address());
  }
}

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '..', 'resources/widget.html')));
app.get('/history', (_req, res) => res.sendFile(path.join(__dirname, '..', 'resources/history.html')));
app.get('/subs', (_req, res) => res.sendFile(path.join(__dirname, '..', 'resources/subs.html')));
app.get('/socket.io.js', (_req, res) => res.sendFile(path.join(__dirname, '..', 'node_modules', 'socket.io', 'client-dist', 'socket.io.min.js'))); // TODO reference directly so IDE can pick it up

let socketTimer: Socket | undefined;
let socketHistory: Socket | undefined;
let socketSubs: Socket | undefined;

io.of('/history').on('connection', s => {
  // TODO allows multiple widget? store in array (not for timer!)
  if (socketHistory) socketHistory.emit('error', 'only one history widget allowed');
  socketHistory = s;
  socketHistory.emit('history-data', history);
  socketHistory.emit('config', config);
});

io.of('/subs').on('connection', s => {
  // TODO allows multiple widget? store in array (not for timer!)
  if (socketSubs) socketSubs.emit('error', 'only one sub history widget allowed');
  socketSubs = s;
  socketSubs.emit('subs-data', subscription);
  socketSubs.emit('config', config);
});

io.of('/timer').on('connection', s => {
  if (socketTimer) socketTimer.emit('error', 'only one timer widget allowed');
  socketTimer = s;
  socketTimer.on('history', saveHistory);
  socketTimer.emit('init', inTime);
  socketTimer.emit('config', config);
});

const saveHistory = (historyEntry: History) => {
  history.push(historyEntry);
  socketHistory && socketHistory.emit('history-data', history);
}

// TODO [#17] show oldest history timestamp on control screen (only if active?)
export const resetHistory = () => { // TODO ask to reset when pressing stop?
  history.splice(0, history.length); // cannot assign empty so use splice to remove all entries
  socketHistory && socketHistory.emit('history-data', history);
}

// TODO improve export: make picture bigger, prettier, increase resolution
export const exportHistory = () => {
  if (socketHistory) {
    socketHistory.emit('history-data', history); // make sure latest data is available
    socketHistory.emit('history-export', config.bgColor, (dataUrl: string) => {
      // decode data uri string to buffer
      let image = decodeBase64(dataUrl);

      // generate path
      let date = new Date().toISOString();
      date = date.substring(0, date.lastIndexOf('.')).replace(/[.:T]/g, '-');
      let defaultName = path.join(__dirname, '..', 'history-' + date + '.png');

      // open dialog to save file
      let filename = dialog.showSaveDialogSync({ title: 'Save History as .png', defaultPath: defaultName });
      if (filename) {
        fs.writeFileSync(filename, image.data);
      }
    });
  } else {
    // history widget must be running TODO make export available without widget
    dialog.showErrorBox('Error exporting history', 'Could not export history because the history widget is not connected.');
  }
}

// TODO [#17] show sub count / oldest sub timestamp on control screen (only if active?)
export const resetSubHistory = () => { // TODO ask to reset when pressing stop?
  subscription.splice(0, subscription.length); // cannot assign empty so use splice to remove all entries
  socketSubs && socketSubs.emit('subs-data', history);
}

// TODO improve export: make picture bigger, prettier, increase resolution
export const exportSubHistory = () => {
  if (socketSubs) {
    socketSubs.emit('subs-data', subscription); // make sure latest data is available
    socketSubs.emit('subs-export', config.bgColor, (dataUrl: string) => {
      // decode data uri string to buffer
      let image = decodeBase64(dataUrl);

      // generate path
      let date = new Date().toISOString();
      date = date.substring(0, date.lastIndexOf('.')).replace(/[.:T]/g, '-');
      let defaultName = path.join(__dirname, '..', 'subs-' + date + '.png');

      // open dialog to save file
      let filename = dialog.showSaveDialogSync({ title: 'Save Sub History as .png', defaultPath: defaultName });
      if (filename) {
        fs.writeFileSync(filename, image.data);
      }
    });
  } else {
    // subs widget must be running TODO make export available without widget
    dialog.showErrorBox('Error exporting sub history', 'Could not export sub history because the subs widget is not connected.');
  }
}

const decodeBase64 = (dataString: string) => {
  let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (matches.length != 3) {
    dialog.showErrorBox('Error exporting graph', 'Could not convert graph to png.');
  }

  return {
    type: matches[1],
    data: Buffer.from(matches[2], 'base64')
  }
}

export const updateConfigOnServer = (newConfig: Config) => {
  startServer() // restart on new port if necessary

  addTimeTier1 = newConfig.addTimeTier1;
  addTimeTier2 = newConfig.addTimeTier2;
  addTimeTier3 = newConfig.addTimeTier3;
  inTime = newConfig.inTime;

  socketTimer && socketTimer.emit('config', newConfig);
  socketHistory && socketHistory.emit('config', newConfig);
  socketSubs && socketSubs.emit('config', newConfig);
};

export const sendPause = () => socketTimer && socketTimer.emit('pause');

export const sendInit = () => socketTimer && socketTimer.emit('init', inTime);

export const sendSub = (sub: Subscription) => {
  // TODO [#15] disable before timer was initially started
  // add time to timer
  let addTime;
  switch (sub.tier) {
      case "2000": // Tier 2
          addTime = addTimeTier2;
          break;
      case "3000": // Tier 3
          addTime = addTimeTier3;
          break;
      default: // Tier 1 = "1000", Prime might be "1" or "1000", and everything else should fallback to tier 1
          addTime = addTimeTier1;
  }
  socketTimer && socketTimer.emit('sub', addTime);

  // add sub to history
  // apparently 'sub' does not include info who gifted the sub so we cannot create a cumulative gift count per user
  //  -> update as soon as that information is available in API
  if (config.subHistoryEnabled) {
    subscription.push(sub);
    socketSubs && socketSubs.emit('subs-data', subscription);
  }
}
