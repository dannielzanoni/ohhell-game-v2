import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const files = {
  css: readFileSync(resolve(root, 'src/index.css'), 'utf8'),
  game: readFileSync(resolve(root, 'src/app/routes/Game/GameView.jsx'), 'utf8'),
  rooms: readFileSync(resolve(root, 'src/app/routes/Rooms/RoomsView.jsx'), 'utf8'),
  createGame: readFileSync(resolve(root, 'src/app/routes/CreateGame/LivesSelector.jsx'), 'utf8'),
  mobileNav: readFileSync(resolve(root, 'src/components/layout/MobileNavigation.jsx'), 'utf8'),
  desktopNav: readFileSync(resolve(root, 'src/components/layout/NavBar.jsx'), 'utf8'),
  optionalMedia: readFileSync(resolve(root, 'src/platform/useOptionalMedia.js'), 'utf8'),
  videoText: readFileSync(resolve(root, 'src/components/ui/video-text.jsx'), 'utf8'),
};

const checks = [
  { label: 'global reduced motion query', source: files.css, patterns: ['@media (prefers-reduced-motion: reduce)', 'animation-duration: 0.01ms', 'transition-duration: 0.01ms'] },
  { label: 'game critical events are announced', source: files.game, patterns: ['aria-live="polite"', 'role="status"', 'ohhell-life-loss-popup'] },
  { label: 'loading and refresh are not color-only', source: files.rooms, patterns: ['aria-busy', 'sr-only', 'pages.rooms.refreshing'] },
  { label: 'numeric controls announce changes', source: files.createGame, patterns: ['aria-live="polite"', 'aria-label', 'size-11'] },
  { label: 'mobile touch targets and names', source: files.mobileNav, patterns: ['aria-label={t(\'nav.openMenu\')}', 'aria-modal="true"', 'min-h-11'] },
  { label: 'desktop keyboard focus and names', source: files.desktopNav, patterns: ['aria-label={t(\'nav.primaryNavigation\')}', 'aria-label={t(\'nav.toggleTheme\')}', 'h-11'] },
  { label: 'optional media respects reduced motion', source: files.optionalMedia, patterns: ['prefers-reduced-motion: reduce', 'shouldLoadOptionalMedia'] },
  { label: 'video text disables video on reduced motion', source: files.videoText, patterns: ['prefers-reduced-motion: reduce', 'videoEnabled && !videoFailed', 'sr-only'] },
];

const failures = checks.flatMap((check) =>
  check.patterns
    .filter((pattern) => !check.source.includes(pattern))
    .map((pattern) => `${check.label}: missing "${pattern}"`),
);

if (failures.length) {
  console.error('accessibility and motion gate failed');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`accessibility and motion gate passed: ${checks.length} anchors`);
