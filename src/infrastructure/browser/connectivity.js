export function getOnlineStatus(browser = globalThis) {
  return browser.navigator?.onLine !== false;
}

export function subscribeConnectivity(listener, browser = globalThis) {
  const notify = () => listener({ online: getOnlineStatus(browser) });
  browser.addEventListener?.('online', notify);
  browser.addEventListener?.('offline', notify);
  return () => {
    browser.removeEventListener?.('online', notify);
    browser.removeEventListener?.('offline', notify);
  };
}
