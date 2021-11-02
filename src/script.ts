(window as any).bridge.on('config', (config: any) => {
  (window as any).running.innerText = `Widget is running on http://localhost:${config.port}`;
  (window as any).streamLabsTokenInput.value = config.streamLabsTokens;
  (window as any).addTimeTier1Input.value = config.addTimeTier1;
  (window as any).addTimeTier2Input.value = config.addTimeTier2;
  (window as any).addTimeTier3Input.value = config.addTimeTier3;
  (window as any).portInput.value = config.port;
  (window as any).inTimeInput.value = config.inTime;
  (window as any).timespanInput.value = config.timespan;
  (window as any).refreshIntervalInput.value = config.refreshInterval;
  (window as any).bgColorInput.value = config.bgColor;
  (window as any).lineColorInput.value = config.lineColor;
  (window as any).timerColorInput.value = config.timerColor;
  (window as any).timerShadowColorInput.value = config.timerShadowColor;
  (window as any).webhookEnabledInput.checked = config.webhookEnabled;
  (window as any).webhookUrlInput.value = config.webhookUrl;
  (window as any).webhookTriggerInput.valueAsNumber = config.webhookTrigger;
  (window as any).timerHistoryEnabledInput.checked = config.timerHistoryEnabled;
  (window as any).timerHistoryShowTotalInput.checked = config.timerHistoryShowTotal;
  (window as any).timerHistoryIntervalInput.value = config.timerHistoryInterval;
  (window as any).subHistoryEnabledInput.checked = config.subHistoryEnabled;
  (window as any).subHistoryShowTotalInput.checked = config.subHistoryShowTotal;
  (window as any).subHistoryRefreshInput.value = config.subHistoryRefresh;
});

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

const changePage = (page: 0 | 1) => {
  (window as any).settings.style.display = ['none', 'flex'][page];
  (window as any).info.style.display = ['unset', 'none'][page];
  if (page) { // page = 1 is settings page
    (window as any).bridge.send('settings');
  }
};

(window as any).settingsButton.addEventListener('click', () => changePage(1));

(window as any).backButton.addEventListener('click', () => changePage(0));

((window as any).settings as HTMLFormElement).addEventListener('submit', e => {
  e.preventDefault();
  (window as any).running.innerText = `Widget is running on http://localhost:${Number((window as any).portInput.value)}`;
  (window as any).bridge.send('config', {
    streamLabsTokens: (window as any).streamLabsTokenInput.value
      .split(',')
      .map((token: string) => token.trim())
      .filter((token: string) => token) // filter out empty
      .filter((token: string, index: number, array: string[]) => array.indexOf(token) === index), // unique values (otherwise same token would lead to time added multiple times per sub)
    port: Number((window as any).portInput.value),
    addTimeTier1: (window as any).addTimeTier1Input.valueAsNumber,
    addTimeTier2: (window as any).addTimeTier2Input.valueAsNumber,
    addTimeTier3: (window as any).addTimeTier3Input.valueAsNumber,
    inTime: (window as any).inTimeInput.valueAsNumber,
    timespan: (window as any).timespanInput.valueAsNumber,
    refreshInterval: (window as any).refreshIntervalInput.valueAsNumber,
    bgColor: (window as any).bgColorInput.value,
    lineColor: (window as any).lineColorInput.value,
    timerColor: (window as any).timerColorInput.value,
    timerShadowColor: (window as any).timerShadowColorInput.value,
    webhookEnabled: (window as any).webhookEnabledInput.checked,
    webhookUrl: (window as any).webhookUrlInput.value,
    webhookTrigger: (window as any).webhookTriggerInput.valueAsNumber,
    timerHistoryEnabled: (window as any).timerHistoryEnabledInput.checked,
    timerHistoryShowTotal: (window as any).timerHistoryShowTotalInput.checked,
    timerHistoryInterval: (window as any).timerHistoryIntervalInput.valueAsNumber,
    subHistoryEnabled: (window as any).subHistoryEnabledInput.checked,
    subHistoryShowTotal: (window as any).subHistoryShowTotalInput.checked,
    subHistoryRefresh: (window as any).subHistoryRefreshInput.valueAsNumber
  });
  changePage(0);
});

((window as any).pauseButton as HTMLButtonElement).addEventListener('click', () => (window as any).bridge.send('pause'));
((window as any).stopButton as HTMLButtonElement).addEventListener('click', () => (window as any).bridge.send('stop')); // TODO add confirmation?
(window as any).timerHistoryResetButton.addEventListener('click', () => (window as any).bridge.send('history-reset'));
(window as any).timerHistoryExportButton.addEventListener('click', () => (window as any).bridge.send('history-export'));
(window as any).subHistoryResetButton.addEventListener('click', () => (window as any).bridge.send('subs-reset'));
(window as any).subHistoryExportButton.addEventListener('click', () => (window as any).bridge.send('subs-export'));
