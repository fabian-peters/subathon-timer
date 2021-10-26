import * as express from 'express';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import * as http from 'http';
import * as path from 'path';
import type { Config } from './types/config';
import config from './types/config';
import type { History } from './types/history';
import history from './types/history';

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
app.get('/socket.io.js', (_req, res) => res.sendFile(path.join(__dirname, '..', 'node_modules', 'socket.io', 'client-dist', 'socket.io.min.js')));

let socketTimer: Socket | undefined;
let socketHistory: Socket | undefined;

io.of('/history').on('connection', s => {
  // TODO allows multiple widget? store in array (not for timer!)
  if (socketHistory) socketHistory.emit('error', 'only one history widget allowed');
  socketHistory = s;
  socketHistory.emit('history-data', history);
  sendConfig(config);
});

io.of('/timer').on('connection', s => {
  if (socketTimer) socketTimer.emit('error', 'only one timer widget allowed');
  socketTimer = s;
  socketTimer.on('history', saveHistory);
  socketTimer.emit('start', inTime);
  sendConfig(config);
});

const saveHistory = (historyEntry: History) => {
  history.push(historyEntry);
  socketHistory && socketHistory.emit('history-data', history);
}

const sendConfig = (newConfig: Config) => {
  socketTimer &&
  socketTimer.emit('config', newConfig);
  socketHistory &&
  socketHistory.emit('config', newConfig);
}

export const updateConfigOnServer = (newConfig: Config) => {
  startServer() // restart on new port if necessary

  addTimeTier1 = newConfig.addTimeTier1;
  addTimeTier2 = newConfig.addTimeTier2;
  addTimeTier3 = newConfig.addTimeTier3;
  inTime = newConfig.inTime;
  sendConfig(newConfig);
};

export const sendPause = () => socketTimer && socketTimer.emit('pause');

export const sendSub = (tier: string) => {
    let addTime;
    switch (tier) {
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
}
