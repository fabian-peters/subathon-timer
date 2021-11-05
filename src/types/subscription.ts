import * as fs from 'fs';

export interface Subscription {
  timestamp: Date;
  name: string;
  tier: string;
}

// TODO move to utils
export function readFile(filename: string) {
  let fileContent;
  try {
    fileContent = fs.readFileSync(filename).toString();
  } catch (e) {
    fileContent = "[]"; // TODO use object for config (parameter? 2 methods?)
  }
  return JSON.parse(fileContent);
}

export default new Proxy(readFile('./subs.json') as Subscription[], {
  set: (obj, prop, value) => {
    (obj as any)[prop] = value;
    fs.writeFileSync('./subs.json', JSON.stringify(obj, null, '  '));
    return true;
  }
});
