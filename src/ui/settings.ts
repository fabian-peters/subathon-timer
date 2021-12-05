(window as any).bridge.on('load-config', (config: any) => {
  (window as any).streamLabsTokenInput.value = config.streamLabsTokens;
  (window as any).addTimeTier1Input.value = config.addTimeTier1;
  (window as any).addTimeTier2Input.value = config.addTimeTier2;
  (window as any).addTimeTier3Input.value = config.addTimeTier3;
  (window as any).addTimeBeforeStartInput.checked = config.addTimeBeforeStart;
  (window as any).addTimePausedInput.checked = config.addTimePaused;
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

((window as any).settings as HTMLFormElement).addEventListener('submit', e => {
  e.preventDefault();
  (window as any).bridge.send('save-config', {
    streamLabsTokens: (window as any).streamLabsTokenInput.value
      .split(',')
      .map((token: string) => token.trim())
      .filter((token: string) => token) // filter out empty
      .filter((token: string, index: number, array: string[]) => array.indexOf(token) === index), // unique values (otherwise same token would lead to time added multiple times per sub)
    port: Number((window as any).portInput.value),
    addTimeTier1: (window as any).addTimeTier1Input.valueAsNumber,
    addTimeTier2: (window as any).addTimeTier2Input.valueAsNumber,
    addTimeTier3: (window as any).addTimeTier3Input.valueAsNumber,
    addTimeBeforeStart: (window as any).addTimeBeforeStartInput.checked,
    addTimePaused: (window as any).addTimePausedInput.checked,
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
});

(window as any).backButton.addEventListener('click', () => (window as any).bridge.send('close-settings'));
(window as any).timerHistoryResetButton.addEventListener('click', () => (window as any).bridge.send('history-reset'));
(window as any).timerHistoryExportButton.addEventListener('click', () => (window as any).bridge.send('history-export'));
(window as any).subHistoryResetButton.addEventListener('click', () => (window as any).bridge.send('subs-reset'));
(window as any).subHistoryExportButton.addEventListener('click', () => (window as any).bridge.send('subs-export'));

function showSection(id: string) {
  const sections = Array.from(document.getElementsByClassName("settings-section"));
  sections.forEach(div => {
    if (!div.classList.contains('hide')) { div.classList.add('hide') }
  });

  document.getElementById(id.replace('-nav','')).classList.remove('hide');

  const navs = Array.from(document.getElementsByClassName("nav-item"));
  navs.forEach(nav => {
    if (nav.classList.contains('active')) { nav.classList.remove('active'); }
  });
  document.getElementById(id).classList.add('active');
}
