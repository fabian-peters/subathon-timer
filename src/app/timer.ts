import config from '../types/config';
import { saveHistory, updateWidgets } from './server';
import { WidgetData } from '../types/widgetData';
import { State } from '../types/state';
import { startTask, stopTask } from './utils';
import * as https from 'https';

/*
TODO
 - update time on config change + app start
 - update timerHistoryInterval if changed in config
 - display current time in control app
 - refactor const to function?
 - refactor other widgets
 - run reformat over all source files
 - enable multiple connections per widget
 */

/** the current time of the timer */
let time = 0;

/** the current state of the timer, e.g. is it running/paused? */
let timerState = State.NOT_STARTED;

/** background task handling the countdown */
let timerCountdown: NodeJS.Timer;

/** background task to save the timer history */
let timerSaveHistory: NodeJS.Timer;

// TODO re-implement this for in-app timer:
//   if (intervalIdDrawLine) { // only update interval, do not start if it isn't running
//     if (timerHistoryEnabled) {
//       timerSaveHistory = startTask(timerSaveHistory, saveToTimerHistory, timerHistoryInterval);
//     } else { // history is disabled but there is still an interval active
//       clearInterval(timerSaveHistory);
//       timerSaveHistory = null;
//     }
//   }

/**
 * Initialize/reset the timer (without starting it).
 * This also stops any running background task like the countdown.
 *
 * @param initialTime the initial time of the timer (default: initial time from config)
 */
export const initTimer = (initialTime: number = config.inTime) => {
  // make sure background tasks are not running
  timerCountdown = stopTask(timerCountdown);
  timerSaveHistory = stopTask(timerSaveHistory);

  // pause, reset time and default values
  timerState = State.NOT_STARTED;
  setTime(Math.floor(initialTime * 60));
};

/**
 * Toggle timer state.
 * "Pause" is also used to start the timer because it is the same button in the UI.
 * If this is the initial start of the timer, start background tasks.
 */
export const togglePause = () => {
  switch (timerState) {
    case State.NOT_STARTED:
      timerState = State.RUNNING;
      saveToTimerHistory(); // update history to include the initial start
      timerSaveHistory = startTask(timerSaveHistory, saveToTimerHistory, config.timerHistoryInterval);
      timerCountdown = startTask(timerCountdown, countDown, 1);
      console.log('Timer started!');
      return;
    case State.RUNNING:
      timerState = State.PAUSED;
      console.log('Timer paused!');
      return;
    case State.PAUSED:
      timerState = State.RUNNING;
      console.log('Timer resumed!');
      return;
    case State.FINISHED:
      // ignore if timer already at 0
      return;
  }
}

/**
 * Increase the timer by the given amount.
 * The change is applied gradually (+1 every 25ms).
 *
 * @param additionalTime the additional time to add to the timer (in seconds)
 */
export const increaseTimer = (additionalTime: number) => {
  // do not increase timer if it already hit zero or disabled in settings TODO [#20] also if timer cap is hit
  if (timerState === State.FINISHED ||
    (timerState === State.NOT_STARTED && !config.addTimeBeforeStart) ||
    (timerState == State.PAUSED && !config.addTimePaused)){
    return;
  }

  let i = Math.floor(additionalTime);
  const interval: NodeJS.Timer = setInterval(() => {
    if (i === 0) return clearInterval(interval);
    setTime(time + 1);
    i -= 1;
  }, 25);
};

/**
 * Update the internal time and the displayed time to the given time.
 * Also check whether to trigger the webhook.
 *
 * @param newTime the time after update
 */
const setTime = (newTime: number) => {
  time = newTime;
  let data = new WidgetData(timerState, false, time, 0, 0); // TODO implement timer cap, total time and total subs
  console.log('Current time: ' + data.currentTimeString);
  // TODO update timer in control app
  updateWidgets(data);
  handleWebhooks();
};

/**
 * Trigger the webhook if the current time matches the configured trigger and webhooks are enabled.
 */
const handleWebhooks = () => {
  // TODO store config to not access file every single time?
  if (config.webhookEnabled && time === Math.floor(config.webhookTrigger / 1000)) { // trigger stored in config in ms but we use seconds for the time
    console.log('Triggering webhook...');

    const req = https.request(config.webhookUrl,{ method: 'POST' }, (res) => {
      console.log('Webhook responded with status code: ', res.statusCode);
      res.on('data', (d) => {
        process.stdout.write(d);
        console.log(); // new line
      });
    });

    req.on('error', (e) => {
      console.error('Webhook failed: ', e);
    });

    req.end();
  }
};

/**
 * Count down the timer and check if it hit 0.
 * Only count down if the timer is actually running.
 */
const countDown = () => {
  if (timerState !== State.RUNNING) return;

  setTime(time - 1);
  if (time === 0) {
    // stop background tasks
    timerCountdown = stopTask(timerCountdown);
    timerSaveHistory = stopTask(timerSaveHistory);

    saveToTimerHistory(); // update history to include the 0
    timerState = State.FINISHED;
  }
};

/**
 * Save the current time with timestamp to the timer history.
 * Note: This also happens while the timer is paused.
 */
const saveToTimerHistory = () => {
  if (!config.timerHistoryEnabled || timerState === State.FINISHED) return;

  saveHistory({
    timestamp: new Date(),
    time: time
  });
}
