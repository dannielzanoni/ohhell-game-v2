import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from './apiClient.js';
import { loginWithGoogle, MAX_GUEST_NICKNAME_LENGTH, normalizeGuestNickname, refreshAuthSession, saveGuestProfile } from './authService.js';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';

vi.mock('./apiClient.js', () => ({
  apiRequest: vi.fn(),
  clearAuthToken: vi.fn(),
  getAuthToken: vi.fn(),
  setAuthToken: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  storage.removeItem(storageKeys.refreshToken);
  apiRequest.mockResolvedValue({ token: 'next-token' });
});

function tokenFor(player) {
  const payload = Buffer.from(JSON.stringify({ user: player })).toString('base64url');
  return `header.${payload}.signature`;
}

describe('guest profile contract', () => {
  it('creates a guest without a current token', async () => {
    getAuthToken.mockReturnValue(null);
    await saveGuestProfile({ nickname: '  Ada  ', picture: 'avatar-1' });
    expect(apiRequest).toHaveBeenCalledWith('/auth/signup', {
      method: 'POST',
      body: { nickname: 'Ada', picture: 'avatar-1' },
    });
  });

  it('updates a guest when a current token exists', async () => {
    getAuthToken.mockReturnValue('current-token');
    await saveGuestProfile({ nickname: 'Grace', picture: 'avatar-2' });
    expect(apiRequest).toHaveBeenCalledWith('/auth/profile', {
      auth: true,
      method: 'POST',
      body: { nickname: 'Grace', picture: 'avatar-2' },
    });
  });

  it('enforces the 24-character boundary before any HTTP request', async () => {
    expect(normalizeGuestNickname('a'.repeat(MAX_GUEST_NICKNAME_LENGTH))).toHaveLength(24);
    await expect(saveGuestProfile({ nickname: 'a'.repeat(25), picture: '' })).rejects.toMatchObject({ code: 'nickname_too_long' });
    expect(apiRequest).not.toHaveBeenCalled();
  });
});

describe('Google migration contract', () => {
  it('attaches the current anonymous guest token to POST /auth/google', async () => {
    const guestToken = tokenFor({ type: 'Anonymous', data: { id: 'guest-1', data: { nickname: 'Ada' } } });
    getAuthToken.mockReturnValue(guestToken);
    await loginWithGoogle('google-credential');
    expect(apiRequest).toHaveBeenCalledWith('/auth/google', {
      method: 'POST',
      body: { credential: 'google-credential' },
      token: guestToken,
    });
  });

  it('does not attach a non-guest token', async () => {
    getAuthToken.mockReturnValue(tokenFor({ type: 'Google', data: { email: 'player@example.com' } }));
    await loginWithGoogle('google-credential');
    expect(apiRequest).toHaveBeenCalledWith('/auth/google', expect.objectContaining({ token: null }));
  });
});

describe('session refresh', () => {
  it('rotates tokens through one request for concurrent callers', async () => {
    storage.setItem(storageKeys.refreshToken, 'old-refresh');
    let resolveRefresh;
    apiRequest.mockImplementationOnce(() => new Promise((resolve) => { resolveRefresh = resolve; }));

    const first = refreshAuthSession();
    const second = refreshAuthSession();
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(apiRequest).toHaveBeenCalledWith('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: 'old-refresh' },
    });

    resolveRefresh({ token: 'new-access', refresh_token: 'rotated-refresh' });
    await expect(Promise.all([first, second])).resolves.toEqual([
      { token: 'new-access', refresh_token: 'rotated-refresh' },
      { token: 'new-access', refresh_token: 'rotated-refresh' },
    ]);
    expect(setAuthToken).toHaveBeenCalledOnce();
    expect(storage.getItem(storageKeys.refreshToken)).toBe('rotated-refresh');
  });

  it('clears a definitively rejected session and requests profile confirmation', async () => {
    storage.setItem(storageKeys.refreshToken, 'invalid-refresh');
    apiRequest.mockRejectedValueOnce({ status: 401 });
    await expect(refreshAuthSession()).rejects.toMatchObject({
      code: 'profile_confirmation_required',
      name: 'SessionExpiredError',
    });
    expect(clearAuthToken).toHaveBeenCalledOnce();
    expect(storage.getItem(storageKeys.refreshToken)).toBeNull();
  });

  it('preserves the session on a transient refresh failure', async () => {
    storage.setItem(storageKeys.refreshToken, 'retryable-refresh');
    apiRequest.mockRejectedValueOnce({ status: 503 });
    await expect(refreshAuthSession()).rejects.toMatchObject({ status: 503 });
    expect(clearAuthToken).not.toHaveBeenCalled();
    expect(storage.getItem(storageKeys.refreshToken)).toBe('retryable-refresh');
  });
});
