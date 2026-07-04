import {
  apiRequest,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from './apiClient.js';
import { avatars } from '@/components/auth/avatarOptions.js';

const GUEST_AVATAR_STORAGE_KEY = 'ohhell_guest_avatar_id';
const GUEST_NICKNAME_STORAGE_KEY = 'ohhell_guest_nickname';
const REFRESH_TOKEN_STORAGE_KEY = 'REFRESH_TOKEN';
let pendingGuestAuthRefresh = null;

function canUseStorage() {
  return typeof window !== 'undefined' && window.localStorage;
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

  if (canUseStorage() && response?.refresh_token !== undefined) {
    if (response.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.refresh_token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
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
  const response = await apiRequest('/auth/profile', {
    auth: true,
    method: 'POST',
    body: { nickname, picture },
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

    await refreshGuestAuth(payload);
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
  refreshGuestAuth,
  saveGuestProfile,
  signUp,
  updateProfile,
  withGuestAuthRetry,
};
