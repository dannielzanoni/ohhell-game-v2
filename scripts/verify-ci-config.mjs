import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const workflow = readFileSync(resolve(root, '.github/workflows/fly-deploy.yml'), 'utf8');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

const workflowPatterns = [
  'npm ci',
  'npm run lint',
  'npm test',
  'npm run build',
  'cargo fmt --check',
  'cargo clippy --all-targets --all-features -- -D warnings',
  'cargo test --all-features',
  'cargo build --release',
  'needs: [frontend-quality, backend-quality]',
  'flyctl deploy --remote-only',
];

const scriptPatterns = ['lint', 'ci:check'];

const failures = [
  ...workflowPatterns
    .filter((pattern) => !workflow.includes(pattern))
    .map((pattern) => `workflow missing "${pattern}"`),
  ...scriptPatterns
    .filter((script) => !packageJson.scripts?.[script])
    .map((script) => `package.json missing "${script}" script`),
];

if (failures.length) {
  console.error('CI configuration gate failed');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`CI configuration gate passed: ${workflowPatterns.length} workflow anchors`);
