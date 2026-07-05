import { describe, expect, it } from 'vitest';
import { DEFAULT_LIVES, isValidLives, normalizeLives } from './lives.js';

describe('lives configuration', () => {
  it('defaults to five and accepts only integer values from one to five', () => {
    expect(DEFAULT_LIVES).toBe(5);
    expect([1, 2, 3, 4, 5].every(isValidLives)).toBe(true);
    expect([0, 6, 2.5, '', null, undefined].some(isValidLives)).toBe(false);
    expect(() => normalizeLives(6)).toThrow();
  });
});
