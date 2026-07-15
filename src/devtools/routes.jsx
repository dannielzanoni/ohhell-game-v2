import { Navigate } from 'react-router-dom';
import { lazyNamed } from '@/shared/lib/lazyNamed.js';
import { DEV_PATHS } from './paths.js';

const WorkshopPage = lazyNamed(() => import('./hell-hand/WorkshopPage.jsx'), 'HellHandWorkshop');
const HellHandGamePlaygroundPage = lazyNamed(
  () => import('./hell-hand/game-playground/GamePlayground.jsx'),
  'GamePlayground',
);
const ClassicGamePlaygroundPage = lazyNamed(
  () => import('./classic/game-playground/GamePlaygroundClassic.jsx'),
  'GamePlaygroundClassic',
);
const CardEditorPage = lazyNamed(
  () => import('./hell-hand/card-editor/CardEditorPage.jsx'),
  'Playground',
);
const PowerDecksPage = lazyNamed(
  () => import('./hell-hand/power-decks/PowerDecksPage.jsx'),
  'PowerDecks',
);

export const devRouteChildren = [
  { index: true, element: <Navigate to={DEV_PATHS.HELL_HAND_WORKSHOP} replace /> },
  { path: 'hell-hand/workshop', element: <WorkshopPage /> },
  { path: 'hell-hand/game-playground', element: <HellHandGamePlaygroundPage /> },
  { path: 'hell-hand/card-editor', element: <CardEditorPage /> },
  { path: 'hell-hand/power-decks', element: <PowerDecksPage /> },
  { path: 'classic/game-playground', element: <ClassicGamePlaygroundPage /> },
];
