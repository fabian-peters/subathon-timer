import * as fs from 'fs';
import { readFile } from './config';

export interface Subscription {
  timestamp: Date;
  name: string;
  tier: string;
}

export default new Proxy(readFile('./subs.json', '[]') as Subscription[], {
  set: (obj, prop, value) => {
    (obj as any)[prop] = value;
    fs.writeFileSync('./subs.json', JSON.stringify(obj, null, '  '));
    return true;
  }
});
