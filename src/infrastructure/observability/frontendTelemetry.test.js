import { describe, expect, it, vi } from 'vitest';
import { createFrontendTelemetry, normalizeFrontendEvent } from './frontendTelemetry.js';

describe('frontend telemetry', () => {
  it('sanitizes tokens, sensitive nicknames and authenticated URLs', () => {
    const event = normalizeFrontendEvent({
      diagnostic: {
        nickname: 'SecretNick',
        token: 'secret-token',
        url: 'wss://game.example.test/game?token=secret-token',
      },
      failureType: 'api',
      phase: 'response',
      platform: 'mobile',
      timestamp: '2026-07-07T00:00:00.000Z',
    });

    const output = JSON.stringify(event);
    expect(output).not.toContain('SecretNick');
    expect(output).not.toContain('secret-token');
    expect(event).toMatchObject({
      failureType: 'api',
      phase: 'response',
      platform: 'mobile',
      source: 'frontend',
    });
  });

  it('sends normalized web/mobile failure metrics through an injected transport', () => {
    const transport = vi.fn();
    const telemetry = createFrontendTelemetry({
      getPlatform: () => 'web',
      transport,
    });

    telemetry.trackFailure({
      diagnostic: new Error('boom'),
      failureType: 'websocket',
      phase: 'connection',
    });

    expect(transport).toHaveBeenCalledWith(expect.objectContaining({
      diagnostic: { name: 'Error', message: 'boom' },
      failureType: 'websocket',
      phase: 'connection',
      platform: 'web',
    }));
  });
});
