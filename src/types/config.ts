import * as fs from 'fs';

export interface Config {
  port: number;
  inTime: number;
  addTimeTier1: number;
  addTimeTier2: number;
  addTimeTier3: number;
  addTimeBeforeStart: boolean;
  addTimePaused: boolean;
  timespan: number;
  refreshInterval: number;
  bgColor: string;
  lineColor: string;
  timerColor: string;
  streamLabsTokens: string[];
  timerShadowColor: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookTrigger: number;
  timerHistoryEnabled: boolean;
  timerHistoryShowTotal: boolean;
  timerHistoryInterval: number;
  subHistoryEnabled: boolean;
  subHistoryShowTotal: boolean;
  subHistoryRefresh: number;
}

export default new Proxy(readFile('./config.json', defaultConfig()) as Config, {
  set: (obj, prop, value) => {
    (obj as any)[prop] = value;
    fs.writeFileSync('./config.json', JSON.stringify(obj, null, '  '));
    return true;
  }
});

export function readFile(filename: string, defaultValue: string) {
  let fileContent;
  try {
    fileContent = fs.readFileSync(filename).toString();
  } catch (e) {
    fileContent = defaultValue;
  }
  return JSON.parse(fileContent);
}

function defaultConfig() {
  return '{\n' +
    '  "streamLabsTokens": [],\n' +
    '  "port": 4040,\n' +
    '  "inTime": 60,\n' +
    '  "addTimeTier1": 60,\n' +
    '  "addTimeTier2": 90,\n' +
    '  "addTimeTier3": 120,\n' +
    '  "bgColor": "#323232",\n' +
    '  "lineColor": "#ff0000",\n' +
    '  "timerColor": "#ffc800",\n' +
    '  "timerShadowColor": "#323232",\n' +
    '  "timespan": 600,\n' +
    '  "refreshInterval": 10,\n' +
    '  "webhookUrl": "",\n' +
    '  "webhookTrigger": 300000,\n' +
    '  "webhookEnabled": false,\n' +
    '  "timerHistoryEnabled": true,\n' +
    '  "timerHistoryInterval": 60,\n' +
    '  "timerHistoryShowTotal": true,\n' +
    '  "subHistoryEnabled": true,\n' +
    '  "subHistoryShowTotal": true,\n' +
    '  "subHistoryRefresh": 20,\n' +
    '  "addTimeBeforeStart": false,\n' +
    '  "addTimePaused": true\n' +
    '}';
}
