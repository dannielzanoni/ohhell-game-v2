import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const config = readFileSync(resolve(root, 'playwright.config.js'), 'utf8');
const spec = readFileSync(resolve(root, 'e2e/main-flows.spec.js'), 'utf8');

const checks = [
  { source: config, label: 'viewport 360x800', patterns: ['width: 360', 'height: 800'] },
  { source: config, label: 'viewport 390x844', patterns: ['width: 390', 'height: 844'] },
  { source: config, label: 'viewport 768x1024', patterns: ['width: 768', 'height: 1024'] },
  { source: config, label: 'viewport 1440x900', patterns: ['width: 1440', 'height: 900'] },
  { source: spec, label: 'Playwright test import', patterns: ["from '@playwright/test'"] },
  { source: spec, label: 'guest flow', patterns: ['Save nick', 'Profile saved'] },
  { source: spec, label: 'create flow', patterns: ['Create a Game', '/game/room-e2e'] },
  { source: spec, label: 'share/enter flow', patterns: ['/rooms', 'Join'] },
  { source: spec, label: 'ready flow', patterns: ['PlayerStatusChange', 'Ready'] },
  { source: spec, label: 'bid flow', patterns: ['PlayerBiddingTurn', 'Bid 1'] },
  { source: spec, label: 'result flow', patterns: ['GameEnded', 'Game ended'] },
  { source: spec, label: 'ranking flow', patterns: ['/leaderboard', 'E2E Guest'] },
  { source: spec, label: 'language flow', patterns: ['Language', 'Portuguese'] },
  { source: spec, label: 'preferences flow', patterns: ['Settings', 'Volume geral'] },
  { source: spec, label: 'single socket during resize', patterns: ['setViewportSize', '__socketCount', 'toBe(1)'] },
  { source: spec, label: 'backend-free fakes', patterns: ['page.route', 'FakeWebSocket', 'addInitScript'] },
];

const failures = checks.flatMap((check) =>
  check.patterns
    .filter((pattern) => !check.source.includes(pattern))
    .map((pattern) => `${check.label}: missing "${pattern}"`),
);

if (failures.length) {
  console.error('e2e coverage gate failed');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`e2e coverage gate passed: ${checks.length} anchors`);
