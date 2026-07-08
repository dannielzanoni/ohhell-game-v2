const defaultScheduler = {
  clearTimeout: (id) => globalThis.clearTimeout(id),
  setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
};

export function createRoundTransitionController({ scheduler = defaultScheduler } = {}) {
  let active = false;
  let queue = [];
  let timeoutId = null;

  return {
    begin({ delayMs, onComplete, process }) {
      if (active) return false;
      active = true;
      timeoutId = scheduler.setTimeout(() => {
        timeoutId = null;
        active = false;
        onComplete?.();

        while (queue.length && !active) {
          process(queue.shift());
        }
      }, Math.max(0, Number(delayMs) || 0));
      return true;
    },
    cancel() {
      if (timeoutId !== null) scheduler.clearTimeout(timeoutId);
      timeoutId = null;
      active = false;
      queue = [];
    },
    enqueue(message) {
      queue.push(message);
    },
    isActive() {
      return active;
    },
    queuedCount() {
      return queue.length;
    },
  };
}
