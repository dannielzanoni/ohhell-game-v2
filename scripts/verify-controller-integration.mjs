import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const integrationAnchors = [
  {
    file: 'src/app/routes/Rooms/useRoomsController.test.jsx',
    patterns: ['vi.mock', 'getLobbies', 'signal.aborted', 'unmount'],
    topic: 'HTTP fake plus route cleanup',
  },
  {
    file: 'src/services/gameSocketService.test.js',
    patterns: ['class FakeSocket', 'connect()', 'dispose()', 'Snapshot'],
    topic: 'socket fake connection, cleanup and snapshot handling',
  },
  {
    file: 'src/app/routes/Game/reconnectPolicy.test.js',
    patterns: ['reconnectWithSnapshot', 'join', 'applySnapshot', 'connect'],
    topic: 'retry flow applies snapshot before reconnecting',
  },
  {
    file: 'src/infrastructure/browser/audio.test.js',
    patterns: ['createAudioAdapter', 'createMedia', 'playOnce', 'clearSlot'],
    topic: 'audio fake boundary',
  },
  {
    file: 'src/infrastructure/storage/storageAdapter.test.js',
    patterns: ['createBackend', 'StorageAdapter', 'throws', 'migrateApplicationStorage'],
    topic: 'storage fake boundary',
  },
];

const failures = [];

for (const anchor of integrationAnchors) {
  let source = '';
  try {
    source = readFileSync(resolve(root, anchor.file), 'utf8');
  } catch {
    failures.push(`${anchor.topic}: missing ${anchor.file}`);
    continue;
  }

  for (const pattern of anchor.patterns) {
    if (!source.includes(pattern)) {
      failures.push(`${anchor.topic}: ${anchor.file} does not include "${pattern}"`);
    }
  }
}

if (failures.length) {
  console.error('controller integration gate failed');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`controller integration gate passed: ${integrationAnchors.length} integration anchors`);
