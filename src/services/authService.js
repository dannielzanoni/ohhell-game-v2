import {
  apiRequest,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from './apiClient.js';

function isInvalidAuthTokenError(error) {
  const message = String(error?.message || error?.data?.error || '');

  return (
    error?.status === 401 ||
    message.includes("Invalid KeyId ('kid')") ||
    message.toLowerCase().includes('invalid token')
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
  if (!getAuthToken()) {
    return signUp(payload);
  }

  try {
    return await updateProfile(payload);
  } catch (error) {
    if (!isInvalidAuthTokenError(error)) {
      throw error;
    }

    clearAuthToken();
    return signUp(payload);
  }
}

export const authService = {
  clearAuthToken,
  getAuthToken,
  saveGuestProfile,
  signUp,
  updateProfile,
};
