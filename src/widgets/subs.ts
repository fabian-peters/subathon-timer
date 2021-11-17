import { Subscription } from '../types/subscription';
import { Config } from '../types/config';
import { WidgetData } from '../types/widgetData';
import { getNormalizedValues, startTask, stopTask } from '../utils';

const io = require("socket.io/client-dist/socket.io.min"); // use socket.io/client-dist instead of socket.io-client because streamlabs requires older client version

// TODO reduce code duplication with timer history if possible

// background tasks
let intervalIdDrawLine: NodeJS.Timer;

// graph
let subs: Subscription[] = [];
const canvas = document.getElementsByTagName('canvas')[0];
const ctx = canvas.getContext('2d');
ctx.lineWidth = 5; // TODO reduce width if timespan greater than x?
ctx.lineJoin = 'bevel';

// register events
const socket = io("/subs");
socket.on('connect', () => {
  console.log('Connected to timer.');
  document.querySelector('span').innerText = "";
});
socket.on('disconnect', () => {
  console.log("Connection to timer lost.")
  document.querySelector('span').innerText = "Not connected to timer";
  document.querySelector('p').innerText = "";
  intervalIdDrawLine = stopTask(intervalIdDrawLine);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
socket.on('error', (msg: string) => {
  document.querySelector('span').innerText = msg;
});
socket.on('config', (newConfig: Config) => updateConfig(newConfig));
socket.on('update', (data: WidgetData) => setSubCount(data.totalSubs));
socket.on('subs-data', (subsData: Subscription[]) => {
  subs = subsData
  drawLine(subs);
});
socket.on('subs-export', (bgColor: string, callback: (dataUrl: string) => void) => {
  const globalCompositeOperation = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  callback(canvas.toDataURL());
  ctx.globalCompositeOperation = globalCompositeOperation;
});

/**
 * Update the configuration based on the provided config.
 *
 * @param config the config containing the new values that should be used
 */
const updateConfig = (config: Config) => {
  document.querySelector('p').hidden = !config.subHistoryShowTotal;

  document.querySelector('div').style.background = config.bgColor;
  document.querySelector('p').style.color = config.timerColor;
  document.querySelector('p').style.textShadow = `0px 0px 10px ${config.timerShadowColor}`;
  ctx.strokeStyle = config.lineColor;

  drawLine(subs);
  intervalIdDrawLine = startTask(intervalIdDrawLine, () => drawLine(subs), config.subHistoryRefresh);
};

/**
 * Update the displayed sub count.
 *
 * @param count the new sub count
 */
const setSubCount = (count: number) => {
  document.querySelector('p').innerText = `${count}`;
};

/**
 * Draw the line graph of the sub count history of the provided data.
 *
 * @param data the graph data
 */
const drawLine = (data: any[]) => {  // TODO replace by Subscription[]?
  // TODO add possibility to limit the timespan of the graph
  // TODO use same start time as history (could get from widgetData); ties in with todo above
  data = data
    .map(item => {
      const timestamp = Date.parse(item.timestamp); // parse date to a number
      return { ...item, timestamp };
    })
    .filter(item => Number.isInteger(item.timestamp)) // remove invalid data points
    .sort((a, b) => a.timestamp - b.timestamp); // sort by timestamp in case json file is weird

  let dates = data.map(value => value.timestamp);
  dates.push(Date.now()); // add current timestamp to stretch the graph to current time instead of last sub
  dates = getNormalizedValues(dates);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // calc offsets so the line is not cut off at the edge
  const offset = ctx.lineWidth / 2;
  const width = canvas.width - ctx.lineWidth;
  const height = canvas.height - ctx.lineWidth;

  ctx.beginPath();
  ctx.moveTo(0, height + offset);
  for (let i = 0; i < data.length; i++) { // important: use 'data' not 'dates' as 'dates' contains current time additionally  which isn't a sub
    let subCount = i + 1; // data is 0-indexed so subCount is 1 higher than index
    ctx.lineTo(width * dates[i] + offset, height * (1 - (i / data.length)) + offset); // i is also equal to the previous subCount
    ctx.lineTo(width * dates[i] + offset, height * (1 - (subCount / data.length)) + offset);
  }
  ctx.lineTo(canvas.width, (data.length === 0 ? height : 0) + offset); // finish line to current timestamp (end of graph, subCount is either at 0 or max)
  ctx.stroke();
};
