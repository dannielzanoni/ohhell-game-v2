// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';
import { LoginCard } from './LoginCard.jsx';
import '@/i18n/index.js';

const authService = vi.hoisted(() => ({
  getAuthToken: vi.fn(),
  getCurrentProfile: vi.fn(),
  isGoogleAuthenticated: vi.fn(),
  loginWithGoogle: vi.fn(),
  saveGuestProfile: vi.fn(),
}));

vi.mock('./useAuthController.js', () => ({
  useAuthController: () => authService,
}));

vi.mock('@/components/ui/typing-animation.jsx', () => ({
  TypingAnimation: ({ words }) => <span>{words.join('')}</span>,
}));

beforeEach(() => {
  storage.removeItem(storageKeys.authToken);
  storage.removeItem(storageKeys.guestAvatar);
  storage.removeItem(storageKeys.guestNickname);
  authService.getAuthToken.mockReturnValue('guest-token');
  authService.getCurrentProfile.mockReturnValue({ isGoogle: false, nickname: '', picture: '' });
  authService.isGoogleAuthenticated.mockReturnValue(false);
  authService.saveGuestProfile.mockResolvedValue({ token: 'guest-token' });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LoginCard profile summary', () => {
  it('restores the same saved nickname when the responsive view remounts', async () => {
    const firstRender = render(<LoginCard />);
    fireEvent.change(screen.getByLabelText('Nick'), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save nick' }));

    await waitFor(() => expect(authService.saveGuestProfile).toHaveBeenCalledWith({ nickname: 'Ada', picture: '' }));
    expect(storage.getItem(storageKeys.guestNickname)).toBe('Ada');

    firstRender.unmount();
    render(<LoginCard />);
    expect(screen.getByLabelText('Nick')).toHaveValue('Ada');
  });

  it('keeps an authentication failure next to and linked to the save action', async () => {
    authService.saveGuestProfile.mockRejectedValueOnce(new Error('Profile service unavailable'));
    render(<LoginCard />);
    fireEvent.change(screen.getByLabelText('Nick'), { target: { value: 'Grace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save nick' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Profile service unavailable');
    expect(screen.getByRole('button', { name: 'Save nick' })).toHaveAttribute('aria-describedby', alert.id);
    expect(screen.getByLabelText('Nick')).toHaveAttribute('aria-invalid', 'true');
  });

  it('opens an avatar sheet constrained to the mobile viewport', () => {
    render(<LoginCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit guest avatar' }));
    expect(screen.getByRole('dialog', { name: 'Select your avatar' })).toHaveClass('max-h-[calc(100dvh-max(1rem,env(safe-area-inset-top)))]');
  });
});
