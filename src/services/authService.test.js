import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, getAuthToken } from './apiClient.js';
import { MAX_GUEST_NICKNAME_LENGTH, normalizeGuestNickname, saveGuestProfile } from './authService.js';

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
