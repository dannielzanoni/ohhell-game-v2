import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function readPreference(browser) {
  return {
    reducedMotion: Boolean(browser?.matchMedia?.(REDUCED_MOTION_QUERY).matches),
    saveData: Boolean(browser?.navigator?.connection?.saveData),
  };
}

export function useOptionalMedia(browser = globalThis) {
  const [preference, setPreference] = useState(() => readPreference(browser));

  useEffect(() => {
    const mediaQuery = browser?.matchMedia?.(REDUCED_MOTION_QUERY);
    const connection = browser?.navigator?.connection;
    const update = () => setPreference(readPreference(browser));

    mediaQuery?.addEventListener?.('change', update);
    connection?.addEventListener?.('change', update);
    return () => {
      mediaQuery?.removeEventListener?.('change', update);
      connection?.removeEventListener?.('change', update);
    };
  }, [browser]);

  return {
    ...preference,
    shouldLoadOptionalMedia: !preference.reducedMotion && !preference.saveData,
  };
}
