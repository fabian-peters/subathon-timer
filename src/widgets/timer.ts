import { Config } from '../types/config';
import { WidgetData } from '../types/widgetData';
import { convertToTimeString, startTask, stopTask } from '../utils';

const io = require("socket.io/client-dist/socket.io.min"); // use socket.io/client-dist instead of socket.io-client because streamlabs requires older client version

// TODO store config instead of individual values?
// background tasks
let intervalIdDrawLine: NodeJS.Timer;

// graph
let time = 0;
let timespan = 0;
let refreshInterval = 10;
let timeHistory: number[] = []; // TODO rename to avoid confusion if history widget
const canvas = document.getElementsByTagName('canvas')[0];
const ctx = canvas.getContext('2d');
ctx.lineWidth = 5;
ctx.lineJoin = 'bevel';

// register events
const socket = io("/timer");
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
socket.on('update', (data: WidgetData) => {
  setTime(data.currentTime);

  if (data.timerState === 'not-started') { // reset / init
    console.log('Reset or init received. Resetting graph...');
    // stop task
    intervalIdDrawLine = stopTask(intervalIdDrawLine);

    // reset graph
    timeHistory = [];
    drawLine(); // draw empty once to reset the graph
    timeHistory = new Array(timespan / refreshInterval);
  } else if (!intervalIdDrawLine) { // initial start of timer (or reconnect?)
    console.log('Initial start received. Starting graph...');
    drawLine(); // immediately start the graph (might make it look a bit weird because the spacing might be ~1s off, but that should be fine)
    intervalIdDrawLine = startTask(intervalIdDrawLine, drawLine, refreshInterval);
  }
});
socket.on('animate-timer', (additionalTime: number) => {
  let offset = Math.floor(additionalTime / 60); // this is to offset the inaccuracy caused by overwriting the values every second with normal update; '60' because it works
  let i = Math.floor(additionalTime + offset);
  const interval: NodeJS.Timer = setInterval(() => { // TODO stop on reset/connection loss; hide timer?
    if (i === 0) return clearInterval(interval);
    setTime(time + 1);
    i -= 1;
  }, 25);
});

/**
 * Update the configuration based on the provided config.
 * If the graph refresh interval changes, the respective task will be restarted with the new interval.
 *
 * @param config the config containing the new values that should be used
 */
const updateConfig = (config: Config) => { // TODO remove token before sending?
  // update colors
  document.querySelector('div').style.background = config.bgColor;
  document.querySelector('p').style.color = config.timerColor;
  document.querySelector('p').style.textShadow = `0px 0px 10px ${config.timerShadowColor}`;
  ctx.strokeStyle = config.lineColor;
  // TODO update current graph; only possible if timer calculates graph?

  // update history graph
  let oldSize = timespan / refreshInterval;
  timespan = config.timespan;
  if (refreshInterval === config.refreshInterval && oldSize === timeHistory.length) { // only resize if the array was initialized
    // interval is the same so we can copy the history
    console.log("Resizing the history array.")
    console.log("old history: " + timeHistory)
    const newSize = timespan / refreshInterval;
    while (timeHistory.length > newSize) { timeHistory.shift() } // while bigger, delete oldest values
    while (timeHistory.length < newSize) { timeHistory.unshift(null) } // while smaller, add to the front (so there is no break)
    console.log("new history: " + timeHistory)
  } else {
    // we need to update the interval and re-initialize the history
    console.log("Resetting the history because refresh interval changed.")
    refreshInterval = config.refreshInterval;
    timeHistory = new Array(timespan / refreshInterval);

    // also update the interval for drawLine
    if (intervalIdDrawLine) { // only update interval, do not start if it isn't running
      intervalIdDrawLine = startTask(intervalIdDrawLine, drawLine, refreshInterval);
    }
  }
}

/**
 * Update the internal time and the displayed time to the given time.
 *
 * @param newTime the time after update
 */
const setTime = (newTime: number) => {
  time = newTime; // still needed for the graph/animation even though timer is now running in app
  document.querySelector('p').innerText = convertToTimeString(time);
};

/**
 * Draw the line graph of the recent history.
 * Be careful with calling this method outside of an interval because that might lead to incorrect data.
 */
const drawLine = () => {
  timeHistory.shift();
  timeHistory.push(time);

  let points = timeHistory.filter(time => Number.isInteger(time) && time >= 0);

  // scale graph to fit
  let min = Math.min.apply(Math, points);
  let max = Math.max.apply(Math, points);
  let range = Math.max(max - min, 2 * timespan); // range = timespan would mean pretty steep curve even though nothing really happened so use at least twice the time span as vertical range
  points = points.map(time => 1 - ((time - min) / range)); // TODO move point calculation to app? pros: graph doesn't reset on reconnect and multiple timers have the same graph

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // calc offsets so the line is not cut off at the edge
  const offset = ctx.lineWidth / 2;
  const width = canvas.width - ctx.lineWidth;
  const height = canvas.height - ctx.lineWidth;

  ctx.beginPath();
  ctx.moveTo(0, height * points[0] + offset);
  for (let i = 0; i < points.length; i++) {
    ctx.lineTo(i * (width / (points.length - 1)) + offset, height * points[i] + offset);
  }
  ctx.lineTo(canvas.width, height * points[points.length - 1] + offset);
  ctx.stroke();
};
