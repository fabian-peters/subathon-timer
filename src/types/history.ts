import * as fs from 'fs';
import {readFile} from "./subscription";

export interface History {
  timestamp: Date;
  time: number;
}

export default new Proxy(readFile('./history.json') as History[], {
  set: (obj, prop, value) => {
    (obj as any)[prop] = value;
    fs.writeFileSync('./history.json', JSON.stringify(obj, null, '  '));
    return true;
  }
});
