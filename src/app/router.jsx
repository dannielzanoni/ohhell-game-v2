import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { routePaths } from './routes/routeContract.js';

const Home = lazy(() => import('./routes/Home/Home.jsx').then((module) => ({ default: module.Home })));
const CreateGame = lazy(() => import('./routes/CreateGame/CreateGame.jsx').then((module) => ({ default: module.CreateGame })));
const Game = lazy(() => import('./routes/Game/Game.jsx').then((module) => ({ default: module.Game })));
const Rooms = lazy(() => import('./routes/Rooms/Rooms.jsx').then((module) => ({ default: module.Rooms })));
const Leaderboard = lazy(() => import('./routes/Leaderboard/Leaderboard.jsx').then((module) => ({ default: module.Leaderboard })));
const HowToPlay = lazy(() => import('./routes/HowToPlay/HowToPlay.jsx').then((module) => ({ default: module.HowToPlay })));
const Github = lazy(() => import('./routes/Github/Github.jsx').then((module) => ({ default: module.Github })));

function RouteLoadingFallback() {
  const { t } = useTranslation();

  return (
    <main
      aria-busy="true"
      className="grid min-h-screen place-items-center px-6 py-8 text-muted-foreground"
    >
      <p className="rounded-md border border-border bg-card px-4 py-3 text-sm font-semibold shadow-sm">
        {t('common.loading')}
      </p>
    </main>
  );
}

function LazyRoute({ children }) {
  return <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={routePaths.home} element={<LazyRoute><Home /></LazyRoute>} />
          <Route path={routePaths.createGame} element={<LazyRoute><CreateGame /></LazyRoute>} />
          <Route path={routePaths.game} element={<Navigate to={routePaths.createGame} replace />} />
          <Route path={`${routePaths.game}/:lobbyId`} element={<LazyRoute><Game /></LazyRoute>} />
          <Route path={routePaths.rooms} element={<LazyRoute><Rooms /></LazyRoute>} />
          <Route path={routePaths.leaderboard} element={<LazyRoute><Leaderboard /></LazyRoute>} />
          <Route path={routePaths.howToPlay} element={<LazyRoute><HowToPlay /></LazyRoute>} />
          <Route path={routePaths.github} element={<LazyRoute><Github /></LazyRoute>} />
        </Route>
        <Route path="*" element={<Navigate to={routePaths.home} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
