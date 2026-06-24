import {
  apiRequest,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from './apiClient.js';

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

export const authService = {
  clearAuthToken,
  getAuthToken,
  signUp,
  updateProfile,
};
