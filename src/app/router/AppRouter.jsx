import { Suspense } from 'react';
import { BrowserRouter, Navigate, useParams, useRoutes } from 'react-router-dom';
import { AppLayout } from '@/app/layouts/AppLayout.jsx';
import { GameModeSelect } from '@/app/pages/GameModeSelectPage.jsx';
import { DEV_PATHS } from '@/devtools/paths.js';
import { devRouteChildren } from '@/devtools/routes.jsx';
import { CLASSIC_PATHS } from '@/games/classic/paths.js';
import { classicRouteChildren } from '@/games/classic/routes.jsx';
import { GAME_TYPES } from '@/games/core/model/gameTypes.js';
import { HELL_HAND_PATHS } from '@/games/hell-hand/paths.js';
import { hellHandRouteChildren } from '@/games/hell-hand/routes.jsx';

function LegacyLobbyRedirect() {
  const { lobbyId } = useParams();
  const storedGameType = localStorage.getItem(`ohhell_lobby_game_type_${lobbyId}`);
  const target =
    storedGameType === GAME_TYPES.HELL_HAND
      ? HELL_HAND_PATHS.game(lobbyId)
      : CLASSIC_PATHS.game(lobbyId);

  return <Navigate to={target} replace />;
}

const legacyRoutes = [
  { path: '/home', element: <Navigate to={CLASSIC_PATHS.ROOT} replace /> },
  { path: '/create-game', element: <Navigate to={CLASSIC_PATHS.CREATE_GAME} replace /> },
  { path: '/game', element: <Navigate to={CLASSIC_PATHS.CREATE_GAME} replace /> },
  { path: '/game/:lobbyId', element: <LegacyLobbyRedirect /> },
  { path: '/rooms', element: <Navigate to={CLASSIC_PATHS.ROOMS} replace /> },
  { path: '/leaderboard', element: <Navigate to={CLASSIC_PATHS.LEADERBOARD} replace /> },
  { path: '/how-to-play', element: <Navigate to={CLASSIC_PATHS.HOW_TO_PLAY} replace /> },
  { path: '/settings', element: <Navigate to={CLASSIC_PATHS.SETTINGS} replace /> },
  { path: '/github', element: <Navigate to={CLASSIC_PATHS.GITHUB} replace /> },
  { path: '/characters', element: <Navigate to={HELL_HAND_PATHS.MERCENARIES} replace /> },
  { path: '/mercenaries', element: <Navigate to={HELL_HAND_PATHS.MERCENARIES} replace /> },
  { path: '/hell-hand/game', element: <Navigate to={HELL_HAND_PATHS.CREATE_GAME} replace /> },
  { path: '/hell-hand/workshop', element: <Navigate to={DEV_PATHS.HELL_HAND_WORKSHOP} replace /> },
  {
    path: '/hell-hand/game-playground',
    element: <Navigate to={DEV_PATHS.HELL_HAND_GAME_PLAYGROUND} replace />,
  },
  {
    path: '/game-playground-classic',
    element: <Navigate to={DEV_PATHS.CLASSIC_PLAYGROUND} replace />,
  },
  { path: '/playground', element: <Navigate to={DEV_PATHS.HELL_HAND_CARD_EDITOR} replace /> },
  { path: '/power-decks', element: <Navigate to={DEV_PATHS.HELL_HAND_POWER_DECKS} replace /> },
  ...['Artemis', 'Carmen', 'Conjuruz', 'Gambler', 'Leandro'].map((mercenaryId) => ({
    path: `/${mercenaryId}`,
    element: <Navigate to={HELL_HAND_PATHS.mercenary(mercenaryId)} replace />,
  })),
];

function AppRouteTree() {
  return useRoutes([
    { path: '/', element: <GameModeSelect /> },
    {
      path: CLASSIC_PATHS.ROOT,
      element: <AppLayout />,
      children: classicRouteChildren,
    },
    {
      path: HELL_HAND_PATHS.ROOT,
      children: hellHandRouteChildren,
    },
    {
      path: DEV_PATHS.ROOT,
      children: devRouteChildren,
    },
    ...legacyRoutes,
    { path: '*', element: <Navigate to="/" replace /> },
  ]);
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-stone-950" />}>
        <AppRouteTree />
      </Suspense>
    </BrowserRouter>
  );
}
