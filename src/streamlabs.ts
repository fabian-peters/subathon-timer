const io = require('socket.io-client');
import { sendSub } from './server';

let socket: any;

export const listenForSubs = (token: string) => {
  socket = io(`https://sockets.streamlabs.com?token=${token}`, { transports: ['websocket'] });
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

export const reloadListener = (token: string): void => {
  if (socket) (socket as any).disconnect();
  listenForSubs(token);
};
