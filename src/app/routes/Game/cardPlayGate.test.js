import { describe, expect, it, vi } from 'vitest';
import { createCardPlayGate } from './cardPlayGate.js';

describe('card play gate', () => {
  it('accepts only one play until the command is reset', () => {
    const gate = createCardPlayGate();
    const play = vi.fn();

    expect(gate.tryPlay(play)).toBe(true);
    expect(gate.tryPlay(play)).toBe(false);
    expect(play).toHaveBeenCalledTimes(1);

    gate.reset();
    expect(gate.tryPlay(play)).toBe(true);
  });

  it('releases the gate when sending throws', () => {
    const gate = createCardPlayGate();
    expect(() => gate.tryPlay(() => { throw new Error('offline'); })).toThrow('offline');
    expect(gate.tryPlay(() => {})).toBe(true);
  });
});
