import { describe, expect, it, vi } from 'vitest';
import { createReadyController } from './readyController.js';

describe('ready controller', () => {
  it('requires two players and an open socket', () => {
    const send = vi.fn();
    const controller = createReadyController({ send });
    expect(controller.toggle({ playerCount: 1, ready: false, socket: {}, socketOpen: true })).toBe(false);
    expect(controller.toggle({ playerCount: 2, ready: false, socket: {}, socketOpen: false })).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('sends once while pending and releases after acknowledgement', () => {
    const socket = {};
    const send = vi.fn();
    const controller = createReadyController({ send });
    const input = { playerCount: 2, ready: false, socket, socketOpen: true };
    expect(controller.toggle(input)).toBe(true);
    expect(controller.toggle(input)).toBe(false);
    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith(socket, true);
    controller.settle();
    expect(controller.toggle({ ...input, ready: true })).toBe(true);
    expect(send).toHaveBeenLastCalledWith(socket, false);
  });
});
