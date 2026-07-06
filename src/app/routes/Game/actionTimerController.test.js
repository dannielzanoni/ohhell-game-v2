import { describe, expect, it, vi } from 'vitest';
import { createActionTimerController } from './actionTimerController.js';

function createFakeClock() {
  let now = 0;
  let callback = null;
  return {
    clock: {
      clearInterval: vi.fn(() => { callback = null; }),
      now: () => now,
      setInterval: vi.fn((next) => { callback = next; return 1; }),
    },
    advance(ms) {
      now += ms;
      callback?.();
    },
  };
}

describe('action timer controller', () => {
  it('derives visible state and expires according to a fake clock', () => {
    const fake = createFakeClock();
    const onExpire = vi.fn();
    const controller = createActionTimerController({ clock: fake.clock, onExpire });
    const states = [];
    controller.subscribe((state) => states.push(state));

    controller.start('bid', 3);
    fake.advance(9000);
    expect(states.at(-1)).toMatchObject({ seconds: 1, progress: 10, type: 'bid' });
    fake.advance(1000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('cannot expire twice after background-like time jumps', () => {
    const fake = createFakeClock();
    const onExpire = vi.fn();
    const controller = createActionTimerController({ clock: fake.clock, onExpire });
    controller.start('play', 0);

    fake.advance(60_000);
    fake.advance(60_000);

    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(fake.clock.clearInterval).toHaveBeenCalledTimes(1);
  });
});
