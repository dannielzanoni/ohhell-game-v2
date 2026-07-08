import { environment } from '@/config/environment.js';
import { sanitizeDiagnostic } from '@/infrastructure/security/sanitizeDiagnostic.js';

const validFailureTypes = new Set(['api', 'websocket', 'render']);
const validPlatforms = new Set(['mobile', 'web', 'unknown']);

function getBrowserPlatform(browser = globalThis) {
  const width = browser?.innerWidth ?? browser?.window?.innerWidth ?? 0;
  return width >= 768 ? 'web' : 'mobile';
}

export function normalizeFrontendEvent({
  diagnostic,
  failureType,
  phase = 'unknown',
  platform = getBrowserPlatform(),
  timestamp = new Date().toISOString(),
} = {}) {
  return {
    diagnostic: sanitizeDiagnostic(diagnostic || {}),
    failureType: validFailureTypes.has(failureType) ? failureType : 'render',
    phase: String(phase || 'unknown'),
    platform: validPlatforms.has(platform) ? platform : 'unknown',
    source: 'frontend',
    timestamp,
  };
}

export function createFrontendTelemetry({
  endpoint = `${environment.apiUrl}/observability/frontend`,
  getPlatform = getBrowserPlatform,
  transport,
} = {}) {
  const send = transport || ((event) => {
    const body = JSON.stringify(event);
    if (globalThis.navigator?.sendBeacon) {
      return globalThis.navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
    }

    return globalThis.fetch?.(endpoint, {
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      method: 'POST',
    })?.catch(() => false);
  });

  return {
    trackFailure(event) {
      const normalized = normalizeFrontendEvent({
        ...event,
        platform: event?.platform || getPlatform(),
      });

      try {
        return send(normalized);
      } catch {
        return false;
      }
    },
  };
}

export const frontendTelemetry = createFrontendTelemetry();
