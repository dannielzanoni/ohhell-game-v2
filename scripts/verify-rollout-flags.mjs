import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const featureFlags = readFileSync(resolve(root, 'src/platform/featureFlags.js'), 'utf8');
const platformProvider = readFileSync(resolve(root, 'src/platform/PlatformProvider.jsx'), 'utf8');
const tests = readFileSync(resolve(root, 'src/platform/featureFlags.test.js'), 'utf8')
  + readFileSync(resolve(root, 'src/platform/PlatformProvider.rollout.test.jsx'), 'utf8');

const checks = [
  { label: 'mobile current/v2 split', source: featureFlags, patterns: ['CURRENT', 'V2', 'mobile_ui'] },
  { label: 'QA query override', source: tests, patterns: ['?mobile_ui=v1', '?mobile_ui=v2', 'beta'] },
  { label: 'env default and rollback', source: tests, patterns: ['VITE_MOBILE_UI_VERSION', 'mobile:v1:false', 'mobile:v2:true'] },
  { label: 'provider exposes rollout state', source: platformProvider, patterns: ['dataset.mobileUi', 'isMobileV2', 'mobileUiVersion'] },
  { label: 'non-persistent rollout', source: tests, patterns: ['Storage.prototype', 'not.toHaveBeenCalled'] },
];

const forbidden = [
  { label: 'feature flags must not touch storage', source: featureFlags, patterns: ['localStorage', 'sessionStorage', 'storage.setItem'] },
  { label: 'feature flags must not touch HTTP/contracts', source: featureFlags, patterns: ['fetch(', '@/services/', '@/contracts/'] },
];

const failures = [
  ...checks.flatMap((check) =>
    check.patterns
      .filter((pattern) => !check.source.includes(pattern))
      .map((pattern) => `${check.label}: missing "${pattern}"`),
  ),
  ...forbidden.flatMap((check) =>
    check.patterns
      .filter((pattern) => check.source.includes(pattern))
      .map((pattern) => `${check.label}: found forbidden "${pattern}"`),
  ),
];

if (failures.length) {
  console.error('rollout flag gate failed');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`rollout flag gate passed: ${checks.length} anchors`);
