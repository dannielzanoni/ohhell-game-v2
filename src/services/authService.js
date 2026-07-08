import {
  apiRequest,
  clearAuthToken as clearStoredAuthToken,
  getAuthToken,
  setAuthToken,
} from './apiClient.js';
import { avatars } from '@/components/auth/avatarOptions.js';

const GUEST_AVATAR_STORAGE_KEY = 'ohhell_guest_avatar_id';
const GUEST_NICKNAME_STORAGE_KEY = 'ohhell_guest_nickname';
const REFRESH_TOKEN_STORAGE_KEY = 'REFRESH_TOKEN';
const ACCESS_TOKEN_REFRESH_SKEW_SECONDS = 30;
const MISSING_REFRESH_TOKEN_CODE = 'MISSING_REFRESH_TOKEN';
let pendingAuthRefresh = null;
let pendingGuestAuthRefresh = null;

function canUseStorage() {
  return typeof window !== 'undefined' && window.localStorage;
}

function getAuthErrorMessage(error) {
  return String(error?.message || error?.data?.error || '');
}

function getRefreshToken() {
  return canUseStorage() ? localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) : null;
}

function setRefreshToken(token) {
  if (!canUseStorage()) {
    return;
  }

  if (token) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

function createMissingRefreshTokenError() {
  const error = new Error('Missing refresh token');
  error.code = MISSING_REFRESH_TOKEN_CODE;
  error.status = 401;
  error.data = { error: 'Missing refresh token' };
  return error;
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

function getExplicitPlayerRole(player, claims) {
  return (
    player?.role ||
    player?.data?.role ||
    claims?.role ||
    claims?.user?.role ||
    claims?.user?.data?.role ||
    null
  );
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

function getPlayerRole(player, claims) {
  return getExplicitPlayerRole(player, claims) || 'Player';
}

export function isMissingAuthTokenError(error) {
  return (
    error?.status === 401 &&
    getAuthErrorMessage(error).toLowerCase().includes('missing auth token')
  );
}

function isInvalidAuthTokenError(error, hadAuthToken = Boolean(getAuthToken())) {
  const message = getAuthErrorMessage(error);

  return (
    !isMissingAuthTokenError(error) &&
    (message.includes("Invalid KeyId ('kid')") ||
      message.toLowerCase().includes('invalid token') ||
      (error?.status === 401 && hadAuthToken))
  );
}

function canFallbackToGuestAuth(error) {
  return (
    error?.code === MISSING_REFRESH_TOKEN_CODE ||
    (error?.status === 401 &&
      getAuthErrorMessage(error).toLowerCase().includes('refresh token'))
  );
}

function shouldRefreshAccessToken(token) {
  const claims = decodeAuthTokenPayload(token);
  const expiresAt = Number(claims?.exp);

  if (!Number.isFinite(expiresAt)) {
    return true;
  }

  return (
    expiresAt <= Math.floor(Date.now() / 1000) + ACCESS_TOKEN_REFRESH_SKEW_SECONDS
  );
}

export function clearAuthToken() {
  clearStoredAuthToken();
  setRefreshToken(null);
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
    setRefreshToken(response.refresh_token);
  }

  return response;
}

function getSavedGuestProfile(payload = {}) {
  const savedNickname = canUseStorage()
    ? localStorage.getItem(GUEST_NICKNAME_STORAGE_KEY)
    : '';
  const savedAvatarId = canUseStorage()
    ? localStorage.getItem(GUEST_AVATAR_STORAGE_KEY)
    : '';
  const savedAvatar = avatars.find((avatar) => avatar.id === savedAvatarId);
  const nickname = String(payload.nickname ?? savedNickname ?? '').trim();

  return {
    nickname: nickname || 'Guest',
    picture: payload.picture ?? savedAvatar?.picture ?? '',
  };
}

export async function signUp({ nickname, picture } = {}) {
  const response = await apiRequest('/auth/signup', {
    method: 'POST',
    body: { nickname, picture },
  });

  return persistAuth(response);
}

export async function updateProfile({ nickname, picture }) {
  const response = await withAuthRetry(
    () =>
      apiRequest('/auth/profile', {
        auth: true,
        method: 'POST',
        body: { nickname, picture },
      }),
    { nickname, picture },
  );

  return persistAuth(response);
}

export async function refreshAuth() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthToken();
    throw createMissingRefreshTokenError();
  }

  if (!pendingAuthRefresh) {
    pendingAuthRefresh = apiRequest('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
      token: null,
    })
      .then(persistAuth)
      .catch((error) => {
        if (error?.status === 401) {
          clearAuthToken();
        }

        throw error;
      })
      .finally(() => {
        pendingAuthRefresh = null;
      });
  }

  return pendingAuthRefresh;
}

export async function refreshAuthIfNeeded() {
  const token = getAuthToken();
  const player = parseAuthPlayer(token);

  if (!token) {
    return null;
  }

  if (!shouldRefreshAccessToken(token)) {
    return token;
  }

  try {
    const response = await refreshAuth();

    return response?.token || getAuthToken();
  } catch (error) {
    if (player?.type !== 'Anonymous' || !canFallbackToGuestAuth(error)) {
      throw error;
    }

    const response = await refreshGuestAuth();

    return response?.token || getAuthToken();
  }
}

export async function loginWithGoogle(credential) {
  const response = await apiRequest('/auth/google', {
    auth: false,
    method: 'POST',
    body: { credential },
    token: null,
  });

  clearAuthToken();
  return persistAuth(response);
}

export async function saveGuestProfile(payload) {
  const guestProfile = getSavedGuestProfile(payload);
  const existingPlayer = getAuthPlayer();

  if (!getAuthToken()) {
    return signUp(guestProfile);
  }

  try {
    return await updateProfile(guestProfile);
  } catch (error) {
    if (existingPlayer?.type === 'Google' || !isInvalidAuthTokenError(error)) {
      throw error;
    }

    clearAuthToken();
    return signUp(guestProfile);
  }
}

export async function refreshGuestAuth(payload) {
  if (!pendingGuestAuthRefresh) {
    pendingGuestAuthRefresh = (async () => {
      clearAuthToken();
      return signUp(getSavedGuestProfile(payload));
    })().finally(() => {
      pendingGuestAuthRefresh = null;
    });
  }

  return pendingGuestAuthRefresh;
}

export function getAuthPlayer() {
  return parseAuthPlayer();
}

export function isCurrentUserAdmin() {
  const token = getAuthToken();
  const claims = decodeAuthTokenPayload(token);
  const player = parseAuthPlayer(token);

  return String(getPlayerRole(player, claims)).toLowerCase() === 'admin';
}

export function getCurrentProfile() {
  const token = getAuthToken();
  const claims = decodeAuthTokenPayload(token);
  const player = parseAuthPlayer(token);

  return {
    isGoogle: player?.type === 'Google',
    nickname: getPlayerNickname(player),
    picture: getPlayerPicture(player),
    player,
    role: getPlayerRole(player, claims),
  };
}

export function isGoogleAuthenticated() {
  const token = getAuthToken();
  const player = parseAuthPlayer(token);

  return player?.type === 'Google';
}

export async function withAuthRetry(request, payload) {
  const tokenBeforeRequest = getAuthToken();
  const playerBeforeRequest = parseAuthPlayer(tokenBeforeRequest);

  try {
    return await request();
  } catch (error) {
    if (
      !tokenBeforeRequest ||
      isMissingAuthTokenError(error) ||
      !isInvalidAuthTokenError(error, Boolean(tokenBeforeRequest))
    ) {
      throw error;
    }

    try {
      await refreshAuth();
    } catch (refreshError) {
      if (
        playerBeforeRequest?.type !== 'Anonymous' ||
        !canFallbackToGuestAuth(refreshError)
      ) {
        throw refreshError;
      }

      await refreshGuestAuth(payload);
    }

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
  refreshAuth,
  refreshAuthIfNeeded,
  refreshGuestAuth,
  saveGuestProfile,
  signUp,
  updateProfile,
  withAuthRetry,
};
