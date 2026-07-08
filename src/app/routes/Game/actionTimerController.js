const defaultClock = {
  clearInterval: (id) => globalThis.clearInterval(id),
  now: () => Date.now(),
  setInterval: (callback, delay) => globalThis.setInterval(callback, delay),
};

export function projectActionTimer(timer, now) {
  if (!timer) return null;
  const elapsedMs = Math.max(0, now - timer.startedAt);
  const remainingMs = Math.max(0, timer.durationMs - elapsedMs);

  return {
    ...timer,
    progress: timer.durationMs
      ? Math.max(0, Math.min(100, (remainingMs / timer.durationMs) * 100))
      : 0,
    remainingMs,
    seconds: Math.ceil(remainingMs / 1000),
  };
}

export function createActionTimerController({ clock = defaultClock, onExpire = () => {}, tickMs = 200 } = {}) {
  let expirationHandled = false;
  let expirationListener = onExpire;
  let intervalId = null;
  let sequence = 0;
  let timer = null;
  const listeners = new Set();

  const emit = () => {
    const state = projectActionTimer(timer, clock.now());
    listeners.forEach((listener) => listener(state));
    return state;
  };

  const stopInterval = () => {
    if (intervalId !== null) clock.clearInterval(intervalId);
    intervalId = null;
  };

  const tick = () => {
    const state = emit();
    if (!state || state.remainingMs > 0 || expirationHandled) return;
    expirationHandled = true;
    stopInterval();
    expirationListener(timer);
  };

  return {
    clear() {
      stopInterval();
      timer = null;
      expirationHandled = false;
      emit();
    },
    destroy() {
      stopInterval();
      listeners.clear();
    },
    getState() {
      return projectActionTimer(timer, clock.now());
    },
    setOnExpire(listener) {
      expirationListener = listener || (() => {});
    },
    start(type, cardCount) {
      stopInterval();
      const normalizedCardCount = Math.max(0, Math.trunc(Number(cardCount) || 0));
      const startedAt = clock.now();
      timer = {
        cardCount: normalizedCardCount,
        durationMs: (7 + normalizedCardCount) * 1000,
        id: `${type}-${startedAt}-${sequence += 1}`,
        startedAt,
        type,
      };
      expirationHandled = false;
      emit();
      intervalId = clock.setInterval(tick, tickMs);
      return timer;
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(projectActionTimer(timer, clock.now()));
      return () => listeners.delete(listener);
    },
  };
}
