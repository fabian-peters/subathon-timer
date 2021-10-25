import * as fs from 'fs';

export interface Config {
  Port: number;
  InTime: number;
  AddTimeTier1: number;
  AddTimeTier2: number;
  AddTimeTier3: number;
  Timespan: number;
  RefreshInterval: number;
  BgColor: string;
  LineColor: string;
  TimerColor: string;
  StreamLabsToken: string;
  TimerShadowColor: string;
  WebhookEnabled: boolean;
  WebhookUrl: string;
  WebhookTrigger: number;
}

export default new Proxy(JSON.parse(fs.readFileSync('./config.json').toString()) as Config, {
  set: (obj, prop, value) => {
    (obj as any)[prop] = value;
    fs.writeFileSync('./config.json', JSON.stringify(obj, null, '  '));
    return true;
  }
});
