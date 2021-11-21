import config from '../types/config';
import { animateTimerInWidget, saveHistory, updateAllWidgets } from './server';
import { WidgetData } from '../types/widgetData';
import { State } from '../types/state';
import { convertToTimeString, startTask, stopTask } from '../utils';
import * as https from 'https';
import { updateAppTimer } from './main';

/*
TODO
 - refactor const to function?
 - refactor other widgets
 - run reformat over all source files
 */

/** the current time of the timer */
let time = 0;

/** the current state of the timer, e.g. is it running/paused? */
let timerState = State.NOT_STARTED;

/** background task to save the timer history */
let timerSaveHistory: NodeJS.Timer;

/**
 * Update the time and "save history" interval to new config.
 */
export const updateAppTimerConfig = () => {
  if (timerState === State.NOT_STARTED) {
    initTimer();
  }

  // update timer/interval for saving timer history
  if (timerState === State.RUNNING || timerState === State.PAUSED) { // only update if timer is running
    if (config.timerHistoryEnabled) {
      saveToTimerHistory();
      timerSaveHistory = startTask(timerSaveHistory, saveToTimerHistory, config.timerHistoryInterval);
    } else {
      timerSaveHistory = stopTask(timerSaveHistory);
    }
  }
}

/**
 * Stuff to do every tick, i.e. every second.
 * This is running even if timer is not started yet or timer already finished.
 */
const tick = () => {
  countDown(); // has internal check if timer is running
  updateAllWidgets();
}
startTask(null, tick, 1); // run all the time so don't store the id

/**
 * Initialize/reset the timer (without starting it).
 * This also stops any running background task like saving the timer history.
 */
export const initTimer = () => {
  // make sure background tasks are not running
  timerSaveHistory = stopTask(timerSaveHistory);

  // reset timer
  const initialTimeSeconds = Math.floor(config.inTime * 60);
  timerState = initialTimeSeconds > 0 ? State.NOT_STARTED : State.FINISHED;
  setTime(initialTimeSeconds);

  updateAllWidgets();
};

/**
 * Resume the timer from the specified time (if it isn't already running), e.g. from history.
 * This sets the time and brings the timer to the correct state
 *
 * @param resumeTimeSeconds the time in seconds
 */
export const resumeTimerFrom = (resumeTimeSeconds: number) => {
  if (timerState !== State.NOT_STARTED) return;

  setTime(resumeTimeSeconds);

  if (resumeTimeSeconds > 0) {
    // toggle pause twice to get to correct state while also triggering initial start stuff etc.
    togglePause();
    togglePause();
  } else {
    // timer was already finished
    timerState = State.FINISHED;
  }

  updateAllWidgets();
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
      if (config.timerHistoryEnabled) {
        saveToTimerHistory(); // update history to include the initial start
        timerSaveHistory = startTask(timerSaveHistory, saveToTimerHistory, config.timerHistoryInterval);
      }
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
    (timerState === State.PAUSED && !config.addTimePaused)){
    return;
  }

  let i = Math.floor(additionalTime);
  const interval: NodeJS.Timer = setInterval(() => {
    if (i === 0) {
      updateAllWidgets(); // update widgets with final value
      return clearInterval(interval);
    }
    setTime(time + 1);
    i -= 1;
  }, 25);
  animateTimerInWidget(additionalTime); // trigger "animation" on client side to reduce network load
};

/**
 * Update the internal time and the displayed time to the given time.
 * Also check whether to trigger the webhook.
 *
 * @param newTime the time after update
 */
const setTime = (newTime: number) => {
  time = newTime;
  let timeString = convertToTimeString(time);
  console.log('Current time: ' + timeString);
  updateAppTimer(timeString);
  handleWebhooks();
};

/**
 * TODO
 */
export const getDataForWidgets = () => {
  return new WidgetData(timerState, false, time); // TODO implement timer cap, total time and total subs
}

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
    // stop timer history
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
