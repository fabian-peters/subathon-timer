import * as fs from 'fs';

export interface History {
  timestamp: Date;
  time: number;
}

export default new Proxy(JSON.parse(fs.readFileSync('./history.json').toString()) as [History], {
  set: (obj, prop, value) => {
    (obj as any)[prop] = value;
    fs.writeFileSync('./history.json', JSON.stringify(obj, null, '  '));
    return true;
  }
});
