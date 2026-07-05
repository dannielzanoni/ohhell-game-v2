import { environment } from '@/config/environment.js';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { legacyStorageKeys, storageKeys } from '@/infrastructure/storage/storageKeys.js';
import { createHttpClient, HttpError } from '@/infrastructure/http/httpClient.js';

export const API_BASE_URL = environment.apiUrl;

export const JWT_TOKEN = storageKeys.authToken;
const LEGACY_AUTH_TOKEN_STORAGE_KEY = legacyStorageKeys.authToken;

export { HttpError as ApiError };

function normalizeStoredToken(value) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  try {
    const parsed = JSON.parse(trimmedValue);

    if (typeof parsed === 'string') {
      return parsed;
    }

    if (typeof parsed?.token === 'string') {
      return parsed.token;
    }
  } catch {
    return trimmedValue;
  }

  return trimmedValue;
}

export function getAuthToken() {
  const token = normalizeStoredToken(
    storage.getItem(JWT_TOKEN) ||
      storage.getItem(LEGACY_AUTH_TOKEN_STORAGE_KEY),
  );

  if (token && token !== storage.getItem(JWT_TOKEN)) {
    setAuthToken(token);
  }

  return token;
}

export function setAuthToken(token) {
  storage.setItem(JWT_TOKEN, normalizeStoredToken(token) || '');
  storage.removeItem(LEGACY_AUTH_TOKEN_STORAGE_KEY);
}

export function clearAuthToken() {
  storage.removeItem(JWT_TOKEN);
  storage.removeItem(LEGACY_AUTH_TOKEN_STORAGE_KEY);
}

const httpClient = createHttpClient({
  baseUrl: API_BASE_URL,
  getAccessToken: getAuthToken,
});

export function apiRequest(path, options) {
  return httpClient.request(path, options);
}
