(window as any).bridge.on('config', (config: any) => {
  (window as any).running.innerText = `Widget is running on http://localhost:${config.Port}`;
  (window as any).streamLabsTokenInput.value = config.StreamLabsToken;
  (window as any).addTimeTier1Input.value = config.AddTimeTier1;
  (window as any).addTimeTier2Input.value = config.AddTimeTier2;
  (window as any).addTimeTier3Input.value = config.AddTimeTier3;
  (window as any).portInput.value = config.Port;
  (window as any).inTimeInput.value = config.InTime;
  (window as any).timespanInput.value = config.Timespan;
  (window as any).refreshIntervalInput.value = config.RefreshInterval;
  (window as any).bgColorInput.value = config.BgColor;
  (window as any).lineColorInput.value = config.LineColor;
  (window as any).timerColorInput.value = config.TimerColor;
  (window as any).timerShadowColorInput.value = config.TimerShadowColor;
  (window as any).webhookEnabledInput.checked = config.WebhookEnabled;
  (window as any).webhookUrlInput.value = config.WebhookUrl;
  (window as any).webhookTriggerInput.valueAsNumber = config.WebhookTrigger;
});

const changePage = (page: 0 | 1) => {
  (window as any).settings.style.display = ['none', 'flex'][page];
  (window as any).info.style.display = ['unset', 'none'][page];
};

(window as any).settingsButton.addEventListener('click', () => changePage(1));

(window as any).backButton.addEventListener('click', () => changePage(0));

((window as any).settings as HTMLFormElement).addEventListener('submit', e => {
  e.preventDefault();
  (window as any).bridge.send('config', {
    StreamLabsToken: (window as any).streamLabsTokenInput.value,
    Port: Number((window as any).portInput.value),
    AddTimeTier1: (window as any).addTimeTier1Input.valueAsNumber,
    AddTimeTier2: (window as any).addTimeTier2Input.valueAsNumber,
    AddTimeTier3: (window as any).addTimeTier3Input.valueAsNumber,
    InTime: (window as any).inTimeInput.valueAsNumber,
    Timespan: (window as any).timespanInput.valueAsNumber,
    RefreshInterval: (window as any).refreshIntervalInput.valueAsNumber,
    BgColor: (window as any).bgColorInput.value,
    LineColor: (window as any).lineColorInput.value,
    TimerColor: (window as any).timerColorInput.value,
    TimerShadowColor: (window as any).timerShadowColorInput.value,
    WebhookEnabled: (window as any).webhookEnabledInput.checked,
    WebhookUrl: (window as any).webhookUrlInput.value,
    WebhookTrigger: (window as any).webhookTriggerInput.valueAsNumber
  });
  changePage(0);
});

((window as any).pauseButton as HTMLButtonElement).addEventListener('click', () => (window as any).bridge.send('pause'));
