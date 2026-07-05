import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, getAuthToken } from './apiClient.js';
import { loginWithGoogle, MAX_GUEST_NICKNAME_LENGTH, normalizeGuestNickname, saveGuestProfile } from './authService.js';

vi.mock('./apiClient.js', () => ({
  apiRequest: vi.fn(),
  clearAuthToken: vi.fn(),
  getAuthToken: vi.fn(),
  setAuthToken: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
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
