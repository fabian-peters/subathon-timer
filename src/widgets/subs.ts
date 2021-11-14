import { Subscription } from '../types/subscription';
import { Config } from '../types/config';

const io = require("socket.io/client-dist/socket.io.min"); // use socket.io/client-dist instead of socket.io-client because streamlabs requires older client version

// TODO clean up code, add comments (like timer.js)
// TODO reduce code duplication with timer history if possible
let subs: Subscription[] = [];
let intervalIdDrawLine: NodeJS.Timer;

const socket = io("/subs");
socket.on('subs-data', (subsData: Subscription[]) => {
  subs = subsData
  setSubCount(subs.length);
  drawLine(subs);
  // console.log('subs: ' + subs.map(item => Date.parse(item.timestamp)));
});
socket.on('subs-export', (bgColor: string, callback: (dataUrl: string) => void) => {
  const globalCompositeOperation = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  callback(canvas.toDataURL());
  ctx.globalCompositeOperation = globalCompositeOperation;
});
socket.on('error', (msg: string) => {
  document.querySelector('div').innerText = msg;
});

const setSubCount = (count: number) => {
  document.querySelector('p').innerText = `${count}`;

  // TODO add webhooks for sub count? see #14
};

const canvas = document.getElementsByTagName('canvas')[0];
const ctx = canvas.getContext('2d');
ctx.lineWidth = 5; // TODO reduce width if timespan greater than x?
ctx.lineJoin = 'bevel';

socket.on('config', (config: Config) => {
  document.querySelector('p').hidden = !config.subHistoryShowTotal; // TODO add offset to config see #8

  document.querySelector('div').style.background = config.bgColor;
  document.querySelector('p').style.color = config.timerColor;
  document.querySelector('p').style.textShadow = `0px 0px 10px ${config.timerShadowColor}`;
  ctx.strokeStyle = config.lineColor;

  drawLine(subs);
  intervalIdDrawLine = startTask(intervalIdDrawLine, () => drawLine(subs), config.subHistoryRefresh);
});

/**
 * Run a task at a certain interval.
 * If it is already running, stop the old interval first.
 *
 * @param intervalId the intervalId for this task
 * @param task the task/function to execute
 * @param interval the interval to run the task (in seconds)
 * @returns {number}
 */
const startTask = (intervalId: NodeJS.Timer, task: () => void, interval: number) => {
  stopTask(intervalId)
  return setInterval(task, interval * 1000);
};

/**
 * Stop the task/interval with the given id.
 *
 * @param intervalId the id of the interval to stop
 * @returns {null} null to reset intervalId
 */
const stopTask = (intervalId: NodeJS.Timer): null => {
  if (intervalId) {
    clearInterval(intervalId);
  }
  return null;
};

const getNormalizedValues = (values: number[]) => {
  // TODO limit vertical zoom like in timer widget? probably not needed here
  let min = Math.min.apply(Math, values);
  let max = Math.max.apply(Math, values);

  let normalized = [];
  for (let value of values) {
    if (Number.isInteger(value)) {
      normalized.push((value - min) / (max - min));
    }
  }
  return normalized;
};

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
