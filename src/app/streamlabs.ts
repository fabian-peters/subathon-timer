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
};

export const reloadListener = (tokens: string[]): void => {
  // first, disconnect ALL sockets
  for (const socket of sockets) {
    if (socket) socket.disconnect();
  }

  // then open new sockets only for the tokens that were provided (may be more or less then previously)
  for (const token of tokens) {
    listenForSubs(token);
  }
};
