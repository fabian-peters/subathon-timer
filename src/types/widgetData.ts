import { State } from './state';
import { convertToTimeString } from '../app/utils';

export class WidgetData {
  timestamp: Date = new Date();
  timerState: State;
  capReached: boolean;
  currentTime: number;
  currentTimeString: string;
  totalTime: number;
  totalTimeString: string;
  totalSubs: number;


  constructor(timerState: State, capReached: boolean, currentTime: number, totalTime: number, totalSubs: number) {
    this.timerState = timerState;
    this.capReached = capReached;
    this.currentTime = currentTime;
    this.currentTimeString = convertToTimeString(currentTime);
    this.totalTime = totalTime;
    this.totalTimeString = convertToTimeString(totalTime);
    this.totalSubs = totalSubs;
  }
}
