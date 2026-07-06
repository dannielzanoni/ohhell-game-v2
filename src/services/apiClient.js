import { environment } from '@/config/environment.js';

export const API_BASE_URL = environment.apiUrl;

export const JWT_TOKEN = 'JWT_TOKEN';
const LEGACY_AUTH_TOKEN_STORAGE_KEY = 'ohhell_auth_token';

export class ApiError extends Error {
  constructor({ message, status, statusText, data }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

function canUseStorage() {
  return typeof window !== 'undefined' && window.localStorage;
}

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
  if (!canUseStorage()) {
    return null;
  }

  const token = normalizeStoredToken(
    localStorage.getItem(JWT_TOKEN) ||
      localStorage.getItem(LEGACY_AUTH_TOKEN_STORAGE_KEY),
  );

  if (token && token !== localStorage.getItem(JWT_TOKEN)) {
    setAuthToken(token);
  }

  return token;
}

export function setAuthToken(token) {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(JWT_TOKEN, normalizeStoredToken(token) || '');
  localStorage.removeItem(LEGACY_AUTH_TOKEN_STORAGE_KEY);
}

export function clearAuthToken() {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(JWT_TOKEN);
  localStorage.removeItem(LEGACY_AUTH_TOKEN_STORAGE_KEY);
}

function buildUrl(path, query) {
  const url = new URL(
    path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`,
  );

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest(
  path,
  {
    auth = false,
    body,
    headers,
    method = 'GET',
    query,
    signal,
    token = getAuthToken(),
  } = {},
) {
  if (auth && !token) {
    throw new ApiError({
      message: 'Missing auth token',
      status: 401,
      statusText: 'Unauthorized',
      data: { error: 'Missing auth token' },
    });
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined && !isFormData) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const requestUrl = buildUrl(path, query);
  let response;

  try {
    response = await fetch(requestUrl, {
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      headers: requestHeaders,
      method,
      signal,
    });
  } catch (error) {
    throw new ApiError({
      message: `Nao foi possivel conectar na API em ${API_BASE_URL}. Verifique se o backend esta rodando.`,
      status: 0,
      statusText: 'Network Error',
      data: { error: error.message, url: requestUrl },
    });
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError({
      message: data?.error || response.statusText || 'Request failed',
      status: response.status,
      statusText: response.statusText,
      data,
    });
  }

  return data;
}
