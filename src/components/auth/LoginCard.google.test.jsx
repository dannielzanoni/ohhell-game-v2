// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

beforeEach(() => {
  authService.getAuthToken.mockReturnValue('');
  authService.getCurrentProfile.mockReturnValue({ isGoogle: false, nickname: '', picture: '' });
  authService.isGoogleAuthenticated.mockReturnValue(false);
  authService.loginWithGoogle.mockReset();
});

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

  it('clears an endpoint error when a later credential succeeds', async () => {
    const identity = {
      initialize: vi.fn(),
      renderButton: vi.fn(),
    };
    window.google = { accounts: { id: identity } };
    authService.loginWithGoogle.mockRejectedValueOnce(new Error('Google endpoint unavailable'));
    render(<LoginCard />);

    await waitFor(() => expect(identity.initialize).toHaveBeenCalled());
    const callback = identity.initialize.mock.calls[0][0].callback;
    await act(() => callback({ credential: 'first-credential' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Google endpoint unavailable');

    authService.loginWithGoogle.mockResolvedValueOnce({ token: 'google-token' });
    await act(() => callback({ credential: 'second-credential' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(authService.loginWithGoogle).toHaveBeenNthCalledWith(2, 'second-credential');
  });
});
