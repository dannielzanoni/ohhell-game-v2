import { frontendTelemetry } from '@/infrastructure/observability/frontendTelemetry.js';

export class HttpError extends Error {
  constructor({ cause, data, message, status, statusText }) {
    super(message, cause ? { cause } : undefined);
    this.name = 'HttpError';
    this.data = data;
    this.status = status;
    this.statusText = statusText;
  }
}

export function buildHttpUrl(baseUrl, path, query) {
  const normalizedPath = String(path);
  const url = new URL(
    /^https?:\/\//i.test(normalizedPath)
      ? normalizedPath
      : `${String(baseUrl).replace(/\/$/, '')}/${normalizedPath.replace(/^\//, '')}`,
  );

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function createHttpClient({
  baseUrl,
  fetchImpl = globalThis.fetch?.bind(globalThis),
  getAccessToken = () => null,
} = {}) {
  if (!baseUrl) throw new TypeError('HTTP baseUrl is required');
  if (!fetchImpl) throw new TypeError('A fetch implementation is required');

  return {
    async request(
      path,
      {
        auth = false,
        body,
        headers,
        method = 'GET',
        query,
        signal,
        token = getAccessToken(),
      } = {},
    ) {
      if (auth && !token) {
        throw new HttpError({
          data: { error: 'Missing auth token' },
          message: 'Missing auth token',
          status: 401,
          statusText: 'Unauthorized',
        });
      }

      const requestHeaders = { Accept: 'application/json', ...headers };
      if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
      if (token) requestHeaders.Authorization = `Bearer ${token}`;

      const url = buildHttpUrl(baseUrl, path, query);
      let response;

      try {
        response = await fetchImpl(url, {
          body: body === undefined ? undefined : JSON.stringify(body),
          headers: requestHeaders,
          method,
          signal,
        });
      } catch (cause) {
        frontendTelemetry.trackFailure({
          diagnostic: { message: cause?.message, path, status: 0 },
          failureType: 'api',
          phase: 'request',
        });
        throw new HttpError({
          cause,
          data: { code: cause?.name === 'AbortError' ? 'ABORTED' : 'NETWORK_ERROR' },
          message: cause?.name === 'AbortError' ? 'Request aborted' : 'Network request failed',
          status: 0,
          statusText: cause?.name === 'AbortError' ? 'Aborted' : 'Network Error',
        });
      }

      const data = await parseBody(response);
      if (!response.ok) {
        frontendTelemetry.trackFailure({
          diagnostic: { path, status: response.status, statusText: response.statusText },
          failureType: 'api',
          phase: 'response',
        });
        throw new HttpError({
          data,
          message: data?.error || response.statusText || 'Request failed',
          status: response.status,
          statusText: response.statusText,
        });
      }

      return data;
    },
  };
}
