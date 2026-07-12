import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { gameTypes } from '@/services/gameTypesService.js';
import { NavBar } from './NavBar.jsx';

const NAV_COLLAPSED_STORAGE_KEY = 'ohhell_nav_collapsed';

function getSavedNavCollapsed() {
  try {
    return localStorage.getItem(NAV_COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getRouteLobbyGameType(pathname) {
  const match = pathname.match(/^\/game\/([^/]+)$/);
  return match
    ? localStorage.getItem(`ohhell_lobby_game_type_${match[1]}`) || ''
    : '';
}

export function AppLayout() {
  const location = useLocation();
  const [isNavCollapsed, setIsNavCollapsed] = useState(getSavedNavCollapsed);
  const [routeGameType, setRouteGameType] = useState(() =>
    getRouteLobbyGameType(location.pathname),
  );
  const isLobbyGameRoute = /^\/game\/[^/]+$/.test(location.pathname);
  const showNavBar = !isLobbyGameRoute || routeGameType === gameTypes.FODINHA_CLASSIC;

  useEffect(() => {
    setRouteGameType(getRouteLobbyGameType(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const handleGameTypeChange = (event) => {
      if (event.detail?.lobbyId && location.pathname === `/game/${event.detail.lobbyId}`) {
        setRouteGameType(event.detail.gameType || '');
      }
    };

    window.addEventListener('ohhell:lobby-game-type', handleGameTypeChange);
    return () => window.removeEventListener('ohhell:lobby-game-type', handleGameTypeChange);
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(
        NAV_COLLAPSED_STORAGE_KEY,
        String(isNavCollapsed),
      );
    } catch {
      // Ignore storage failures and keep the menu usable.
    }
  }, [isNavCollapsed]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showNavBar ? (
        <NavBar
          isCollapsed={isNavCollapsed}
          onToggle={() => setIsNavCollapsed((current) => !current)}
        />
      ) : null}
      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          showNavBar ? (isNavCollapsed ? 'md:pl-20' : 'md:pl-64') : ''
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
}
