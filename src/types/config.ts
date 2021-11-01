import * as fs from 'fs';

export interface Config {
  port: number;
  inTime: number;
  addTimeTier1: number;
  addTimeTier2: number;
  addTimeTier3: number;
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

export default new Proxy(JSON.parse(fs.readFileSync('./config.json').toString()) as Config, {
  set: (obj, prop, value) => {
    (obj as any)[prop] = value;
    fs.writeFileSync('./config.json', JSON.stringify(obj, null, '  '));
    return true;
  }
});
