import * as express from 'express';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import * as http from 'http';
import * as path from 'path';
import type { Config } from './config';
import config from './config';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let inTime = config.InTime;
let addTimeTier1 = config.AddTimeTier1;
let addTimeTier2 = config.AddTimeTier2;
let addTimeTier3 = config.AddTimeTier3;

export const startServer = () => server.listen(config.Port); // TODO refresh if changed?

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '..', 'resources/widget.html')));
app.get('/socket.io.js', (_req, res) => res.sendFile(path.join(__dirname, '..', 'node_modules', 'socket.io', 'client-dist', 'socket.io.min.js')));

let socket: Socket | undefined;

io.on('connection', s => {
  if (socket) socket.emit('error', 'only one widget allowed');
  socket = s;
  socket.emit('start', inTime);
  sendColors(config);
});

const sendColors = (newConfig: Config) =>
  socket &&
  socket.emit('colors', {
    lineColor: newConfig.LineColor,
    bgColor: newConfig.BgColor,
    timerColor: newConfig.TimerColor,
    timerShadowColor: newConfig.TimerShadowColor,
    // also update other graph stuff
    timespan: newConfig.Timespan,
    refreshInterval: newConfig.RefreshInterval,
    // update webhook config
    webhookEnabled: newConfig.WebhookEnabled,
    webhookUrl: newConfig.WebhookUrl,
    webhookTrigger: newConfig.WebhookTrigger
  });

export const updateConfigOnServer = (newConfig: Config) => {
  addTimeTier1 = newConfig.AddTimeTier1;
  addTimeTier2 = newConfig.AddTimeTier2;
  addTimeTier3 = newConfig.AddTimeTier3;
  inTime = newConfig.InTime;
  sendColors(newConfig);
};

export const sendPause = () => socket && socket.emit('pause');

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
    socket && socket.emit('sub', addTime);
}
