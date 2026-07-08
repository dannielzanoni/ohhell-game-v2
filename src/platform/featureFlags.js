export const mobileUiVersions = Object.freeze({
  CURRENT: 'v1',
  V2: 'v2',
});

const supportedMobileUiVersions = new Set(Object.values(mobileUiVersions));

export function getMobileUiQueryOverride(search = '') {
  const value = new URLSearchParams(search).get('mobile_ui');

  return supportedMobileUiVersions.has(value) ? value : null;
}

export function getDefaultMobileUiVersion(environment = import.meta.env) {
  const value = environment?.VITE_MOBILE_UI_VERSION;

  return supportedMobileUiVersions.has(value)
    ? value
    : mobileUiVersions.V2;
}

export function resolveMobileUiVersion({ environment, search = '' } = {}) {
  return getMobileUiQueryOverride(search) || getDefaultMobileUiVersion(environment);
}

export function isMobileUiV2(options) {
  return resolveMobileUiVersion(options) === mobileUiVersions.V2;
}
