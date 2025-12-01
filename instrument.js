(function () {
  const v = document.getElementById('video');
  const logEl = document.getElementById('log');
  const startBtn = document.getElementById('startLog');
  const dlBtn = document.getElementById('downloadLog');

  const events = [
    'loadstart','loadedmetadata','loadeddata','canplay','canplaythrough',
    'playing','play','pause','waiting','stalled','seeking','seeked','ended','error','progress','suspend'
  ];

  let records = [];

  function push(msg, data) {
    const entry = {
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      msg,
      data
    };
    records.push(entry);
    logEl.textContent =
      `${entry.iso} | ${msg} ${data ? JSON.stringify(data) : ''}\n`
      + logEl.textContent;
  }

  function bufferedInfo() {
    const b = v.buffered;
    const ranges = [];
    for (let i = 0; i < b.length; ++i)
      ranges.push([b.start(i), b.end(i)]);

    return {
      ranges,
      bufferedPercent: b.length ? (b.end(b.length-1) / v.duration * 100).toFixed(2) : null,
      readyState: v.readyState,
      networkState: v.networkState,
      currentTime: v.currentTime
    };
  }

  events.forEach(ev =>
    v.addEventListener(ev, () => push(ev, bufferedInfo()))
  );

  // periodic monitoring
  let interval = null;
  function startPeriodic() {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      push('tick', bufferedInfo());
    }, 500);
  }
  function stopPeriodic() {
    if (interval) { clearInterval(interval); interval = null; }
  }

  v.addEventListener('play', startPeriodic);
  v.addEventListener('pause', stopPeriodic);
  v.addEventListener('ended', stopPeriodic);

  startBtn.addEventListener('click', () => {
    records = [];
    logEl.textContent = "";
    push('log-start', { userAgent: navigator.userAgent });

    v.currentTime = 0;
    v.load();
  });

  dlBtn.addEventListener('click', () => {
    const blob = new Blob(
      [JSON.stringify(records, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video_log.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  push('script-loaded', {});
})();
