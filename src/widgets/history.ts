import { History } from '../types/history';
import { Config } from '../types/config';
import { WidgetData } from '../types/widgetData';
import { getNormalizedValues } from '../utils';

const io = require("socket.io/client-dist/socket.io.min"); // use socket.io/client-dist instead of socket.io-client because streamlabs requires older client version

// TODO clean up code, add comments (like timer.js)

// graph
let timerHistory: History[] = []; // cache history to update graph if config changes
const canvas = document.getElementsByTagName('canvas')[0];
const ctx = canvas.getContext('2d');
ctx.lineWidth = 5; // TODO reduce width if timespan greater than x? add to config?
ctx.lineJoin = 'bevel';

// register events
const socket = io("/history");
socket.on('connect', () => {
  console.log('Connected to timer.');
  document.querySelector('span').innerText = "";
});
socket.on('disconnect', () => {
  console.log("Connection to timer lost.")
  document.querySelector('span').innerText = "Not connected to timer";
  document.querySelector('p').innerText = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
socket.on('error', (msg: string) => {
  document.querySelector('span').innerText = msg;
});
socket.on('config', (config: Config) => updateConfig(config));
socket.on('update', (data: WidgetData) => setTime(data.totalTimeString));
socket.on('history-data', (historyData: History[]) => {
  timerHistory = historyData
  drawLine(timerHistory);
});
socket.on('history-export', (bgColor: string, callback: (dataUrl: string) => void) => {
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
  document.querySelector('p').hidden = !config.timerHistoryShowTotal;

  document.querySelector('div').style.background = config.bgColor;
  document.querySelector('p').style.color = config.timerColor;
  document.querySelector('p').style.textShadow = `0px 0px 10px ${config.timerShadowColor}`;
  ctx.strokeStyle = config.lineColor;

  drawLine(timerHistory);
}

/**
 * Update the displayed total time to the given time.
 *
 * @param timeAsString the timer after update formatted to be displayed
 */
const setTime = (timeAsString: string) => {
  document.querySelector('p').innerText = timeAsString ? timeAsString : "";
};

/**
 * Draw the line graph of the total history of the provided data.
 *
 * @param data the graph data
 */
const drawLine = (data: any[]) => { // TODO replace by History[]?
  data = data
    .map(item => {
      const timestamp = Date.parse(item.timestamp); // parse date to a number
      return { ...item, timestamp };
    })
    .filter(item => Number.isInteger(item.timestamp) && Number.isInteger(item.time)) // remove invalid data points
    .sort((a, b) => a.timestamp - b.timestamp); // sort by timestamp in case json file is weird

  let dates = getNormalizedValues(data.map(value => value.timestamp));
  let times = getNormalizedValues(data.map(value => value.time), true).map(time => 1 - time);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // calc offsets so the line is not cut off at the edge
  const offset = ctx.lineWidth / 2;
  const width = canvas.width - ctx.lineWidth;
  const height = canvas.height - ctx.lineWidth;

  ctx.beginPath();
  ctx.moveTo(0, height * times[0] + offset);
  for (let i = 0; i < data.length; i++) {
    ctx.lineTo(width * dates[i] + offset, height * times[i] + offset);
  }
  ctx.lineTo(canvas.width, height * times[data.length - 1] + offset)
  ctx.stroke();
};
