// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { HomeShortcuts } from './HomeShortcuts.jsx';
import '@/i18n/index.js';

afterEach(cleanup);

describe('HomeShortcuts', () => {
  it('uses router links for every internal destination', () => {
    render(<MemoryRouter><HomeShortcuts /></MemoryRouter>);
    expect(screen.getByRole('navigation', { name: 'Main shortcuts' })).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    expect(screen.getByRole('link', { name: 'Create a Game' })).toHaveAttribute('href', '/create-game');
    expect(screen.getByRole('link', { name: 'Rooms' })).toHaveAttribute('href', '/rooms');
    expect(screen.getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('href', '/leaderboard');
    expect(screen.getByRole('link', { name: 'How To Play' })).toHaveAttribute('href', '/how-to-play');
  });

  it('identifies the external shortcut and opens it safely in a new tab', () => {
    render(<MemoryRouter><HomeShortcuts /></MemoryRouter>);
    const external = screen.getByRole('link', { name: 'GitHub (opens in a new window)' });
    expect(external).toHaveAttribute('href', 'https://github.com/dannielzanoni/ohhell-game-v2');
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noreferrer');
  });
});
