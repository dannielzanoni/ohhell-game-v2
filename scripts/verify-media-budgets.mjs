import { existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const MB = 1024 * 1024;
const root = process.cwd();

const budgets = [
  { label: 'home/create video', path: 'src/assets/videos', extensions: ['.mp4'], maxBytes: 7 * MB },
  { label: 'card backs', path: 'src/assets/cards/back_cards', extensions: ['.png'], maxBytes: 6 * MB },
  { label: 'animated avatars', path: 'src/assets/profile_pictures/gifs', extensions: ['.gif'], maxBytes: 4 * MB },
  { label: '8-bit cards', path: 'src/assets/cards/spanish_8bit', extensions: ['.png'], maxBytes: 2 * MB },
  { label: 'french cards', path: 'src/assets/cards/french', extensions: ['.png'], maxBytes: 512 * 1024 },
  { label: 'spanish cards', path: 'src/assets/cards/spanish', extensions: ['.jpg'], maxBytes: 512 * 1024 },
];

const optionalDistBudgets = [
  { label: 'JavaScript bundle chunk', path: 'dist/assets', extensions: ['.js'], maxBytes: 750 * 1024 },
  { label: 'CSS bundle chunk', path: 'dist/assets', extensions: ['.css'], maxBytes: 150 * 1024 },
];

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function verifyBudget({ extensions, label, maxBytes, path }) {
  const files = walk(join(root, path))
    .filter((file) => extensions.includes(extname(file).toLowerCase()));

  return files.flatMap((file) => {
    const size = statSync(file).size;
    return size > maxBytes
      ? [`${label}: ${relative(root, file)} is ${(size / MB).toFixed(2)}MB, budget ${(maxBytes / MB).toFixed(2)}MB`]
      : [];
  });
}

const failures = budgets.flatMap(verifyBudget);

if (existsSync(join(root, 'dist/assets'))) {
  failures.push(...optionalDistBudgets.flatMap(verifyBudget));
}

if (failures.length) {
  console.error('media budget check failed');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const assetCount = budgets.reduce((total, budget) => total + walk(join(root, budget.path)).length, 0);
console.log(`media budget check passed: ${assetCount} source assets${existsSync(join(root, 'dist/assets')) ? ' plus dist bundles' : ''}`);
