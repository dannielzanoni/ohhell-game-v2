import { describe, expect, it, vi } from 'vitest';
import { getOnlineStatus, subscribeConnectivity } from './connectivity.js';

describe('browser connectivity adapter', () => {
  it('reports status changes and removes both listeners', () => {
    const listeners = {};
    const browser = {
      navigator: { onLine: false },
      addEventListener: vi.fn((type, listener) => { listeners[type] = listener; }),
      removeEventListener: vi.fn(),
    };
    const listener = vi.fn();
    const unsubscribe = subscribeConnectivity(listener, browser);
    expect(getOnlineStatus(browser)).toBe(false);
    listeners.online();
    expect(listener).toHaveBeenCalledWith({ online: false });
    unsubscribe();
    expect(browser.removeEventListener).toHaveBeenCalledTimes(2);
  });
});
