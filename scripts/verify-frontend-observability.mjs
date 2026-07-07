import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const telemetry = readFileSync(resolve(root, 'src/infrastructure/observability/frontendTelemetry.js'), 'utf8');
const telemetryTest = readFileSync(resolve(root, 'src/infrastructure/observability/frontendTelemetry.test.js'), 'utf8');
const http = readFileSync(resolve(root, 'src/infrastructure/http/httpClient.js'), 'utf8');
const socket = readFileSync(resolve(root, 'src/services/gameSocketService.js'), 'utf8');
const renderBoundary = readFileSync(resolve(root, 'src/app/RenderErrorBoundary.jsx'), 'utf8');
const sanitizer = readFileSync(resolve(root, 'src/infrastructure/security/sanitizeDiagnostic.js'), 'utf8');

const checks = [
  { label: 'sanitized frontend event', source: telemetry, patterns: ['sanitizeDiagnostic', 'failureType', 'phase', 'platform', 'source: \'frontend\''] },
  { label: 'sensitive data redaction', source: sanitizer + telemetryTest, patterns: ['nick.?name', 'AUTHENTICATED_URL', 'not.toContain'] },
  { label: 'API failure detection', source: http, patterns: ['failureType: \'api\'', 'phase: \'request\'', 'phase: \'response\''] },
  { label: 'WebSocket failure detection', source: socket, patterns: ['failureType: \'websocket\'', 'phase: \'connection\'', 'phase: \'message_parse\''] },
  { label: 'render failure detection', source: renderBoundary, patterns: ['failureType: \'render\'', 'phase: \'render\'', 'role="alert"'] },
  { label: 'backend observability endpoint', source: telemetry, patterns: ['/observability/frontend', 'sendBeacon', 'keepalive'] },
];

const failures = checks.flatMap((check) =>
  check.patterns
    .filter((pattern) => !check.source.includes(pattern))
    .map((pattern) => `${check.label}: missing "${pattern}"`),
);

if (failures.length) {
  console.error('frontend observability gate failed');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`frontend observability gate passed: ${checks.length} anchors`);
