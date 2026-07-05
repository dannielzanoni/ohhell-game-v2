import { describe, expect, it, vi } from 'vitest';
import {
  classifyPlatform,
  getBrowserPlatform,
  getPlatformOverride,
  platforms,
  subscribeToPlatform,
} from './platform.js';

describe('platform classifier', () => {
  it.each([
    [0, platforms.MOBILE],
    [320, platforms.MOBILE],
    [767, platforms.MOBILE],
    [768, platforms.WEB],
    [1440, platforms.WEB],
  ])('classifies width %i as %s', (width, expected) => {
    expect(classifyPlatform({ width })).toBe(expected);
  });

  it('allows a non-persistent query override', () => {
    expect(classifyPlatform({ search: '?ui=web', width: 320 })).toBe('web');
    expect(classifyPlatform({ search: '?ui=mobile', width: 1440 })).toBe(
      'mobile',
    );
    expect(getPlatformOverride('?ui=tablet')).toBeNull();
  });

  it('is safe without a browser window', () => {
    expect(getBrowserPlatform(undefined)).toBe(platforms.MOBILE);
  });

  it('subscribes and cleans up without owning application state', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const mediaQuery = { addEventListener, removeEventListener };
    const browser = {
      addEventListener,
      innerWidth: 768,
      location: { search: '' },
      matchMedia: () => mediaQuery,
      removeEventListener,
    };

    const unsubscribe = subscribeToPlatform(vi.fn(), browser);
    unsubscribe();

    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledTimes(2);
  });
});
