// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginCard } from './LoginCard.jsx';
import '@/i18n/index.js';

const authService = vi.hoisted(() => ({
  getAuthToken: vi.fn(() => ''),
  getCurrentProfile: vi.fn(() => ({ isGoogle: false, nickname: '', picture: '' })),
  isGoogleAuthenticated: vi.fn(() => false),
  loginWithGoogle: vi.fn(),
  saveGuestProfile: vi.fn().mockResolvedValue({ token: 'guest-token' }),
}));

vi.mock('./useAuthController.js', () => ({ useAuthController: () => authService }));
vi.mock('@/config/environment.js', () => ({
  environment: { apiUrl: 'http://unavailable.test', googleClientId: 'configured-client', websocketUrl: 'ws://unavailable.test/game' },
}));

afterEach(() => {
  cleanup();
  document.querySelectorAll('script[src="https://accounts.google.com/gsi/client"]').forEach((script) => script.remove());
  delete window.google;
});

describe('LoginCard Google degradation', () => {
  it('reports an unavailable SDK without blocking the guest profile', async () => {
    render(<LoginCard />);
    const script = await waitFor(() => document.querySelector('script[src="https://accounts.google.com/gsi/client"]'));
    fireEvent.error(script);

    expect(await screen.findByRole('alert')).toHaveTextContent('Google login is unavailable right now.');
    expect(screen.getByLabelText('Nick')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Save nick' })).toBeEnabled();
  });
});
