import { useEffect, useState } from 'react';

export function useTemporaryValue(initialValue, durationMs = 1600) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (value === initialValue) return undefined;
    const timeout = globalThis.setTimeout(() => setValue(initialValue), durationMs);
    return () => globalThis.clearTimeout(timeout);
  }, [durationMs, initialValue, value]);
  return [value, setValue];
}
