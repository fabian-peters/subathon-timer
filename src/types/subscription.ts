import * as fs from 'fs';

export interface Subscription {
  timestamp: Date;
  name: string;
  tier: string;
}

export default new Proxy(JSON.parse(fs.readFileSync('./subs.json').toString()) as Subscription[], {
  set: (obj, prop, value) => {
    (obj as any)[prop] = value;
    fs.writeFileSync('./subs.json', JSON.stringify(obj, null, '  '));
    return true;
  }
});
