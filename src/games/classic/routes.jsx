import { lazyNamed } from '@/shared/lib/lazyNamed.js';

const ClassicHomePage = lazyNamed(() => import('./pages/ClassicHomePage.jsx'), 'Home');
const CreateClassicGamePage = lazyNamed(
  () => import('./pages/CreateClassicGamePage.jsx'),
  'CreateGame',
);
const ClassicGamePage = lazyNamed(() => import('./pages/ClassicGamePage.jsx'), 'ClassicGamePage');
const ClassicRoomsPage = lazyNamed(() => import('./pages/ClassicRoomsPage.jsx'), 'Rooms');
const ClassicLeaderboardPage = lazyNamed(
  () => import('./pages/ClassicLeaderboardPage.jsx'),
  'Leaderboard',
);
const ClassicHowToPlayPage = lazyNamed(
  () => import('./pages/ClassicHowToPlayPage.jsx'),
  'HowToPlay',
);
const ClassicSettingsPage = lazyNamed(
  () => import('./pages/ClassicSettingsPage.jsx'),
  'Settings',
);
const GithubPage = lazyNamed(() => import('./pages/GithubPage.jsx'), 'Github');

export const classicRouteChildren = [
  { index: true, element: <ClassicHomePage /> },
  { path: 'create-game', element: <CreateClassicGamePage /> },
  { path: 'game/:lobbyId', element: <ClassicGamePage /> },
  { path: 'rooms', element: <ClassicRoomsPage /> },
  { path: 'leaderboard', element: <ClassicLeaderboardPage /> },
  { path: 'how-to-play', element: <ClassicHowToPlayPage /> },
  { path: 'settings', element: <ClassicSettingsPage /> },
  { path: 'github', element: <GithubPage /> },
];
