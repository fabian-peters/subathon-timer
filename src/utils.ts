/**
 * Convert a time to a properly formatted string ("hh:mm:ss" or "d'd' hh:mm" depending on length).
 * Null will be converted to '0:00'.
 *
 * @param time the time to convert to a string
 * @returns {string} the formatted time
 */
export const convertToTimeString = (time: number) => {
  if (!time) return '0:00';

  const days = Math.floor(time / 86400),
    hours = Math.floor((time % 86400) / 3600),
    minutes = Math.floor((time % 3600) / 60),
    seconds = time % 60;

  // TODO leave it like this or adjust font size to fit and use 'd:hh:mm:ss'
  if (days === 0) {
    return `${hours ? `${hours}:${minutes < 10 ? '0' : ''}` : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  } else {
    return `${days}d ${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
  }
};

/**
 * Normalize values in array (between 0 and 1).
 *
 * @param values the array to normalize
 * @param useZeroAsMin whether to use zero or the lowest value from array as minimum; default: false (lowest value)
 * @returns {*[]} the array with the normalized values
 */
export const getNormalizedValues = (values: number[], useZeroAsMin: boolean = false) => {
  let min = useZeroAsMin ? 0 : Math.min.apply(Math, values);
  let max = Math.max.apply(Math, values);

  let normalized = [];
  for (let value of values) {
    if (Number.isInteger(value)) {
      normalized.push((value - min) / (max - min));
    }
  }
  return normalized;
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
