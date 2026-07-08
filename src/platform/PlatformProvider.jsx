import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getBrowserPlatform,
  getPlatformSearch,
  platforms,
  subscribeToPlatform,
} from './platform.js';
import { mobileUiVersions, resolveMobileUiVersion } from './featureFlags.js';

const PlatformContext = createContext({
  isMobile: true,
  isMobileV2: true,
  isWeb: false,
  mobileUiVersion: 'v2',
  platform: platforms.MOBILE,
});

export function PlatformProvider({ children, browser = globalThis.window, environment = import.meta.env }) {
  const [platform, setPlatform] = useState(() => getBrowserPlatform(browser));
  const [mobileUiVersion, setMobileUiVersion] = useState(() =>
    resolveMobileUiVersion({ environment, search: getPlatformSearch(browser) }),
  );

  useEffect(() => subscribeToPlatform((nextPlatform) => {
    setPlatform(nextPlatform);
    setMobileUiVersion(resolveMobileUiVersion({
      environment,
      search: getPlatformSearch(browser),
    }));
  }, browser), [browser, environment]);

  useEffect(() => {
    const root = browser?.document?.documentElement;

    if (root) {
      root.dataset.platform = platform;
      root.dataset.mobileUi = mobileUiVersion;
    }
  }, [browser, mobileUiVersion, platform]);

  const value = useMemo(
    () => ({
      isMobile: platform === platforms.MOBILE,
      isMobileV2: platform === platforms.MOBILE && mobileUiVersion === mobileUiVersions.V2,
      isWeb: platform === platforms.WEB,
      mobileUiVersion,
      platform,
    }),
    [mobileUiVersion, platform],
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
