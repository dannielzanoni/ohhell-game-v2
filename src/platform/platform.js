export const DESKTOP_BREAKPOINT = 768;

export const platforms = Object.freeze({
  MOBILE: 'mobile',
  WEB: 'web',
});

export function getPlatformOverride(search = '') {
  const value = new URLSearchParams(search).get('ui');

  return Object.values(platforms).includes(value) ? value : null;
}

export function classifyPlatform({ search = '', width = 0 } = {}) {
  return (
    getPlatformOverride(search) ||
    (Number(width) >= DESKTOP_BREAKPOINT ? platforms.WEB : platforms.MOBILE)
  );
}

export function getBrowserPlatform(browser = globalThis.window) {
  if (!browser) {
    return platforms.MOBILE;
  }

  return classifyPlatform({
    search: browser.location?.search,
    width: browser.innerWidth,
  });
}

export function subscribeToPlatform(listener, browser = globalThis.window) {
  if (!browser) {
    return () => {};
  }

  const mediaQuery = browser.matchMedia?.(
    `(min-width: ${DESKTOP_BREAKPOINT}px)`,
  );
  const notify = () => listener(getBrowserPlatform(browser));

  mediaQuery?.addEventListener?.('change', notify);
  browser.addEventListener?.('popstate', notify);

  return () => {
    mediaQuery?.removeEventListener?.('change', notify);
    browser.removeEventListener?.('popstate', notify);
  };
}
