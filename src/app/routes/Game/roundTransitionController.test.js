import { describe, expect, it, vi } from 'vitest';
import { createRoundTransitionController } from './roundTransitionController.js';

function createScheduler() {
  let callback;
  return {
    flush: () => callback?.(),
    scheduler: {
      clearTimeout: vi.fn(),
      setTimeout: vi.fn((next) => { callback = next; return 1; }),
    },
  };
}

describe('round transition controller', () => {
  it('runs one configured transition even when begin is requested twice', () => {
    const fake = createScheduler();
    const complete = vi.fn();
    const controller = createRoundTransitionController({ scheduler: fake.scheduler });
    const options = { delayMs: 1000, onComplete: complete, process: () => {} };

    expect(controller.begin(options)).toBe(true);
    expect(controller.begin(options)).toBe(false);
    expect(fake.scheduler.setTimeout).toHaveBeenCalledTimes(1);
    fake.flush();
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('applies messages queued during the delay in FIFO order', () => {
    const fake = createScheduler();
    const process = vi.fn();
    const controller = createRoundTransitionController({ scheduler: fake.scheduler });
    controller.begin({ delayMs: 1000, onComplete: () => {}, process });
    controller.enqueue({ type: 'SetEnded' });
    controller.enqueue({ type: 'PlayerTurn' });

    fake.flush();

    expect(process.mock.calls.map(([message]) => message.type)).toEqual(['SetEnded', 'PlayerTurn']);
    expect(controller.queuedCount()).toBe(0);
  });
});
