// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { AppProvider } from '@/app/provider.jsx';
import { DesktopSidebar } from '@/components/layout/NavBar.jsx';
import { MobileNavigation } from '@/components/layout/MobileNavigation.jsx';
import {
  gamePath,
  isDestinationActive,
  resolveAppRoute,
  routePaths,
} from './routeContract.js';

afterEach(cleanup);

describe('canonical route contract', () => {
  it('resolves direct game deep links without changing their URL', () => {
    expect(gamePath('room/a')).toBe('/game/room%2Fa');
    expect(resolveAppRoute('/game/room%2Fa?ui=mobile')).toEqual({
      lobbyId: 'room/a', name: 'game', path: '/game/room%2Fa',
    });
  });

  it('redirects unknown routes to Home once', () => {
    expect(resolveAppRoute('/does-not-exist')).toEqual({
      name: 'home', path: '/', redirected: true,
    });
    expect(resolveAppRoute('/')).toEqual({ name: 'home', path: '/' });
  });

  it('computes exact Home and nested destination activity', () => {
    expect(isDestinationActive('/rooms', routePaths.rooms)).toBe(true);
    expect(isDestinationActive('/rooms', routePaths.home)).toBe(false);
    expect(isDestinationActive('/game/abc', routePaths.game)).toBe(true);
  });

  it('marks the same destination active in Web and Mobile navigation', () => {
    render(
      <MemoryRouter initialEntries={[routePaths.rooms]}>
        <AppProvider>
          <DesktopSidebar isCollapsed={false} onToggle={() => {}} />
          <MobileNavigation />
        </AppProvider>
      </MemoryRouter>,
    );

    const desktop = screen.getByRole('navigation', { name: 'Primary navigation' });
    const mobile = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(within(desktop).getByRole('link', { name: 'Rooms' })).toHaveAttribute('aria-current', 'page');
    expect(within(mobile).getByRole('link', { name: 'Rooms' })).toHaveAttribute('aria-current', 'page');
  });
});
