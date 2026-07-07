import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const router = readFileSync(resolve(root, 'src/app/router.jsx'), 'utf8');
const cardCatalog = readFileSync(resolve(root, 'src/assets/catalog/cardCatalog.js'), 'utf8');

const routeModules = [
  'CreateGame',
  'Game',
  'Github',
  'Home',
  'HowToPlay',
  'Leaderboard',
  'Rooms',
];

const failures = [];

if (!router.includes('lazy, Suspense')) {
  failures.push('router must import React.lazy and Suspense');
}

if (!router.includes('RouteLoadingFallback')) {
  failures.push('router must expose an accessible lazy-route fallback');
}

for (const route of routeModules) {
  if (!router.includes(`const ${route} = lazy(() => import('./routes/${route}/${route}.jsx')`)) {
    failures.push(`${route} route is not lazy-loaded through a dynamic import`);
  }

  if (router.includes(`import { ${route} } from './routes/${route}/${route}.jsx'`)) {
    failures.push(`${route} route still has a synchronous router import`);
  }
}

if (!cardCatalog.includes("import.meta.glob('../cards/spanish/*.jpg'")) {
  failures.push('spanish deck assets must stay behind the card catalog boundary');
}

if (!cardCatalog.includes("import.meta.glob('../cards/french/*.png'")) {
  failures.push('french deck assets must stay behind the card catalog boundary');
}

if (!cardCatalog.includes("import.meta.glob('../cards/spanish_8bit/*.png'")) {
  failures.push('8-bit deck assets must stay behind the card catalog boundary');
}

if (failures.length) {
  console.error('lazy loading gate failed');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`lazy loading gate passed: ${routeModules.length} lazy routes and deck catalog boundary`);
