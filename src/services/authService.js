import {
  apiRequest,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from './apiClient.js';
import { avatars } from '@/components/auth/avatarOptions.js';

const GUEST_AVATAR_STORAGE_KEY = 'ohhell_guest_avatar_id';
const GUEST_NICKNAME_STORAGE_KEY = 'ohhell_guest_nickname';
let pendingGuestAuthRefresh = null;

function canUseStorage() {
  return typeof window !== 'undefined' && window.localStorage;
}

function getAuthErrorMessage(error) {
  return String(error?.message || error?.data?.error || '');
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
  getAuthToken,
  refreshGuestAuth,
  saveGuestProfile,
  signUp,
  updateProfile,
  withGuestAuthRetry,
};
