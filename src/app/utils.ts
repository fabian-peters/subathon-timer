export const convertToTimeString = (time: number) => {
  if (!time) return '0:00';

  const hours = Math.floor(time / 3600),
    minutes = Math.floor((time % 3600) / 60),
    seconds = time % 60;
  return `${hours ? `${hours}:${minutes < 10 ? '0' : ''}` : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// different format used for total time because it may be significantly longer TODO instead use the same and build switch if it is too long?
export const convertToTotalTimeString = (totalTime: number) => {
  if (!totalTime) return '0:00';

  const days = Math.floor(totalTime / 86400),
    hours = Math.floor((totalTime % 86400) / 3600),
    minutes = Math.floor((totalTime % 3600) / 60),
    seconds = totalTime % 60;
  return `${days ? `${days}d ` : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
};

/**
 * Run a task at a certain interval.
 * If it is already running, stop the old interval first.
 *
 * @param intervalId the intervalId for this task
 * @param task the task/function to execute
 * @param interval the interval to run the task (in seconds)
 * @returns {number}
 */
export const startTask = (intervalId: NodeJS.Timer, task: () => void, interval: number): NodeJS.Timer => {
  stopTask(intervalId)
  return setInterval(task, interval * 1000);
};

/**
 * Stop the task/interval with the given id.
 *
 * @param intervalId the id of the interval to stop
 * @returns {null} null to reset intervalId
 */
export const stopTask = (intervalId: NodeJS.Timer): null => {
  if (intervalId) {
    clearInterval(intervalId);
  }
  return null;
};
