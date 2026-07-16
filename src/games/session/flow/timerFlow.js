import { useEffect, useState } from 'react';

export function useTimerNow(timer) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer) return undefined;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(interval);
  }, [timer]);

  return now;
}

export function getTimerSnapshot(timer, now) {
  if (!timer) return { progress: 0, seconds: 0 };
  const elapsedMs = Math.max(0, now - timer.startedAt);
  const remainingMs = Math.max(0, timer.durationMs - elapsedMs);
  const progress = timer.durationMs
    ? Math.max(0, Math.min(100, (remainingMs / timer.durationMs) * 100))
    : 0;

  return { progress, seconds: Math.ceil(remainingMs / 1000) };
}
