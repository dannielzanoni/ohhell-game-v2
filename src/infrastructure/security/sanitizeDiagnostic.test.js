import { describe, expect, it } from 'vitest';
import { sanitizeDiagnostic } from './sanitizeDiagnostic.js';

describe('sanitizeDiagnostic', () => {
  it('redacts tokens, credentials and authenticated URLs recursively', () => {
    const secret = 'eyJheader.eyJpayload.signature';
    const output = JSON.stringify(sanitizeDiagnostic({
      authorization: `Bearer ${secret}`,
      credential: 'google-secret',
      nickname: 'private-nick',
      nested: { refresh_token: 'refresh-secret' },
      socket: `wss://game.example.test/game?token=${secret}`,
    }));
    expect(output).not.toContain(secret);
    expect(output).not.toContain('google-secret');
    expect(output).not.toContain('private-nick');
    expect(output).not.toContain('refresh-secret');
    expect(output).not.toContain('wss://game.example.test/game?token=');
  });
});
