import { sendSub } from './server';
import type { Socket } from 'socket.io';

const io = require('socket.io-client');

let sockets: Socket[] = [];

const listenForSubs = (token: string) => {
  let socket = io(`https://sockets.streamlabs.com?token=${token}`, { transports: ['websocket'] });
  sockets.push(socket);
  socket.on('event', (event: any) => {
    if (event.for && event.for === 'twitch_account' && (event.type === 'subscription' || event.type === 'resub')) {
      for (const sub of event.message) {
        sendSub({
          timestamp: new Date(),
          name: sub.name,
          tier: sub.sub_plan
        });
      }
    }
  });
  socket.on("connect_error", (err: any) => {
    console.log(`Streamlabs connection failed. Reason: ${err.message}`);
  });
};

export const reloadListener = (tokens: string[]): void => {
  // first, disconnect ALL sockets (log if not successful)
  sockets = sockets
    .filter(socket => socket)
    .map(socket => socket.disconnect())
    .filter(socket => socket.connected);
  if (sockets.length > 0) {
    console.log(`WARN: ${sockets.length} socket${sockets.length === 1 ? ' is' : 's are'} still connected.`);
  }

  // then open new sockets only for the tokens that were provided (may be more or less then previously)
  for (const token of tokens) {
    listenForSubs(token);
  }
};
