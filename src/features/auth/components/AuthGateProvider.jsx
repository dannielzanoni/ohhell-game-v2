import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { authService } from '@/features/auth/api/authService.js';
import { GAME_TYPES } from '@/games/core/model/gameTypes.js';

const AuthRequiredDialog = lazy(() =>
  import('./AuthRequiredDialog.jsx').then((module) => ({
    default: module.AuthRequiredDialog,
  })),
);

function getStoredLobbyGameType(pathname) {
  const lobbyMatch = pathname.match(/^\/(?:classic|hell-hand)\/game\/([^/]+)/);
  return lobbyMatch
    ? localStorage.getItem(`ohhell_lobby_game_type_${lobbyMatch[1]}`) || ''
    : '';
}

function getAuthRequestVariant(detail = {}) {
  const pathname = window.location.pathname;
  const gameType = detail.gameType || getStoredLobbyGameType(pathname);

  if (
    gameType === GAME_TYPES.HELL_HAND ||
    pathname.startsWith('/hell-hand') ||
    pathname === '/mercenaries' ||
    pathname.startsWith('/mercenaries/') ||
    pathname === '/characters'
  ) {
    return 'hellHand';
  }

  return 'default';
}

function shouldUseRouteAuthGate() {
  return /^\/(?:classic|hell-hand)\/game\/[^/]+/.test(window.location.pathname);
}

export function AuthGateProvider({ children }) {
  const [isAuthReady, setIsAuthReady] = useState(
    () => !authService.canRestoreAuthSession(),
  );
  const [authRequest, setAuthRequest] = useState(null);

  useEffect(() => {
    const handleMissingAuthToken = (event) => {
      if (!shouldUseRouteAuthGate()) {
        setAuthRequest({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          variant: getAuthRequestVariant(event.detail),
        });
      }
    };

    window.addEventListener('ohhell:missing-auth-token', handleMissingAuthToken);
    return () => window.removeEventListener('ohhell:missing-auth-token', handleMissingAuthToken);
  }, []);

  useEffect(() => {
    if (isAuthReady) {
      return undefined;
    }

    let isMounted = true;
    void authService.hydrateAuthSession().finally(() => {
      if (isMounted) {
        setIsAuthReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthReady]);

  const handleAuthCompleted = useCallback(() => {
    setAuthRequest(null);
    window.dispatchEvent(new CustomEvent('ohhell:auth-completed'));
  }, []);

  return (
    <>
      {isAuthReady ? children : null}
      {authRequest ? (
        <Suspense fallback={null}>
          <AuthRequiredDialog
            request={authRequest}
            onAuthenticated={handleAuthCompleted}
          />
        </Suspense>
      ) : null}
    </>
  );
}
