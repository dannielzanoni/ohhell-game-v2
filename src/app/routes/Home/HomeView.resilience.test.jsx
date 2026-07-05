// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeView } from './HomeView.jsx';
import '@/i18n/index.js';

const authService = vi.hoisted(() => ({
  getAuthToken: vi.fn(() => ''),
  getCurrentProfile: vi.fn(() => ({ isGoogle: false, nickname: '', picture: '' })),
  isGoogleAuthenticated: vi.fn(() => false),
  loginWithGoogle: vi.fn(),
  saveGuestProfile: vi.fn(() => Promise.reject(new Error('Backend unavailable'))),
}));

vi.mock('@/components/auth/useAuthController.js', () => ({ useAuthController: () => authService }));

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('HomeView resilience', () => {
  it('keeps every primary destination navigable after the backend fails', async () => {
    render(<MemoryRouter><HomeView /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Nick'), { target: { value: 'Offline guest' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save nick' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend unavailable');
    const shortcuts = within(screen.getByRole('navigation', { name: 'Main shortcuts' }));
    expect(shortcuts.getByRole('link', { name: 'Create a Game' })).toHaveAttribute('href', '/create-game');
    expect(shortcuts.getByRole('link', { name: 'Rooms' })).toHaveAttribute('href', '/rooms');
    expect(shortcuts.getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('href', '/leaderboard');
    expect(shortcuts.getByRole('link', { name: 'How To Play' })).toHaveAttribute('href', '/how-to-play');
  });
});
