import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getBrowserPlatform,
  platforms,
  subscribeToPlatform,
} from './platform.js';

const PlatformContext = createContext({
  isMobile: true,
  isWeb: false,
  platform: platforms.MOBILE,
});

export function PlatformProvider({ children, browser = globalThis.window }) {
  const [platform, setPlatform] = useState(() => getBrowserPlatform(browser));

  useEffect(() => subscribeToPlatform(setPlatform, browser), [browser]);

  useEffect(() => {
    const root = browser?.document?.documentElement;

    if (root) {
      root.dataset.platform = platform;
    }
  }, [browser, platform]);

  const value = useMemo(
    () => ({
      isMobile: platform === platforms.MOBILE,
      isWeb: platform === platforms.WEB,
      platform,
    }),
    [platform],
  );

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  return useContext(PlatformContext);
}
