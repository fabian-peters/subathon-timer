const io = require('socket.io-client');
import { sendSub } from './server';
import config from './types/config';
import subscription from './types/subscription';

let socket: any;

export const listenForSubs = (token: string) => {
  socket = io(`https://sockets.streamlabs.com?token=${token}`, { transports: ['websocket'] });
  socket.on('event', (event: any) => {
    if (event.for && event.for === 'twitch_account' && (event.type === 'subscription' || event.type === 'resub')) {
      for (const sub of event.message) {
        sendSub(sub.sub_plan);

        // apparently 'sub' does not include info who gifted the sub so we cannot create a cumulative gift count per user
        //  -> update as soon as that information is available in API
        if (config.SubHistoryEnabled) {
          subscription.push({
            timestamp: new Date(),
            name: sub.name,
            sub_plan: sub.sub_plan
          });
        }
      }
    }
  });
};

export const reloadListener = (token: string): void => {
  if (socket) (socket as any).disconnect();
  listenForSubs(token);
};
