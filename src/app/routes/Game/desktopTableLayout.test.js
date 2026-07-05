import { describe, expect, it } from 'vitest';
import { getDesktopSeatLayout } from './GameView.jsx';

describe('desktop table layout', () => {
  it('places thirteen dense seats at distinct readable coordinates', () => {
    const seats = Array.from({ length: 13 }, (_, index) => getDesktopSeatLayout(index, 13, index === 0));
    expect(seats.every(({ density }) => density === 'dense')).toBe(true);
    for (let first = 0; first < seats.length; first += 1) {
      for (let second = first + 1; second < seats.length; second += 1) {
        const dx = Number.parseFloat(seats[first].left) - Number.parseFloat(seats[second].left);
        const dy = Number.parseFloat(seats[first].top) - Number.parseFloat(seats[second].top);
        expect(Math.hypot(dx, dy)).toBeGreaterThan(14);
      }
    }
  });

  it('keeps the local player lifted without changing the player collection', () => {
    const local = getDesktopSeatLayout(0, 6, true);
    const remote = getDesktopSeatLayout(0, 6, false);
    expect(Number.parseFloat(local.top)).toBeLessThan(Number.parseFloat(remote.top));
    expect(local.density).toBe('comfortable');
  });
});
