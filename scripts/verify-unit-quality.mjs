import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const requiredCoverage = [
  {
    file: 'src/contracts/v1/contracts.test.js',
    patterns: ['parseRealtimeMessage', 'serializeRealtimeCommand', 'httpContract'],
    topic: 'contracts parsers and serializers',
  },
  {
    file: 'src/infrastructure/storage/storageAdapter.test.js',
    patterns: ['StorageAdapter', 'migrateApplicationStorage', 'throws'],
    topic: 'storage adapter and migrations',
  },
  {
    file: 'src/services/authService.test.js',
    patterns: ['refreshAuthSession', '/auth/refresh', 'rotated-refresh'],
    topic: 'auth refresh token rotation',
  },
  {
    file: 'src/assets/catalog/catalog.test.js',
    patterns: ['getCardAssetKey', 'getCardImageSrc', 'getCardBackSrc'],
    topic: 'card and asset catalog',
  },
  {
    file: 'src/domain/gameStateReducer.test.js',
    patterns: ['reduceGameMessage', 'createGameStateController', 'unknown_server_message'],
    topic: 'game state reducer',
  },
  {
    file: 'src/app/routes/Game/biddingModel.test.js',
    patterns: ['normalizePossibleBids', 'canSubmitBid', 'possible_bids'],
    topic: 'bidding presentation rules',
  },
  {
    file: 'src/app/routes/Game/desktopTableLayout.test.js',
    patterns: ['getDesktopSeatLayout', 'density', 'distinct readable coordinates'],
    topic: 'desktop table presentation rules',
  },
  {
    file: 'src/app/routes/Game/actionTimerController.test.js',
    patterns: ['createFakeClock', 'advance', 'setInterval'],
    topic: 'action timers with an injected fake clock',
  },
  {
    file: 'src/app/routes/Game/roundTransitionController.test.js',
    patterns: ['scheduler', 'setTimeout', 'flush'],
    topic: 'round transition timers with a fake scheduler',
  },
  {
    file: 'src/app/routes/Rooms/RoomsView.test.jsx',
    patterns: ['controller', 'lobbies', 'refresh: vi.fn()'],
    topic: 'rooms view model rendering without backend',
  },
  {
    file: 'src/app/routes/CreateGame/CreateGameView.test.jsx',
    patterns: ['controller', 'createGame', 'vi.fn()'],
    topic: 'create game view model rendering without backend',
  },
];

const failures = [];

for (const check of requiredCoverage) {
  let source = '';
  try {
    source = readFileSync(resolve(root, check.file), 'utf8');
  } catch {
    failures.push(`${check.topic}: missing ${check.file}`);
    continue;
  }

  for (const pattern of check.patterns) {
    if (!source.includes(pattern)) {
      failures.push(`${check.topic}: ${check.file} does not include "${pattern}"`);
    }
  }
}

if (failures.length) {
  console.error('unit quality gate failed');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`unit quality gate passed: ${requiredCoverage.length} coverage anchors`);
