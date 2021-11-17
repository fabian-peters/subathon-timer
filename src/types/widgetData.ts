import { State } from './state';
import { convertToTimeString, convertToTotalTimeString } from '../utils';
import history from './history';
import subscription from './subscription';

export class WidgetData {
  timestamp: Date = new Date();
  timerState: State;
  capReached: boolean;
  currentTime: number;
  currentTimeString: string;
  startTimestamp: Date;
  totalTime: number;
  totalTimeString: string;
  totalSubs: number;
  // TODO [#8] add start startSubs/subsOffset?

  constructor(timerState: State, capReached: boolean, currentTime: number) {
    this.timerState = timerState;
    this.capReached = capReached;
    this.currentTime = currentTime;
    this.currentTimeString = convertToTimeString(currentTime);

    // calculate total time
    let startTime = this.getStartTime();
    const now = Math.floor((this.timestamp as unknown as number) / 1000);
    let totalTime = now - startTime;
    if (!Number.isInteger(totalTime)) {
      totalTime = 0;
    }

    // console.log(`${this.startTimestamp.toLocaleString()} (${startTime}), ${this.timestamp.toLocaleString()} (${now}): ${totalTime}`); // TODO remove

    this.totalTime = totalTime;
    this.totalTimeString = convertToTotalTimeString(totalTime);

    this.totalSubs = subscription.length; // TODO [#8] add offset
  }

  private getStartTime(): number {
    // TODO [#8] allow start time from config
    this.startTimestamp = new Date(Math.min.apply(Math, history.map(item => Date.parse(item.timestamp as unknown as string))));
    return Math.floor((this.startTimestamp as unknown as number) / 1000);
  }

}
