import * as express from 'express';
import { Server } from 'socket.io';
import * as http from 'http';
import * as path from 'path';
import type { Config } from '../types/config';
import config from '../types/config';
import type { History } from '../types/history';
import history from '../types/history';
import { dialog } from 'electron';
import * as fs from 'fs';
import subscription, { Subscription } from '../types/subscription';
import { sendStartTimes } from './main';
import { getDataForWidgets, increaseTimer } from './timer';
import { WidgetData } from '../types/widgetData';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let addTimeTier1 = config.addTimeTier1; // TODO store values, store config or read directly
let addTimeTier2 = config.addTimeTier2;
let addTimeTier3 = config.addTimeTier3;

export const startServer = () => {
  if (server.listening) {
    if ((server.address() as any).port === config.port) {
      // already running on correct port
      return;
    } else {
      console.log(`Restarting server on new port '${config.port}...'`);
      io.of('/timer').disconnectSockets(true);
      io.of('/history').disconnectSockets(true);
      io.of('/subs').disconnectSockets(true);
      server.close(() => {
        server.listen(config.port); // restart on new port when server is closed
        console.log('Restarted server on ', server.address());
      });
    }
  } else {
    server.listen(config.port);
    console.log('Started server on ', server.address());
  }
};

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '..', '..', 'widgets', 'timer.html')));
app.get('/history', (_req, res) => res.sendFile(path.join(__dirname, '..', '..', 'widgets', 'history.html')));
app.get('/subs', (_req, res) => res.sendFile(path.join(__dirname, '..', '..', 'widgets', 'subs.html')));
app.get('/widgets.css', (_req, res) => res.sendFile(path.join(__dirname, '..', '..', 'widgets', 'widgets.css')));
app.use(express.static(path.join(__dirname, '..', '..', 'dist', 'widgets'))); // widget scripts

io.of('/timer').on('connection', socket => {
  console.log('Timer widget connected.');
  // initially load config and data
  socket.emit('config', config);
  socket.emit('update', getDataForWidgets());
});

io.of('/history').on('connection', socket => {
  console.log('History widget connected.');
  // initially load config and data
  socket.emit('config', config);
  socket.emit('update', getDataForWidgets());
  socket.emit('history-data', history);
});

io.of('/subs').on('connection', socket => {
  console.log('Subs widget connected.');
  // initially load config and data
  socket.emit('config', config);
  socket.emit('update', getDataForWidgets());
  socket.emit('subs-data', subscription);
});

export const saveHistory = (historyEntry: History) => {
  history.push(historyEntry);
  io.of('/history').emit('history-data', history);
  sendStartTimes();
}

export const resetHistory = () => {
  history.splice(0, history.length); // cannot assign empty so use splice to remove all entries
  updateAllWidgets();
  io.of('/history').emit('history-data', history);
  sendStartTimes();
}

// TODO improve export: make picture bigger, prettier, increase resolution
export const exportHistory = () => {
  let [socketHistory] = io.of('/history').sockets.values();
  if (socketHistory) {
    socketHistory.emit('history-data', history); // make sure latest data is available
    socketHistory.emit('history-export', config.bgColor, (dataUrl: string) => {
      // decode data uri string to buffer
      let image = decodeBase64(dataUrl);

      // generate path
      let date = new Date().toISOString();
      date = date.substring(0, date.lastIndexOf('.')).replace(/[.:T]/g, '-');
      let defaultName = path.join(__dirname, '..', '..', 'history-' + date + '.png');

      // open dialog to save file
      let filename = dialog.showSaveDialogSync({ title: 'Save History as .png', defaultPath: defaultName });
      if (filename) {
        fs.writeFileSync(filename, image.data);
      }
    });
  } else {
    // history widget must be running TODO make export available without widget
    dialog.showErrorBox('Error exporting history', 'Could not export history because no history widget is connected.');
  }
}

export const resetSubHistory = () => {
  subscription.splice(0, subscription.length); // cannot assign empty so use splice to remove all entries
  io.of('/subs').emit('subs-data', subscription);
  sendStartTimes();
}

// TODO improve export: make picture bigger, prettier, increase resolution
export const exportSubHistory = () => {
  let [socketSubs] = io.of('/subs').sockets.values();
  if (socketSubs) {
    socketSubs.emit('subs-data', subscription); // make sure latest data is available
    socketSubs.emit('subs-export', config.bgColor, (dataUrl: string) => {
      // decode data uri string to buffer
      let image = decodeBase64(dataUrl);

      // generate path
      let date = new Date().toISOString();
      date = date.substring(0, date.lastIndexOf('.')).replace(/[.:T]/g, '-');
      let defaultName = path.join(__dirname, '..', '..', 'subs-' + date + '.png');

      // open dialog to save file
      let filename = dialog.showSaveDialogSync({ title: 'Save Sub History as .png', defaultPath: defaultName });
      if (filename) {
        fs.writeFileSync(filename, image.data);
      }
    });
  } else {
    // subs widget must be running TODO make export available without widget
    dialog.showErrorBox('Error exporting sub history', 'Could not export sub history because no subs widget is connected.');
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

  io.of('/timer').emit('config', newConfig);
  io.of('/history').emit('config', newConfig);
  io.of('/subs').emit('config', newConfig);
};

export const updateAllWidgets = () => {
  const data: WidgetData = getDataForWidgets();
  io.of('/timer').emit('update', data);
  io.of('/history').emit('update', data);
  io.of('/subs').emit('update', data);
}

export const updateTimerWidget = () => {
  const data: WidgetData = getDataForWidgets();
  io.of('/timer').emit('update', data);
};

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
  increaseTimer(addTime);

  // add sub to history
  // apparently 'sub' does not include info who gifted the sub so we cannot create a cumulative gift count per user
  //  -> update as soon as that information is available in API
  if (config.subHistoryEnabled) {
    subscription.push(sub);
    io.of('/subs').emit('subs-data', subscription);
  }

  sendStartTimes();
}
