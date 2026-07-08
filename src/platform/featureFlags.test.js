import { describe, expect, it } from 'vitest';
import {
  getDefaultMobileUiVersion,
  getMobileUiQueryOverride,
  isMobileUiV2,
  mobileUiVersions,
  resolveMobileUiVersion,
} from './featureFlags.js';

describe('mobile UI rollout flags', () => {
  it('defaults to mobile v2 unless an environment default is supplied', () => {
    expect(getDefaultMobileUiVersion({})).toBe(mobileUiVersions.V2);
    expect(getDefaultMobileUiVersion({ VITE_MOBILE_UI_VERSION: 'v1' })).toBe(mobileUiVersions.CURRENT);
  });

  it('lets QA force the mobile UI by query without accepting unknown values', () => {
    expect(getMobileUiQueryOverride('?mobile_ui=v1')).toBe(mobileUiVersions.CURRENT);
    expect(getMobileUiQueryOverride('?mobile_ui=v2')).toBe(mobileUiVersions.V2);
    expect(getMobileUiQueryOverride('?mobile_ui=beta')).toBeNull();
  });

  it('resolves query before env so rollback does not alter contracts or stored data', () => {
    expect(resolveMobileUiVersion({
      environment: { VITE_MOBILE_UI_VERSION: 'v2' },
      search: '?mobile_ui=v1',
    })).toBe(mobileUiVersions.CURRENT);
    expect(isMobileUiV2({ search: '?mobile_ui=v2' })).toBe(true);
  });
});
