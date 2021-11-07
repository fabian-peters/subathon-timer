(window as any).bridge.on('update-start-times', (startTimes: any) => {
  if (isNaN(startTimes.history)) {
    (window as any).historyStart.innerText = `No timer history found`;
  } else {
    (window as any).historyStart.innerText = `Timer history started at ${startTimes.history.toLocaleString()}`;
  }

  if (isNaN(startTimes.subs)) {
    (window as any).subsStart.innerText = `No sub history found`;
  } else {
    (window as any).subsStart.innerText = `Sub history started at ${startTimes.subs.toLocaleString()}`;
  }
});

(window as any).bridge.on('update-timer', (timeString: string) => {
  (window as any).timerFront.innerText = timeString;
  (window as any).timerBackground.innerText = timeString.replace(/\d/g, '8');
});

((window as any).pauseButton as HTMLButtonElement).addEventListener('click', () => (window as any).bridge.send('pause'));
((window as any).stopButton as HTMLButtonElement).addEventListener('click', () => (window as any).bridge.send('stop')); // TODO add confirmation?
((window as any).settingsButton as HTMLButtonElement).addEventListener('click', () => (window as any).bridge.send('open-settings'));
