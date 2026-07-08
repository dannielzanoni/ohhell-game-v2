import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

const requiredScripts = [
  'security:check',
  'contracts:check',
  'test',
  'build',
];

const missingScripts = requiredScripts.filter((script) => !packageJson.scripts?.[script]);

if (missingScripts.length) {
  console.error(`lint gate failed: missing scripts ${missingScripts.join(', ')}`);
  process.exit(1);
}

console.log(`lint gate passed: ${requiredScripts.length} required project scripts available`);
