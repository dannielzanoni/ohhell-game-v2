import { describe, expect, it, vi } from 'vitest';
import { buildHttpUrl, createHttpClient, HttpError } from './httpClient.js';

function response(body, { ok = true, status = 200, statusText = 'OK' } = {}) {
  return {
    ok,
    status,
    statusText,
    text: async () => (body === null ? '' : JSON.stringify(body)),
  };
}

describe('shared HTTP client', () => {
  it('builds base URL and filters empty query values', () => {
    expect(buildHttpUrl('https://api.test/', '/rooms', {
      empty: '', limit: 10, missing: null,
    })).toBe('https://api.test/rooms?limit=10');
  });

  it('serializes JSON and attaches the access token', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ id: 1 }));
    const client = createHttpClient({
      baseUrl: 'https://api.test',
      fetchImpl,
      getAccessToken: () => 'access-token',
    });

    await expect(client.request('/rooms', {
      body: { lives: 5 }, method: 'POST',
    })).resolves.toEqual({ id: 1 });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.test/rooms',
      expect.objectContaining({
        body: JSON.stringify({ lives: 5 }),
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('requires a token only for authenticated requests', async () => {
    const client = createHttpClient({
      baseUrl: 'https://api.test',
      fetchImpl: vi.fn(),
    });

    await expect(client.request('/private', { auth: true })).rejects.toMatchObject({
      status: 401,
      data: { error: 'Missing auth token' },
    });
  });

  it('preserves response status and payload in typed errors', async () => {
    const client = createHttpClient({
      baseUrl: 'https://api.test',
      fetchImpl: vi.fn().mockResolvedValue(response(
        { error: 'Room is full', reason: 'capacity' },
        { ok: false, status: 409, statusText: 'Conflict' },
      )),
    });

    await expect(client.request('/rooms/1')).rejects.toEqual(
      expect.objectContaining({
        data: { error: 'Room is full', reason: 'capacity' },
        name: 'HttpError',
        status: 409,
        statusText: 'Conflict',
      }),
    );
  });

  it('normalizes cancellation and network failures', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(
      Object.assign(new Error('cancelled'), { name: 'AbortError' }),
    );
    const client = createHttpClient({ baseUrl: 'https://api.test', fetchImpl });

    await expect(client.request('/rooms')).rejects.toBeInstanceOf(HttpError);
    await expect(client.request('/rooms')).rejects.toMatchObject({
      data: { code: 'ABORTED' }, status: 0,
    });
  });
});
