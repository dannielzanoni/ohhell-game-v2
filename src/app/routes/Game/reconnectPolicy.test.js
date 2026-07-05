import { describe, expect, it, vi } from 'vitest';
import { reconnectDelay, reconnectWithSnapshot, RECONNECT_DELAYS_MS } from './reconnectPolicy.js';

describe('lobby reconnect policy', () => {
  it('uses bounded backoff and stops after the configured attempts', () => {
    expect(RECONNECT_DELAYS_MS).toEqual([100, 250, 500, 1000, 1500, 2500]);
    expect(reconnectDelay(5)).toBe(2500);
    expect(reconnectDelay(6)).toBeNull();
  });

  it('requests and applies a snapshot before opening the socket', async () => {
    const order = [];
    await reconnectWithSnapshot({
      join: vi.fn(async () => { order.push('put'); return { status: {} }; }),
      applySnapshot: vi.fn(() => order.push('snapshot')),
      connect: vi.fn(() => order.push('socket')),
    });
    expect(order).toEqual(['put', 'snapshot', 'socket']);
  });
});
