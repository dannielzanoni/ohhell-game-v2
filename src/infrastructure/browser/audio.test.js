import { describe, expect, it, vi } from 'vitest';
import { createAudioAdapter } from './audio.js';

describe('audio adapter', () => {
  it('does not create media when volume is zero', () => {
    const createMedia = vi.fn();
    const audio = createAudioAdapter({ createMedia });

    expect(audio.play('turn.mp3', 0)).toBe(false);
    expect(createMedia).not.toHaveBeenCalled();
  });

  it('normalizes volume and safely plays through the injected media boundary', () => {
    const media = { play: vi.fn(() => Promise.resolve()), volume: 0 };
    const audio = createAudioAdapter({ createMedia: vi.fn(() => media) });

    expect(audio.play('turn.mp3', 40)).toBe(true);
    expect(media.volume).toBe(0.4);
    expect(media.play).toHaveBeenCalledTimes(1);
  });

  it('plays an event once per slot until that slot is released', () => {
    const media = { play: vi.fn(() => Promise.resolve()), volume: 0 };
    const audio = createAudioAdapter({ createMedia: () => media });

    expect(audio.playOnce('turn', 'bid:ada', 'bid.mp3', 100)).toBe(true);
    expect(audio.playOnce('turn', 'bid:ada', 'bid.mp3', 100)).toBe(false);
    audio.clearSlot('turn');
    expect(audio.playOnce('turn', 'bid:ada', 'bid.mp3', 100)).toBe(true);
    expect(media.play).toHaveBeenCalledTimes(2);
  });
});
