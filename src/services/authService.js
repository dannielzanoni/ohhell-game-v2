import {
  apiRequest,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from './apiClient.js';
import { findAvatar } from '@/assets/catalog/avatarCatalog.js';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';

const GUEST_AVATAR_STORAGE_KEY = storageKeys.guestAvatar;
const GUEST_NICKNAME_STORAGE_KEY = storageKeys.guestNickname;
const REFRESH_TOKEN_STORAGE_KEY = storageKeys.refreshToken;
let pendingSessionRefresh = null;
export const MAX_GUEST_NICKNAME_LENGTH = 24;

export function normalizeGuestNickname(value) {
  const nickname = String(value ?? '').trim();

  if (nickname.length > MAX_GUEST_NICKNAME_LENGTH) {
    const error = new RangeError(`Nickname must have at most ${MAX_GUEST_NICKNAME_LENGTH} characters.`);
    error.code = 'nickname_too_long';
    throw error;
  }

  return nickname || 'Guest';
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired. Confirm your profile to continue.');
    this.name = 'SessionExpiredError';
    this.code = 'profile_confirmation_required';
  }
}

function getAuthErrorMessage(error) {
  return String(error?.message || error?.data?.error || '');
}

function decodeAuthTokenPayload(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );

    const decodedPayload = atob(padded);
    const payloadBytes = Uint8Array.from(decodedPayload, (character) =>
      character.charCodeAt(0),
    );

    return JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return null;
  }
}

function parseAuthPlayer(token = getAuthToken()) {
  const claims = decodeAuthTokenPayload(token);

  if (!claims) {
    return null;
  }

  if (claims.user) {
    return claims.user;
  }

  if (claims.email && claims.name && claims.picture) {
    return {
      type: 'Google',
      data: {
        email: claims.email,
        name: claims.name,
        nickname: claims.nickname,
        picture: claims.picture,
        picture_override: claims.picture_override,
      },
    };
  }

  return null;
}

function getPlayerNickname(player) {
  if (player?.type === 'Anonymous') {
    return player.data?.data?.nickname || player.data?.id || '';
  }

  if (player?.type === 'Google') {
    return player.data?.nickname || player.data?.name || player.data?.email || '';
  }

  return player?.data?.nickname || player?.nickname || player?.name || '';
}

function getPlayerPicture(player) {
  if (player?.type === 'Anonymous') {
    return player.data?.data?.picture || '';
  }

  if (player?.type === 'Google') {
    return player.data?.picture_override || player.data?.picture || '';
  }

  return player?.data?.picture || player?.picture || '';
}

export function isMissingAuthTokenError(error) {
  return (
    error?.status === 401 &&
    getAuthErrorMessage(error).toLowerCase().includes('missing auth token')
  );
}

function isInvalidAuthTokenError(error) {
  const message = getAuthErrorMessage(error);

  return (
    !isMissingAuthTokenError(error) &&
    (message.includes("Invalid KeyId ('kid')") ||
      message.toLowerCase().includes('invalid token') ||
      (error?.status === 401 && Boolean(getAuthToken())))
  );
}

function persistAuth(response) {
  if (typeof response === 'string') {
    setAuthToken(response);
    return { token: response };
  }

  if (response?.token) {
    setAuthToken(response.token);
  }

  if (response?.refresh_token !== undefined) {
    if (response.refresh_token) {
      storage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.refresh_token);
    } else {
      storage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  }

  return response;
}

function getSavedGuestProfile(payload = {}) {
  const savedNickname = storage.getItem(GUEST_NICKNAME_STORAGE_KEY) || '';
  const savedAvatarId = storage.getItem(GUEST_AVATAR_STORAGE_KEY) || '';
  const savedAvatar = findAvatar(savedAvatarId);
  const nickname = normalizeGuestNickname(payload.nickname ?? savedNickname);

  return {
    nickname,
    picture: payload.picture ?? savedAvatar?.picture ?? '',
  };
}

export async function signUp({ nickname, picture } = {}) {
  const response = await apiRequest('/auth/signup', {
    method: 'POST',
    body: { nickname: normalizeGuestNickname(nickname), picture },
  });

  return persistAuth(response);
}

export async function updateProfile({ nickname, picture }) {
  const response = await apiRequest('/auth/profile', {
    auth: true,
    method: 'POST',
    body: { nickname: normalizeGuestNickname(nickname), picture },
  });

  return persistAuth(response);
}

export async function loginWithGoogle(credential) {
  const token = getAuthToken();
  const currentPlayer = parseAuthPlayer(token);
  const response = await apiRequest('/auth/google', {
    method: 'POST',
    body: { credential },
    token: currentPlayer?.type === 'Anonymous' ? token : null,
  });

  return persistAuth(response);
}

export async function saveGuestProfile(payload) {
  const guestProfile = getSavedGuestProfile(payload);

  if (!getAuthToken()) {
    return signUp(guestProfile);
  }

  try {
    return await updateProfile(guestProfile);
  } catch (error) {
    if (!isInvalidAuthTokenError(error)) {
      throw error;
    }

    clearAuthToken();
    return signUp(guestProfile);
  }
}

function clearSession() {
  clearAuthToken();
  storage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

function isDefinitiveRefreshFailure(error) {
  return [400, 401, 403].includes(error?.status);
}

export async function refreshAuthSession() {
  if (!pendingSessionRefresh) {
    pendingSessionRefresh = (async () => {
      const refreshToken = storage.getItem(REFRESH_TOKEN_STORAGE_KEY);

      if (!refreshToken) {
        clearSession();
        throw new SessionExpiredError();
      }

      try {
        const response = await apiRequest('/auth/refresh', {
          method: 'POST',
          body: { refresh_token: refreshToken },
        });
        return persistAuth(response);
      } catch (error) {
        if (isDefinitiveRefreshFailure(error)) {
          clearSession();
          throw new SessionExpiredError();
        }
        throw error;
      }
    })().finally(() => {
      pendingSessionRefresh = null;
    });
  }

  return pendingSessionRefresh;
}

export const refreshGuestAuth = refreshAuthSession;

export function getAuthPlayer() {
  return parseAuthPlayer();
}

export function getCurrentProfile() {
  const player = getAuthPlayer();

  return {
    isGoogle: player?.type === 'Google',
    nickname: getPlayerNickname(player),
    picture: getPlayerPicture(player),
    player,
  };
}

export function isGoogleAuthenticated() {
  return getAuthPlayer()?.type === 'Google';
}

export async function withGuestAuthRetry(request, payload) {
  const tokenBeforeRequest = getAuthToken();

  try {
    return await request();
  } catch (error) {
    if (
      !tokenBeforeRequest ||
      isMissingAuthTokenError(error) ||
      !isInvalidAuthTokenError(error)
    ) {
      throw error;
    }

    await refreshAuthSession();
    return request();
  }
}

export const authService = {
  clearAuthToken,
  getAuthPlayer,
  getAuthToken,
  getCurrentProfile,
  isGoogleAuthenticated,
  loginWithGoogle,
  refreshAuthSession,
  refreshGuestAuth,
  saveGuestProfile,
  signUp,
  updateProfile,
  withGuestAuthRetry,
};
