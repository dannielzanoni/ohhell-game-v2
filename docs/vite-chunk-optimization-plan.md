# Vite Chunk Optimization Plan

## Goal

Reduce the initial production bundle size and address Vite warnings for chunks larger than 500 kB without hiding real performance issues.

## Current Observations

- `src/app/router.jsx` statically imports every route component.
- `src/app/routes/Game/Game.jsx` is part of the initial route graph even though it is only needed on `/game/:lobbyId`.
- `Game.jsx` eagerly imports all card deck assets with `import.meta.glob(..., eager: true)`.
- The production build currently emits at least one JS chunk over 500 kB.
- The generated CSS bundle is also over 500 kB before gzip.
- The CSS gzip size is much smaller, so CSS needs analysis before aggressive changes.

## Phase 1: Measure Baseline

1. Run a clean production build.

```sh
npm run build
```

2. Record the generated JS and CSS asset sizes from the Vite output.

3. Add a bundle visualizer temporarily if deeper analysis is needed.

```sh
npm install -D rollup-plugin-visualizer
```

4. If using the visualizer, configure it only during analysis and remove it afterward unless the team wants to keep it.

## Phase 2: Split Routes

1. Update `src/app/router.jsx` to lazy-load route components with `React.lazy` and `Suspense`.

2. Keep `AppLayout` imported normally if it is used on every route.

3. Lazy-load these route components:

- `Home`
- `CreateGame`
- `Game`
- `Rooms`
- `Leaderboard`
- `HowToPlay`
- `Github`

4. Use small named-export adapters because current route files export named components.

Example pattern:

```jsx
const Game = lazy(() =>
  import('./routes/Game/Game.jsx').then((module) => ({ default: module.Game })),
);
```

5. Wrap the route tree in `Suspense` with a lightweight fallback.

6. Verify that direct navigation to every route still works.

## Phase 3: Rebuild And Compare

1. Run production build again.

```sh
npm run build
```

2. Compare these metrics against the baseline:

- Initial JS chunk size
- Route-specific chunk sizes
- Total JS size
- CSS size
- Gzip sizes shown by Vite

3. Expected outcome: the initial JS chunk should drop because `Game.jsx` and route-specific code are no longer loaded upfront.

## Phase 4: Handle Game Assets If Needed

Only do this if the `/game/:lobbyId` route chunk is still too large or slow to load.

1. Review the eager card imports in `Game.jsx`:

```js
import.meta.glob('/src/assets/cards/spanish/*.jpg', { eager: true, import: 'default' })
```

2. Consider moving deck asset maps into dedicated modules by deck type.

3. Load only the selected deck when entering a game or when preferences change.

4. Keep user-visible card loading behavior stable.

5. Avoid making each individual card image a separate runtime network waterfall unless tested.

## Phase 5: Review CSS Bundle

1. Identify global CSS imports in `src/index.css` and `src/main.jsx`.

2. Current global imports to review:

- `tailwindcss`
- `tw-animate-css`
- `shadcn/tailwind.css`
- `@fontsource-variable/geist`
- `primeicons/primeicons.css`
- `flag-icons/css/flag-icons.min.css`

3. Check actual usage before removing anything.

4. Candidate cleanup:

- Replace the few `pi` icon usages with existing React icons and remove `primeicons` if no longer needed.
- Replace global `flag-icons` CSS if only a small fixed set of flags is used.
- Keep Tailwind and shadcn globals unless analysis proves they are the real issue.

5. Rebuild after each CSS cleanup to confirm size impact.

## Phase 6: Manual Chunking Only If Needed

Do not start with manual chunks. Add them only after route splitting and bundle analysis show a clear benefit.

Possible stable vendor groups:

- `react-vendor`: `react`, `react-dom`, `react-router-dom`
- `i18n-vendor`: `i18next`, `react-i18next`
- UI vendor group only if Radix or icon libraries dominate a shared chunk

Avoid over-splitting into many tiny vendor chunks.

## Phase 7: Warning Limit Decision

Only raise `build.chunkSizeWarningLimit` after real optimization work.

Acceptable reason to raise it:

- The remaining large chunk is route-specific.
- Gzip size is reasonable.
- Loading behavior is acceptable on slow network simulation.
- Further splitting would add complexity without user-visible benefit.

## Verification Checklist

- `npm run build` succeeds.
- No unexpected production build errors.
- `/` loads correctly.
- `/create-game` loads correctly.
- `/game/:lobbyId` loads correctly when a valid lobby exists.
- `/rooms`, `/leaderboard`, `/how-to-play`, and `/github` still render.
- Language selector still shows flags correctly if flag CSS is changed.
- Icons still render correctly if PrimeIcons is changed.
- No route shows a blank screen during lazy-load.

## Acceptance Criteria

- Initial JS chunk is below the previous baseline.
- The largest initial route chunk is below 500 kB or has a documented reason for exceeding it.
- Any remaining Vite chunk warning is understood and documented.
- No user-facing route behavior regresses.
- No broad `chunkSizeWarningLimit` increase is used as the primary fix.

## Notes

- The first implementation should be route-level lazy loading. It is the lowest-risk improvement and directly targets the current initial bundle problem.
- CSS optimization should be measured separately from JS chunk optimization.
- Asset optimization for cards can wait until route splitting proves whether it is still necessary.
