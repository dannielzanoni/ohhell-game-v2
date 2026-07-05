export const routePaths = Object.freeze({
  createGame: '/create-game',
  game: '/game',
  github: '/github',
  home: '/',
  howToPlay: '/how-to-play',
  leaderboard: '/leaderboard',
  rooms: '/rooms',
  settings: '/settings',
});

export function gamePath(lobbyId) {
  return `${routePaths.game}/${encodeURIComponent(lobbyId)}`;
}

export function resolveAppRoute(pathname = '/') {
  const normalized = `/${String(pathname).split(/[?#]/)[0].replace(/^\/+|\/+$/g, '')}`;
  if (normalized === '//' || normalized === '/') return { name: 'home', path: '/' };

  const staticRoute = Object.entries(routePaths).find(([, path]) => path === normalized);
  if (staticRoute) return { name: staticRoute[0], path: normalized };

  const gameMatch = normalized.match(/^\/game\/([^/]+)$/);
  if (gameMatch) {
    return {
      lobbyId: decodeURIComponent(gameMatch[1]),
      name: 'game',
      path: normalized,
    };
  }

  return { name: 'home', path: routePaths.home, redirected: true };
}

export function isDestinationActive(pathname, destination) {
  const current = resolveAppRoute(pathname);
  if (destination === routePaths.home) return current.path === routePaths.home;
  return current.path === destination || current.path.startsWith(`${destination}/`);
}
